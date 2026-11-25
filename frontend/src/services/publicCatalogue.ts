import {
  PublicProduct,
  BrandItem,
  CategoryItem,
  OfferItem,
  GalleryItem,
  MilestoneItem,
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
  email: 'contact@meghaniwatch.com',
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
    tagline: 'Timeless Elegance & Reliable Quality',
    description: "India's most trusted watch brand offering contemporary design and precision quartz and automatic watches. Known for the popular Edge, Raga, and Regalia collections.",
    heroImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
  },
  {
    name: 'Casio',
    slug: 'casio',
    count: 6,
    country: 'Japan',
    established: '1946',
    tagline: 'Tough, Reliable Digital & Sports Watches',
    description: 'Renowned Japanese precision engineering featuring iconic G-Shock durability, Edifice chronographs, and vintage gold and silver digital watches.',
    heroImage: 'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200',
    is_featured: true,
  },
  {
    name: 'Timex',
    slug: 'timex',
    count: 5,
    country: 'United States',
    established: '1854',
    tagline: 'Classic Heritage & Everyday Durability',
    description: 'Over 170 years of watchmaking heritage, known for mechanical automatic movements, Marlin vintage models, and practical everyday styles.',
    heroImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
  },
  {
    name: 'Citizen',
    slug: 'citizen',
    count: 4,
    country: 'Japan',
    established: '1918',
    tagline: 'Eco-Drive Light-Powered Innovation',
    description: 'Global leader in light-powered Eco-Drive watches that never need a battery change, featuring durable stainless steel, titanium cases, and water resistance.',
    heroImage: 'https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
  },
  {
    name: 'Fastrack',
    slug: 'fastrack',
    count: 4,
    country: 'India',
    established: '1998',
    tagline: 'Youthful, Sporty & Trendy Watches',
    description: 'Energetic watches designed for young professionals and students, featuring sporty dials, comfortable silicone straps, and trendy everyday styles.',
    heroImage: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
  },
  {
    name: 'Sonata',
    slug: 'sonata',
    count: 3,
    country: 'India',
    established: '1997',
    tagline: 'Great Value Everyday Watches',
    description: 'Classic analog watches with gold accents and genuine leather straps, offering great value and reliable performance for daily wear and festive occasions.',
    heroImage: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
  },
  {
    name: 'Ajanta',
    slug: 'ajanta',
    count: 3,
    country: 'India',
    established: '1971',
    tagline: 'Trusted Wall Clocks for Home & Office',
    description: "India's trusted wall clock manufacturer, crafting wooden, pendulum, and silent-sweep quartz clocks for living rooms, bedrooms, and office spaces.",
    heroImage: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
  }
];

export const PUBLIC_CATEGORIES: CategoryItem[] = [
  {
    id: 'analog',
    name: 'Analog Watches',
    slug: 'analog',
    tagline: 'Classic Style for Every Occasion',
    description: 'Traditional quartz and automatic watches with clean dials, scratch-resistant glass, genuine leather straps, and stainless steel link bracelets.',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    count: 14,
    features: ['Quartz & Automatic Movements', 'Scratch-Resistant Glass', 'Date & Chronograph Displays', 'Genuine Leather & Solid Steel']
  },
  {
    id: 'digital',
    name: 'Digital Watches',
    slug: 'digital',
    tagline: 'Durable, Shock-Resistant & Sporty',
    description: 'High-precision digital displays with stopwatches, alarms, world time, backlight illumination, and durable water-resistant cases.',
    imageUrl: '/images/placeholders/cat-digital.svg',
    count: 6,
    features: ['Shock & Water Resistance', 'Stopwatch & Multi-Alarms', 'Bright Backlight & Solar Power', '100m – 200m Water Resistance']
  },
  {
    id: 'smart',
    name: 'Smartwatches',
    slug: 'smart',
    tagline: 'Connected Style & Everyday Health Tracking',
    description: 'Modern smartwatches featuring clear AMOLED displays, heart rate monitoring, step tracking, Bluetooth calling, and long battery life.',
    imageUrl: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800',
    count: 5,
    features: ['Vibrant AMOLED Displays', 'Heart Rate & Fitness Tracking', 'Bluetooth Calling & Alerts', 'Up to 7 Days Battery Life']
  },
  {
    id: 'wall',
    name: 'Wall Clocks',
    slug: 'wall',
    tagline: 'Quality Clocks for Homes & Offices',
    description: 'Decorative and functional wall clocks with silent-sweep quartz movements, wooden and metallic finishes, and clear, easy-to-read dials.',
    imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80',
    count: 5,
    features: ['Silent Sweep Movement (No Ticking)', 'Solid Wooden & Metallic Finishes', 'Pendulum & Classic Designs', 'Clear & Easy-to-Read Dials']
  },
  {
    id: 'accessory',
    name: 'Watch Straps & Accessories',
    slug: 'accessory',
    tagline: 'Replacement Straps & Watch Care',
    description: 'High-quality leather and metal replacement straps, travel cases, and watch care accessories fitted directly in our Vadodara showroom.',
    imageUrl: '/images/placeholders/cat-accessory.svg',
    count: 7,
    features: ['Genuine Leather Replacement Straps', 'Stainless Steel Mesh & Link Straps', 'Tool-Free Quick Release Fitting', 'Travel Cases & Cleaning Care']
  }
];

