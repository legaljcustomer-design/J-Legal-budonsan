import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Home as HomeIcon, 
  Briefcase, 
  TrendingUp, 
  MessageCircle, 
  MessageSquare,
  Instagram,
  Youtube,
  Phone,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Building2
} from 'lucide-react';
import { Property } from '../types';
import { firebaseService } from '../services/firebaseService';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: HomeIcon },
  { id: 'OneRoom', label: '원룸/투룸', icon: Building2 },
  { id: 'Family', label: '타워맨션', icon: HomeIcon },
  { id: 'Office', label: '상가/사무실', icon: Briefcase },
  { id: 'Investment', label: '수익형 부동산', icon: TrendingUp },
];

const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 'sample-1',
    title: '우메다 시티타워 자이 럭셔리 펜트하우스',
    price: '¥285,000,000',
    location: '키타구 우메다',
    type: 'Family',
    description: '오사카 최고의 스카이라인을 자랑하는 우메다 중심의 초고층 타워 맨션입니다. 최고급 자재와 최첨단 보안 시스템을 갖추고 있습니다.',
    images: ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop'],
    features: ['초고층 뷰', '컨시어지 서비스', '전용 주차장', '피트니스 센터'],
    isFeatured: true,
    createdAt: new Date(),
    ownerId: 'system'
  },
  {
    id: 'sample-2',
    title: '난바역 도보 7분 초프리미엄 1LDK+S',
    price: '¥188,000円 / 월\n(관리비 별도)',
    location: '나니와구 난바',
    type: '1LDK+S',
    description: '난바 생활권에서 50㎡대 1LDK를 찾으신다면, 실제로 보셨을 때 “생각보다 훨씬 넓다”는 느낌이 먼저 들 만한 맨션입니다...',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'],
    features: ['역세권', '신축', '오토록', '택배함'],
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
    description: '유동인구가 가장 많은 신사이바시 메인 스트리트에 위치한 8층 규모의 수익형 빌딩입니다. 안정적인 임대 수익이 보장됩니다.',
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2048&auto=format&fit=crop'],
    features: ['고수익', '핵심 상권', '엘리베이터 완비', '관리 용이'],
    isFeatured: true,
    createdAt: new Date(),
    ownerId: 'system'
  },
  {
    id: 'sample-4',
    title: '혼마치 비즈니스 지구 모던 오피스',
    price: '¥420,000 / 월',
    location: '주오구 혼마치',
    type: 'Office',
    description: '기업체 밀집 지역인 혼마치에 위치한 대형 평수 오피스입니다. 세련된 인테리어와 쾌적한 업무 환경을 제공합니다.',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop'],
    features: ['대형 평수', '중심 업무 지구', '개별 냉난방', '회의실 가능'],
    isFeatured: false,
    createdAt: new Date(),
    ownerId: 'system'
  },
  {
    id: 'sample-5',
    title: '텐노지 공원 근교 파노라마 뷰 맨션',
    price: '¥198,000 / 월',
    location: '덴노지구 덴노지',
    type: 'Family',
    description: '덴노지 공원과 하루카스가 한눈에 보이는 조망권을 가진 가족형 맨션입니다. 교육 환경과 편의시설이 우수합니다.',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop'],
    features: ['공원 근처', '파노라마 뷰', '대형 수납장', '바닥 난방'],
    isFeatured: true,
    createdAt: new Date(),
    ownerId: 'system'
  }
];

