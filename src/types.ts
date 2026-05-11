export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  type: 'OneRoom' | 'TwoRoom' | 'Family' | 'Office' | 'Investment';
  description: string;
  images: string[];
  features: string[];
  construction: string;
  completionYear: string;
  nearestStation?: string;
  floorPlan?: string;
  area?: string;
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
