export type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'on_request' | 'discontinued';

export type ProductCategory = 'analog' | 'digital' | 'smart' | 'wall' | 'accessory';

export interface WatchSpecifications {
  movement?: string;
  caseMaterial?: string;
  caseDiameter?: string;
  dialColor?: string;
  glass?: string;
  waterResistance?: string;
  strapMaterial?: string;
  claspType?: string;
  functions?: string[];
}

export interface PublicProduct {
  id: number;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number | null; // null when price_visible is false or on_request
  price_visible: boolean;
  availability: AvailabilityStatus;
  stock: number;
  barcode: string | null;
  image: string | null;
  galleryImages?: string[];
  description: string;
  warranty_months: number;
  specifications?: WatchSpecifications;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  created_at: string;
}

export interface BrandItem {
  name: string;
  slug: string;
  count: number;
  country: string;
  established: string;
  tagline: string;
  description: string;
  logoText?: string;
  heroImage: string;
  is_featured: boolean;
}

export interface CategoryItem {
  id: ProductCategory;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  imageUrl: string;
  count: number;
  features: string[];
}

export interface OfferItem {
  id: string;
  title: string;
  badge: string;
  discount: string;
  description: string;
  code?: string;
  validity: string;
  terms: string;
  bannerImage: string;
  targetCategory?: ProductCategory;
  targetBrand?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'craftsmanship' | 'timepieces' | 'heritage' | 'boutique';
  imageUrl: string;
  caption: string;
  details?: string;
}

export interface BusinessStoreInfo {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
  };
  hours: {
    weekdays: string;
    sunday: string;
  };
  googleMapsUrl: string;
  googleMapsEmbedSrc: string;
  socials: {
    instagram?: string;
    facebook?: string;
  };
}

export interface EnquirySubmission {
  name: string;
  phone: string;
  email?: string;
  enquiryType: 'product' | 'viewing' | 'service' | 'general';
  productId?: number;
  productName?: string;
  productBrand?: string;
  preferredDate?: string;
  message: string;
}

