import {
  PublicProduct,
  BrandItem,
  CategoryItem,
  OfferItem,
  GalleryItem,
  BusinessStoreInfo,
  AvailabilityStatus,
  ProductCategory
} from '@/types/public';
import axios from 'axios';

export const MEGHANI_STORE_INFO: BusinessStoreInfo = {
  name: 'Meghani Watch Co.',
  tagline: 'Timeless Style. Trusted Quality.',
  phone: '+91 91066 80191',
  whatsapp: '919106680191',
  email: 'concierge@meghaniwatch.com',
  address: {
    line1: 'Cactus Park, 23, New Sama Rd',
    line2: 'Near Abhilasha Char Rasta, Prabhat Nagar, New Sama',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '390008',
    landmark: 'Near Abhilasha Char Rasta (Plus Code: 85RP+R5 Vadodara)'
  },
  hours: {
    weekdays: '10:00 AM – 9:00 PM (Mon – Sat)',
    sunday: '11:00 AM – 8:00 PM (Sun)'
  },
  googleMapsUrl: 'https://maps.app.goo.gl/XctrXf3yChPNyg3a9',
  googleMapsEmbedSrc: 'https://maps.google.com/maps?q=85RP%2BR5+Vadodara,+Gujarat&t=&z=16&ie=UTF8&iwloc=&output=embed',
  socials: {
    instagram: 'https://instagram.com/meghaniwatchco',
    facebook: 'https://facebook.com/meghaniwatchco'
  }
};

export const PUBLIC_BRANDS: BrandItem[] = [
  {
    name: 'Titan',
    slug: 'titan',
    count: 8,
    country: 'India',
    established: '1984',
    tagline: 'Crafting Timeless Sophistication',
    description: "India's premier watchmaker blending contemporary artistry with precision quartz and automatic engineering. Known for the celebrated Edge, Raga, and Regalia series.",
    heroImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
  },
  {
    name: 'Casio',
    slug: 'casio',
    count: 6,
    country: 'Japan',
    established: '1946',
    tagline: 'Pioneering Toughness and Digital Horology',
    description: 'World-renowned Japanese precision engineering featuring iconic G-Shock durability, Edifice chronographs, and vintage digital designs.',
    heroImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
  },
  {
    name: 'Timex',
    slug: 'timex',
    count: 5,
    country: 'United States',
    established: '1854',
    tagline: 'True American Craftsmanship',
    description: 'Over 170 years of legendary watchmaking heritage, renowned for robust automatic movements, Marlin heritage designs, and Indiglo illumination.',
    heroImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
  },
  {
    name: 'Citizen',
    slug: 'citizen',
    count: 4,
    country: 'Japan',
    established: '1918',
    tagline: 'Eco-Drive Innovation & Horological Purity',
    description: 'A global leader in light-powered Eco-Drive movements, precision craftsmanship, titanium casing, and automatic dive masterpieces.',
    heroImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
  },
  {
    name: 'Fastrack',
    slug: 'fastrack',
    count: 4,
    country: 'India',
    established: '1998',
    tagline: 'Bold, Expressive & Dynamic Style',
    description: 'High-energy timepieces designed for the modern lifestyle, featuring avant-garde dials, sporty silicon straps, and smart capabilities.',
    heroImage: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
  },
  {
    name: 'Sonata',
    slug: 'sonata',
    count: 3,
    country: 'India',
    established: '1997',
    tagline: 'Authentic Everyday Elegance',
    description: 'Classic analog designs with gold accents and genuine leather straps, offering trusted reliability for festive occasions and daily wear.',
    heroImage: 'https://images.unsplash.com/photo-1547996160-71dfabbce5ed?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
  },
  {
    name: 'Ajanta',
    slug: 'ajanta',
    count: 3,
    country: 'India',
    established: '1971',
    tagline: 'Heritage Horology for the Living Space',
    description: "Asia's foremost quartz wall clock artisan, crafting statement pendulum, wooden, and silent-sweep architectural clocks for homes and offices.",
    heroImage: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
  }
];