export default function Home({ isAdmin }: { isAdmin: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultationCount, setConsultationCount] = useState(134);

  useEffect(() => {
    const updateCount = () => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const jstNow = new Date(utc + (jstOffset * 60000));
      
      const startOfDay = new Date(jstNow);
      startOfDay.setHours(0, 0, 0, 0);
      
      const minutesPassed = Math.floor((jstNow.getTime() - startOfDay.getTime()) / 60000);
      // Base 102 + 1 every 12 minutes (approx 120 per day increase)
      setConsultationCount(102 + Math.floor(minutesPassed / 12));
    };

    updateCount();
    const interval = setInterval(updateCount, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const data = await firebaseService.getProperties(activeCategory);
      
      // Filter samples based on active category
      const filteredSamples = activeCategory === 'all' 
        ? SAMPLE_PROPERTIES 
        : SAMPLE_PROPERTIES.filter(p => p.type === activeCategory);
      
      setProperties([...filteredSamples, ...data]);
      setLoading(false);
    };
    fetchProperties();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-luxury-black text-zinc-900 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-10 flex justify-between items-center">
          <div className="flex flex-col">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="https://yt3.googleusercontent.com/ZNWF_L7kuC_cHkMdodV_-R27ac-oQModzDEdDhAm6h-qFoA9-mLjbJMi05MbA66tU8U7zqVN=s160-c-k-c0x00ffffff-no-rj" 
                alt="J Logo" 
                className="w-8 h-8 rounded-sm object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-bold tracking-tight text-zinc-900">오사카J부동산</span>
            </Link>
            <a 
              href="https://legalj.jp/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xl font-bold tracking-tight text-zinc-900 hover:text-blue-600 transition-colors flex items-center gap-2 mt-2"
            >
              <img 
                src="https://legalj.jp/wp-content/uploads/2025/01/favicon-e1737704245801.png" 
                alt="Legal J Logo" 
                className="w-8 h-8 rounded-sm object-contain"
                referrerPolicy="no-referrer"
              />
              行政書士Legal_ J office <ExternalLink size={16} />
            </a>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-500">
            <a href="#hero" className="text-zinc-900 border-b-2 border-electric-blue pb-1 transition-all font-bold">홈</a>
            <a href="#properties" className="hover:text-electric-blue transition-colors">매물검색</a>
            <a href="#guide" className="hover:text-electric-blue transition-colors">지역 가이드</a>
            <a href="#about" className="hover:text-electric-blue transition-colors">회사소개</a>
            <Link to="/recruitment" className="hover:text-electric-blue transition-colors">채용 정보</Link>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://pf.kakao.com/_TSvgxb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex blue-glow-btn px-8 py-3 items-center justify-center text-white text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse-slow hover:animate-none"
            >
              문의하기
            </a>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-zinc-400">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-24 px-10 md:hidden flex flex-col gap-8 justify-center items-center text-center"
          >
            <div className="flex flex-col gap-8 text-3xl font-bold">
              <a href="#hero" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">H O M E</a>
              <a href="#properties" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">매물검색</a>
              <a href="#guide" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">가이드</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">회사소개</a>
              <Link to="/recruitment" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">채용 정보</Link>
              {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-electric-blue">대시보드</Link>}
            </div>
            <a 
              href="https://pf.kakao.com/_TSvgxb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="blue-glow-btn w-full max-w-xs py-4 text-sm flex items-center justify-center font-bold text-white shadow-xl"
            >
              문의하기
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="hero" className="relative h-[80vh] min-h-[700px] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div 
          className="absolute inset-0 z-0 bg-zinc-950"
          animate={{ x: mousePosition.x, y: mousePosition.y }}
          transition={{ type: "spring", damping: 30, stiffness: 100 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2670&auto=format&fit=crop" 
            alt="Osaka Umeda Business District" 
            className="w-[115%] h-[115%] object-cover -translate-x-[7%] -translate-y-[7%] opacity-70 scale-110"
          />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="relative z-20 px-10"
        >
          <div className="mt-10 mb-8 backdrop-blur-md bg-blue-600/30 border border-blue-400/30 text-white py-4 px-10 text-xl md:text-2xl font-bold tracking-tight inline-block mx-auto rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            현재 오사카J부동산에서 <span className="text-yellow-300 underline underline-offset-8 decoration-yellow-400/50 decoration-2">{consultationCount}명</span>이 상담 받고 계세요 ❤️
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter leading-tight drop-shadow-2xl text-white">
            오사카 최고의 매물을 <br />
            <span className="text-gradient">찾으시나요?</span>
          </h1>
          <p className="text-white max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-12 drop-shadow-lg">
            난바, 우메다 등 주요 거점의 <span className="font-bold text-electric-blue">신축 맨션</span>부터 <span className="font-bold text-electric-blue">수익형 빌딩</span>까지, <br />
            오사카 거주 한국인 및 투자자를 위한 맞춤형 럭셔리 컨설팅을 제공합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#properties" className="blue-glow-btn px-12 py-5 flex items-center justify-center gap-2 text-lg">
              매물 리스트 <ArrowRight size={20} />
            </a>
            <a href="#about" className="bg-white text-zinc-900 px-12 py-5 rounded-full font-bold hover:bg-zinc-100 transition-all text-sm tracking-[0.2em] uppercase shadow-xl flex items-center justify-center">
              회사 소개
            </a>
          </div>
        </motion.div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="py-24 px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-10">
            <div>
              <div className="text-electric-blue text-xs font-bold uppercase tracking-[0.3em] mb-4">Properties</div>
              <h2 className="text-4xl font-bold tracking-tighter text-zinc-900">추천 프리미엄 매물</h2>
              <p className="text-[11px] text-zinc-500 font-medium mt-2 leading-relaxed">
                ※ 실시간 공실/만실 매물 상황은 무조건 문의바랍니다.
              </p>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar w-full md:w-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                    activeCategory === cat.id 
                    ? 'bg-electric-blue text-white border-electric-blue shadow-lg shadow-blue-500/20' 
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
             <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-electric-blue" size={40} />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.length > 0 ? (
                properties.map((prop, index) => (
                  <motion.div
                    key={prop.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="card-luxury group"
                  >
                    <div className="relative h-48 overflow-hidden bg-zinc-800">
                      <img 
                        src={prop.images[0] || 'https://via.placeholder.com/800x480?text=Premium+Listing'} 
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute top-4 left-4 px-2 py-1 bg-electric-blue text-[10px] font-bold rounded uppercase tracking-wider text-white">
                        {CATEGORIES.find(c => c.id === prop.type)?.label}
                      </span>
                      {prop.isFeatured && (
                        <div className="absolute top-4 right-4 bg-emerald-600 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest text-white">
                          FEATURED
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 bg-white flex flex-col flex-grow">
                      <div className="mb-6">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">{prop.location}</p>
                        <h3 className="text-xl font-bold tracking-tight text-zinc-900 leading-snug h-[3.5rem] line-clamp-2">
                          {prop.title}
                        </h3>
                      </div>

                      <div className="flex justify-between items-end mb-6 pt-4 border-t border-zinc-100">
                        <span className="text-2xl font-bold tracking-tighter text-zinc-900 whitespace-pre-wrap">{prop.price}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">상담 문의</span>
                      </div>
                      
                      <div className="flex gap-2 mb-8 flex-wrap">
                        {prop.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-50 rounded text-[10px] text-zinc-500 font-bold border border-zinc-100 uppercase tracking-tighter">
                                {f}
                            </span>
                        ))}
                      </div>
                      
                      <Link 
                        to={`/property/${prop.id}`}
                        className="w-full py-4 bg-zinc-950 text-white text-[10px] font-bold tracking-[0.2em] uppercase transition-all rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                      >
                        매물 정보 더보기 <ChevronRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-24 text-zinc-500 text-sm tracking-widest uppercase bg-zinc-900/20 rounded-3xl border border-white/5">
                  해당 카테고리에 등록된 매물이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Area Guide Section */}
      <section id="guide" className="py-24 px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="tag-blue mb-4">Osaka Area Guide</div>
            <h2 className="text-4xl font-bold tracking-tighter text-zinc-900">오사카 지역 가이드</h2>
            <div className="w-12 h-1 bg-electric-blue mt-6" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-light">
            <div className="group bg-slate-50 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
               <div className="h-48 overflow-hidden">
                  <img 
                    src="https://i.namu.wiki/i/h972-p_G-i13DqN13Ulh4ktKLuwmaDrKsUCff62Ye7fstKQMlGTL9BK2K6rbqyJdutM7FWnvollhRsUDRVLGDr0NXsQpiOZQYraAfmzXkk_jl_kGpf1Vocoy2xFtfB9QHtZ9PR2shhdDiDxiY6jAZF47AzTgRsCTO7qZJSfX8Cs.webp" 
                    alt="난바 & 도톤보리" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
               </div>
               <div className="p-8 flex-grow">
                  <h3 className="text-xl font-bold mb-4 text-electric-blue">난바 & 도톤보리</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm mb-6">오사카의 중심지이자 여행객과 활기로 넘치는 지역입니다. 다양한 직업군이 선호하며 주거와 상권이 완벽하게 조화된 지역입니다.</p>
                  <Link to="/namba-guide" className="inline-flex items-center gap-2 bg-electric-blue text-white px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-colors">
                     추천매물 바로가기 <ArrowRight size={14} />
                  </Link>
               </div>
            </div>
            <div className="group bg-slate-50 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
               <div className="h-48 overflow-hidden">
                  <img 
                    src="https://i.namu.wiki/i/h972-p_G-i13DqN13Ulh4iQeDTIfbpYrTc3vkDRCGSdcB5dxNKqmpo5Yd6-MigBNaLATwqPSgqh7RuEVsut8r1WPHdMKfuYSa-FImQpLJBREdSeYO_-ts72oAkEgRk3hv4f9GUOnb5tA4tuIt6SDEPoq4eYi9RIf0MN6zxdT-3U.webp" 
                    alt="우메다 & 키타구" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
               </div>
               <div className="p-8 flex-grow">
                  <h3 className="text-xl font-bold mb-4 text-electric-blue">우메다 & 키타구</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm mb-6">오사카의 비즈니스 중심지로, 현대적인 오피스와 고급 아파트가 밀집해 있습니다. 교통의 요지이며 세련된 도시 생활을 원하시는 분들께 추천합니다.</p>
                  <button className="inline-flex items-center gap-2 bg-zinc-200 text-zinc-500 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-not-allowed">
                     준비 중
                  </button>
               </div>
            </div>
          </div>
        </div>
      </section>

       {/* About Us Section */}
      <section id="about" className="py-24 px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-1">
              <div className="tag-blue mb-4">About Us</div>
              <h2 className="text-4xl font-bold tracking-tighter mb-8 leading-tight text-zinc-900">
                <a href="https://legalj.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                  行政書士Legal_ J office
                </a><br />
                & 오사카J부동산
              </h2>
              <p className="text-zinc-600 leading-relaxed mb-6 font-light">
                저희는 오사카 지역 전문 부동산으로서, 단순한 매물 소개를 넘어 고객님의 일본 정착과 투자의 성공을 위한 모든 행정적/법률적 지원을 아우르는 토탈 솔루션을 제공합니다.
              </p>
              <p className="text-zinc-600 leading-relaxed font-light">
                정직과 신뢰는 저희 서비스의 핵심 가치입니다. 모든 거래 단계에서 투명성을 유지하며, 한국인 고객님들의 입장에서 가장 유리한 조건의 매칭을 약속드립니다.
              </p>
            </div>
            
            <div className="lg:col-span-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <img 
                  src="https://legalj.jp/wp-content/uploads/2025/02/Photo_25-02-05-10-38-56.243.jpg" 
                  alt="Legal J Office" 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>

            <div className="lg:col-span-1 bg-white p-10 rounded-3xl border border-zinc-200 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
               <div className="absolute top-0 right-0 w-32 h-32 bg-electric-blue/5 rounded-full blur-[60px]" />
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-electric-blue flex items-center justify-center rounded-lg font-bold text-xl text-white shadow-lg shadow-blue-500/20">J</div>
                    <span className="text-xl font-bold text-zinc-900">오사카 J 브랜드 철학</span>
                  </div>
                  <ul className="space-y-4 text-sm text-zinc-600">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-electric-blue shrink-0" /> <span className="font-medium">신뢰 중심의 정직한 거래</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-electric-blue shrink-0" /> <span className="font-medium">한국어 완벽 대응 및 행정 지원</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-electric-blue shrink-0" /> <span className="font-medium">오사카 전 지역 데이터베이스 확보</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-electric-blue shrink-0" /> <span className="font-medium">행정서사 & 택지건물거래사 자격증 보유</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-electric-blue shrink-0" /> <span className="font-medium">부동산 전문 전담팀 운영</span>
                    </li>
                  </ul>
               </div>
            </div>
          </div>

          {/* Certifications Gallery */}
          <div className="mt-24 pt-16 border-t border-zinc-200">
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold tracking-[0.3em] text-blue-600 uppercase">Professional License</span>
              <h3 className="text-2xl font-bold mt-2 text-zinc-900">공인 자격 및 전문 라이선스</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {[
                { url: "acc7ca0397ca9757de2dadff837859e3.png", label: "行政書士試験" },
                { url: "c53af1f0cba156493843f10955cbcc3f.png", label: "外国人雇用管理主任者" },
                { url: "4a29f6991741fa243bc2f110898e41a4.png", label: "宅地建物取引士" },
                { url: "3bf5e82c96385b7906d3ccf13505c5c4.png", label: "敷金診断士" }
              ].map((cert, index) => (
                <div key={index} className="flex flex-col items-center group">
                  <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm mb-4 transition-all duration-500 group-hover:shadow-xl group-hover:border-blue-200 group-hover:-translate-y-1">
                    <img 
                      src={`https://legalj.jp/wp-content/uploads/2025/01/${cert.url}`} 
                      alt={cert.label} 
                      className="h-64 md:h-80 w-auto object-contain transition-all duration-500"
                    />
                  </div>
                  <span className="text-[12px] font-bold text-zinc-500 tracking-tight text-center group-hover:text-blue-600 transition-colors">
                    {cert.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats Section */}
      <section className="px-10 py-10 bg-electric-blue flex items-center justify-center">
        <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-12 flex-wrap justify-center">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Years of Trust</span>
              <span className="text-3xl font-bold tracking-tighter">10+</span>
            </div>
            <div className="flex flex-col border-l border-white/20 pl-12">
              <span className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Properties Managed</span>
              <span className="text-3xl font-bold tracking-tighter">1,240+</span>
            </div>
            <div className="flex flex-col border-l border-white/20 pl-12">
              <span className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Customer Rating</span>
              <span className="text-3xl font-bold tracking-tighter">4.9 / 5.0</span>
            </div>
          </div>
          
          <div className="flex gap-6 items-center">
            <div className="hidden lg:flex flex-col items-end">
              <p className="text-sm font-bold">지금 바로 전문가와 상담하세요</p>
              <p className="text-xs opacity-80">카카오톡 ID: jhome1749</p>
            </div>
            <div className="flex gap-3">
                <a 
                  href="https://pf.kakao.com/_TSvgxb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                >
                   <MessageCircle className="w-6 h-6 text-yellow-400" />
                </a>
                <a 
                  href="https://line.me/R/ti/p/@845immxy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                >
                   <MessageSquare className="w-6 h-6 text-emerald-500" />
                </a>
                <a 
                  href="https://www.instagram.com/oosaka_j/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                >
                   <Instagram className="w-6 h-6 text-pink-500" />
                </a>
                <a 
                  href="https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=fyvJj_s_8MHE-l7W" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                >
                   <Youtube className="w-6 h-6 text-red-600" />
                </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 py-20 px-10 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-20">
            <div>
              <div className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-900">
                <div className="w-6 h-6 bg-electric-blue rounded-xs flex items-center justify-center text-sm text-white">J</div>
                <a href="https://legalj.jp/" target="_blank" rel="noopener noreferrer" className="tracking-tighter hover:text-blue-600 transition-colors">
                  行政書士Legal_ J office
                </a>
                <span className="tracking-tighter"> & 오사카J부동산</span>
              </div>
              <p className="text-zinc-600 max-w-md leading-relaxed text-sm font-medium">
                오사카 한인 경제의 중심에서 정직과 신뢰를 바탕으로 한 <br />
                부동산 거래 문화를 선도합니다. <br />
                거주용 맨션부터 상가 매매까지 원스톱 토탈 리얼티 서비스를 경험하세요.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-4">Office Address</h4>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    본사주소:〒553-0003<br />
                    大阪府大阪市福島区福島7丁目20-18<br />
                    ｼﾃｨﾀﾜｰ西梅田4203号
                  </p>
                </div>
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Representative</h4>
                    <p className="text-zinc-600 text-sm">070‐2805‐1749</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Official Email</h4>
                    <p className="text-zinc-600 text-sm">visa.legal.j@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-[0.3em] flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div className="normal-case tracking-normal text-zinc-400">
              오사카J부동산은 Legal_J Office에서 운영하는 일본 부동산 서비스입니다.
            </div>
            {isAdmin && <Link to="/admin" className="text-electric-blue font-bold">ADMIN ACCESS</Link>}
          </div>
        </div>
      </footer>

      {/* Floating Social Sidebar */}
      <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        <motion.a 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          href="https://pf.kakao.com/_TSvgxb" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 md:w-16 md:h-16 bg-[#FEE500] rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(254,229,0,0.3)] hover:scale-110 transition-transform group relative border-4 border-white"
        >
          <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-[#3C1E1E]" />
          <span className="absolute right-20 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            카카오톡 상담
          </span>
        </motion.a>
        
        <motion.a 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          href="https://line.me/R/ti/p/@845immxy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 md:w-16 md:h-16 bg-[#06C755] rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(6,199,85,0.3)] hover:scale-110 transition-transform group relative border-4 border-white"
        >
          <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
          <span className="absolute right-20 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            라인 상담
          </span>
        </motion.a>

        <motion.a 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          href="https://www.instagram.com/oosaka_j/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-[#f9ce67] via-[#f07030] to-[#833ab4] rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(131,58,180,0.3)] hover:scale-110 transition-transform group relative border-4 border-white"
        >
          <Instagram className="w-6 h-6 md:w-8 md:h-8 text-white" />
          <span className="absolute right-20 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            인스타그램
          </span>
        </motion.a>

        <motion.a 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          href="https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=fyvJj_s_8MHE-l7W" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 md:w-16 md:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(220,38,38,0.3)] hover:scale-110 transition-transform group relative border-4 border-white"
        >
          <Youtube className="w-6 h-6 md:w-8 md:h-8 text-white" />
          <span className="absolute right-20 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            유튜브 채널
          </span>
        </motion.a>
      </div>
    </div>
  );
}