export const PUBLIC_OFFERS: OfferItem[] = [
  {
    id: 'offer-1',
    title: 'Special Festive Offers',
    badge: 'Festive Offer',
    discount: 'Up to 20% Off',
    description: 'Celebrate festivals and family milestones with special discounts on select Titan, Timex, and Citizen watches.',
    code: 'FESTIVE-HERITAGE',
    validity: 'Valid through this season',
    terms: 'Applicable on select models in our Vadodara showroom. Free strap adjustment included.',
    bannerImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'analog'
  },
  {
    id: 'offer-2',
    title: 'Wedding Watch Gift Pairs',
    badge: 'Couple Watches',
    discount: 'Free Watch Gift Box',
    description: 'Buy matching his & hers watches from Titan, Citizen, or Timex and receive a complimentary watch presentation box and warranty coverage.',
    validity: 'Ongoing Wedding Season',
    terms: 'Valid on paired watch purchases above ₹10,000 at our Vadodara showroom.',
    bannerImage: 'https://images.pexels.com/photos/125779/pexels-photo-125779.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    id: 'offer-3',
    title: 'Free Watch Inspection & Service Check',
    badge: 'Showroom Service',
    discount: '100% Free Service Check',
    description: 'Bring any watch into our Vadodara showroom for a free battery check, strap fitting, and timekeeping accuracy inspection.',
    validity: 'Walk-in or Booked Appointment',
    terms: 'Available at our New Sama Road showroom. One watch per customer per visit.',
    bannerImage: 'https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg?auto=compress&cs=tinysrgb&w=1200',
  }
];