export const PUBLIC_CATEGORIES: CategoryItem[] = [
  {
    id: 'analog',
    name: 'Analog Timepieces',
    slug: 'analog',
    tagline: 'The Pinnacle of Classical Horology',
    description: 'Traditional mechanical, automatic, and quartz movements featuring sapphire crystals, hand-stitched leather straps, and solid stainless steel or gold-plated cases.',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    count: 14,
    features: ['Mechanical & Automatic Movements', 'Sapphire & Mineral Crystals', 'Chronograph & Date Complications', 'Genuine Leather & Solid Steel']
  },
  {
    id: 'digital',
    name: 'Digital Watches',
    slug: 'digital',
    tagline: 'Utilitarian Precision & Iconic Retro Heritage',
    description: 'High-precision digital displays with multi-function stopwatch, world time, solar battery backup, and shock-resistant architectures.',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    count: 6,
    features: ['Shock & Vibration Resistance', 'World Time & Multi-Alarms', 'EL Backlight & Solar Power', '100m – 200m Water Resistance']
  },
  {
    id: 'smart',
    name: 'Smart & Hybrid',
    slug: 'smart',
    tagline: 'Intelligent Technology in Luxury Enclosures',
    description: 'Next-generation connected watches featuring AMOLED displays, health biometric sensors, call notifications, and premium metal finishes.',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
    count: 5,
    features: ['Vibrant AMOLED Displays', 'Comprehensive Health Sensors', 'Bluetooth Calling & Notifications', 'Up to 14 Days Battery Life']
  },
  {
    id: 'wall',
    name: 'Wall Clocks',
    slug: 'wall',
    tagline: 'Sculptural Timepieces for Fine Interiors',
    description: 'Architectural wall clocks combining silent quartz movements, carved wooden bezels, brass pendulums, and timeless dial artistry.',
    imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80',
    count: 5,
    features: ['Silent Sweep Movement', 'Solid Wooden & Metallic Finishes', 'Harmonic Chime & Pendulums', 'High-Visibility Aesthetic Dials']
  },
  {
    id: 'accessory',
    name: 'Horology Accessories',
    slug: 'accessory',
    tagline: 'Care, Presentation & Personalization',
    description: 'Artisan watch winders, Italian leather replacement straps, travel presentation cases, and professional watchmaker maintenance kits.',
    imageUrl: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=800&q=80',
    count: 7,
    features: ['Italian Full-Grain Leather Straps', 'Automatic Watch Winders', 'Handcrafted Travel Rolls', 'Demagnetizing & Cleaning Care']
  }
];

export const PUBLIC_OFFERS: OfferItem[] = [
  {
    id: 'offer-1',
    title: 'Heritage Festive Privilege',
    badge: 'Exclusive Privilege',
    discount: 'Up to 20% Privilege Privilege',
    description: 'Celebrate milestone occasions with privileged pricing on select Titan Edge, Timex Automatic, and Citizen Eco-Drive curations.',
    code: 'FESTIVE-HERITAGE',
    validity: 'Valid through this season',
    terms: 'Applicable on select authorized boutique curations. Complimentary engraving included.',
    bannerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'analog'
  },
  {
    id: 'offer-2',
    title: 'The Wedding Connoisseur Suite',
    badge: 'Curated Duo',
    discount: 'Complimentary Horological Care Kit',
    description: 'Acquire matching his & hers luxury timepieces and receive an artisan 2-slot travel presentation case plus a 3-year extended warranty certificate.',
    validity: 'Ongoing Wedding Season',
    terms: 'Valid on paired purchases of Titan, Citizen, or Timex timepieces above ₹10,000.',
    bannerImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'offer-3',
    title: 'Complimentary Master Service Inspection',
    badge: 'Boutique Service',
    discount: '100% Complimentary',
    description: 'Bring any vintage or modern timepiece into our Vadodara boutique for complete ultrasonic case sanitization, demagnetization, and precision timegrapher testing.',
    validity: 'Walk-in or Booked Appointment',
    terms: 'Subject to master horologist availability. One timepiece per client per visit.',
    bannerImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
  }
];

