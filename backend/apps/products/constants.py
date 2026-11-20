"""
Master Data Constants and Static Registries for Meghani Connect 360.
Provides standardized choices and options for watches, clocks, accessories,
inventory, POS, tax, and purchasing without creating redundant database tables.
"""

WATCH_MOVEMENTS = [
    {'code': 'quartz', 'name': 'Quartz (Battery Powered)', 'description': 'Standard electronic quartz crystal movement'},
    {'code': 'automatic', 'name': 'Automatic (Self-Winding)', 'description': 'Mechanical movement powered by wrist movement'},
    {'code': 'mechanical', 'name': 'Manual Hand-Wound Mechanical', 'description': 'Traditional manual spring winding horological movement'},
    {'code': 'solar', 'name': 'Solar Powered / Eco-Drive', 'description': 'Light/solar rechargeable capacitor movement'},
    {'code': 'kinetic', 'name': 'Kinetic / Auto-Quartz', 'description': 'Oscillating rotor generates electrical energy for quartz'},
    {'code': 'smart_digital', 'name': 'Smart Digital Processor', 'description': 'Microprocessor SoC for smart wearable operating systems'},
]

WATCH_DISPLAYS = [
    {'code': 'analog', 'name': 'Analog (Hands)', 'description': 'Traditional hour, minute, and second hands'},
    {'code': 'digital', 'name': 'Digital (LCD/OLED)', 'description': 'Digital numeric display screen'},
    {'code': 'ana_digi', 'name': 'Analog-Digital (Hybrid Display)', 'description': 'Combination hands with digital sub-windows'},
    {'code': 'chronograph', 'name': 'Chronograph (Stopwatch Subdials)', 'description': 'Stopwatch subdial registers on analog face'},
    {'code': 'smart_touch', 'name': 'Full Touch AMOLED / LCD', 'description': 'Interactive touchscreen smart display'},
]

STRAP_MATERIALS = [
    {'code': 'leather', 'name': 'Genuine Leather', 'description': 'Calfskin, alligator grain, or premium leather'},
    {'code': 'stainless_steel', 'name': 'Stainless Steel (Mesh/Link)', 'description': 'Solid 316L or folded link bracelet'},
    {'code': 'silicone', 'name': 'Silicone', 'description': 'Soft sweat-resistant flexible silicone strap'},
    {'code': 'rubber', 'name': 'Rubber / Fluoroelastomer (FKM)', 'description': 'Durable vulcanized waterproof rubber'},
    {'code': 'nylon_nato', 'name': 'Nylon / NATO Weave', 'description': 'Breathable woven fabric military-style strap'},
    {'code': 'ceramic', 'name': 'Ceramic', 'description': 'Scratchproof high-tech ceramic link bracelet'},
    {'code': 'titanium', 'name': 'Titanium', 'description': 'Lightweight, hypoallergenic aerospace-grade metal'},
    {'code': 'gold_plated', 'name': 'Gold PVD Plated', 'description': 'Steel with gold or rose gold PVD coating'},
]

CASE_MATERIALS = [
    {'code': 'stainless_steel', 'name': 'Stainless Steel (316L)', 'description': 'Standard surgical grade corrosion-resistant steel'},
    {'code': 'titanium', 'name': 'Grade 5 Titanium', 'description': 'Ultra-light, durable, skin-friendly metal'},
    {'code': 'ceramic', 'name': 'High-Tech Ceramic', 'description': 'Virtually unscratchable sintered zirconium oxide'},
    {'code': 'resin', 'name': 'Shock-Resistant Resin', 'description': 'Durable lightweight polymer (standard in G-Shock)'},
    {'code': 'aluminium', 'name': 'Anodized Aluminium', 'description': 'Lightweight metal commonly used in smartwatches'},
    {'code': 'brass', 'name': 'Plated Brass', 'description': 'Traditional clock and classic watch case metal'},
    {'code': 'solid_gold', 'name': '18K Solid Gold', 'description': 'Precious metal yellow, white, or rose gold'},
]

GLASS_TYPES = [
    {'code': 'sapphire', 'name': 'Sapphire Crystal (Scratchproof)', 'description': 'Mohs hardness 9 synthetic sapphire with anti-reflective coating'},
    {'code': 'mineral', 'name': 'Hardened Mineral Crystal', 'description': 'Treated glass resistant to everyday scratching and shattering'},
    {'code': 'hardlex', 'name': 'Hardlex Mineral Glass', 'description': 'Proprietary hardened mineral crystal used by Seiko'},
    {'code': 'acrylic', 'name': 'Acrylic / Hesalite Crystal', 'description': 'Vintage plexiglass style crystal that can be polished'},
    {'code': 'gorilla_glass', 'name': 'Gorilla Glass / Toughened Glass', 'description': 'Chemically strengthened glass for smart wearables'},
]

DIAL_SHAPES = [
    {'code': 'round', 'name': 'Round / Circular'},
    {'code': 'square', 'name': 'Square'},
    {'code': 'rectangular', 'name': 'Rectangular / Tank'},
    {'code': 'tonneau', 'name': 'Tonneau (Barrel)'},
    {'code': 'cushion', 'name': 'Cushion'},
    {'code': 'oval', 'name': 'Oval'},
    {'code': 'octagonal', 'name': 'Octagonal'},
]

