from django.db import transaction, models
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.crm.models import Customer, LoyaltyTransaction, normalize_phone_number
from apps.sales.models import Sale, Warranty
from apps.repairs.models import Repair


class CustomerMergeService:
    """
    Service for identifying and consolidating duplicate customer profiles.
    Reassigns sales, repairs, warranties, and loyalty ledgers to the primary
    profile while preserving full audit trails.
    """

    @classmethod
    def find_potential_duplicates(cls):
        """
        Scans customer records for potential duplicates:
        - Matching 10-digit phone suffix
        - Exact email match (non-empty)
        """
        all_customers = list(Customer.objects.all())
        phone_map = {}
        email_map = {}
        duplicates = []

        for cust in all_customers:
            # 10-digit phone key
            clean_digits = ''.join(c for c in cust.phone if c.isdigit())[-10:]
            if clean_digits:
                phone_map.setdefault(clean_digits, []).append(cust)

            if cust.email and cust.email.strip():
                email_clean = cust.email.strip().lower()
                email_map.setdefault(email_clean, []).append(cust)

        seen_pairs = set()

        # Group phone duplicates
        for p_digits, group in phone_map.items():
            if len(group) > 1:
                for i in range(len(group)):
                    for j in range(i + 1, len(group)):
                        pair = tuple(sorted([group[i].id, group[j].id]))
                        if pair not in seen_pairs:
                            seen_pairs.add(pair)
                            duplicates.append({
                                'type': 'phone_match',
                                'match_value': p_digits,
                                'primary_candidate': group[i],
                                'duplicate_candidate': group[j]
                            })

        # Group email duplicates
        for email_val, group in email_map.items():
            if len(group) > 1:
                for i in range(len(group)):
                    for j in range(i + 1, len(group)):
                        pair = tuple(sorted([group[i].id, group[j].id]))
                        if pair not in seen_pairs:
                            seen_pairs.add(pair)
                            duplicates.append({
                                'type': 'email_match',
                                'match_value': email_val,
                                'primary_candidate': group[i],
                                'duplicate_candidate': group[j]
                            })

        return duplicates

    @classmethod
    def merge_customers(cls, primary_customer_id: int, duplicate_customer_id: int, user=None) -> Customer:
        """
        Merges duplicate customer into primary customer and safely deletes duplicate.
        """
        if primary_customer_id == duplicate_customer_id:
            raise ValidationError({'error': 'Cannot merge a customer profile into itself.'})

        with transaction.atomic():
            try:
                primary = Customer.objects.select_for_update().get(id=primary_customer_id)
                duplicate = Customer.objects.select_for_update().get(id=duplicate_customer_id)
            except Customer.DoesNotExist:
                raise ValidationError({'error': 'One or both customer profiles could not be found.'})

            # 1. Reassign Sales
            Sale.objects.filter(customer=duplicate).update(customer=primary)

            # 2. Reassign Repairs
            Repair.objects.filter(customer=duplicate).update(customer=primary)

            # 3. Reassign Warranties
            Warranty.objects.filter(customer=duplicate).update(customer=primary)

            # 4. Reassign and Consolidate Loyalty Points
            duplicate_points = duplicate.loyalty_points
            if duplicate_points > 0:
                primary.loyalty_points += duplicate_points
                LoyaltyTransaction.objects.create(
                    customer=primary,
                    transaction_type='adjustment',
                    points=duplicate_points,
                    balance_after=primary.loyalty_points,
                    reference_id=f"MERGE-{duplicate.id}",
                    reason=f"Loyalty points transferred from merged profile #{duplicate.id} ({duplicate.phone})",
                    created_by=user
                )

            LoyaltyTransaction.objects.filter(customer=duplicate).update(customer=primary)

            # 5. Fill missing fields from duplicate if empty on primary
            if not primary.email and duplicate.email:
                primary.email = duplicate.email
            if not primary.address and duplicate.address:
                primary.address = duplicate.address
            if not primary.date_of_birth and duplicate.date_of_birth:
                primary.date_of_birth = duplicate.date_of_birth
            if not primary.anniversary_date and duplicate.anniversary_date:
                primary.anniversary_date = duplicate.anniversary_date
            if not primary.gstin and duplicate.gstin:
                primary.gstin = duplicate.gstin

            # Append audit note
            merge_note = f"\n[Merged from customer #{duplicate.id} ({duplicate.name}, {duplicate.phone}) on {timezone.now().date()} by {user.username if user else 'System'}]."
            if duplicate.notes:
                merge_note += f" Notes: {duplicate.notes}"
            primary.notes = (primary.notes + merge_note).strip()
            primary.save()

            # 6. Delete duplicate record now that all relations have been transferred
            super(Customer, duplicate).delete()

            return primary