export const PUBLIC_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Master Horologist At Work',
    category: 'craftsmanship',
    imageUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1000&q=80',
    caption: 'Precision assembly and escapement calibration under 10x magnification.',
    details: 'Every mechanical timepiece entrusted to Meghani Watch Co. undergoes strict timegrapher balance testing.'
  },
  {
    id: 'gal-2',
    title: 'Titan Regalia Executive Chronograph',
    category: 'timepieces',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
    caption: 'Sunray dial with hand-applied gold indices and surgical stainless steel case.',
    details: 'A signature statement timepiece in our curated catalog.'
  },
  {
    id: 'gal-3',
    title: 'The Vadodara Boutique Salon',
    category: 'boutique',
    imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1000&q=80',
    caption: 'Our prestigious salon at Cactus Park, New Sama Road, welcoming timepiece connoisseurs.',
    details: 'Private viewing lounge with dedicated horological advisors.'
  },
  {
    id: 'gal-4',
    title: 'Vintage Escapement Restoration',
    category: 'heritage',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    caption: 'Meticulous ultrasonic cleaning and genuine Swiss oil re-lubrication.',
    details: 'Restoring family heirloom pocket watches and vintage wristwatches to within chronometer specs.'
  },
  {
    id: 'gal-5',
    title: 'Citizen Eco-Drive Solar Architecture',
    category: 'timepieces',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
    caption: 'Light-absorbing photovoltaic ring hidden beneath an iridescent dial.',
    details: 'Runs indefinitely in any light without ever needing a battery replacement.'
  },
  {
    id: 'gal-6',
    title: 'Artisan Full-Grain Leather Strapping',
    category: 'craftsmanship',
    imageUrl: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1000&q=80',
    caption: 'Hand-burnished vegetable tanned leather straps tailored to each client.',
    details: 'Equipped with quick-release spring bars and hypoallergenic 316L buckles.'
  }
];

