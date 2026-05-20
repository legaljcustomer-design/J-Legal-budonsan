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
  ChevronLeft,
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
  { id: 'OneRoom', label: '주거용 맨션', icon: Building2 },
  { id: 'Family', label: '타워맨션', icon: HomeIcon },
  { id: 'Office', label: '상가/사무실', icon: Briefcase },
  { id: 'Investment', label: '수익형 부동산', icon: TrendingUp },
];

interface Review {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

export default function Home({ isAdmin }: { isAdmin: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [osakaInfos, setOsakaInfos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultationCount, setConsultationCount] = useState(134);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);

  const normalizeImageSrc = (src: string | undefined) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:')) {
      return src;
    }
    return `/${src}`;
  };

  const [settings, setSettings] = useState({
    heroTitle: '오사카 최고의 매물을 찾으시나요?',
    heroSubtitle: '난바, 우메다 등 주요 거점의 신축 맨션부터 수익형 빌딩까지, 오사카 거주 한국인 및 투자자를 위한 맞춤형 럭셔리 컨설팅을 제공합니다.',
    heroImage: '',
    heroTitleFontSizeMobile: 60,
    heroTitleFontSizeDesktop: 96,
    heroTitleFontFile: '',
    consultationBaseCount: 102,
    kakaoId: 'oosakaj',
    kakaoUrl: 'https://pf.kakao.com/_TSvgxb',
    lineId: '@845immxy',
    instagramId: 'oosaka_j',
    instagramUrl: '',
    youtubeUrl: 'https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=Fvg2lwsd-_UGjgSx'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await firebaseService.getSettings();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const jstNow = new Date(utc + (jstOffset * 60000));
      
      const startOfDay = new Date(jstNow);
      startOfDay.setHours(0, 0, 0, 0);
      
      const minutesPassed = Math.floor((jstNow.getTime() - startOfDay.getTime()) / 60000);
      setConsultationCount(settings.consultationBaseCount + Math.floor(minutesPassed / 12));
    };

    updateCount();
    const interval = setInterval(updateCount, 60000);
    return () => clearInterval(interval);
  }, [settings.consultationBaseCount]);

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
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [reviewData, osakaData] = await Promise.all([
          firebaseService.getReviews(),
          firebaseService.getOsakaInfos()
        ]);
        setReviews(reviewData);
        setOsakaInfos(osakaData);
      } catch (error) {
        console.error("Error fetching initial static data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propData = await firebaseService.getProperties(activeCategory);
        setProperties(propData);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };
    fetchProperties();
  }, [activeCategory]);

  const heroTitleFontSizeMobile = Number(settings.heroTitleFontSizeMobile) || 60;
  const heroTitleFontSizeDesktop = Number(settings.heroTitleFontSizeDesktop) || 96;
  const heroTitleFontSrc = settings.heroTitleFontFile?.trim()
    ? normalizeImageSrc(settings.heroTitleFontFile.trim())
    : '';

  return (
    <div className="min-h-screen bg-luxury-black text-zinc-900 font-sans overflow-x-hidden">
      <style>{`
        ${
          heroTitleFontSrc
            ? `
              @font-face {
                font-family: 'HeroTitleCustomFont';
                src: url('${heroTitleFontSrc}');
                font-display: swap;
              }
            `
            : ''
        }

        .hero-title-dynamic {
          font-size: ${heroTitleFontSizeMobile}px;
          ${
            heroTitleFontSrc
              ? "font-family: 'HeroTitleCustomFont', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
              : ''
          }
        }

        @media (min-width: 768px) {
          .hero-title-dynamic {
            font-size: ${heroTitleFontSizeDesktop}px;
          }
        }
      `}</style>

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
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <a href="#hero" className="text-zinc-900 border-b-2 border-electric-blue pb-1 transition-all font-bold">홈</a>
            <a href="#properties" className="hover:text-electric-blue transition-colors">매물검색</a>
            <a href="#guide" className="hover:text-electric-blue transition-colors">고객후기</a>
            <a href="#about" className="hover:text-electric-blue transition-colors">회사소개</a>
            <Link to="/recruitment" className="hover:text-electric-blue transition-colors">채용 정보</Link>
            <Link to="/admin" className="hover:text-electric-blue transition-colors flex items-center gap-1.5 group/admin">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover/admin:bg-electric-blue transition-colors mb-[1px]" />
              관리자전용
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
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
              <a href="#guide" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">고객후기</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">회사소개</a>
              <Link to="/recruitment" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">채용 정보</Link>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-electric-blue">관리자전용</Link>
            </div>
            <a 
              href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
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
        <motion.div 
          className="absolute inset-0 z-0 bg-zinc-950"
          animate={{ x: mousePosition.x, y: mousePosition.y }}
          transition={{ type: "spring", damping: 30, stiffness: 100 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 z-10" />
          <img 
            src={(settings.heroImage && settings.heroImage.trim()) ? normalizeImageSrc(settings.heroImage.trim()) : "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2670&auto=format&fit=crop"} 
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
          <h1 className="hero-title-dynamic font-bold mb-8 tracking-tighter leading-tight drop-shadow-2xl text-white">
            {settings.heroTitle.split('\n').map((line, i) => (
              <React.Fragment key={i}>{line}<br /></React.Fragment>
            ))}
          </h1>
          <p className="text-white max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-12 drop-shadow-lg whitespace-pre-line">
            {settings.heroSubtitle}
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

      {/* 이하 나머지 기존 코드 동일 */}
      {/* Properties Section */}
      <section id="properties" className="py-24 px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-10">
            <div>
              <div className="text-electric-blue text-xs font-bold uppercase tracking-[0.3em] mb-4">Properties</div>
              <h2 className="text-4xl font-bold tracking-tighter text-zinc-900">오사카 추천 프리미엄 매물</h2>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.length > 0 ? (
                  properties.slice(0, 6).map((prop, index) => (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="card-luxury group h-full"
                    >
                      <div className="relative h-52 overflow-hidden bg-zinc-800">
                        <img 
                          src={normalizeImageSrc(prop.images[0]) || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute top-4 left-4 px-2 py-1 bg-electric-blue text-[10px] font-bold rounded uppercase tracking-wider text-white">
                          {prop.type === 'OneRoom' ? '주거용 맨션' : 
                          prop.type === 'TwoRoom' ? '주거용 맨션(투룸형)' : 
                          CATEGORIES.find(c => c.id === prop.type)?.label || prop.type}
                        </span>
                        {prop.isFeatured && (
                          <div className="absolute top-4 right-4 bg-emerald-600 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest text-white">
                            FEATURED
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 bg-white flex flex-col h-[calc(100%-13rem)]">
                        <div className="mb-2">
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">{prop.location}</p>
                          <h3 className="text-base font-bold tracking-tight text-zinc-900 leading-tight line-clamp-2">
                            {prop.title}
                          </h3>
                        </div>

                        <div className="flex flex-col mb-6 pt-3 border-t border-zinc-100">
                          <span className="text-2xl font-black tracking-tighter text-zinc-900 whitespace-pre-wrap leading-tight">
                            {prop.price.replace(/상담\s*문의/g, '').trim()}
                          </span>
                        </div>
                        
                        <div className="mt-auto">
                          <Link 
                            to={`/property/${prop.id}`}
                            className="w-full py-4 bg-zinc-950 text-white text-[10px] font-bold tracking-[0.2em] uppercase transition-all rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                          >
                            매물 정보 더보기 <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-24 text-zinc-500 text-sm tracking-widest uppercase bg-zinc-900/20 rounded-3xl border border-white/5">
                    해당 카테고리에 등록된 매물이 없습니다.
                  </div>
                )}
              </div>

              <div className="mt-16 flex justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/properties"
                    className="px-12 py-4 rounded-full bg-zinc-950 text-white text-sm font-bold tracking-widest hover:bg-electric-blue transition-all flex items-center gap-2 shadow-xl"
                  >
                    매물 더보기 <ChevronRight size={14} />
                  </Link>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 기존 나머지 섹션들은 사용자님의 현재 코드와 동일하게 유지됩니다. */}
    </div>
  );
}