DIAL_COLORS = [
    'Black', 'White', 'Silver', 'Navy Blue', 'Deep Green', 'Champagne Gold',
    'Anthracite Grey', 'Sunray Blue', 'Burgundy Red', 'Skeleton / Transparent',
    'Mother of Pearl', 'Salmon', 'Brown / Chocolate'
]

STRAP_COLORS = [
    'Black', 'Dark Brown', 'Light Tan', 'Silver / Steel', 'Gold / Rose Gold',
    'Dual Tone (Silver & Gold)', 'Navy Blue', 'Olive Green', 'Red', 'White', 'Grey'
]

GENDER_CHOICES = [
    {'code': 'men', 'name': 'Men'},
    {'code': 'women', 'name': 'Women'},
    {'code': 'unisex', 'name': 'Unisex'},
    {'code': 'kids_boys', 'name': 'Kids (Boys)'},
    {'code': 'kids_girls', 'name': 'Kids (Girls)'},
    {'code': 'couple', 'name': 'Couple Pair'},
]

WATER_RESISTANCE_CHOICES = [
    {'code': 'none', 'name': 'Not Water Resistant', 'depth_m': 0},
    {'code': '30m', 'name': '30m / 3 ATM (Splash / Rain Resistant)', 'depth_m': 30},
    {'code': '50m', 'name': '50m / 5 ATM (Handwash / Light Swim)', 'depth_m': 50},
    {'code': '100m', 'name': '100m / 10 ATM (Swimming / Snorkeling)', 'depth_m': 100},
    {'code': '200m', 'name': '200m / 20 ATM (Diving / ISO 6425 Standard)', 'depth_m': 200},
    {'code': '300m_plus', 'name': '300m+ / Professional Saturation Diver', 'depth_m': 300},
]

PRODUCT_SIZES = [
    # Numeric watch case/strap widths in mm
    {'category': 'watch_case_mm', 'sizes': [str(x) for x in range(24, 51, 2)]}, # 24mm to 50mm
    # Standard apparel/strap sizes
    {'category': 'general', 'sizes': ['Small', 'Medium', 'Large', 'XL', 'Adjustable', 'Free Size']},
    # Clock dimensions
    {'category': 'clock_inches', 'sizes': ['6 Inch', '8 Inch', '10 Inch', '12 Inch', '14 Inch', '16 Inch', '18 Inch', '24 Inch']},
]

UNITS_OF_MEASURE = [
    {'code': 'Piece', 'name': 'Piece (Pcs)', 'description': 'Single individual unit'},
    {'code': 'Pair', 'name': 'Pair (Pr)', 'description': 'Set of two (e.g. couple watches)'},
    {'code': 'Box', 'name': 'Box (Bx)', 'description': 'Box packaging containing set'},
    {'code': 'Set', 'name': 'Set', 'description': 'Gift or combo package'},
    {'code': 'Pack', 'name': 'Pack (Pk)', 'description': 'Multi-pack e.g. batteries or pins'},
    {'code': 'Dozen', 'name': 'Dozen (Dzn)', 'description': '12 units bulk pack'},
]

SUPPLIER_PAYMENT_TERMS = [
    {'code': 'Advance Payment', 'days': 0},
    {'code': 'Cash on Delivery', 'days': 0},
    {'code': 'Immediate', 'days': 0},
    {'code': 'Net 7', 'days': 7},
    {'code': 'Net 15', 'days': 15},
    {'code': 'Net 30', 'days': 30},
    {'code': 'Net 45', 'days': 45},
    {'code': 'Net 60', 'days': 60},
    {'code': 'Net 90', 'days': 90},
]

GST_REFERENCE_RATES = [
    {'rate': 0.0, 'label': '0% (Exempt / Nil Rated)', 'hsn_example': ''},
    {'rate': 5.0, 'label': '5% (Concessional Goods)', 'hsn_example': ''},
    {'rate': 12.0, 'label': '12% (Select Horological Parts / Clocks)', 'hsn_example': '9105'},
    {'rate': 18.0, 'label': '18% Standard GST (Wristwatches & Straps)', 'hsn_example': '9101, 9102, 9113'},
    {'rate': 28.0, 'label': '28% (Luxury & Electronic Items)', 'hsn_example': '9101 (Precious Metal)'},
]

INVOICE_TYPES = [
    {'code': 'tax_invoice', 'name': 'GST Tax Invoice (B2B / B2C Registered)'},
    {'code': 'retail_invoice', 'name': 'Retail Consumer Invoice (B2C Regular)'},
    {'code': 'bill_of_supply', 'name': 'Bill of Supply (Exempt / Composition)'},
    {'code': 'proforma_invoice', 'name': 'Proforma Invoice / Quotation'},
]

STOCK_ADJUSTMENT_REASONS = [
    'Opening Stock Initial Balance',
    'Purchase Order Goods Receipt',
    'POS Sales Outflow',
    'Customer Return & Restock',
    'Supplier Return (Damaged/Defective)',
    'Showroom Display Wear & Tear',
    'Physical Audit Discrepancy Correction',
    'Workshop Repair Part Consumption',
    'Workshop Repair Component Return',
    'Transit Breakage / Loss',
]

CUSTOMER_CLASSIFICATIONS = [
    {'code': 'retail', 'name': 'Retail Customer'},
    {'code': 'vip', 'name': 'VIP / Collector'},
    {'code': 'corporate', 'name': 'Corporate / Gifting Client'},
    {'code': 'wholesale', 'name': 'Wholesale Partner'},
]