export const SEED_PUBLIC_PRODUCTS: PublicProduct[] = [
  {
    id: 30,
    name: 'Titan Classic Leather Strap Analog',
    brand: 'Titan',
    category: 'analog',
    price: 3499,
    price_visible: true,
    availability: 'in_stock',
    stock: 25,
    barcode: 'TITAN-CLS-01',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'An understated icon of masculine refinement. Features an ivory dial framed by a polished stainless steel bezel, accented with rose gold hands and a genuine calfskin brown leather band.',
    warranty_months: 24,
    specifications: {
      movement: 'High-Precision Quartz Calibre',
      caseMaterial: '316L Surgical Stainless Steel',
      caseDiameter: '41 mm',
      dialColor: 'Sunburst Ivory',
      glass: 'Scratch-Resistant Mineral Crystal',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Genuine Embossed Calfskin Leather',
      claspType: 'Pin Buckle',
      functions: ['Hours', 'Minutes', 'Central Seconds', 'Date Window at 3 o\'clock']
    },
    is_featured: true,
    is_new_arrival: false,
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 31,
    name: 'Titan Executive Regalia Gold Edition',
    brand: 'Titan',
    category: 'analog',
    price: 5999,
    price_visible: true,
    availability: 'in_stock',
    stock: 15,
    barcode: 'TITAN-EXEC-GOLD',
    image: 'https://images.unsplash.com/photo-1547996160-71dfabbce5ed?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1547996160-71dfabbce5ed?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Engineered for commanding presence. Rich champagne dial with polished gold Roman numerals, encased in 23k PVD gold plating with a solid multi-link gold bracelet.',
    warranty_months: 24,
    specifications: {
      movement: 'Japanese Precision Quartz',
      caseMaterial: '23k Gold PVD Stainless Steel',
      caseDiameter: '42 mm',
      dialColor: 'Champagne Gold',
      glass: 'Hardened Mineral Crystal with Anti-Reflective Coating',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Solid Stainless Steel Link Bracelet (PVD Gold)',
      claspType: 'Butterfly Deployant Clasp with Push Buttons',
      functions: ['Hours', 'Minutes', 'Seconds', 'Day-Date Subdials']
    },
    is_featured: true,
    is_new_arrival: false,
    created_at: '2026-01-11T11:00:00Z'
  },
  {
    id: 32,
    name: 'Fastrack Sports Tachymeter Chronograph',
    brand: 'Fastrack',
    category: 'analog',
    price: 2599,
    price_visible: true,
    availability: 'in_stock',
    stock: 30,
    barcode: 'FST-CHRONO-01',
    image: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Dynamic sports chronograph with a high-contrast matte black dial, tachymeter scale, vibrant orange accent hands, and a durable sweat-resistant silicon strap.',
    warranty_months: 12,
    specifications: {
      movement: 'Multi-Function Quartz Chronograph',
      caseMaterial: 'High-Impact Polycarbonate & Alloy',
      caseDiameter: '45 mm',
      dialColor: 'Matte Charcoal Black',
      glass: 'Mineral Glass',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Ergonomic Textured Silicone',
      claspType: 'Heavy-Duty Tang Buckle',
      functions: ['1/10th Second Stopwatch', '60-Minute Counter', 'Split Timing', '24-Hour Display']
    },
    is_featured: false,
    is_new_arrival: true,
    created_at: '2026-01-12T09:30:00Z'
  },
  {
    id: 33,
    name: 'Timex Vintage Marlin Automatic Heritage',
    brand: 'Timex',
    category: 'analog',
    price: 4499,
    price_visible: true,
    availability: 'in_stock',
    stock: 12,
    barcode: 'TMX-MARLIN-01',
    image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'A tribute to the mid-century 1960s horological aesthetic. Features a domed acrylic crystal, exhibition caseback revealing the 21-jewel automatic movement, and a vintage black sunray dial.',
    warranty_months: 24,
    specifications: {
      movement: '21-Jewel Automatic Mechanical (Self-Winding)',
      caseMaterial: 'Polished 316L Stainless Steel',
      caseDiameter: '40 mm',
      dialColor: 'Obsidian Sunray',
      glass: 'Domed Vintage Acrylic Crystal',
      waterResistance: '30 Meters (3 ATM)',
      strapMaterial: 'Supple Italian Grain Leather',
      claspType: 'Vintage Pin Buckle',
      functions: ['Hours', 'Minutes', 'Sweep Seconds', 'Exhibition Caseback', 'Manual Wind Option']
    },
    is_featured: true,
    is_new_arrival: false,
    created_at: '2026-01-13T14:15:00Z'
  },
  {
    id: 34,
    name: 'Sonata Minimalist Slim Classic',
    brand: 'Sonata',
    category: 'analog',
    price: 1799,
    price_visible: true,
    availability: 'in_stock',
    stock: 40,
    barcode: 'SONATA-SLIM-01',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    description: 'Clean, effortless elegance designed for everyday reliability. Ultra-thin profile that slides smoothly under any dress cuff.',
    warranty_months: 12,
    specifications: {
      movement: 'Slimline Japanese Quartz',
      caseMaterial: 'Polished Brass with Steel Back',
      caseDiameter: '38 mm',
      dialColor: 'Clean Opal White',
      glass: 'Scratch-Resistant Mineral Glass',
      waterResistance: '30 Meters',
      strapMaterial: 'Genuine Black Leather',
      claspType: 'Pin Buckle',
      functions: ['Hours', 'Minutes', 'Seconds']
    },
    is_featured: false,
    is_new_arrival: false,
    created_at: '2026-01-14T12:00:00Z'
  },
  {
    id: 99,
    name: 'Meghani Sovereign Tourbillon Atelier Piece',
    brand: 'Meghani Atelier',
    category: 'analog',
    price: null, // Strictly null: price_visible is false
    price_visible: false, // EXPLICIT REQUIREMENT TEST: Price visibility disabled!
    availability: 'on_request',
    stock: 2,
    barcode: 'MGH-TOURB-EXCLUSIVE',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'An exclusive Haute Horlogerie masterpiece crafted upon bespoke commission. Incorporates an open-heart 60-second flying tourbillon cage, hand-guilloché slate dial, and 18k solid gold bezel.',
    warranty_months: 60,
    specifications: {
      movement: 'Hand-Finished Manual-Wind Tourbillon Calibre (28,800 vph)',
      caseMaterial: '18k Solid Rose Gold & Grade 5 Titanium',
      caseDiameter: '42.5 mm',
      dialColor: 'Hand-Engineered Guilloché Slate Grey',
      glass: 'Double Anti-Reflective Domed Sapphire Crystal',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Hand-Sewn Louisiana Alligator Leather',
      claspType: '18k Rose Gold Deployant Buckle',
      functions: ['Flying Tourbillon', '72-Hour Power Reserve Indicator', 'Sapphire Exhibition Back']
    },
    is_featured: true,
    is_new_arrival: true,
    created_at: '2026-01-15T16:00:00Z'
  },
  {
    id: 35,
    name: 'Casio Vintage Digital Gold Chrono A168WG',
    brand: 'Casio',
    category: 'digital',
    price: 2695,
    price_visible: true,
    availability: 'in_stock',
    stock: 20,
    barcode: 'CASIO-A168WG',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=900&q=80',
    description: 'The definitive retro icon. Featuring a brilliant electro-luminescent backlight, gold-tone stainless steel adjustable bracelet, and unmistakable 1980s digital horology charm.',
    warranty_months: 24,
    specifications: {
      movement: 'Japanese Digital Quartz Engine',
      caseMaterial: 'Gold-Tone Resin & Stainless Steel Back',
      caseDiameter: '38.6 mm',
      dialColor: 'Digital LCD with Gold Border',
      glass: 'Resin Glass',
      waterResistance: 'Water Resistant (Splashproof)',
      strapMaterial: 'Gold Ion-Plated Stainless Steel Mesh Bracelet',
      claspType: 'Sliding Adjustable Clasp',
      functions: ['Electro-Luminescent Backlight', '1/100-Sec Stopwatch', 'Daily Alarm', 'Auto Calendar', '12/24 Hr Format']
    },
    is_featured: true,
    is_new_arrival: false,
    created_at: '2026-01-16T10:00:00Z'
  },
  {
    id: 36,
    name: 'Casio G-Shock Rugged Tough Solar GA-2100',
    brand: 'Casio',
    category: 'digital',
    price: 8995,
    price_visible: true,
    availability: 'in_stock',
    stock: 14,
    barcode: 'CASIO-GA2100-SOLAR',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
    description: 'The legendary "CasiOak" with Carbon Core Guard structure. Slim, octagonal bezel with Bluetooth smartphone linking and solar charging for infinite autonomous power.',
    warranty_months: 24,
    specifications: {
      movement: 'Tough Solar Ana-Digi Module with Bluetooth',
      caseMaterial: 'Carbon-Reinforced Fine Resin',
      caseDiameter: '45.4 mm',
      dialColor: 'Stealth Black with Neo-Brite Luminous Hands',
      glass: 'Scratch-Resistant Mineral Crystal',
      waterResistance: '200 Meters (20 Bar Diver Grade)',
      strapMaterial: 'Durable Bio-Based Resin Strap',
      claspType: 'Heavy-Duty Buckle',
      functions: ['Solar Charging', 'Phone Link Bluetooth', 'World Time (38 Cities)', '5 Daily Alarms', 'Double LED Super Illuminator']
    },
    is_featured: true,
    is_new_arrival: true,
    created_at: '2026-01-17T15:00:00Z'
  },
  {
    id: 37,
    name: 'Citizen Promaster Eco-Drive Marine Automatic',
    brand: 'Citizen',
    category: 'analog',
    price: 18500,
    price_visible: true,
    availability: 'in_stock',
    stock: 8,
    barcode: 'CITIZEN-ECO-PRO',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80',
    description: 'ISO-compliant professional diver timepiece powered by light. Features a unidirectional rotating elapsed-time bezel and high-intensity luminous markers for deep underwater visibility.',
    warranty_months: 36,
    specifications: {
      movement: 'Citizen Eco-Drive Calibre E168 (Light Powered)',
      caseMaterial: '316L Marine-Grade Stainless Steel',
      caseDiameter: '44 mm',
      dialColor: 'Ocean Deep Blue',
      glass: 'Anti-Reflective Mineral Crystal',
      waterResistance: '200 Meters (ISO 6425 Certified)',
      strapMaterial: 'Polyurethane Diver Accordion Strap',
      claspType: 'Tang Buckle',
      functions: ['Screw-Down Crown', 'Unidirectional 60-Minute Bezel', 'Low-Charge Indicator']
    },
    is_featured: true,
    is_new_arrival: false,
    created_at: '2026-01-18T13:20:00Z'
  },
  {
    id: 38,
    name: 'Noise ColorFit Pro Luxury Stainless Smartwatch',
    brand: 'Noise',
    category: 'smart',
    price: 4999,
    price_visible: true,
    availability: 'in_stock',
    stock: 18,
    barcode: 'NOISE-CFP-LUX',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=80',
    description: 'A fusion of haute horology styling and modern intelligence. 1.85-inch AMOLED display encased in metallic stainless steel with magnetic Milanese loop strap.',
    warranty_months: 12,
    specifications: {
      movement: 'Dual-Core Smart Engine with Real-Time OS',
      caseMaterial: 'Zinc Alloy & Stainless Steel Polish',
      caseDiameter: '46 mm',
      dialColor: 'Customizable 100+ AMOLED Watch Faces',
      glass: '2.5D Curved Tempered Glass',
      waterResistance: 'IP68 Dust & Water Resistant',
      strapMaterial: 'Magnetic Stainless Steel Milanese Mesh',
      claspType: 'Magnetic Clasp',
      functions: ['Bluetooth Calling', 'SpO2 & Heart Rate 24/7', 'Sleep Tracking', '7-Day Battery']
    },
    is_featured: false,
    is_new_arrival: true,
    created_at: '2026-01-19T09:00:00Z'
  },
  {
    id: 39,
    name: 'Ajanta Grand Pendulum Wooden Wall Clock',
    brand: 'Ajanta',
    category: 'wall',
    price: 2499,
    price_visible: true,
    availability: 'in_stock',
    stock: 10,
    barcode: 'AJANTA-PEND-WOOD',
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=900&q=80',
    description: 'An architectural centerpiece for living spaces and executive suites. Crafted with warm mahogany-finish casing, glass viewing portal, and a harmonic swinging pendulum.',
    warranty_months: 18,
    specifications: {
      movement: 'Silent-Sweep Quartz Pendulum Mechanism',
      caseMaterial: 'Engineered Wood with Mahogany Veneer',
      caseDiameter: '600 mm x 280 mm',
      dialColor: 'Classical Ivory with Roman Numerals',
      glass: 'Flat Beveled Mineral Glass',
      waterResistance: 'Indoor Indoor Grade',
      strapMaterial: 'N/A',
      claspType: 'Wall Hanging Bracket',
      functions: ['Precision Continuous Sweep Hand', 'Synchronized Mechanical Pendulum']
    },
    is_featured: false,
    is_new_arrival: false,
    created_at: '2026-01-20T11:45:00Z'
  },
  {
    id: 40,
    name: 'Meghani Handcrafted Italian Leather Strap Set',
    brand: 'Meghani Atelier',
    category: 'accessory',
    price: 1299,
    price_visible: true,
    availability: 'in_stock',
    stock: 22,
    barcode: 'MGH-STRAP-ITL-20',
    image: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=900&q=80',
    description: 'Curated replacement strap set crafted from Tuscan vegetable-tanned leather. Includes quick-release spring bars and a hypoallergenic 316L brushed steel buckle.',
    warranty_months: 12,
    specifications: {
      movement: 'N/A',
      caseMaterial: 'N/A',
      caseDiameter: '20 mm / 22 mm Lug Widths',
      dialColor: 'Cognac Brown with Waxed Stitching',
      glass: 'N/A',
      waterResistance: 'Sweat & Moisture Resistant',
      strapMaterial: '100% Genuine Italian Vegetable-Tanned Leather',
      claspType: 'Solid 316L Stainless Steel Tang Buckle',
      functions: ['Tool-Free Quick Release Spring Bars']
    },
    is_featured: false,
    is_new_arrival: true,
    created_at: '2026-01-21T14:00:00Z'
  }
];

