from django.db import migrations


def seed_suppliers_and_movements(apps, schema_editor):
    Supplier = apps.get_model('purchasing', 'Supplier')
    ProductSupplier = apps.get_model('purchasing', 'ProductSupplier')
    StockMovement = apps.get_model('purchasing', 'StockMovement')
    Product = apps.get_model('products', 'Product')

    suppliers_data = [
        {
            'name': 'Swatch Group India Pvt Ltd',
            'contact_person': 'Vikram Rathore',
            'phone': '+91 22 6639 4800',
            'email': 'orders.india@swatchgroup.com',
            'address': '2nd Floor, Rectangle 1, D-4 Saket District Centre, New Delhi, 110017',
            'gstin': '07AAACS1842C1Z6',
            'payment_terms': 'Net 30 Days',
            'opening_balance': 0,
            'notes': 'Authorized National Distributor for Tissot, Omega, Longines, Rado, Swatch.'
        },
        {
            'name': 'Titan Company Limited',
            'contact_person': 'Anand Murthy',
            'phone': '+91 80 6704 7000',
            'email': 'b2b.watches@titan.co.in',
            'address': 'Integrity, #193, Veerasandra, Electronics City P.O., Off Hosur Main Road, Bangalore, 560100',
            'gstin': '29AAACT2702H1ZQ',
            'payment_terms': 'Net 45 Days',
            'opening_balance': 0,
            'notes': 'Official Manufacturer and Distributor for Titan, Fastrack, Sonata, Tommy Hilfiger Watches.'
        },
        {
            'name': 'Casio India Co. Pvt Ltd',
            'contact_person': 'Rajesh Sharma',
            'phone': '+91 11 6699 9200',
            'email': 'distribution@casioindia.com',
            'address': 'A-410, Bestech Business Towers, Sector 66, Mohali / Okhla Phase III, New Delhi, 110020',
            'gstin': '07AAACC6145K1ZK',
            'payment_terms': 'Net 30 Days',
            'opening_balance': 0,
            'notes': 'Official Indian Subsidiary for Casio, G-Shock, Baby-G, Edifice, and Sheen lines.'
        },
        {
            'name': 'Timex Group India Ltd',
            'contact_person': 'Sanjay Malhotra',
            'phone': '+91 120 4741300',
            'email': 'customercare@timexindia.com',
            'address': 'Plot No. 10, Industrial Area, Katha, Baddi, Solan, HP / Noida, UP, 201301',
            'gstin': '02AAACT1946H1ZA',
            'payment_terms': 'Net 30 Days',
            'opening_balance': 0,
            'notes': 'Authorized Distributor for Timex, Nautica, Guess, and Versace Horology.'
        },
        {
            'name': 'Ajanta Transistor Clock Mfg Co (Orpat Group)',
            'contact_person': 'Pravin Patel',
            'phone': '+91 2822 230461',
            'email': 'sales@orpatgroup.com',
            'address': 'Orpat Industrial Estate, Rajkot-Morbi Highway, Morbi, Gujarat, 363641',
            'gstin': '24AAACA3899J1ZY',
            'payment_terms': 'Immediate / Advance',
            'opening_balance': 0,
            'notes': 'Manufacturer and bulk supplier of Quartz Wall Clocks, Pendulums, and Commercial Timepieces.'
        },
        {
            'name': 'Swiss Time Care India (Independent Importer & Spares)',
            'contact_person': 'Farrokh Mehta',
            'phone': '+91 22 2204 8831',
            'email': 'spares@swisstimecare.in',
            'address': 'Fort Chambers, Homi Modi Street, Fort, Mumbai, 400001',
            'gstin': '27AAAGS5541L1Z2',
            'payment_terms': 'Net 15 Days',
            'opening_balance': 0,
            'notes': 'Independent importer of Swiss luxury watches, genuine horological spare parts, movements, and straps.'
        }
    ]

    supplier_objs = {}
    for data in suppliers_data:
        sup, _ = Supplier.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        supplier_objs[data['name']] = sup

    # Map products to suppliers and create opening StockMovement ledger entries
    brand_to_supplier = {
        'Tissot': 'Swatch Group India Pvt Ltd',
        'Omega': 'Swatch Group India Pvt Ltd',
        'Titan': 'Titan Company Limited',
        'Fastrack': 'Titan Company Limited',
        'Sonata': 'Titan Company Limited',
        'Casio': 'Casio India Co. Pvt Ltd',
        'Timex': 'Timex Group India Ltd',
        'Orpat': 'Ajanta Transistor Clock Mfg Co (Orpat Group)',
    }

    fallback_supplier = supplier_objs['Swiss Time Care India (Independent Importer & Spares)']

    for product in Product.objects.all():
        brand_name = product.brand.name if product.brand else product.brand_text
        supplier_name = brand_to_supplier.get(brand_name)
        supplier = supplier_objs.get(supplier_name, fallback_supplier)

        # Link product to preferred supplier
        ProductSupplier.objects.get_or_create(
            product=product,
            supplier=supplier,
            defaults={
                'supplier_sku': f"SKU-{product.article_code or product.id}",
                'last_cost_price': product.cost_price,
                'lead_time_days': 7,
                'is_preferred': True,
            }
        )

        # Record Opening Stock ledger entry if not already recorded
        if not StockMovement.objects.filter(product=product, movement_type='opening_stock').exists():
            StockMovement.objects.create(
                product=product,
                movement_type='opening_stock',
                quantity_in=product.stock,
                quantity_out=0,
                previous_balance=0,
                resulting_balance=product.stock,
                reference_id='INIT-OPENING-LEDGER',
                reason='Initial reconciliation of physical inventory into audit ledger'
            )


def rollback_suppliers_and_movements(apps, schema_editor):
    StockMovement = apps.get_model('purchasing', 'StockMovement')
    ProductSupplier = apps.get_model('purchasing', 'ProductSupplier')
    Supplier = apps.get_model('purchasing', 'Supplier')

    StockMovement.objects.filter(reference_id='INIT-OPENING-LEDGER').delete()
    ProductSupplier.objects.all().delete()
    Supplier.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('purchasing', '0001_initial'),
        ('products', '0007_alter_product_brand_text_alter_product_category_slug'),
    ]

    operations = [
        migrations.RunPython(seed_suppliers_and_movements, rollback_suppliers_and_movements),
    ]
