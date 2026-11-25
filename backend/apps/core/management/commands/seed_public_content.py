"""
Management command to seed dynamic public boutique content:
Brands, Categories, Offers, Gallery, Milestones, Store Settings, and Product Specifications.
Run: python manage.py seed_public_content
"""

from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.models import Offer, GalleryItem, Milestone
from apps.core.settings_models import BusinessSettings
from apps.products.models import Product, ProductImage, Brand, Category


class Command(BaseCommand):
    help = 'Seed dynamic public boutique content (Brands, Categories, Offers, Gallery, Store Info, Specs)'

    def handle(self, *args, **options):
        self.stdout.write('Starting public content seed...')

        with transaction.atomic():
            self.seed_business_settings()
            self.seed_brands()
            self.seed_categories()
            self.seed_offers()
            self.seed_gallery()
            self.seed_milestones()
            self.seed_products_and_specs()

        self.stdout.write(self.style.SUCCESS('Successfully seeded all public content!'))

    def seed_business_settings(self):
        settings_obj = BusinessSettings.get_settings()
        settings_obj.business_name = 'Meghani Watch Co.'
        settings_obj.tagline = 'Timeless Style. Trusted Quality.'
        settings_obj.phone = '+91 91066 80191'
        settings_obj.alternate_phone = '+91 265 2780191'
        settings_obj.whatsapp_number = '919106680191'
        settings_obj.email = 'concierge@meghaniwatch.com'
        settings_obj.website = 'https://meghaniwatch.com'
        settings_obj.address_line1 = 'Cactus Park, 23, New Sama Rd'
        settings_obj.address_line2 = 'Near Abhilasha Char Rasta, Prabhat Nagar, New Sama'
        settings_obj.city = 'Vadodara'
        settings_obj.state = 'Gujarat'
        settings_obj.pincode = '390008'
        settings_obj.landmark = 'Near Abhilasha Char Rasta (Plus Code: 85RP+R5 Vadodara)'
        settings_obj.opening_hours_weekdays = '10:00 AM – 9:00 PM (Mon – Sat)'
        settings_obj.opening_hours_sunday = '11:00 AM – 8:00 PM (Sun)'
        settings_obj.google_maps_url = 'https://maps.app.goo.gl/XctrXf3yChPNyg3a9'
        settings_obj.google_maps_embed_src = 'https://maps.google.com/maps?q=85RP%2BR5+Vadodara,+Gujarat&t=&z=16&ie=UTF8&iwloc=&output=embed'
        settings_obj.instagram_url = 'https://instagram.com/meghaniwatchco'
        settings_obj.facebook_url = 'https://facebook.com/meghaniwatchco'
        settings_obj.privacy_policy = (
            "At Meghani Watch Co., we hold the confidentiality and privacy of our clientele in the highest regard. "
            "We collect only the information necessary to provide tailored timepiece consultation and fulfill warranty obligations: "
            "name, phone number, email address for scheduling viewings, and timepiece preferences. We never share client records with third parties."
        )
        settings_obj.terms_and_conditions = (
            "All timepieces purveyed by Meghani Watch Co. are 100% authentic with direct manufacturer authorized warranties. "
            "Complimentary bracelet sizing and initial inspection are provided with every purchase. "
            "Exchange is accepted within 7 days in unblemished condition with original box and papers."
        )
        settings_obj.save()
        self.stdout.write(f'  ✓ Updated BusinessSettings for {settings_obj.business_name}')

    def seed_brands(self):
        brands_data = [
            {
                'name': 'Titan',
                'slug': 'titan',
                'country': 'India',
                'established': '1984',
                'tagline': 'Crafting Timeless Sophistication',
                'description': "India's premier watchmaker blending contemporary artistry with precision quartz and automatic engineering. Known for Edge, Raga, and Regalia series.",
                'hero_image': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
                'is_featured': True,
                'display_order': 1,
            },
            {
                'name': 'Casio',
                'slug': 'casio',
                'country': 'Japan',
                'established': '1946',
                'tagline': 'Pioneering Toughness and Digital Horology',
                'description': 'World-renowned Japanese precision engineering featuring iconic G-Shock durability, Edifice chronographs, and vintage digital designs.',
                'hero_image': 'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200',
                'is_featured': True,
                'display_order': 2,
            },
            {
                'name': 'Timex',
                'slug': 'timex',
                'country': 'United States',
                'established': '1854',
                'tagline': 'True American Craftsmanship',
                'description': 'Over 170 years of legendary watchmaking heritage, renowned for robust automatic movements, Marlin heritage designs, and Indiglo illumination.',
                'hero_image': 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
                'is_featured': True,
                'display_order': 3,
            },
            {
                'name': 'Citizen',
                'slug': 'citizen',
                'country': 'Japan',
                'established': '1918',
                'tagline': 'Eco-Drive Innovation & Horological Purity',
                'description': 'A global leader in light-powered Eco-Drive movements, precision craftsmanship, titanium casing, and automatic dive masterpieces.',
                'hero_image': 'https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&w=1200&q=80',
                'is_featured': True,
                'display_order': 4,
            },
            {
                'name': 'Fastrack',
                'slug': 'fastrack',
                'country': 'India',
                'established': '1998',
                'tagline': 'Bold, Expressive & Dynamic Style',
                'description': 'High-energy timepieces designed for the modern lifestyle, featuring avant-garde dials, sporty silicon straps, and smart capabilities.',
                'hero_image': 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1200&q=80',
                'is_featured': False,
                'display_order': 5,
            },
            {
                'name': 'Sonata',
                'slug': 'sonata',
                'country': 'India',
                'established': '1997',
                'tagline': 'Authentic Everyday Elegance',
                'description': 'Classic analog designs with gold accents and genuine leather straps, offering trusted reliability for festive occasions and daily wear.',
                'hero_image': 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=80',
                'is_featured': False,
                'display_order': 6,
            },
            {
                'name': 'Ajanta',
                'slug': 'ajanta',
                'country': 'India',
                'established': '1971',
                'tagline': 'Heritage Horology for the Living Space',
                'description': "Asia's foremost quartz wall clock artisan, crafting statement pendulum, wooden, and silent-sweep architectural clocks for homes and offices.",
                'hero_image': 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1200&q=80',
                'is_featured': False,
                'display_order': 7,
            },
        ]

        bad_legacy_tokens = ('1522335789203', '1547996160-71dfabbce5ed', '1539185441755', '1595341888016', '218490')
        for item in brands_data:
            brand, created = Brand.objects.get_or_create(slug=item['slug'], defaults=item)
            if not created:
                if not brand.hero_image or any(t in brand.hero_image for t in bad_legacy_tokens):
                    brand.hero_image = item['hero_image']
                    brand.save(update_fields=['hero_image'])
        self.stdout.write(f'  ✓ Verified/seeded {len(brands_data)} Brands (preserving custom images)')

    def seed_categories(self):
        categories_data = [
            {
                'name': 'Analog Timepieces',
                'slug': 'analog',
                'tagline': 'The Pinnacle of Classical Horology',
                'description': 'Traditional mechanical, automatic, and quartz movements featuring sapphire crystals, hand-stitched leather straps, and solid stainless steel or gold-plated cases.',
                'image_url': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
                'features': ['Mechanical & Automatic Movements', 'Sapphire & Mineral Crystals', 'Chronograph & Date Complications', 'Genuine Leather & Solid Steel'],
                'display_order': 1,
            },
            {
                'name': 'Digital Watches',
                'slug': 'digital',
                'tagline': 'Utilitarian Precision & Iconic Retro Heritage',
                'description': 'High-precision digital displays with multi-function stopwatch, world time, solar battery backup, and shock-resistant architectures.',
                'image_url': '',
                'features': ['Shock & Vibration Resistance', 'World Time & Multi-Alarms', 'EL Backlight & Solar Power', '100m – 200m Water Resistance'],
                'display_order': 2,
            },
            {
                'name': 'Smart & Hybrid',
                'slug': 'smart',
                'tagline': 'Intelligent Technology in Luxury Enclosures',
                'description': 'Next-generation connected watches featuring AMOLED displays, health biometric sensors, call notifications, and premium metal finishes.',
                'image_url': 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800',
                'features': ['Vibrant AMOLED Displays', 'Comprehensive Health Sensors', 'Bluetooth Calling & Notifications', 'Up to 14 Days Battery Life'],
                'display_order': 3,
            },
            {
                'name': 'Wall Clocks',
                'slug': 'wall',
                'tagline': 'Sculptural Timepieces for Fine Interiors',
                'description': 'Architectural wall clocks combining silent quartz movements, carved wooden bezels, brass pendulums, and timeless dial artistry.',
                'image_url': 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80',
                'features': ['Silent Sweep Movement', 'Solid Wooden & Metallic Finishes', 'Harmonic Chime & Pendulums', 'High-Visibility Aesthetic Dials'],
                'display_order': 4,
            },
            {
                'name': 'Horology Accessories',
                'slug': 'accessory',
                'tagline': 'Care, Presentation & Personalization',
                'description': 'Artisan watch winders, Italian leather replacement straps, travel presentation cases, and professional watchmaker maintenance kits.',
                'image_url': '',
                'features': ['Italian Full-Grain Leather Straps', 'Automatic Watch Winders', 'Handcrafted Travel Rolls', 'Demagnetizing & Cleaning Care'],
                'display_order': 5,
            },
        ]

        bad_legacy_tokens = ('1508685096489', '1539185441755', '218490', '1614164185128', '1522335789203')
        for item in categories_data:
            cat, created = Category.objects.get_or_create(slug=item['slug'], defaults=item)
            if not created:
                if (not cat.image_url and item['image_url']) or any(t in cat.image_url for t in bad_legacy_tokens):
                    cat.image_url = item['image_url']
                    cat.save(update_fields=['image_url'])
        self.stdout.write(f'  ✓ Verified/seeded {len(categories_data)} Categories (preserving custom images)')

    def seed_offers(self):
        offers_data = [
            {
                'title': 'Heritage Festive Privilege',
                'badge': 'Exclusive Privilege',
                'discount': 'Up to 20% Privilege',
                'description': 'Celebrate milestone occasions with privileged pricing on select Titan Edge, Timex Automatic, and Citizen Eco-Drive curations.',
                'code': 'FESTIVE-HERITAGE',
                'validity': 'Valid through this season',
                'terms': 'Applicable on select authorized boutique curations. Complimentary engraving included.',
                'banner_image': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
                'target_category': 'analog',
                'display_order': 1,
            },
            {
                'title': 'The Wedding Connoisseur Suite',
                'badge': 'Curated Duo',
                'discount': 'Complimentary Horological Care Kit',
                'description': 'Acquire matching his & hers luxury timepieces and receive an artisan 2-slot travel presentation case plus a 3-year extended warranty certificate.',
                'code': '',
                'validity': 'Ongoing Wedding Season',
                'terms': 'Valid on paired purchases of Titan, Citizen, or Timex timepieces above ₹10,000.',
                'banner_image': 'https://images.pexels.com/photos/125779/pexels-photo-125779.jpeg?auto=compress&cs=tinysrgb&w=1200',
                'display_order': 2,
            },
            {
                'title': 'Complimentary Master Service Inspection',
                'badge': 'Boutique Service',
                'discount': '100% Complimentary',
                'description': 'Bring any vintage or modern timepiece into our Vadodara boutique for complete ultrasonic case sanitization, demagnetization, and precision timegrapher testing.',
                'validity': 'Walk-in or Booked Appointment',
                'terms': 'Subject to master horologist availability. One timepiece per client per visit.',
                'banner_image': 'https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg?auto=compress&cs=tinysrgb&w=1200',
                'display_order': 3,
            },
        ]

        bad_legacy_tokens = ('1522335789203', '1513094735237', '1508057198894')
        for item in offers_data:
            offer, created = Offer.objects.get_or_create(title=item['title'], defaults=item)
            if not created:
                if not offer.banner_image or any(t in offer.banner_image for t in bad_legacy_tokens):
                    offer.banner_image = item['banner_image']
                    offer.save(update_fields=['banner_image'])
        self.stdout.write(f'  ✓ Verified/seeded {len(offers_data)} Offers (preserving custom banners)')

    def seed_gallery(self):
        gallery_data = [
            {
                'title': 'Mechanical Movement Inspection',
                'category': 'craftsmanship',
                'image_url': 'https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg?auto=compress&cs=tinysrgb&w=1000',
                'caption': 'Precision assembly and escapement calibration under 10x magnification.',
                'details': 'Every mechanical timepiece entrusted to Meghani Watch Co. undergoes strict timegrapher balance testing.',
                'display_order': 1,
            },
            {
                'title': 'Classic Open-Heart Dress Horology',
                'category': 'timepieces',
                'image_url': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
                'caption': 'Exhibition dial detailing with hand-stitched leather strap.',
                'details': 'Representative dress horology from our curated collection.',
                'display_order': 2,
            },
            {
                'title': 'Precision Steel Chronograph Craft',
                'category': 'timepieces',
                'image_url': 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1000',
                'caption': 'Brushed stainless steel casework with multi-register chronograph dial.',
                'details': 'Private viewing available with dedicated horological advisors at our New Sama Road showroom.',
                'display_order': 3,
            },
            {
                'title': 'Minimalist Everyday Wristwear',
                'category': 'heritage',
                'image_url': 'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1000',
                'caption': 'Clean legible dials built for comfortable daily wear and timeless appeal.',
                'details': 'Complimentary strap adjustment and battery servicing available in-store.',
                'display_order': 4,
            },
            {
                'title': 'Chronograph Leather Strap Edition',
                'category': 'craftsmanship',
                'image_url': 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1000&q=80',
                'caption': 'Precision chronograph sub-registers paired with genuine leather straps.',
                'details': 'Equipped with quick-release spring bars and hypoallergenic 316L buckles.',
                'display_order': 5,
            },
            {
                'title': 'Architectural Wall Clocks',
                'category': 'boutique',
                'image_url': 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1000&q=80',
                'caption': 'Silent-sweep quartz wall clocks designed for contemporary homes and offices.',
                'details': 'Curated wall and pendulum clocks inspected and backed by store support.',
                'display_order': 6,
            },
        ]

        for item in gallery_data:
            GalleryItem.objects.get_or_create(
                display_order=item['display_order'],
                defaults=item
            )
        self.stdout.write(f'  ✓ Verified/seeded {len(gallery_data)} Gallery items (preserving custom uploads)')

    def seed_milestones(self):
        milestones_data = [
            {
                'year': '1984',
                'title': 'The Foundation in Vadodara',
                'description': 'Meghani Watch Co. opens its doors in Vadodara with a dedicated bench for classical mechanical pocket watches and early quartz calibres.',
                'display_order': 1,
            },
            {
                'year': '1995',
                'title': 'Authorized Titan & Japanese Partnerships',
                'description': 'Awarded premier authorized dealership rights for Titan, Citizen, and Casio, establishing our reputation as the trusted source for genuine timepieces.',
                'display_order': 2,
            },
            {
                'year': '2010',
                'title': 'Master Atelier Expansion',
                'description': 'Equipped our in-house workshop with Swiss precision timegraphers, ultrasonic sanitization vats, and automated water-resistance testing chambers.',
                'display_order': 3,
            },
            {
                'year': '2026',
                'title': 'Four Decades of Horological Excellence',
                'description': 'Celebrating 40+ years serving multi-generational families with over 50,000 timepieces purveyed and restored.',
                'display_order': 4,
            },
        ]

        for item in milestones_data:
            Milestone.objects.update_or_create(
                year=item['year'],
                defaults=item
            )
        self.stdout.write(f'  ✓ Seeded {len(milestones_data)} Milestones')

    def seed_products_and_specs(self):
        """
        Enrich existing database products with specifications, featured tags,
        and multiple gallery images matching the seed catalogue.
        """
        sample_specs = {
            'analog': {
                'movement': 'Japanese Precision Quartz / Automatic',
                'caseMaterial': '316L Surgical Stainless Steel',
                'caseDiameter': '42 mm',
                'dialColor': 'Sunburst Champagne / Obsidian',
                'glass': 'Scratch-Resistant Sapphire Crystal',
                'waterResistance': '50 Meters (5 ATM)',
                'strapMaterial': 'Handcrafted Full-Grain Leather',
                'claspType': 'Double Deployant Butterfly Clasp',
                'functions': ['Hours', 'Minutes', 'Central Seconds', 'Date Window at 3 o\'clock']
            },
            'digital': {
                'movement': 'High-Impact Digital Module',
                'caseMaterial': 'Carbon-Reinforced Resin',
                'caseDiameter': '48 mm',
                'dialColor': 'High-Contrast Negative LCD',
                'glass': 'Hardened Mineral Crystal',
                'waterResistance': '200 Meters (20 ATM)',
                'strapMaterial': 'Ergonomic Sweat-Proof Resin',
                'claspType': 'Heavy-Duty Tang Buckle',
                'functions': ['World Time (48 Cities)', '1/1000s Chronograph', 'Countdown Timer', '5 Daily Alarms', 'Super Illuminator LED']
            },
            'smart': {
                'movement': 'Intelligent Microprocessor Calibre',
                'caseMaterial': 'Aerospace-Grade Aluminum Alloy',
                'caseDiameter': '44 mm',
                'dialColor': '1.43" Ultra-AMOLED Touch Display (466x466)',
                'glass': 'Corning Gorilla Glass Anti-Fingerprint',
                'waterResistance': 'IP68 & 50m Swim-Proof',
                'strapMaterial': 'Hypoallergenic Fluororubber Band',
                'claspType': 'Magnetic Clasp & Pin Buckle',
                'functions': ['Biometric Heart Rate & SpO2', 'Bluetooth Calling', '100+ Sports Modes', 'Sleep Architecture', '10-Day Battery']
            },
            'wall': {
                'movement': 'Ultra-Silent Sweep Quartz Movement',
                'caseMaterial': 'Hand-Carved Solid Teak Wood',
                'caseDiameter': '350 mm (14 Inch)',
                'dialColor': 'Antique Ivory with Embossed Gold Numerals',
                'glass': 'Convex Anti-Glare Architectural Glass',
                'waterResistance': 'Indoor Climate Protection',
                'strapMaterial': 'Wall Mount Bracket Included',
                'claspType': 'Heavy-Duty Brass Keyhole Hanger',
                'functions': ['Silent Non-Ticking Seconds Hand', 'High-Torque Precision Stepping', 'Continuous Sweep']
            },
            'accessory': {
                'movement': 'Precision Watchmaker Calibre Tool / Storage',
                'caseMaterial': 'Vegetable-Tanned Italian Leather & Brushed Steel',
                'caseDiameter': 'Universal 20mm / 22mm Lug Width',
                'dialColor': 'Cognac Brown / Velvet Interior',
                'glass': 'N/A',
                'waterResistance': 'Treated Water-Repellent Coating',
                'strapMaterial': 'Full-Grain Tuscan Cowhide',
                'claspType': 'Solid 316L Stainless Steel Buckle',
                'functions': ['Quick-Release Spring Bars', 'Hypoallergenic Backing', 'Hand-Stitched Saddle Seams']
            }
        }

        products = Product.objects.filter(is_active=True).select_related('category')
        count = 0
        for idx, prod in enumerate(products):
            # Populate specifications if empty
            if not prod.specifications:
                cat_slug = prod.category_slug_val or 'analog'
                cat_specs = sample_specs.get(cat_slug, sample_specs['analog'])
                prod.specifications = cat_specs

            # Tag first 8 as featured, next 6 as new arrival if not already set
            if idx < 8 and not prod.is_featured:
                prod.is_featured = True
            if 4 <= idx < 10 and not prod.is_new_arrival:
                prod.is_new_arrival = True

            prod.save()
            count += 1

        self.stdout.write(f'  ✓ Enriched {count} Products with specifications and tags (never attaching unrelated gallery photos)')
