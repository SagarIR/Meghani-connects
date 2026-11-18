"""
Customer Import Service - Import customers from Excel or CSV files.
Provides phone normalization, duplicate detection, transaction safety,
and sample template generation.
"""
import openpyxl
import csv
from io import TextIOWrapper, BytesIO
from django.db import transaction
from .models import Customer


class CustomerImportService:
    """
    Service to import customers from Excel or CSV files.
    """
    REQUIRED_COLUMNS = ['name', 'phone']
    OPTIONAL_COLUMNS = [
        'email', 'address', 'date_of_birth',
        'language_preference', 'loyalty_points', 'notes'
    ]

    def __init__(self):
        self.errors = []
        self.imported = 0
        self.updated = 0
        self.skipped = 0

    def import_from_excel(self, file, update_existing=False):
        """Import customers from an Excel workbook (.xlsx/.xls)"""
        try:
            wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
            sheet = wb.active

            headers = []
            for cell in sheet[1]:
                if cell.value:
                    headers.append(str(cell.value).lower().strip().replace(' ', '_'))

            missing = [col for col in self.REQUIRED_COLUMNS if col not in headers]
            if missing:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing)}',
                    'expected_columns': self.REQUIRED_COLUMNS + self.OPTIONAL_COLUMNS,
                    'imported': 0,
                    'updated': 0,
                    'skipped': 0,
                    'errors': [],
                    'total_errors': 0
                }

            rows = list(sheet.iter_rows(min_row=2, values_only=True))
            return self._process_rows(headers, rows, update_existing)
        except Exception as e:
            return {
                'success': False,
                'error': f'Excel processing failed: {str(e)}',
                'imported': 0,
                'updated': 0,
                'skipped': 0,
                'errors': [],
                'total_errors': 0
            }

    def import_from_csv(self, file, update_existing=False):
        """Import customers from a CSV file"""
        try:
            wrapper = TextIOWrapper(file.file, encoding='utf-8-sig', errors='replace')
            reader = csv.reader(wrapper)

            first_row = next(reader, None)
            if not first_row:
                return {
                    'success': False,
                    'error': 'CSV file is empty',
                    'imported': 0,
                    'updated': 0,
                    'skipped': 0,
                    'errors': [],
                    'total_errors': 0
                }

            headers = [col.lower().strip().replace(' ', '_') for col in first_row if col]
            missing = [col for col in self.REQUIRED_COLUMNS if col not in headers]
            if missing:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing)}',
                    'expected_columns': self.REQUIRED_COLUMNS + self.OPTIONAL_COLUMNS,
                    'imported': 0,
                    'updated': 0,
                    'skipped': 0,
                    'errors': [],
                    'total_errors': 0
                }

            rows = list(reader)
            return self._process_rows(headers, rows, update_existing)
        except Exception as e:
            return {
                'success': False,
                'error': f'CSV processing failed: {str(e)}',
                'imported': 0,
                'updated': 0,
                'skipped': 0,
                'errors': [],
                'total_errors': 0
            }

    def _process_rows(self, headers, rows, update_existing):
        """Process rows with duplicate handling and transaction safety"""
        seen_phones_in_batch = set()

        for idx, row in enumerate(rows, start=2):
            if not row or all(v is None or str(v).strip() == '' for v in row):
                continue

            row_data = dict(zip(headers, row))
            cleaned = self._clean_row(row_data, idx)
            if not cleaned:
                continue

            phone = cleaned['phone']
            if phone in seen_phones_in_batch:
                self.errors.append({
                    'row': idx,
                    'error': f"Duplicate phone '{phone}' repeated within this import file"
                })
                continue
            seen_phones_in_batch.add(phone)

            try:
                with transaction.atomic():
                    existing = Customer.objects.filter(phone=phone).first()
                    if existing:
                        if update_existing:
                            existing.name = cleaned['name']
                            if cleaned.get('email'):
                                existing.email = cleaned['email']
                            if cleaned.get('address'):
                                existing.address = cleaned['address']
                            if cleaned.get('date_of_birth'):
                                existing.date_of_birth = cleaned['date_of_birth']
                            if cleaned.get('language_preference'):
                                existing.language_preference = cleaned['language_preference']
                            if cleaned.get('loyalty_points') is not None:
                                existing.loyalty_points = cleaned['loyalty_points']
                            if cleaned.get('notes'):
                                existing.notes = cleaned['notes']
                            existing.save()
                            self.updated += 1
                        else:
                            self.skipped += 1
                    else:
                        Customer.objects.create(**cleaned)
                        self.imported += 1
            except Exception as e:
                self.errors.append({'row': idx, 'error': f"Database error: {str(e)}"})

        return {
            'success': True,
            'imported': self.imported,
            'updated': self.updated,
            'skipped': self.skipped,
            'errors': self.errors,
            'total_errors': len(self.errors)
        }

    def _clean_row(self, row_data, row_num):
        """Validate and clean single row"""
        try:
            name = str(row_data.get('name') or '').strip()
            if not name:
                self.errors.append({'row': row_num, 'error': 'Customer name is required'})
                return None

            phone_raw = str(row_data.get('phone') or '').strip()
            # Normalize phone: remove spaces, dots, dashes, parentheses
            phone = ''.join(c for c in phone_raw if c.isdigit() or c == '+')
            if not phone:
                self.errors.append({'row': row_num, 'error': 'Customer phone number is required'})
                return None

            # Add +91 prefix if 10-digit standard Indian mobile
            if len(phone) == 10 and phone.isdigit():
                phone = f'+91{phone}'
            elif not phone.startswith('+') and len(phone) > 10:
                phone = f'+{phone}'

            if len(phone) < 8 or len(phone) > 15:
                self.errors.append({'row': row_num, 'error': f"Invalid phone length: '{phone}'"})
                return None

            email = str(row_data.get('email') or '').strip()
            address = str(row_data.get('address') or '').strip()
            notes = str(row_data.get('notes') or '').strip()

            lang = str(row_data.get('language_preference') or 'en').strip().lower()
            if lang not in ['en', 'hi', 'gu']:
                lang = 'en'

            # Parse loyalty points
            loyalty_raw = row_data.get('loyalty_points')
            loyalty_points = 0
            if loyalty_raw is not None:
                try:
                    loyalty_points = max(0, int(float(str(loyalty_raw).strip())))
                except (ValueError, TypeError):
                    loyalty_points = 0

            # Parse date of birth
            dob = None
            dob_raw = row_data.get('date_of_birth')
            if dob_raw:
                from datetime import datetime, date
                if isinstance(dob_raw, (datetime, date)):
                    dob = dob_raw.date() if isinstance(dob_raw, datetime) else dob_raw
                else:
                    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d'):
                        try:
                            dob = datetime.strptime(str(dob_raw).strip()[:10], fmt).date()
                            break
                        except ValueError:
                            pass

            return {
                'name': name[:100],
                'phone': phone[:15],
                'email': email,
                'address': address,
                'date_of_birth': dob,
                'language_preference': lang,
                'loyalty_points': loyalty_points,
                'notes': notes,
            }
        except Exception as e:
            self.errors.append({'row': row_num, 'error': f'Validation error: {str(e)}'})
            return None

    @staticmethod
    def get_sample_template():
        """Generate a professionally styled sample Excel template for customer import"""
        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = 'Customers'

        headers = [
            'Name', 'Phone', 'Email', 'Address',
            'Date of Birth', 'Language Preference', 'Loyalty Points', 'Notes'
        ]
        for col_idx, header in enumerate(headers, 1):
            cell = sheet.cell(row=1, column=col_idx, value=header)
            cell.font = openpyxl.styles.Font(bold=True)

        sample_data = [
            ['Rajesh Mehta', '+919825012345', 'rajesh@example.com', 'Alkapuri, Vadodara, Gujarat', '1985-05-15', 'gu', 50, 'VIP Customer - Prefers Rado'],
            ['Ananya Verma', '+919876543210', 'ananya@example.com', 'Akota, Vadodara, Gujarat', '1992-10-24', 'en', 25, 'Interested in Titan Edge'],
            ['Suresh Patel', '+919426098765', 'suresh@example.com', 'Sayajigunj, Vadodara', '1978-01-30', 'hi', 10, 'Regular service patron']
        ]

        for row_idx, row_values in enumerate(sample_data, start=2):
            for col_idx, val in enumerate(row_values, start=1):
                sheet.cell(row=row_idx, column=col_idx, value=val)

        for col in sheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            sheet.column_dimensions[col[0].column_letter].width = min(max_len + 4, 40)

        return wb