export interface ProductFilterParams {
  category?: string;
  brand?: string;
  availability?: AvailabilityStatus | '';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  results: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Fetch products from Django backend or fallback smoothly to rich curated dataset.
 */
export async function getPublicProducts(
  params: ProductFilterParams = {}
): Promise<PaginatedResult<PublicProduct>> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 12;

  try {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.brand) query.append('brand', params.brand);
    if (params.availability) query.append('availability', params.availability);
    if (params.minPrice) query.append('min_price', params.minPrice.toString());
    if (params.maxPrice) query.append('max_price', params.maxPrice.toString());
    if (params.search) query.append('search', params.search);
    if (params.sort) {
      if (params.sort === 'price_asc') query.append('ordering', 'selling_price');
      else if (params.sort === 'price_desc') query.append('ordering', '-selling_price');
      else if (params.sort === 'name_asc') query.append('ordering', 'name');
      else if (params.sort === 'newest') query.append('ordering', '-created_at');
    }
    query.append('page', page.toString());
    query.append('page_size', pageSize.toString());

    // Try fetching from Django public endpoint with 2.5s timeout
    const res = await axios.get(`${API_BASE}/products/public/?${query.toString()}`, {
      timeout: 2500,
    });

    if (res.data && (res.data.results || Array.isArray(res.data))) {
      const rawList = res.data.results || res.data;
      const count = res.data.count || rawList.length;
      
      const mappedResults: PublicProduct[] = rawList.map((item: any) => ({
        id: item.id,
        name: item.name,
        brand: item.brand || 'Meghani',
        category: (item.category as ProductCategory) || 'analog',
        price: item.price_visible === false || item.availability === 'on_request' ? null : (item.price ?? item.selling_price ?? null),
        price_visible: Boolean(item.price_visible !== false),
        availability: (item.availability as AvailabilityStatus) || (item.stock > 0 ? 'in_stock' : 'out_of_stock'),
        stock: item.stock || 0,
        barcode: item.barcode || null,
        image: item.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
        description: item.description || 'Authentic curated luxury watch from Meghani Watch Co.',
        warranty_months: item.warranty_months || 24,
        created_at: item.created_at || new Date().toISOString()
      }));

      return {
        results: mappedResults,
        count,
        totalPages: Math.ceil(count / pageSize) || 1,
        currentPage: page,
      };
    }
  } catch (err) {
    // Graceful fallback to client curated collection
  }

  // Fallback to rich curated local dataset
  let list = [...SEED_PUBLIC_PRODUCTS];

  if (params.category) {
    list = list.filter((p) => p.category === params.category);
  }

  if (params.brand) {
    list = list.filter(
      (p) => p.brand.toLowerCase() === params.brand!.toLowerCase()
    );
  }

  if (params.availability) {
    list = list.filter((p) => p.availability === params.availability);
  }

  if (params.search) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }

  if (params.minPrice !== undefined) {
    list = list.filter((p) => p.price === null || p.price >= params.minPrice!);
  }

  if (params.maxPrice !== undefined) {
    list = list.filter((p) => p.price === null || p.price <= params.maxPrice!);
  }

  // Sorting
  if (params.sort === 'price_asc') {
    list.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (params.sort === 'price_desc') {
    list.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (params.sort === 'name_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (params.sort === 'newest') {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const count = list.length;
  const totalPages = Math.ceil(count / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const results = list.slice(start, start + pageSize);

  return {
    results,
    count,
    totalPages,
    currentPage: page,
  };
}

/**
 * Get product by ID.
 * Strictly respects price_visible requirement:
 * If price_visible is false or availability is on_request, price is strictly null.
 */
export async function getPublicProductById(
  id: number | string
): Promise<PublicProduct | null> {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  try {
    const res = await axios.get(`${API_BASE}/products/public/${numericId}/`, {
      timeout: 2500,
    });
    if (res.data) {
      const item = res.data;
      const isPriceHidden = item.price_visible === false || item.availability === 'on_request';
      return {
        id: item.id,
        name: item.name,
        brand: item.brand || 'Meghani',
        category: item.category || 'analog',
        price: isPriceHidden ? null : (item.price ?? item.selling_price ?? null),
        price_visible: !isPriceHidden,
        availability: item.availability || (item.stock > 0 ? 'in_stock' : 'out_of_stock'),
        stock: item.stock || 0,
        barcode: item.barcode || null,
        image: item.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
        galleryImages: item.galleryImages || [
          item.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'
        ],
        description: item.description || '',
        warranty_months: item.warranty_months || 24,
        specifications: item.specifications || {
          movement: 'Precision Horological Calibre',
          caseMaterial: 'Surgical Stainless Steel',
          caseDiameter: '42 mm',
          glass: 'Sapphire Crystal Glass',
          waterResistance: '50m Water Resistance',
          strapMaterial: 'Genuine Leather Strap',
          claspType: 'Pin Buckle'
        },
        created_at: item.created_at || new Date().toISOString()
      };
    }
  } catch (err) {
    // Fallback
  }

  const match = SEED_PUBLIC_PRODUCTS.find((p) => p.id === numericId);
  return match || null;
}

/**
 * Generate formatted WhatsApp link with prefilled enquiry message.
 */
export function buildWhatsAppEnquiryUrl(
  product?: PublicProduct,
  customMessage?: string
): string {
  const phone = MEGHANI_STORE_INFO.whatsapp;
  let text = '';

  if (product) {
    const priceText = product.price_visible && product.price
      ? `₹${product.price.toLocaleString('en-IN')}`
      : 'Price on Request';

    text = `Hello Meghani Watch Co.,\n\nI am interested in acquiring this timepiece from your collection:\n\n*${product.name}*\n• Brand: ${product.brand}\n• Category: ${product.category}\n• Availability: ${product.availability.replace('_', ' ').toUpperCase()}\n• Price: ${priceText}\n${product.barcode ? `• Ref Code: ${product.barcode}\n` : ''}\nCould you please share availability details and assist me with a boutique viewing or order?\n\nThank you.`;
  } else if (customMessage) {
    text = `Hello Meghani Watch Co.,\n\n${customMessage}\n\nI look forward to your assistance.`;
  } else {
    text = `Hello Meghani Watch Co.,\n\nI would like to inquire about your curated luxury watch collection and boutique consultation services.`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

