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

  /**
   * 매물 카드 상단에 표시되는 추천 배지 문구입니다.
   * 예: 유학생 추천!, 워홀러 추천!, 2인거주 가능!, 애완동물 가능!
   */
  badgeLabel?: string;

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
