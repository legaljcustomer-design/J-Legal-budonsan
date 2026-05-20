export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  prefecture?: 'osaka' | 'kyoto' | 'hyogo';
  type: 'OneRoom' | 'TwoRoom' | 'Family' | 'Office' | 'Investment';
  description: string;
  images: string[];
  features: string[];
  construction: string;
  completionYear: string;
  nearestStation?: string;
  nearestLine?: string;
  floorPlan?: string;
  floorPlanImage?: string;
  area?: string;
  googleMapUrl?: string;
  mapAddress?: string;
  youtubeUrl?: string;
  mansionFeatures?: string;
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
  heroImage?: string;
  heroTitleFontSizeMobile?: number;
  heroTitleFontSizeDesktop?: number;
  heroTitleFontFile?: string;
  contactNumber: string;
  kakaoId: string;
  kakaoUrl?: string;
  lineId?: string;
  instagramId?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  footerText?: string;
}
