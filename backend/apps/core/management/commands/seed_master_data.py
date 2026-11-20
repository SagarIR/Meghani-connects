"""
Management command to seed standardized, reusable master data for Meghani Connect 360.
Run: python manage.py seed_master_data

Features:
- 100% Idempotent and non-destructive.
- Safe to rerun multiple times in local and production PostgreSQL/Neon.
- Never resets, deletes, or modifies existing business transactions.
- Preserves all customized business settings and existing master records.
- Reports detailed counts of created, skipped, and total records.
"""

from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.core.settings_models import BusinessSettings
from apps.products.models import Brand, Category, Subcategory
from apps.notifications.models import MessageTemplate


class Command(BaseCommand):
    help = 'Seed standardized, reusable master data (Business Settings, Categories, Subcategories, Brands, and Templates)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('=== Meghani Connect 360 – Master Data Engineering ===\n'))

        stats = {
            'settings': {'created': 0, 'updated': 0, 'skipped': 0},
            'categories': {'created': 0, 'skipped': 0, 'total': 0},
            'subcategories': {'created': 0, 'skipped': 0, 'total': 0},
            'brands': {'created': 0, 'skipped': 0, 'total': 0},
            'templates': {'created': 0, 'skipped': 0, 'total': 0},
        }

        with transaction.atomic():
            self.seed_business_settings(stats['settings'])
            self.seed_categories_and_subcategories(stats['categories'], stats['subcategories'])
            self.seed_brands(stats['brands'])
            self.seed_message_templates(stats['templates'])

        self.stdout.write(self.style.SUCCESS('\n=== Master Data Seeding Completed Successfully ==='))
        self.print_summary(stats)

    def seed_business_settings(self, stat):
        """Idempotently configure business settings while preserving all custom data"""
        self.stdout.write('Checking Business Settings...')
        settings, created = BusinessSettings.objects.get_or_create(
            pk=1,
            defaults={
                'business_name': 'Meghani Watch Co.',
                'tagline': 'Timeless Elegance & Precision Horology Since 1985',
                'currency_code': 'INR',
                'currency_symbol': '₹',
                'country': 'India',
                'timezone': 'Asia/Kolkata',
                'invoice_prefix': 'INV',
                'repair_prefix': 'REP',
                'po_prefix': 'PO',
                'default_tax_rate': Decimal('18.00'),
                'phone': '+91 99042 22166',
                'whatsapp_number': '919106680191',
                'email': 'concierge@meghaniwatchco.com',
                'city': 'Vadodara',
                'state': 'Gujarat',
                'pincode': '390001',
                'landmark': 'Near Abhilasha Char Rasta (Plus Code: 85RP+R5 Vadodara)',
                'privacy_policy': 'Meghani Watch Co. respects your privacy and protects your customer data.',
                'terms_and_conditions': '1. Goods once sold carry authorized brand warranty. 2. Repair estimates valid for 15 days.',
            }
        )

        if created:
            stat['created'] += 1
            self.stdout.write(self.style.SUCCESS('  [+] Created default BusinessSettings singleton'))
        else:
            # Preserve existing custom values; only set blank new fields
            updated_fields = []
            if not settings.currency_code:
                settings.currency_code = 'INR'
                updated_fields.append('currency_code')
            if not settings.currency_symbol:
                settings.currency_symbol = '₹'
                updated_fields.append('currency_symbol')
            if not settings.country:
                settings.country = 'India'
                updated_fields.append('country')
            if not settings.timezone:
                settings.timezone = 'Asia/Kolkata'
                updated_fields.append('timezone')
            if not settings.po_prefix:
                settings.po_prefix = 'PO'
                updated_fields.append('po_prefix')
            if not settings.default_tax_rate:
                settings.default_tax_rate = Decimal('18.00')
                updated_fields.append('default_tax_rate')

            if updated_fields:
                settings.save(update_fields=updated_fields)
                stat['updated'] += 1
                self.stdout.write(self.style.SUCCESS(f'  [*] Updated missing settings fields: {", ".join(updated_fields)}'))
            else:
                stat['skipped'] += 1
                self.stdout.write(self.style.NOTICE(f'  [-] BusinessSettings exists and customized ({settings.business_name}) – preserved'))

    def seed_categories_and_subcategories(self, cat_stat, subcat_stat):
        """Seed complete, structured watch & horology taxonomy"""
        self.stdout.write('\nSeeding Categories & Subcategories...')

        # Master category taxonomy with subcategories
        taxonomy = [
            {
                'name': 'Analog Watches',
                'slug': 'analog',
                'tagline': 'Classic Hands & Mechanical Elegance',
                'description': 'Traditional analog watches with hour, minute and second hands, quartz or mechanical movements.',
                'display_order': 1,
                'subcategories': [
                    {'name': "Men's Analog", 'slug': 'mens-analog', 'order': 1},
                    {'name': "Women's Analog", 'slug': 'womens-analog', 'order': 2},
                    {'name': 'Classic Watches', 'slug': 'classic-watches', 'order': 3},
                    {'name': 'Dress Watches', 'slug': 'dress-watches', 'order': 4},
                    {'name': 'Casual Watches', 'slug': 'casual-watches', 'order': 5},
                    {'name': 'Fashion Watches', 'slug': 'fashion-watches', 'order': 6},
                    {'name': 'Chronograph', 'slug': 'chronograph', 'order': 7},
                    {'name': 'Automatic & Mechanical', 'slug': 'automatic-mechanical', 'order': 8},
                    {'name': 'Luxury & Heritage', 'slug': 'luxury-heritage', 'order': 9},
                    {'name': 'Diving Watches', 'slug': 'diving-watches', 'order': 10},
                ]
            },
            {
                'name': 'Digital Watches',
                'slug': 'digital',
                'tagline': 'Rugged Digital Displays & Utility',
                'description': 'Electronic LCD and LED digital wristwatches offering stopwatches, alarms, and rugged durability.',
                'display_order': 2,
                'subcategories': [
                    {'name': 'Sports Digital', 'slug': 'sports-digital', 'order': 1},
                    {'name': 'Vintage Digital', 'slug': 'vintage-digital', 'order': 2},
                    {'name': 'Youth & Kids Digital', 'slug': 'youth-kids', 'order': 3},
                    {'name': 'LED Watches', 'slug': 'led-watches', 'order': 4},
                    {'name': 'Tactical & Outdoor Digital', 'slug': 'tactical-digital', 'order': 5},
                ]
            },
            {
                'name': 'Smartwatches',
                'slug': 'smart',
                'tagline': 'Next-Gen Wearables & Connected Horology',
                'description': 'Smart connected wristwatches with fitness tracking, notifications, Bluetooth calling, and health sensors.',
                'display_order': 3,
                'subcategories': [
                    {'name': 'Fitness Trackers', 'slug': 'fitness-trackers', 'order': 1},
                    {'name': 'Smartwatches', 'slug': 'smartwatches', 'order': 2},
                    {'name': 'Hybrid Smartwatches', 'slug': 'hybrid-smartwatches', 'order': 3},
                    {'name': 'Bluetooth Calling Watches', 'slug': 'bluetooth-calling', 'order': 4},
                    {'name': 'GPS Sports Smartwatches', 'slug': 'gps-smartwatches', 'order': 5},
                ]
            },
            {
                'name': 'Luxury Watches',
                'slug': 'luxury',
                'tagline': 'Haute Horlogerie & Precious Timepieces',
                'description': 'Premium Swiss and luxury horological masterpieces, chronometers, and fine jewelry watches.',
                'display_order': 4,
                'subcategories': [
                    {'name': 'Haute Horlogerie', 'slug': 'haute-horlogerie', 'order': 1},
                    {'name': 'Swiss Heritage', 'slug': 'swiss-heritage', 'order': 2},
                    {'name': 'Diamond & Precious Metals', 'slug': 'diamond-gold', 'order': 3},
                    {'name': 'Tourbillon & Skeleton', 'slug': 'tourbillon-skeleton', 'order': 4},
                ]
            },
            {
                'name': 'Sports Watches',
                'slug': 'sports',
                'tagline': 'High Performance & Adventure Gear',
                'description': 'Endurance sport watches engineered for shock resistance, tachymeter speed tracking, and high water resistance.',
                'display_order': 5,
                'subcategories': [
                    {'name': 'Tachymeter & Racing', 'slug': 'tachymeter-racing', 'order': 1},
                    {'name': 'Water Sports & Diver', 'slug': 'water-sports-diver', 'order': 2},
                    {'name': 'Outdoor & Hiking', 'slug': 'outdoor-hiking', 'order': 3},
                    {'name': 'Tactical Military Watches', 'slug': 'tactical-military', 'order': 4},
                ]
            },
            {
                'name': 'Kids Watches',
                'slug': 'kids',
                'tagline': 'Playful, Durable & Educational Timepieces',
                'description': 'Colorful, durable, easy-to-read watches designed specially for children and young students.',
                'display_order': 6,
                'subcategories': [
                    {'name': 'Boys Watches', 'slug': 'boys-watches', 'order': 1},
                    {'name': 'Girls Watches', 'slug': 'girls-watches', 'order': 2},
                    {'name': 'Time Teacher & Educational', 'slug': 'time-teacher', 'order': 3},
                    {'name': 'Character & Cartoon Watches', 'slug': 'character-watches', 'order': 4},
                ]
            },
            {
                'name': 'Wall Clocks',
                'slug': 'wall',
                'tagline': 'Statement Timepieces for Home & Office',
                'description': 'Decorative, silent sweep, pendulum, and wooden wall clocks for interior aesthetics and precision timekeeping.',
                'display_order': 7,
                'subcategories': [
                    {'name': 'Contemporary Wall Clocks', 'slug': 'contemporary-wall-clocks', 'order': 1},
                    {'name': 'Pendulum Clocks', 'slug': 'pendulum-clocks', 'order': 2},
                    {'name': 'Antique & Wooden Clocks', 'slug': 'antique-wooden', 'order': 3},
                    {'name': 'Office & Commercial Clocks', 'slug': 'office-commercial', 'order': 4},
                    {'name': 'Analog Wall Clocks', 'slug': 'analog-wall-clocks', 'order': 5},
                    {'name': 'Digital LED Wall Clocks', 'slug': 'digital-led-wall', 'order': 6},
                ]
            },
            {
                'name': 'Table & Desk Clocks',
                'slug': 'table-clocks',
                'tagline': 'Executive Desk Accents & Mantel Timepieces',
                'description': 'Precision desk clocks, executive paperweight timepieces, and decorative mantel clocks.',
                'display_order': 8,
                'subcategories': [
                    {'name': 'Executive Desk Clocks', 'slug': 'executive-desk-clocks', 'order': 1},
                    {'name': 'Vintage Mantel Clocks', 'slug': 'vintage-mantel-clocks', 'order': 2},
                    {'name': 'Digital Desktop Monitors', 'slug': 'digital-desktop-clocks', 'order': 3},
                ]
            },
            {
                'name': 'Alarm Clocks',
                'slug': 'alarm-clocks',
                'tagline': 'Reliable Morning Wakening Timepieces',
                'description': 'Traditional twin-bell mechanical alarm clocks, electronic beeper alarms, and digital bedside clocks.',
                'display_order': 9,
                'subcategories': [
                    {'name': 'Twin Bell Retro Alarms', 'slug': 'twin-bell-alarms', 'order': 1},
                    {'name': 'Digital Bedside Alarms', 'slug': 'digital-bedside-alarms', 'order': 2},
                    {'name': 'Silent Sweep Snooze Alarms', 'slug': 'silent-sweep-alarms', 'order': 3},
                ]
            },
            {
                'name': 'Pocket Watches',
                'slug': 'pocket-watches',
                'tagline': 'Timeless Heritage & Vintage Pocket Timepieces',
                'description': 'Traditional pocket watches with chain, hunter case covers, and mechanical or quartz movements.',
                'display_order': 10,
                'subcategories': [
                    {'name': 'Mechanical Pocket Watches', 'slug': 'mechanical-pocket-watches', 'order': 1},
                    {'name': 'Quartz Pocket Watches', 'slug': 'quartz-pocket-watches', 'order': 2},
                    {'name': 'Vintage Engraved Cases', 'slug': 'vintage-engraved-pocket', 'order': 3},
                ]
            },
            {
                'name': 'Watch Accessories',
                'slug': 'accessory',
                'tagline': 'Luxury Storage, Winders & Horology Care',
                'description': 'Watch cases, automatic watch winders, cleaning cloths, and horological storage accessories.',
                'display_order': 11,
                'subcategories': [
                    {'name': 'Watch Boxes & Cases', 'slug': 'watch-boxes-cases', 'order': 1},
                    {'name': 'Automatic Watch Winders', 'slug': 'watch-winders', 'order': 2},
                    {'name': 'Cleaning & Care Kits', 'slug': 'cleaning-care', 'order': 3},
                    {'name': 'Travel Rolls & Pouches', 'slug': 'travel-rolls', 'order': 4},
                ]
            },
            {
                'name': 'Watch Spare Parts',
                'slug': 'spare-parts',
                'tagline': 'Authentic Components & Horological Movements',
                'description': 'Genuine replacement batteries, quartz and mechanical movements, crowns, crystals, and gaskets.',
                'display_order': 12,
                'subcategories': [
                    {'name': 'Power Cells & Batteries', 'slug': 'batteries', 'order': 1},
                    {'name': 'Crowns and Stems', 'slug': 'crowns-and-stems', 'order': 2},
                    {'name': 'Watch Movements (Miyota/Seiko/ETA)', 'slug': 'watch-movements', 'order': 3},
                    {'name': 'Watch Glass & Crystals', 'slug': 'watch-glass', 'order': 4},
                    {'name': 'Gaskets & Waterproof O-Rings', 'slug': 'gaskets-o-rings', 'order': 5},
                    {'name': 'Hands & Dials', 'slug': 'hands-dials', 'order': 6},
                ]
            },
            {
                'name': 'Watch Straps',
                'slug': 'straps',
                'tagline': 'Premium Leather, Steel Mesh & Silicone Bands',
                'description': 'Replacement straps and bracelets in various widths, materials, and buckle finishes.',
                'display_order': 13,
                'subcategories': [
                    {'name': 'Genuine Leather Straps', 'slug': 'leather-straps', 'order': 1},
                    {'name': 'Stainless Steel Metal Bands', 'slug': 'metal-straps', 'order': 2},
                    {'name': 'Silicone & Sport Bands', 'slug': 'silicone-straps', 'order': 3},
                    {'name': 'Nylon & NATO Straps', 'slug': 'nato-straps', 'order': 4},
                    {'name': 'Rubber & FKM Dive Straps', 'slug': 'rubber-straps', 'order': 5},
                ]
            },
            {
                'name': 'Gift Sets',
                'slug': 'gift-sets',
                'tagline': 'Curated Celebration & Couple Watch Combos',
                'description': 'Elegantly packaged couple sets, anniversary combos with wallets, pens, or bracelets.',
                'display_order': 14,
                'subcategories': [
                    {'name': 'Couple Watch Sets (His & Hers)', 'slug': 'couple-watch-sets', 'order': 1},
                    {'name': 'Watch & Wallet Combo Sets', 'slug': 'watch-wallet-sets', 'order': 2},
                    {'name': 'Watch & Pen Presentation Sets', 'slug': 'watch-pen-sets', 'order': 3},
                    {'name': 'Festive Celebration Combos', 'slug': 'festive-combos', 'order': 4},
                ]
            },
        ]

        for cat_data in taxonomy:
            cat_slug = cat_data['slug']
            cat_name = cat_data['name']

            # Match existing category by slug or name
            cat = Category.objects.filter(slug=cat_slug).first()
            if not cat:
                cat = Category.objects.filter(name__iexact=cat_name).first()

            if cat:
                cat_stat['skipped'] += 1
                self.stdout.write(f'  [-] Category exists: {cat.name} ({cat.slug})')
            else:
                cat = Category.objects.create(
                    name=cat_name,
                    slug=cat_slug,
                    tagline=cat_data.get('tagline', ''),
                    description=cat_data.get('description', ''),
                    display_order=cat_data.get('display_order', 0),
                    is_active=True
                )
                cat_stat['created'] += 1
                self.stdout.write(self.style.SUCCESS(f'  [+] Created Category: {cat.name} ({cat.slug})'))

            # Seed subcategories under this category
            for sub_data in cat_data.get('subcategories', []):
                sub_slug = sub_data['slug']
                sub_name = sub_data['name']

                # Subcategory is unique per (category, slug)
                subcat = Subcategory.objects.filter(category=cat, slug=sub_slug).first()
                if not subcat:
                    subcat = Subcategory.objects.filter(category=cat, name__iexact=sub_name).first()

                if subcat:
                    subcat_stat['skipped'] += 1
                else:
                    Subcategory.objects.create(
                        category=cat,
                        name=sub_name,
                        slug=sub_slug,
                        display_order=sub_data.get('order', 0),
                        is_active=True
                    )
                    subcat_stat['created'] += 1

        cat_stat['total'] = Category.objects.count()
        subcat_stat['total'] = Subcategory.objects.count()

    def seed_brands(self, stat):
        """Seed Indian & International watch, smartwatch and clock brands"""
        self.stdout.write('\nSeeding Brand Master Catalogue...')

        brands_catalog = [
            # Indian Heritage & Popular Brands
            {'name': 'Titan', 'slug': 'titan', 'country': 'India', 'est': '1984', 'tagline': 'India’s Favorite Timepiece Maker', 'featured': True},
            {'name': 'Fastrack', 'slug': 'fastrack', 'country': 'India', 'est': '1998', 'tagline': 'Move On', 'featured': True},
            {'name': 'Sonata', 'slug': 'sonata', 'country': 'India', 'est': '1997', 'tagline': 'Pyaar Ki Nazaakat', 'featured': True},
            {'name': 'HMT', 'slug': 'hmt', 'country': 'India', 'est': '1961', 'tagline': 'Timekeepers to the Nation', 'featured': False},
            {'name': 'Maxima', 'slug': 'maxima', 'country': 'India', 'est': '1996', 'tagline': 'Guaranteed Waterproof Quality', 'featured': False},
            {'name': 'Jaipur Watch Company', 'slug': 'jaipur-watch-company', 'country': 'India', 'est': '2013', 'tagline': 'Bespoke Coin Watches & Royal Horology', 'featured': False},
            {'name': 'Bangalore Watch Company', 'slug': 'bangalore-watch-company', 'country': 'India', 'est': '2018', 'tagline': 'World-Class Watches Inspired by India', 'featured': False},
            {'name': 'Nebula', 'slug': 'nebula', 'country': 'India', 'est': '1999', 'tagline': 'Solid 18K Gold Watches by Titan', 'featured': False},
            {'name': 'Raga', 'slug': 'raga', 'country': 'India', 'est': '1992', 'tagline': 'Elegance Redefined for Women', 'featured': True},
            {'name': 'Edge', 'slug': 'edge', 'country': 'India', 'est': '2002', 'tagline': 'The Slimmest Ceramic Watch in the World', 'featured': True},
            {'name': 'Xylys', 'slug': 'xylys', 'country': 'India', 'est': '2006', 'tagline': 'Swiss Made by Titan', 'featured': False},
            {'name': 'Zoop', 'slug': 'zoop', 'country': 'India', 'est': '2009', 'tagline': 'Cool Watches for Smart Kids', 'featured': False},
            {'name': 'boAt', 'slug': 'boat', 'country': 'India', 'est': '2016', 'tagline': 'Plug Into Nirvana', 'featured': True},
            {'name': 'Noise', 'slug': 'noise', 'country': 'India', 'est': '2014', 'tagline': 'Listen to the Noise Within', 'featured': True},
            {'name': 'Fire-Boltt', 'slug': 'fire-boltt', 'country': 'India', 'est': '2015', 'tagline': 'Ignite the Fire in You', 'featured': True},
            {'name': 'Boult', 'slug': 'boult', 'country': 'India', 'est': '2017', 'tagline': 'Unapologetically Innovative', 'featured': False},
            {'name': 'Pebble', 'slug': 'pebble', 'country': 'India', 'est': '2013', 'tagline': 'Empowering Smart Living', 'featured': False},
            {'name': 'Hammer', 'slug': 'hammer', 'country': 'India', 'est': '2019', 'tagline': 'Smart Lifestyle Tech', 'featured': False},
            {'name': 'Crossbeats', 'slug': 'crossbeats', 'country': 'India', 'est': '2015', 'tagline': 'Live Beyond Boundaries', 'featured': False},
            {'name': 'Ajanta', 'slug': 'ajanta', 'country': 'India', 'est': '1971', 'tagline': 'India’s Clock Pioneer', 'featured': True},
            {'name': 'Orpat', 'slug': 'orpat', 'country': 'India', 'est': '1971', 'tagline': 'Innovative Consumer Clocks', 'featured': True},
            {'name': 'Rikon', 'slug': 'rikon', 'country': 'India', 'est': '1989', 'tagline': 'Precision Quartz Wall Clocks', 'featured': False},

            # Japanese Horological Innovators
            {'name': 'Casio', 'slug': 'casio', 'country': 'Japan', 'est': '1946', 'tagline': 'Creativity and Contribution', 'featured': True},
            {'name': 'G-Shock', 'slug': 'g-shock', 'country': 'Japan', 'est': '1983', 'tagline': 'The Absolute Toughness', 'featured': True},
            {'name': 'Edifice', 'slug': 'edifice', 'country': 'Japan', 'est': '2000', 'tagline': 'Speed and Intelligence', 'featured': True},
            {'name': 'Seiko', 'slug': 'seiko', 'country': 'Japan', 'est': '1881', 'tagline': 'Always One Step Ahead of the Rest', 'featured': True},
            {'name': 'Grand Seiko', 'slug': 'grand-seiko', 'country': 'Japan', 'est': '1960', 'tagline': 'The Nature of Time', 'featured': False},
            {'name': 'Citizen', 'slug': 'citizen', 'country': 'Japan', 'est': '1918', 'tagline': 'Better Starts Now', 'featured': True},
            {'name': 'Orient', 'slug': 'orient', 'country': 'Japan', 'est': '1950', 'tagline': 'Craftsmanship & Mechanical Excellence', 'featured': False},
            {'name': 'Orient Star', 'slug': 'orient-star', 'country': 'Japan', 'est': '1951', 'tagline': 'Shining Star of Japanese Horology', 'featured': False},

            # Swiss Luxury & Heritage
            {'name': 'Tissot', 'slug': 'tissot', 'country': 'Switzerland', 'est': '1853', 'tagline': 'Innovators by Tradition', 'featured': True},
            {'name': 'Rado', 'slug': 'rado', 'country': 'Switzerland', 'est': '1917', 'tagline': 'Master of Materials', 'featured': True},
            {'name': 'Longines', 'slug': 'longines', 'country': 'Switzerland', 'est': '1832', 'tagline': 'Elegance is an Attitude', 'featured': False},
            {'name': 'Omega', 'slug': 'omega', 'country': 'Switzerland', 'est': '1848', 'tagline': 'Exact Time for Life', 'featured': True},
            {'name': 'Rolex', 'slug': 'rolex', 'country': 'Switzerland', 'est': '1905', 'tagline': 'A Crown for Every Achievement', 'featured': True},
            {'name': 'TAG Heuer', 'slug': 'tag-heuer', 'country': 'Switzerland', 'est': '1860', 'tagline': 'Don’t Crack Under Pressure', 'featured': False},
            {'name': 'Tudor', 'slug': 'tudor', 'country': 'Switzerland', 'est': '1926', 'tagline': 'Born to Dare', 'featured': False},
            {'name': 'Swatch', 'slug': 'swatch', 'country': 'Switzerland', 'est': '1983', 'tagline': 'Time is What You Make of It', 'featured': False},
            {'name': 'Breitling', 'slug': 'breitling', 'country': 'Switzerland', 'est': '1884', 'tagline': 'Instruments for Professionals', 'featured': False},
            {'name': 'Patek Philippe', 'slug': 'patek-philippe', 'country': 'Switzerland', 'est': '1839', 'tagline': 'Begin Your Own Tradition', 'featured': False},
            {'name': 'Audemars Piguet', 'slug': 'audemars-piguet', 'country': 'Switzerland', 'est': '1875', 'tagline': 'To Break the Rules, You Must First Master Them', 'featured': False},
            {'name': 'Hublot', 'slug': 'hublot', 'country': 'Switzerland', 'est': '1980', 'tagline': 'The Art of Fusion', 'featured': False},
            {'name': 'IWC', 'slug': 'iwc', 'country': 'Switzerland', 'est': '1868', 'tagline': 'Probus Scafusia', 'featured': False},
            {'name': 'Hamilton', 'slug': 'hamilton', 'country': 'Switzerland', 'est': '1892', 'tagline': 'American Spirit, Swiss Precision', 'featured': False},
            {'name': 'Mido', 'slug': 'mido', 'country': 'Switzerland', 'est': '1918', 'tagline': 'Inspired by Architecture', 'featured': False},
            {'name': 'Certina', 'slug': 'certina', 'country': 'Switzerland', 'est': '1888', 'tagline': 'Double Security Concept', 'featured': False},
            {'name': 'Oris', 'slug': 'oris', 'country': 'Switzerland', 'est': '1904', 'tagline': 'Real Watches for Real People', 'featured': False},
            {'name': 'Zenith', 'slug': 'zenith', 'country': 'Switzerland', 'est': '1865', 'tagline': 'Time to Reach Your Star', 'featured': False},
            {'name': 'Raymond Weil', 'slug': 'raymond-weil', 'country': 'Switzerland', 'est': '1976', 'tagline': 'Precision Movements Inspired by Music', 'featured': False},
            {'name': 'Frederique Constant', 'slug': 'frederique-constant', 'country': 'Switzerland', 'est': '1988', 'tagline': 'Live Your Passion', 'featured': False},
            {'name': 'Victorinox', 'slug': 'victorinox', 'country': 'Switzerland', 'est': '1884', 'tagline': 'Swiss Army Precision', 'featured': False},
            {'name': 'Movado', 'slug': 'movado', 'country': 'Switzerland', 'est': '1881', 'tagline': 'Always in Motion (Museum Dial)', 'featured': False},

            # French & German Fine Horology
            {'name': 'Cartier', 'slug': 'cartier', 'country': 'France', 'est': '1847', 'tagline': 'The Jeweler of Kings and the King of Jewelers', 'featured': False},
            {'name': 'Montblanc', 'slug': 'montblanc', 'country': 'Germany', 'est': '1906', 'tagline': 'Inspire Writing & Horology', 'featured': False},
            {'name': 'A. Lange & Söhne', 'slug': 'a-lange-sohne', 'country': 'Germany', 'est': '1845', 'tagline': 'State-of-the-Art Glashütte Tradition', 'featured': False},

            # American & Fashion Lifestyle
            {'name': 'Fossil', 'slug': 'fossil', 'country': 'United States', 'est': '1984', 'tagline': 'Authentic Vintage & Classic Design', 'featured': True},
            {'name': 'Timex', 'slug': 'timex', 'country': 'United States', 'est': '1854', 'tagline': 'Takes a Licking and Keeps on Ticking', 'featured': True},
            {'name': 'Tommy Hilfiger', 'slug': 'tommy-hilfiger', 'country': 'United States', 'est': '1985', 'tagline': 'Classic American Cool', 'featured': True},
            {'name': 'Michael Kors', 'slug': 'michael-kors', 'country': 'United States', 'est': '1981', 'tagline': 'Modern Glamour', 'featured': False},
            {'name': 'Armani Exchange', 'slug': 'armani-exchange', 'country': 'Italy', 'est': '1991', 'tagline': 'Fast Fashion Luxury', 'featured': False},
            {'name': 'Emporio Armani', 'slug': 'emporio-armani', 'country': 'Italy', 'est': '1975', 'tagline': 'Contemporary Italian Sophistication', 'featured': False},
            {'name': 'Diesel', 'slug': 'diesel', 'country': 'Italy', 'est': '1978', 'tagline': 'Only the Brave', 'featured': False},
            {'name': 'Guess', 'slug': 'guess', 'country': 'United States', 'est': '1981', 'tagline': 'Trendsetting Lifestyle Horology', 'featured': False},
            {'name': 'Kenneth Cole', 'slug': 'kenneth-cole', 'country': 'United States', 'est': '1982', 'tagline': 'New York Urban Timepieces', 'featured': False},
            {'name': 'Police', 'slug': 'police', 'country': 'Italy', 'est': '1983', 'tagline': 'Be Younique', 'featured': False},
            {'name': 'Bulova', 'slug': 'bulova', 'country': 'United States', 'est': '1875', 'tagline': 'History of Firsts', 'featured': False},
            {'name': 'Apple', 'slug': 'apple', 'country': 'United States', 'est': '1976', 'tagline': 'The World’s Leading Smartwatch', 'featured': True},
            {'name': 'Samsung', 'slug': 'samsung', 'country': 'South Korea', 'est': '1938', 'tagline': 'Galaxy Connected Horology', 'featured': True},
            {'name': 'Garmin', 'slug': 'garmin', 'country': 'United States', 'est': '1989', 'tagline': 'Engineered on the Inside for Life on the Outside', 'featured': True},
            {'name': 'Amazfit', 'slug': 'amazfit', 'country': 'China', 'est': '2015', 'tagline': 'Up Your Game', 'featured': True},
        ]

        for b_data in brands_catalog:
            slug = b_data['slug']
            name = b_data['name']

            # Match existing brand by slug or name
            brand = Brand.objects.filter(slug=slug).first()
            if not brand:
                brand = Brand.objects.filter(name__iexact=name).first()

            if brand:
                stat['skipped'] += 1
            else:
                Brand.objects.create(
                    name=name,
                    slug=slug,
                    country=b_data.get('country', ''),
                    established=b_data.get('est', ''),
                    tagline=b_data.get('tagline', ''),
                    is_featured=b_data.get('featured', False),
                    is_active=True
                )
                stat['created'] += 1

        stat['total'] = Brand.objects.count()

    def seed_message_templates(self, stat):
        """Seed 8 standardized operational message templates"""
        self.stdout.write('\nSeeding Message Templates...')

        templates = [
            {
                'name': 'sale_confirmation',
                'description': 'Sent to customer immediately upon invoice creation',
                'template': 'Dear {customer_name}, thank you for your purchase from Meghani Watch Co.! Invoice #{invoice_number} for ₹{amount} has been generated. Cherish every second with your new timepiece!',
            },
            {
                'name': 'payment_confirmation',
                'description': 'Payment receipt confirmation sent to customer',
                'template': 'Dear {customer_name}, we have received your payment of ₹{amount} via {payment_mode} for Invoice #{invoice_number}. Meghani Watch Co. appreciates your patronage!',
            },
            {
                'name': 'warranty_registration',
                'description': 'Warranty registration acknowledgement',
                'template': 'Dear {customer_name}, your warranty for {product_name} (Serial: {serial_number}) is registered until {expiry_date}. Meghani Watch Co. provides authentic manufacturer warranty assistance.',
            },
            {
                'name': 'warranty_expiry_reminder',
                'description': 'Advance reminder before customer warranty expires',
                'template': 'Dear {customer_name}, the warranty for your timepiece ({product_name}) will expire on {expiry_date}. Visit Meghani Watch Co. for precision inspection and preventive care.',
            },
            {
                'name': 'repair_received',
                'description': 'Ticket intake notification when customer drops off timepiece',
                'template': 'Dear {customer_name}, your repair ticket #{ticket_number} for {item_type} ({brand}) is registered at Meghani Horological Workshop. Estimated delivery: {estimated_date}. Track progress at our counter.',
            },
            {
                'name': 'repair_status_update',
                'description': 'Workshop repair status progress update',
                'template': 'Dear {customer_name}, your repair ticket #{ticket_number} status is updated to: {status}. Workshop note: {notes}. Meghani Watch Co. Service Centre.',
            },
            {
                'name': 'repair_ready_for_collection',
                'description': 'Notification when repair is completed and tested ready for pickup',
                'template': 'Dear {customer_name}, your timepiece under ticket #{ticket_number} has passed workshop quality inspection and is ready for pickup! Total payable: ₹{amount}. Meghani Watch Co.',
            },
            {
                'name': 'customer_followup',
                'description': 'Post-service or post-purchase satisfaction follow-up',
                'template': 'Dear {customer_name}, how is your timepiece performing? At Meghani Watch Co., your complete satisfaction is our priority. Please let us know if any strap sizing or adjustments are needed.',
            },
        ]

        for t_data in templates:
            name = t_data['name']
            tpl, created = MessageTemplate.objects.get_or_create(
                name=name,
                defaults={
                    'template': t_data['template'],
                    'description': t_data['description'],
                    'is_active': True
                }
            )
            if created:
                stat['created'] += 1
                self.stdout.write(self.style.SUCCESS(f'  [+] Created MessageTemplate: {name}'))
            else:
                stat['skipped'] += 1
                self.stdout.write(f'  [-] Template exists: {name}')

        stat['total'] = MessageTemplate.objects.count()

    def print_summary(self, stats):
        self.stdout.write('\n' + '=' * 65)
        self.stdout.write(' MASTER DATA SEEDING SUMMARY ')
        self.stdout.write('=' * 65)
        self.stdout.write(f"BusinessSettings:  Created: {stats['settings']['created']} | Updated: {stats['settings']['updated']} | Preserved: {stats['settings']['skipped']}")
        self.stdout.write(f"Categories:        Created: {stats['categories']['created']:2d} | Preserved: {stats['categories']['skipped']:2d} | Total in DB: {stats['categories']['total']}")
        self.stdout.write(f"Subcategories:     Created: {stats['subcategories']['created']:2d} | Preserved: {stats['subcategories']['skipped']:2d} | Total in DB: {stats['subcategories']['total']}")
        self.stdout.write(f"Brands:            Created: {stats['brands']['created']:2d} | Preserved: {stats['brands']['skipped']:2d} | Total in DB: {stats['brands']['total']}")
        self.stdout.write(f"MessageTemplates:  Created: {stats['templates']['created']:2d} | Preserved: {stats['templates']['skipped']:2d} | Total in DB: {stats['templates']['total']}")
        self.stdout.write('=' * 65 + '\n')
