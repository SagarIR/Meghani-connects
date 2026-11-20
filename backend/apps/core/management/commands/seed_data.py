"""
Management command to seed the database with sample data for testing.
Run: python manage.py seed_data
"""

import random
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.users.models import User
from apps.products.models import Product
from apps.crm.models import Customer
from apps.sales.models import Sale, SaleItem
from apps.repairs.models import Repair
from apps.expenses.models import Expense


class Command(BaseCommand):
    help = 'Seed database with sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            from django.conf import settings
            from django.core.management.base import CommandError
            if not getattr(settings, 'DEBUG', False) or getattr(settings, 'IS_PRODUCTION', False):
                raise CommandError(
                    "CRITICAL SAFETY BLOCK: Destructive --clear flag is prohibited in production or when DEBUG=False."
                )
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Starting database seed...')
        
        with transaction.atomic():
            self.create_users()
            self.create_products()
            self.create_customers()
            self.create_sales()
            self.create_repairs()
            self.create_expenses()
        
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))

    def clear_data(self):
        """Clear all data except superusers"""
        Expense.objects.all().delete()
        Repair.objects.all().delete()
        SaleItem.objects.all().delete()
        Sale.objects.all().delete()
        Customer.objects.all().delete()
        Product.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def create_users(self):
        """Create admin and staff users"""
        self.stdout.write('Creating users...')
        
        # Create admin user if not exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                password='admin123',
                name='Admin User',
                email='admin@watchshop.com',
                phone='9876543210'
            )
            self.stdout.write(self.style.SUCCESS('  Created admin user (username: admin, password: admin123)'))
        
        # Create staff users
        staff_users = [
            {'username': 'rajesh', 'name': 'Rajesh Kumar', 'phone': '9876543211'},
            {'username': 'priya', 'name': 'Priya Sharma', 'phone': '9876543212'},
        ]
        
        for user_data in staff_users:
            if not User.objects.filter(username=user_data['username']).exists():
                User.objects.create_user(
                    username=user_data['username'],
                    password='staff123',
                    name=user_data['name'],
                    phone=user_data['phone'],
                    role='staff'
                )
        
        self.stdout.write(f'  Created {len(staff_users)} staff users')

    def create_products(self):
        """Create sample products"""
        self.stdout.write('Creating products...')
        
        products_data = [
            # Analog Watches
            {'name': 'Classic Leather Strap', 'brand': 'Titan', 'category': 'analog', 'cost': 2500, 'sell': 3499, 'stock': 25, 'warranty': 12},
            {'name': 'Executive Gold', 'brand': 'Titan', 'category': 'analog', 'cost': 4500, 'sell': 5999, 'stock': 15, 'warranty': 24},
            {'name': 'Sports Chronograph', 'brand': 'Fastrack', 'category': 'analog', 'cost': 1800, 'sell': 2599, 'stock': 30, 'warranty': 12},
            {'name': 'Vintage Collection', 'brand': 'Timex', 'category': 'analog', 'cost': 3200, 'sell': 4499, 'stock': 12, 'warranty': 12},
            {'name': 'Minimalist Slim', 'brand': 'Sonata', 'category': 'analog', 'cost': 1200, 'sell': 1799, 'stock': 40, 'warranty': 6},
            {'name': 'Premium Steel', 'brand': 'Citizen', 'category': 'analog', 'cost': 8500, 'sell': 11999, 'stock': 8, 'warranty': 24},
            {'name': 'Ladies Diamond', 'brand': 'Titan', 'category': 'analog', 'cost': 5500, 'sell': 7499, 'stock': 10, 'warranty': 24},
            {'name': 'Casual Everyday', 'brand': 'Fastrack', 'category': 'analog', 'cost': 1500, 'sell': 2199, 'stock': 35, 'warranty': 12},
            
            # Digital Watches
            {'name': 'G-Shock Classic', 'brand': 'Casio', 'category': 'digital', 'cost': 6500, 'sell': 8999, 'stock': 18, 'warranty': 24},
            {'name': 'Sport Digital', 'brand': 'Casio', 'category': 'digital', 'cost': 2200, 'sell': 2999, 'stock': 25, 'warranty': 12},
            {'name': 'Kids Digital Fun', 'brand': 'Maxima', 'category': 'digital', 'cost': 800, 'sell': 1299, 'stock': 50, 'warranty': 6},
            {'name': 'Runner Pro', 'brand': 'Timex', 'category': 'digital', 'cost': 3500, 'sell': 4799, 'stock': 15, 'warranty': 12},
            
            # Smart Watches
            {'name': 'Fitness Band Pro', 'brand': 'Noise', 'category': 'smart', 'cost': 2500, 'sell': 3499, 'stock': 30, 'warranty': 12},
            {'name': 'ColorFit Ultra', 'brand': 'Noise', 'category': 'smart', 'cost': 3200, 'sell': 4499, 'stock': 20, 'warranty': 12},
            {'name': 'GTR 2 Mini', 'brand': 'Amazfit', 'category': 'smart', 'cost': 5500, 'sell': 7499, 'stock': 12, 'warranty': 12},
            {'name': 'Watch Active', 'brand': 'Samsung', 'category': 'smart', 'cost': 12000, 'sell': 15999, 'stock': 8, 'warranty': 24},
            {'name': 'Band 7', 'brand': 'Mi', 'category': 'smart', 'cost': 2800, 'sell': 3799, 'stock': 25, 'warranty': 12},
            
            # Wall Clocks
            {'name': 'Classic Pendulum', 'brand': 'Ajanta', 'category': 'wall', 'cost': 1800, 'sell': 2499, 'stock': 20, 'warranty': 6},
            {'name': 'Modern Minimalist', 'brand': 'Ajanta', 'category': 'wall', 'cost': 1200, 'sell': 1699, 'stock': 30, 'warranty': 6},
            {'name': 'Digital LED Large', 'brand': 'Orpat', 'category': 'wall', 'cost': 2500, 'sell': 3299, 'stock': 15, 'warranty': 12},
            {'name': 'Wooden Antique', 'brand': 'Kaiser', 'category': 'wall', 'cost': 4500, 'sell': 5999, 'stock': 8, 'warranty': 12},
            {'name': 'Office Standard', 'brand': 'Ajanta', 'category': 'wall', 'cost': 600, 'sell': 899, 'stock': 45, 'warranty': 6},
            
            # Accessories
            {'name': 'Leather Strap 20mm', 'brand': 'Generic', 'category': 'accessory', 'cost': 250, 'sell': 399, 'stock': 100, 'warranty': 0},
            {'name': 'Steel Chain 22mm', 'brand': 'Generic', 'category': 'accessory', 'cost': 450, 'sell': 699, 'stock': 80, 'warranty': 0},
            {'name': 'Watch Box - 6 Slot', 'brand': 'Generic', 'category': 'accessory', 'cost': 800, 'sell': 1199, 'stock': 30, 'warranty': 0},
            {'name': 'Watch Box - 12 Slot', 'brand': 'Generic', 'category': 'accessory', 'cost': 1200, 'sell': 1799, 'stock': 20, 'warranty': 0},
            {'name': 'Cleaning Kit', 'brand': 'Generic', 'category': 'accessory', 'cost': 150, 'sell': 299, 'stock': 60, 'warranty': 0},
            {'name': 'Battery CR2032', 'brand': 'Sony', 'category': 'accessory', 'cost': 30, 'sell': 80, 'stock': 200, 'warranty': 0},
            {'name': 'Silicone Strap', 'brand': 'Generic', 'category': 'accessory', 'cost': 180, 'sell': 349, 'stock': 70, 'warranty': 0},
        ]
        
        for i, data in enumerate(products_data):
            Product.objects.create(
                name=data['name'],
                brand=data['brand'],
                category=data['category'],
                cost_price=Decimal(str(data['cost'])),
                selling_price=Decimal(str(data['sell'])),
                stock=data['stock'],
                warranty_months=data['warranty'],
                barcode=f'PROD{str(i+1001).zfill(8)}',
                description=f"High quality {data['category']} - {data['name']} by {data['brand']}",
            )
        
        self.stdout.write(f'  Created {len(products_data)} products')

    def create_customers(self):
        """Create sample customers"""
        self.stdout.write('Creating customers...')
        
        customers_data = [
            {'name': 'Amit Patel', 'phone': '9898123456', 'email': 'amit.patel@email.com', 'points': 500},
            {'name': 'Sunita Shah', 'phone': '9898234567', 'email': 'sunita.shah@email.com', 'points': 1200},
            {'name': 'Rajesh Mehta', 'phone': '9898345678', 'email': 'rajesh.mehta@email.com', 'points': 2500},
            {'name': 'Priyanka Joshi', 'phone': '9898456789', 'email': 'priyanka.joshi@email.com', 'points': 800},
            {'name': 'Kiran Kumar', 'phone': '9898567890', 'email': 'kiran.kumar@email.com', 'points': 150},
            {'name': 'Neha Desai', 'phone': '9898678901', 'email': 'neha.desai@email.com', 'points': 3500},
            {'name': 'Vikram Singh', 'phone': '9898789012', 'email': 'vikram.singh@email.com', 'points': 600},
            {'name': 'Anita Sharma', 'phone': '9898890123', 'email': 'anita.sharma@email.com', 'points': 950},
            {'name': 'Deepak Verma', 'phone': '9898901234', 'email': 'deepak.verma@email.com', 'points': 5200},
            {'name': 'Kavita Gupta', 'phone': '9899012345', 'email': 'kavita.gupta@email.com', 'points': 1800},
            {'name': 'Suresh Rao', 'phone': '9899123456', 'email': 'suresh.rao@email.com', 'points': 420},
            {'name': 'Meena Iyer', 'phone': '9899234567', 'email': 'meena.iyer@email.com', 'points': 2100},
            {'name': 'Arjun Reddy', 'phone': '9899345678', 'email': 'arjun.reddy@email.com', 'points': 750},
            {'name': 'Lakshmi Nair', 'phone': '9899456789', 'email': 'lakshmi.nair@email.com', 'points': 1500},
            {'name': 'Rohit Agarwal', 'phone': '9899567890', 'email': 'rohit.agarwal@email.com', 'points': 3200},
        ]
        
        for data in customers_data:
            Customer.objects.create(
                name=data['name'],
                phone=data['phone'],
                email=data['email'],
                loyalty_points=data['points'],
                language_preference=random.choice(['en', 'hi', 'gu']),
                address=f"{random.randint(1, 500)}, Main Road, City - {random.randint(380001, 380099)}",
            )
        
        self.stdout.write(f'  Created {len(customers_data)} customers')

    def create_sales(self):
        """Create sample sales"""
        self.stdout.write('Creating sales...')
        
        products = list(Product.objects.all())
        customers = list(Customer.objects.all())
        admin = User.objects.filter(is_superuser=True).first()
        
        if not products or not customers or not admin:
            self.stdout.write(self.style.WARNING('  Skipping sales - missing required data'))
            return
        
        payment_modes = ['cash', 'upi', 'card', 'mixed']
        sales_count = 0
        
        # Create sales for the last 30 days
        for days_ago in range(30):
            sale_date = timezone.now() - timedelta(days=days_ago)
            
            # 2-5 sales per day
            daily_sales = random.randint(2, 5)
            
            for _ in range(daily_sales):
                # Select random products (1-4 items per sale)
                sale_products = random.sample(products, min(random.randint(1, 4), len(products)))
                
                total_amount = Decimal('0')
                total_profit = Decimal('0')
                
                # Calculate totals
                items_data = []
                for product in sale_products:
                    qty = random.randint(1, 3)
                    subtotal = product.selling_price * qty
                    profit = (product.selling_price - product.cost_price) * qty
                    total_amount += subtotal
                    total_profit += profit
                    items_data.append({
                        'product': product,
                        'quantity': qty,
                        'unit_price': product.selling_price,
                        'cost_price': product.cost_price,
                        'subtotal': subtotal,
                    })
                
                # Apply random discount (0-10%)
                discount = total_amount * Decimal(str(random.randint(0, 10) / 100))
                total_amount -= discount
                
                # Create sale
                sale = Sale.objects.create(
                    customer=random.choice(customers) if random.random() > 0.3 else None,
                    total_amount=total_amount,
                    discount=discount,
                    profit=total_profit,
                    payment_mode=random.choice(payment_modes),
                    sale_date=sale_date,
                    created_by=admin,
                )
                
                # Create sale items
                for item in items_data:
                    SaleItem.objects.create(sale=sale, **item)
                
                sales_count += 1
        
        self.stdout.write(f'  Created {sales_count} sales')

    def create_repairs(self):
        """Create sample repair tickets"""
        self.stdout.write('Creating repairs...')
        
        customers = list(Customer.objects.all())
        admin = User.objects.filter(is_superuser=True).first()
        
        if not customers or not admin:
            self.stdout.write(self.style.WARNING('  Skipping repairs - missing required data'))
            return
        
        item_types = ['Wrist Watch', 'Wall Clock', 'Table Clock', 'Smart Watch', 'Pocket Watch']
        brands = ['Titan', 'Casio', 'Fastrack', 'Timex', 'Citizen', 'Ajanta', 'Unknown']
        issues = [
            'Not working, needs battery replacement',
            'Crystal glass broken, needs replacement',
            'Band/strap broken',
            'Crown not working properly',
            'Dial hands not moving',
            'Water damage, needs cleaning',
            'Bezel loose, needs fixing',
            'Pendulum not swinging',
            'Time not accurate, needs servicing',
            'Display not working (smart watch)',
        ]
        statuses = ['received', 'in_repair', 'ready', 'delivered']
        
        repairs_data = []
        for i in range(20):
            days_ago = random.randint(0, 30)
            received_date = timezone.now() - timedelta(days=days_ago)
            estimated = Decimal(str(random.randint(2, 15) * 100))
            
            status = random.choice(statuses)
            repair_charge = None
            delivered_date = None
            
            if status in ['ready', 'delivered']:
                repair_charge = estimated + Decimal(str(random.randint(-50, 200)))
            if status == 'delivered':
                delivered_date = received_date + timedelta(days=random.randint(1, 7))
            
            repairs_data.append({
                'customer': random.choice(customers),
                'item_type': random.choice(item_types),
                'brand': random.choice(brands),
                'issue_description': random.choice(issues),
                'estimated_cost': estimated,
                'repair_charge': repair_charge,
                'advance_paid': Decimal(str(random.randint(0, 5) * 100)),
                'status': status,
                'received_date': received_date,
                'delivered_date': delivered_date,
                'expected_delivery': (received_date + timedelta(days=5)).date(),
                'created_by': admin,
            })
        
        for data in repairs_data:
            Repair.objects.create(**data)
        
        self.stdout.write(f'  Created {len(repairs_data)} repair tickets')

    def create_expenses(self):
        """Create sample expenses"""
        self.stdout.write('Creating expenses...')
        
        admin = User.objects.filter(is_superuser=True).first()
        
        if not admin:
            self.stdout.write(self.style.WARNING('  Skipping expenses - missing admin user'))
            return
        
        expense_categories = {
            'rent': [('Shop rent - January', 25000), ('Shop rent - February', 25000)],
            'salary': [('Staff salary - Rajesh', 18000), ('Staff salary - Priya', 16000)],
            'utilities': [('Electricity bill', 3500), ('Water bill', 800), ('Internet bill', 1200)],
            'maintenance': [('AC servicing', 2500), ('Shop cleaning', 1500)],
            'purchase': [('Watch straps bulk order', 8500), ('Battery stock', 2000), ('Packaging material', 1200)],
            'marketing': [('Local newspaper ad', 3000), ('Pamphlets printing', 1500)],
            'transport': [('Courier charges', 800), ('Local pickup', 500)],
            'other': [('Tea/snacks for shop', 1500), ('Misc supplies', 800)],
        }
        
        expenses_count = 0
        for category, items in expense_categories.items():
            for description, amount in items:
                days_ago = random.randint(0, 45)
                Expense.objects.create(
                    category=category,
                    amount=Decimal(str(amount)),
                    date=date.today() - timedelta(days=days_ago),
                    description=description,
                    vendor_name=f"Vendor - {description.split()[0]}",
                    created_by=admin,
                )
                expenses_count += 1
        
        self.stdout.write(f'  Created {expenses_count} expenses')