export const PUBLIC_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Mechanical Movement Inspection',
    category: 'craftsmanship',
    imageUrl: 'https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg?auto=compress&cs=tinysrgb&w=1000',
    caption: 'Precision assembly and watch movement calibration under high magnification.',
    details: 'Every watch serviced at Meghani Watch Co. undergoes strict accuracy and balance testing.'
  },
  {
    id: 'gal-2',
    title: 'Classic Open-Heart Dress Horology',
    category: 'timepieces',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
    caption: 'Exhibition dial detailing paired with hand-stitched leather strapping.',
    details: 'Representative horological study from our dress timepiece curation.'
  },
  {
    id: 'gal-3',
    title: 'Precision Steel Chronograph Craft',
    category: 'timepieces',
    imageUrl: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1000',
    caption: 'Brushed stainless steel casework with multi-register chronograph dial.',
    details: 'Available for viewing and wrist sizing at our New Sama Road showroom.'
  },
  {
    id: 'gal-4',
    title: 'Minimalist Everyday Wristwear',
    category: 'heritage',
    imageUrl: 'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1000',
    caption: 'Clean legible dials built for comfortable daily wear and timeless appeal.',
    details: 'Complimentary strap adjustment and battery servicing available in-store.'
  },
  {
    id: 'gal-5',
    title: 'Chronograph Leather Strap Edition',
    category: 'craftsmanship',
    imageUrl: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1000&q=80',
    caption: 'Precision chronograph sub-registers paired with genuine leather straps.',
    details: 'Genuine leather replacement straps fitted to size in our Vadodara showroom.'
  },
  {
    id: 'gal-6',
    title: 'Architectural Wall Clocks',
    category: 'boutique',
    imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1000&q=80',
    caption: 'Silent-sweep quartz wall clocks designed for contemporary homes and offices.',
    details: 'Curated wall and pendulum clocks inspected and backed by store support.'
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
    image: '/images/placeholders/analog-watch.svg',
    galleryImages: [
      '/images/placeholders/analog-watch.svg'
    ],
    description: 'A classic men’s analog dress watch featuring an ivory dial, polished stainless steel case, rose gold hands, date display at 3 o’clock, and a genuine brown leather strap with 2 years Titan brand warranty.',
    warranty_months: 24,
    specifications: {
      movement: 'Precision Quartz Movement',
      caseMaterial: 'Stainless Steel',
      caseDiameter: '41 mm',
      dialColor: 'Ivory White',
      glass: 'Scratch-Resistant Mineral Glass',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Genuine Leather',
      claspType: 'Pin Buckle',
      functions: ['Hours', 'Minutes', 'Seconds', 'Date Display']
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
    image: '/images/placeholders/analog-watch.svg',
    galleryImages: [
      '/images/placeholders/analog-watch.svg'
    ],
    description: 'A distinguished executive gold watch with a rich champagne dial, polished gold Roman numerals, durable gold PVD finish, and a solid multi-link stainless steel bracelet.',
    warranty_months: 24,
    specifications: {
      movement: 'Japanese Precision Quartz',
      caseMaterial: 'Gold PVD Stainless Steel',
      caseDiameter: '42 mm',
      dialColor: 'Champagne Gold',
      glass: 'Mineral Glass',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Stainless Steel Link Bracelet (Gold PVD)',
      claspType: 'Fold-Over Clasp with Push Buttons',
      functions: ['Hours', 'Minutes', 'Seconds', 'Day and Date Display']
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
    image: '/images/placeholders/luxury-watch.svg',
    galleryImages: [
      '/images/placeholders/luxury-watch.svg'
    ],
    description: 'A dynamic sports chronograph watch featuring a matte black dial, tachymeter scale, bright orange accent hands, and a comfortable sweat-resistant silicone strap for active daily wear.',
    warranty_months: 12,
    specifications: {
      movement: 'Quartz Chronograph',
      caseMaterial: 'Polycarbonate and Alloy',
      caseDiameter: '45 mm',
      dialColor: 'Matte Black',
      glass: 'Mineral Glass',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Durable Silicone',
      claspType: 'Buckle',
      functions: ['Stopwatch', '60-Minute Counter', '24-Hour Display']
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
    image: '/images/placeholders/analog-watch.svg',
    galleryImages: [
      '/images/placeholders/analog-watch.svg'
    ],
    description: 'A classic 1960s vintage-style self-winding automatic watch with a domed crystal, clean black sunray dial, exhibition caseback showing the mechanical movement, and a genuine leather strap.',
    warranty_months: 24,
    specifications: {
      movement: '21-Jewel Automatic Mechanical (Self-Winding)',
      caseMaterial: 'Stainless Steel',
      caseDiameter: '40 mm',
      dialColor: 'Black Sunray',
      glass: 'Domed Acrylic Glass',
      waterResistance: '30 Meters (3 ATM)',
      strapMaterial: 'Genuine Leather Strap',
      claspType: 'Pin Buckle',
      functions: ['Hours', 'Minutes', 'Sweep Seconds', 'Exhibition Caseback']
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
    image: '/images/placeholders/analog-watch.svg',
    description: 'A clean, slim analog watch designed for dependable everyday wear. Features an easy-to-read white dial, lightweight polished case, and genuine black leather strap.',
    warranty_months: 12,
    specifications: {
      movement: 'Japanese Quartz',
      caseMaterial: 'Polished Alloy with Steel Back',
      caseDiameter: '38 mm',
      dialColor: 'Clean White',
      glass: 'Mineral Glass',
      waterResistance: '30 Meters (Splashproof)',
      strapMaterial: 'Genuine Leather',
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
    image: '/images/placeholders/luxury-watch.svg',
    galleryImages: [
      '/images/placeholders/luxury-watch.svg'
    ],
    description: 'An exclusive handcrafted mechanical watch featuring an open-heart 60-second flying tourbillon movement, hand-guilloché slate dial, and titanium-gold case. Available on request by showroom appointment.',
    warranty_months: 60,
    specifications: {
      movement: 'Manual-Wind Tourbillon Movement',
      caseMaterial: '18k Rose Gold & Titanium',
      caseDiameter: '42.5 mm',
      dialColor: 'Slate Grey Guilloché',
      glass: 'Scratch-Resistant Sapphire Crystal',
      waterResistance: '50 Meters (5 ATM)',
      strapMaterial: 'Genuine Alligator Pattern Leather',
      claspType: 'Deployant Clasp',
      functions: ['Flying Tourbillon', '72-Hour Power Reserve', 'Exhibition Caseback']
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
    image: '/images/placeholders/digital-watch.svg',
    description: 'The iconic retro digital watch from Casio. Features a bright electro-luminescent backlight, gold-tone adjustable stainless steel bracelet, stopwatch, daily alarm, and auto-calendar.',
    warranty_months: 24,
    specifications: {
      movement: 'Digital Quartz Movement',
      caseMaterial: 'Gold-Tone Resin with Stainless Steel Back',
      caseDiameter: '38.6 mm',
      dialColor: 'Digital LCD Display',
      glass: 'Resin Glass',
      waterResistance: 'Water Resistant (Daily Splashproof)',
      strapMaterial: 'Gold-Tone Stainless Steel Bracelet',
      claspType: 'Adjustable Sliding Clasp',
      functions: ['EL Backlight', '1/100-Sec Stopwatch', 'Daily Alarm', 'Auto Calendar', '12/24 Hour Formats']
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
    image: '/images/placeholders/digital-watch.svg',
    description: 'The famous "CasiOak" G-Shock watch with Carbon Core Guard shock resistance, Tough Solar charging, Bluetooth smartphone connection, and 200m water resistance.',
    warranty_months: 24,
    specifications: {
      movement: 'Tough Solar Analog-Digital with Bluetooth',
      caseMaterial: 'Carbon Core Guard Reinforced Resin',
      caseDiameter: '45.4 mm',
      dialColor: 'Stealth Black with Luminous Hands',
      glass: 'Scratch-Resistant Mineral Glass',
      waterResistance: '200 Meters (20 ATM Diver Grade)',
      strapMaterial: 'Durable Resin Strap',
      claspType: 'Buckle',
      functions: ['Tough Solar Charging', 'Smartphone Link via Bluetooth', 'World Time (38 Cities)', '5 Daily Alarms', 'Double LED Light']
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
    image: '/images/placeholders/luxury-watch.svg',
    description: 'An ISO-certified 200-meter diver watch powered continuously by light with Citizen Eco-Drive technology. Features a unidirectional rotating bezel and high-visibility luminous hands.',
    warranty_months: 36,
    specifications: {
      movement: 'Citizen Eco-Drive Light-Powered Movement',
      caseMaterial: 'Stainless Steel',
      caseDiameter: '44 mm',
      dialColor: 'Deep Ocean Blue',
      glass: 'Anti-Reflective Mineral Glass',
      waterResistance: '200 Meters (ISO 6425 Certified)',
      strapMaterial: 'Durable Polyurethane Diver Strap',
      claspType: 'Buckle',
      functions: ['Screw-Down Crown', 'Rotating Elapsed-Time Bezel', 'Date Display', 'Low-Charge Warning']
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
    image: '/images/placeholders/smartwatch.svg',
    description: 'A stylish smartwatch with a vibrant 1.85-inch AMOLED display, stainless steel case, magnetic Milanese strap, Bluetooth calling, and 24/7 heart rate and fitness tracking.',
    warranty_months: 12,
    specifications: {
      movement: 'Smart Engine with Real-Time OS',
      caseMaterial: 'Metallic Stainless Steel Finish',
      caseDiameter: '46 mm',
      dialColor: 'Customizable 100+ AMOLED Watch Faces',
      glass: 'Curved Tempered Glass',
      waterResistance: 'IP68 Water & Dust Resistant',
      strapMaterial: 'Magnetic Stainless Steel Mesh (Milanese)',
      claspType: 'Magnetic Clasp',
      functions: ['Bluetooth Calling', 'Heart Rate & SpO2 Monitoring', 'Sleep Tracking', 'Up to 7 Days Battery']
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
    image: '/images/placeholders/wall-clock.svg',
    description: 'A classic wooden pendulum wall clock with a rich mahogany finish, clear Roman numerals, glass front panel, and a smooth silent-sweep quartz movement with synchronized pendulum.',
    warranty_months: 18,
    specifications: {
      movement: 'Silent-Sweep Quartz Pendulum Mechanism',
      caseMaterial: 'Engineered Wood with Mahogany Finish',
      caseDiameter: '600 mm x 280 mm',
      dialColor: 'Classic Ivory with Roman Numerals',
      glass: 'Flat Mineral Glass',
      waterResistance: 'Indoor Wall Mount',
      strapMaterial: 'N/A',
      claspType: 'Wall Hanging Bracket',
      functions: ['Continuous Silent-Sweep Second Hand', 'Synchronized Pendulum Movement']
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
    image: '/images/placeholders/watch-strap.svg',
    description: 'Premium replacement watch strap crafted from genuine leather. Features tool-free quick-release pins and a stainless steel buckle. Available in 20mm and 22mm widths.',
    warranty_months: 12,
    specifications: {
      movement: 'N/A',
      caseMaterial: 'N/A',
      caseDiameter: '20 mm / 22 mm Lug Widths',
      dialColor: 'Cognac Brown with Stitching',
      glass: 'N/A',
      waterResistance: 'Sweat & Moisture Resistant',
      strapMaterial: '100% Genuine Leather',
      claspType: 'Stainless Steel Pin Buckle',
      functions: ['Tool-Free Quick Release Pins']
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
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  results: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Returns a clean, category-accurate neutral horological placeholder image.
 * Never returns unrelated stock imagery or misleading brand/model photography.
 */
export function getCategoryFallbackImage(category?: string, name?: string): string {
  const c = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (n.includes('battery') || n.includes('cr2032') || c.includes('spare')) {
    return '/images/placeholders/watch-battery.svg';
  }
  if (n.includes('cleaning') || n.includes('kit') || n.includes('care')) {
    return '/images/placeholders/watch-care.svg';
  }
  if (n.includes('box') || n.includes('case') || n.includes('winder')) {
    return '/images/placeholders/watch-box.svg';
  }
  if (c.includes('strap') || n.includes('strap') || n.includes('chain') || n.includes('band 20') || n.includes('band 22')) {
    return '/images/placeholders/watch-strap.svg';
  }
  if (c.includes('accessory')) {
    return '/images/placeholders/watch-box.svg';
  }
  if (c.includes('wall') || c.includes('clock') || n.includes('clock') || n.includes('pendulum') || n.includes('antique') || n.includes('office')) {
    return '/images/placeholders/wall-clock.svg';
  }
  if (c.includes('smart') || n.includes('smart') || n.includes('colorfit') || n.includes('gtr') || n.includes('active') || n.includes('fitness') || n.includes('band 7')) {
    return '/images/placeholders/smartwatch.svg';
  }
  if (c.includes('digital') || n.includes('g-shock') || n.includes('shock') || n.includes('digital') || n.includes('runner')) {
    return '/images/placeholders/digital-watch.svg';
  }
  if (c.includes('luxury') || n.includes('submariner') || n.includes('rolex') || n.includes('speedmaster') || n.includes('omega') || n.includes('prx') || n.includes('tissot') || n.includes('chronograph') || n.includes('tourbillon')) {
    return '/images/placeholders/luxury-watch.svg';
  }
  if (c.includes('analog')) {
    return '/images/placeholders/analog-watch.svg';
  }
  return '/images/placeholders/default-watch.svg';
}

/**
 * Returns an appropriate category banner/card image when a DB Category record has no image_url.
 */
export function getCategoryBannerFallback(slug?: string): string {
  const s = (slug || '').toLowerCase();
  const map: Record<string, string> = {
    analog: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    digital: '/images/placeholders/cat-digital.svg',
    smart: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800',
    luxury: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
    sports: 'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=800',
    kids: '/images/placeholders/cat-kids.svg',
    wall: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80',
    'table-clocks': '/images/placeholders/cat-table-clocks.svg',
    'alarm-clocks': '/images/placeholders/cat-alarm-clocks.svg',
    'pocket-watches': '/images/placeholders/cat-pocket-watches.svg',
    accessory: '/images/placeholders/cat-accessory.svg',
    'spare-parts': '/images/placeholders/cat-spare-parts.svg',
    straps: '/images/placeholders/cat-straps.svg',
    'gift-sets': '/images/placeholders/cat-gift-sets.svg',
  };
  return map[s] || '/images/placeholders/cat-digital.svg';
}

/**
 * Resolves the API base URL with full environment intelligence:
 * - In Browser: returns same-origin '/api' (or NEXT_PUBLIC_API_URL).
 * - On Server (Node.js SSR): constructs a valid absolute URL so Node.js HTTP clients never throw "Invalid URL" errors.
 */
export function getPublicApiBase(): string {
  // 1. Client-side browser runtime:
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // 2. Server-side runtime (Node.js SSR / API Route Handlers):
  if (process.env.BACKEND_URL) {
    try {
      return new URL('/api', process.env.BACKEND_URL).toString().replace(/\/+$/, '');
    } catch {
      return `${process.env.BACKEND_URL.replace(/\/+$/, '')}/api`;
    }
  }

  // If NEXT_PUBLIC_API_URL is already an absolute URL (e.g. http://127.0.0.1:8000/api in local dev)
  if (process.env.NEXT_PUBLIC_API_URL && /^https?:\/\//i.test(process.env.NEXT_PUBLIC_API_URL)) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // On Vercel deployments, VERCEL_URL is automatically populated by Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}/api`;
  }

  // If public site URL is configured
  if (process.env.NEXT_PUBLIC_SITE_URL && /^https?:\/\//i.test(process.env.NEXT_PUBLIC_SITE_URL)) {
    return `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')}/api`;
  }

  // In production environments, use the live production domain
  if (process.env.NODE_ENV === 'production') {
    return 'https://meghani-connects.vercel.app/api';
  }

  // Local development Node.js fallback
  return 'http://127.0.0.1:8000/api';
}

/**
 * Sanitizes and cleans image URLs.
 * Strips accidental media prefix wrapping such as:
 * /media/https%3A/... or https://meghani-connects.vercel.app/media/https%3A/...
 * which can occur when external image URLs are stored in Django's ImageField
 * before a backend deployment is triggered.
 */
export function cleanImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Handle URL-encoded media wrappers (e.g. from DRF ImageField default serialization)
  if (trimmed.includes('/media/')) {
    const parts = trimmed.split('/media/');
    const candidate = parts[parts.length - 1];
    const candidateDecoded = decodeURIComponent(candidate);
    if (/^https?:\//i.test(candidateDecoded)) {
      let clean = candidateDecoded;
      if (clean.startsWith('https:/') && !clean.startsWith('https://')) {
        clean = clean.replace(/^https:\/+/, 'https://');
      } else if (clean.startsWith('http:/') && !clean.startsWith('http://')) {
        clean = clean.replace(/^http:\/+/, 'http://');
      }
      return clean;
    }
  }

  // Handle standard decode check if it contains /media/http
  const decoded = decodeURIComponent(trimmed);
  const mediaIdx = decoded.indexOf('/media/http');
  if (mediaIdx !== -1) {
    const rawInner = decoded.substring(mediaIdx + 7);
    let clean = rawInner;
    if (clean.startsWith('https:/') && !clean.startsWith('https://')) {
      clean = clean.replace(/^https:\/+/, 'https://');
    } else if (clean.startsWith('http:/') && !clean.startsWith('http://')) {
      clean = clean.replace(/^http:\/+/, 'http://');
    }
    return clean;
  }

  return trimmed;
}

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
    if (params.featured) query.append('featured', 'true');
    if (params.sort) {
      if (params.sort === 'price_asc') query.append('ordering', 'selling_price');
      else if (params.sort === 'price_desc') query.append('ordering', '-selling_price');
      else if (params.sort === 'name_asc') query.append('ordering', 'name');
      else if (params.sort === 'newest') query.append('ordering', '-created_at');
    }
    query.append('page', page.toString());
    query.append('page_size', pageSize.toString());

    // Try fetching from Django public endpoint
    const res = await axios.get(`${getPublicApiBase()}/products/public/?${query.toString()}`, {
      timeout: 10000,
    });

    if (res.data && (res.data.results || Array.isArray(res.data))) {
      const rawList = res.data.results || res.data;
      const count = res.data.count || rawList.length;
      
      const mappedResults: PublicProduct[] = rawList.map((item: any) => {
        const cleanedImage = cleanImageUrl(item.image);
        const fallbackImg = getCategoryFallbackImage(item.category, item.name);
        const productImg = cleanedImage && cleanedImage.trim() ? cleanedImage : fallbackImg;
        const rawGallery = item.gallery_images || item.galleryImages;
        const cleanedGallery = Array.isArray(rawGallery)
          ? (rawGallery.map(cleanImageUrl).filter(Boolean) as string[])
          : [productImg];

        return {
          id: item.id,
          name: item.name,
          brand: item.brand || 'Meghani',
          category: (item.category as ProductCategory) || 'analog',
          price: item.price_visible === false || item.availability === 'on_request' ? null : (item.price ?? item.selling_price ?? null),
          price_visible: Boolean(item.price_visible !== false),
          availability: (item.availability as AvailabilityStatus) || (item.stock > 0 ? 'in_stock' : 'out_of_stock'),
          stock: item.stock || 0,
          barcode: item.barcode || null,
          image: productImg,
          galleryImages: cleanedGallery.length > 0 ? cleanedGallery : [productImg],
          description: item.description || 'Authentic curated luxury watch from Meghani Watch Co.',
          warranty_months: item.warranty_months || 24,
          specifications: item.specifications || undefined,
          is_featured: Boolean(item.is_featured),
          is_new_arrival: Boolean(item.is_new_arrival),
          created_at: item.created_at || new Date().toISOString()
        };
      });

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
    const res = await axios.get(`${getPublicApiBase()}/products/public/${numericId}/`, {
      timeout: 10000,
    });
    if (res.data) {
      const item = res.data;
      const isPriceHidden = item.price_visible === false || item.availability === 'on_request';
      const cleanedImage = cleanImageUrl(item.image);
      const fallbackImg = getCategoryFallbackImage(item.category, item.name);
      const productImg = cleanedImage && cleanedImage.trim() ? cleanedImage : fallbackImg;
      const rawGallery = item.gallery_images || item.galleryImages;
      const cleanedGallery = Array.isArray(rawGallery)
        ? (rawGallery.map(cleanImageUrl).filter(Boolean) as string[])
        : [productImg];

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
        image: productImg,
        galleryImages: cleanedGallery.length > 0 ? cleanedGallery : [productImg],
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
        is_featured: Boolean(item.is_featured),
        is_new_arrival: Boolean(item.is_new_arrival),
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

    text = `Hello Meghani Watch Co.,\n\nI am interested in this watch from your collection:\n\n*${product.name}*\n• Brand: ${product.brand}\n• Category: ${product.category}\n• Availability: ${product.availability.replace('_', ' ').toUpperCase()}\n• Price: ${priceText}\n${product.barcode ? `• Reference Code: ${product.barcode}\n` : ''}\nPlease let me know if it is available in your Vadodara showroom and how I can see or purchase it.\n\nThank you.`;
  } else if (customMessage) {
    text = `Hello Meghani Watch Co.,\n\n${customMessage}\n\nThank you.`;
  } else {
    text = `Hello Meghani Watch Co.,\n\nI would like to enquire about your watch collection and showroom in Vadodara.`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Fetch public store business details dynamically from backend,
 * falling back to MEGHANI_STORE_INFO if the backend is unreachable.
 */
export async function getStoreInfo(): Promise<BusinessStoreInfo> {
  try {
    const res = await axios.get(`${getPublicApiBase()}/settings/public/`, { timeout: 10000 });
    if (res.data && res.data.business_name) {
      const d = res.data;
      return {
        name: d.business_name || MEGHANI_STORE_INFO.name,
        tagline: d.tagline || MEGHANI_STORE_INFO.tagline,
        phone: d.phone || MEGHANI_STORE_INFO.phone,
        whatsapp: d.whatsapp_number || MEGHANI_STORE_INFO.whatsapp,
        email: d.email || MEGHANI_STORE_INFO.email,
        address: {
          line1: d.address_line1 || MEGHANI_STORE_INFO.address.line1,
          line2: d.address_line2 || MEGHANI_STORE_INFO.address.line2,
          city: d.city || MEGHANI_STORE_INFO.address.city,
          state: d.state || MEGHANI_STORE_INFO.address.state,
          pincode: d.pincode || MEGHANI_STORE_INFO.address.pincode,
          landmark: d.landmark || MEGHANI_STORE_INFO.address.landmark,
        },
        hours: {
          weekdays: d.opening_hours_weekdays || MEGHANI_STORE_INFO.hours.weekdays,
          sunday: d.opening_hours_sunday || MEGHANI_STORE_INFO.hours.sunday,
        },
        googleMapsUrl: d.google_maps_url || MEGHANI_STORE_INFO.googleMapsUrl,
        googleMapsEmbedSrc: d.google_maps_embed_src || MEGHANI_STORE_INFO.googleMapsEmbedSrc,
        socials: {
          instagram: d.instagram_url || MEGHANI_STORE_INFO.socials.instagram,
          facebook: d.facebook_url || MEGHANI_STORE_INFO.socials.facebook,
        },
        terms_and_conditions: d.terms_and_conditions,
        privacy_policy: d.privacy_policy,
      };
    }
  } catch (err) {
    // fallback
  }
  return MEGHANI_STORE_INFO;
}

/**
 * Fetch authorized brand portfolio dynamically from backend.
 */
export async function getPublicBrands(): Promise<BrandItem[]> {
  try {
    const res = await axios.get(`${getPublicApiBase()}/brands/`, { timeout: 10000 });
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
    if (rawList.length > 0) {
      return rawList.map((b: any) => ({
        name: b.name,
        slug: b.slug,
        count: b.count || 0,
        country: b.country || 'International',
        established: b.established || '',
        tagline: b.tagline || '',
        description: b.description || '',
        heroImage: cleanImageUrl(b.hero_image) || 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200',
        is_featured: Boolean(b.is_featured),
      }));
    }
  } catch (err) {
    // fallback
  }
  return PUBLIC_BRANDS;
}

/**
 * Fetch horological categories dynamically from backend.
 */
export async function getPublicCategories(): Promise<CategoryItem[]> {
  try {
    const res = await axios.get(`${getPublicApiBase()}/categories/`, { timeout: 10000 });
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
    if (rawList.length > 0) {
      return rawList.map((c: any) => ({
        id: (c.slug as ProductCategory) || 'analog',
        name: c.name,
        slug: c.slug,
        tagline: c.tagline || '',
        description: c.description || '',
        imageUrl: cleanImageUrl(c.image_url) || getCategoryBannerFallback(c.slug),
        count: c.count || 0,
        features: c.features || [],
      }));
    }
  } catch (err) {
    // fallback
  }
  return PUBLIC_CATEGORIES;
}

/**
 * Fetch a specific brand by its slug, or return from PUBLIC_BRANDS fallback.
 */
export async function getPublicBrandBySlug(slug: string): Promise<BrandItem | null> {
  const normalizedSlug = slug.toLowerCase();
  try {
    const brands = await getPublicBrands();
    const found = brands.find(
      (b) => b.slug.toLowerCase() === normalizedSlug || b.name.toLowerCase() === normalizedSlug
    );
    if (found) return found;
  } catch (err) {
    // fallback
  }
  return (
    PUBLIC_BRANDS.find(
      (b) => b.slug.toLowerCase() === normalizedSlug || b.name.toLowerCase() === normalizedSlug
    ) || null
  );
}

/**
 * Fetch a specific category by its slug or ID, or return from PUBLIC_CATEGORIES fallback.
 */
export async function getPublicCategoryBySlug(slug: string): Promise<CategoryItem | null> {
  const normalizedSlug = slug.toLowerCase();
  try {
    const categories = await getPublicCategories();
    const found = categories.find(
      (c) =>
        c.slug.toLowerCase() === normalizedSlug ||
        c.id.toLowerCase() === normalizedSlug ||
        c.name.toLowerCase() === normalizedSlug
    );
    if (found) return found;
  } catch (err) {
    // fallback
  }
  return (
    PUBLIC_CATEGORIES.find(
      (c) =>
        c.slug.toLowerCase() === normalizedSlug ||
        c.id.toLowerCase() === normalizedSlug ||
        c.name.toLowerCase() === normalizedSlug
    ) || null
  );
}

/**
 * Fetch active boutique offers and privileges dynamically from backend.
 */
export async function getPublicOffers(): Promise<OfferItem[]> {
  try {
    const res = await axios.get(`${getPublicApiBase()}/offers/`, { timeout: 10000 });
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
    if (rawList.length > 0) {
      return rawList.map((o: any) => ({
        id: o.id.toString(),
        title: o.title,
        badge: o.badge,
        discount: o.discount,
        description: o.description,
        code: o.code || undefined,
        validity: o.validity,
        terms: o.terms,
        bannerImage: o.banner_image,
        targetCategory: o.target_category || undefined,
      }));
    }
  } catch (err) {
    // fallback
  }
  return PUBLIC_OFFERS;
}

/**
 * Fetch horological workshop gallery items dynamically from backend.
 */
export async function getPublicGallery(): Promise<GalleryItem[]> {
  try {
    const res = await axios.get(`${getPublicApiBase()}/gallery/`, { timeout: 10000 });
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
    if (rawList.length > 0) {
      return rawList.map((g: any) => ({
        id: g.id.toString(),
        title: g.title,
        category: g.category,
        imageUrl: g.image_url,
        caption: g.caption,
        details: g.details,
      }));
    }
  } catch (err) {
    // fallback
  }
  return PUBLIC_GALLERY;
}

/**
 * Fetch heritage milestones dynamically from backend.
 */
export async function getPublicMilestones(): Promise<MilestoneItem[]> {
  try {
    const res = await axios.get(`${getPublicApiBase()}/milestones/`, { timeout: 10000 });
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
    if (rawList.length > 0) {
      return rawList.map((m: any) => ({
        year: m.year,
        title: m.title,
        description: m.description,
        display_order: m.display_order,
      }));
    }
  } catch (err) {
    // fallback
  }
  return [
    { year: '1984', title: 'The Foundation in Vadodara', description: 'Meghani Watch Co. opens in Vadodara, offering mechanical wristwatches, pocket watches, and trusted watch repair services.' },
    { year: '1995', title: 'Authorized Brand Partnerships', description: 'Became an authorized dealer for Titan, Citizen, and Casio, bringing genuine branded watches with official warranties to Vadodara families.' },
    { year: '2010', title: 'Workshop Expansion', description: 'Expanded our in-house repair workshop with modern diagnostic equipment, pressure testers, and genuine spare parts.' },
    { year: '2026', title: 'Four Decades of Trust', description: 'Celebrating 40+ years in Vadodara, having served over 50,000 satisfied customers with authentic watches and reliable servicing.' },
  ];
}


