import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Share2, 
  ChevronRight, 
  MessageCircle, 
  MessageSquare,
  Instagram,
  Youtube,
  ExternalLink,
  CheckCircle2,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { Property } from '../types';
import { firebaseService } from '../services/firebaseService';

const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 'sample-1',
    title: '우메다 시티타워 자이 럭셔리 펜트하우스',
    price: '¥285,000,000',
    location: '키타구 우메다',
    type: 'Family',
    description: '오사카 최고의 스카이라인을 자랑하는 우메다 중심의 초고층 타워 맨션입니다. 최고급 자재와 최첨단 보안 시스템을 갖추고 있습니다. 우메다의 화려한 야경을 침실에서 감상하실 수 있으며, 입주민 전용 스카이라운지 및 피트니스 센터 이용이 가능합니다.',
    images: ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop'],
    features: ['초고층 뷰', '컨시어지 서비스', '전용 주차장', '피트니스 센터', '24시간 보안', '스카이라운지'],
    isFeatured: true,
    createdAt: new Date(),
    ownerId: 'system'
  },
  {
    id: 'sample-2',
    title: '난바 스테이션 직결 프리미엄 1LDK',
    price: '¥145,000 / 월',
    location: '나니와구 난바',
    type: 'OneRoom',
    description: '난바역 도보 3분 거리의 초역세권 신축 맨션입니다. 직장인과 학생들에게 가장 인기 있는 위치와 설비를 자랑하며, 주변에 미츠코시 백화점, 도톤보리 상가 등이 인접해 있어 완벽한 생활 인프라를 제공합니다. 시스템 키친, 욕실 건조기, 택배 보관함 등 최신식 설비가 완비되어 있습니다.',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'],
    features: ['역세권', '신축', '오토록', '택배함', '시스템 키친', '인터넷 무료'],
    isFeatured: false,
    createdAt: new Date(),
    ownerId: 'system'
  },
  {
    id: 'sample-3',
    title: '신사이바시 상업지구 수익형 빌딩',
    price: '¥850,000,000',
    location: '주오구 신사이바시',
    type: 'Investment',
    description: '유동인구가 가장 많은 신사이바시 메인 스트리트에 위치한 8층 규모의 수익형 빌딩입니다. 현재 전 층 임대 완료 상태로 안정적인 임대 수익이 발생하고 있으며, 입지 조건이 워낙 뛰어나 향후 자산 가치 상승이 확실시되는 특급 매물입니다.',
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2048&auto=format&fit=crop'],
    features: ['고수익', '핵심 상권', '엘리베이터 완비', '관리 용이', '내진 설계', '우수한 가시성'],
    isFeatured: true,
    createdAt: new Date(),
    ownerId: 'system'
  }
];

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      // First check samples
      const sample = SAMPLE_PROPERTIES.find(p => p.id === id);
      if (sample) {
        setProperty(sample);
        setLoading(false);
      } else {
        // Then check firebase if id is provided
        if (id) {
          const data = await firebaseService.getPropertyById(id);
          setProperty(data);
        }
        setLoading(false);
      }
    };
    fetchProperty();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
        <h2 className="text-2xl font-bold mb-4">매물을 찾을 수 없습니다.</h2>
        <Link to="/" className="text-blue-600 font-bold flex items-center gap-2">
          <ArrowLeft size={20} /> 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-zinc-100 h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-10 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-zinc-900 hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-bold text-sm tracking-tight hidden sm:block">목록으로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-4">
             <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
               <Share2 size={20} />
             </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Left Column: Images & Description */}
            <div className="space-y-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl overflow-hidden shadow-2xl bg-zinc-200 aspect-[4/3]"
              >
                <img 
                  src={property.images[0] || 'https://via.placeholder.com/800x600?text=Premium+Listing'} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <div className="grid grid-cols-3 gap-4">
                {property.images.slice(1, 4).map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-zinc-200 aspect-square shadow-md border border-zinc-100">
                    <img src={img} alt={`${property.title} ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-200 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 border-b border-zinc-100 pb-4">상세 설명</h2>
                <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {property.description}
                </p>
              </div>

              <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-200 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 border-b border-zinc-100 pb-4">주요 특징</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-zinc-700 text-sm font-bold">
                      <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Property Info & Contact */}
            <div className="space-y-8">
              <div className="sticky top-24">
                <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-200 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[60px]" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-blue-600 text-[10px] font-bold text-white uppercase tracking-widest rounded-full">
                        {property.type}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                        <MapPin size={12} /> {property.location}
                      </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6 leading-tight text-zinc-900">
                      {property.title}
                    </h1>

                    <div className="text-4xl font-black text-blue-600 tracking-tighter mb-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 inline-block w-full text-center">
                      {property.price}
                    </div>

                    <div className="space-y-4 mb-20 border-t border-zinc-100 pt-8">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest">담당자</span>
                        <span className="font-bold text-zinc-900">오사카J 전문가팀</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest">등록일</span>
                        <span className="font-bold text-zinc-900">상시공고</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest">상태</span>
                        <span className="text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           상담 가능
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">지금 바로 상담하기</p>
                      
                      <a 
                        href="https://pf.kakao.com/_TSvgxb" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-5 bg-[#FEE500] text-[#3C1E1E] font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <MessageCircle size={24} /> 카카오톡 실시간 상담
                      </a>
                      
                      <a 
                        href="https://line.me/R/ti/p/@845immxy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-5 bg-[#06C755] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <MessageSquare size={24} /> 라인(LINE) 상담
                      </a>

                      <button 
                        onClick={() => window.print()}
                        className="w-full py-4 text-zinc-500 font-bold text-xs uppercase tracking-widest bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors"
                      >
                        매물 정보 인쇄하기
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-zinc-900 text-white p-8 rounded-3xl shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-[40px] -translate-y-12 translate-x-12" />
                   <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold shadow-lg shadow-blue-500/20">J</div>
                      <h3 className="font-bold mb-2">행정서사 Legal_ J 오피스</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-6">부동산 전문 협력 행정지원</p>
                      <a 
                        href="https://legalj.jp/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-8"
                      >
                         공식 웹사이트 바로가기 <ExternalLink size={12} className="inline ml-1" />
                      </a>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 md:px-10 border-t border-zinc-100 text-center">
         <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            © OSAKA J REAL ESTATE & LEGAL J OFFICE. ALL RIGHTS RESERVED.
         </p>
      </footer>
    </div>
  );
}
