export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  type: 'OneRoom' | 'TwoRoom' | 'Family' | 'Office' | 'Investment' | '1LDK+S';
  description: string;
  images: string[];
  features: string[];
  googleMapUrl?: string;
  isFeatured: boolean;
  createdAt: any;
  updatedAt?: any;
  ownerId: string;
}

export interface SiteSettings {
  primaryColor: string;
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  contactNumber: string;
  kakaoId: string;
}
