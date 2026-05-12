import { Property } from './types';

export const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 'sample-1',
    title: '우메다 시티타워 자이 럭셔리 펜트하우스',
    price: '¥285,000,000',
    location: '키타구 우메다',
    type: 'Family',
    description: '오사카 최고의 스카이라운지를 자랑하는 우메다 중심의 초고층 타워 맨션입니다. 최고급 자재와 최첨단 보안 시스템을 갖추고 있습니다. 우메다의 화려한 야경을 침실에서 감상하실 수 있으며, 입주민 전용 스카이라운지 및 피트니스 센터 이용이 가능합니다.',
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop'
    ],
    features: ['초고층 뷰', '컨시어지 서비스', '전용 주차장', '피트니스 센터', '24시간 보안', '스카이라운지'],
    construction: '철근 콘크리트(RC)',
    completionYear: '2022년 5월',
    nearestStation: 'JR 우메다역 도보 5분',
    floorPlan: '3LDK',
    area: '120.5㎡',
    isFeatured: true,
    createdAt: Date.now(),
    ownerId: 'system',
  },
  {
    id: 'sample-2',
    title: '난바역 도보 7분 초프리미엄 원룸/투룸',
    price: '¥188,000円 / 월',
    location: '나니와구 난바',
    type: 'OneRoom',
    description: '외국인 계약 상담이 가능한 맨션으로, 한국인 고객님께도 소개드리기 좋은 물건입니다.\n\n욕실·화장실 분리, 독립 세면대, 실내 세탁기 공간, 욕실 건조기 등 생활 편의 설비가 잘 갖춰져 있으며,\n오토록·방범카메라·모니터 인터폰·택배박스까지 있어 보안성과 편리함도 뛰어납니다.\n\n또한 반려동물 상담이 가능하고, 엘리베이터와 자전거·오토바이 주차장도 마련되어 있어 다양한 고객층께 추천드릴 수 있습니다.\n\n※ 실시간 공실상황은 반드시 연락주시기 바랍니다!',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2070&auto=format&fit=crop'
    ],
    features: ['역세권', '신축', '오토록', '택배함'],
    construction: '철골조(S)',
    completionYear: '2023년 12월',
    nearestStation: '난바역 도보 7분',
    floorPlan: '1LDK',
    area: '50.14㎡',
    youtubeUrl: 'https://youtube.com/shorts/lNfqfRe-rKo?si=bjab3m-djnCXwSGC',
    mansionFeatures: '• 고급스러운 차콜 계열 인테리어\n• 쾌적한 수납 공간 및 드레스룸\n• 최첨단 보안 오토록 시스템\n• 전 세대 남향 배치로 뛰어난 채광',
    isFeatured: true,
    createdAt: Date.now(),
    ownerId: 'system',
  },
  {
    id: 'sample-3',
    title: '신사이바시 상업지구 수익형 빌딩',
    price: '¥850,000,000',
    location: '주오구 신사이바시',
    type: 'Investment',
    description: '유동인구가 가장 많은 신사이바시 메인 스트리트에 위치한 8층 규모의 수익형 빌딩입니다. 현재 전 층 임대 완료 상태로 안정적인 임대 수익이 발생하고 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2048&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-3752e00edcba4?q=80&w=2070&auto=format&fit=crop'
    ],
    features: ['고수익', '핵심 상권', '내진 설계'],
    construction: '철골 철근 콘크리트(SRC)',
    completionYear: '2015년 3월',
    nearestStation: '신사이바시역 도보 3분',
    floorPlan: '전체 임대 중',
    area: '450.8㎡',
    isFeatured: false,
    createdAt: Date.now(),
    ownerId: 'system',
  }
];
