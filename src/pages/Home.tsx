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
import { Link, useNavigate } from 'react-router-dom';
import siteConfig from '../data/siteConfig.json';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: HomeIcon },
  { id: 'OneRoom', label: '주거용 맨션', icon: Building2 },
  { id: 'Family', label: '타워맨션', icon: HomeIcon },
  { id: 'Office', label: '상가/사무실', icon: Briefcase },
  { id: 'Investment', label: '수익형 부동산', icon: TrendingUp },
];

type PrefectureFilter = 'all' | 'osaka' | 'kyoto' | 'hyogo';

const PREFECTURE_OPTIONS: { id: PrefectureFilter; label: string; english: string }[] = [
  { id: 'all', label: '전체', english: 'ALL' },
  { id: 'osaka', label: '오사카', english: 'OSAKA' },
  { id: 'kyoto', label: '교토', english: 'KYOTO' },
  { id: 'hyogo', label: '효고', english: 'HYOGO' },
];

const PREFECTURE_LABELS: Record<'osaka' | 'kyoto' | 'hyogo', string> = {
  osaka: '오사카',
  kyoto: '교토',
  hyogo: '효고',
};

const TRUST_ITEMS = [
  {
    title: '전문성',
    icon: '/trust-icons/전문성.png',
    iconAlt: '전문성 아이콘',
    headline: (
      <>
        택지건물거래사, 행정서사,<br className="hidden md:block" />
        시키킹진단사 등
      </>
    ),
    body: '약 20개가 넘는 자격을 보유한 전문가가 중개하고 있습니다.'
  },
  {
    title: '성실성',
    icon: '/trust-icons/성실성.png',
    iconAlt: '성실성 아이콘',
    headline: (
      <>
        온라인 뿐만 아니라,<br />
        오프라인에서도 언제든 상담과 내견이 가능합니다.
      </>
    ),
    body: '※ 사전예약必'
  },
  {
    title: '신뢰성',
    icon: '/trust-icons/신뢰성.png',
    iconAlt: '신뢰성 아이콘',
    headline: (
      <>
        후기와 리뷰는<br className="hidden md:block" />
        거짓말을 하지 않습니다.
      </>
    ),
    body: '구글 평점 5.0점의 이유가 분명 존재합니다.'
  }
];

interface Review {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

const DEFAULT_SETTINGS = {
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
};

export default function Home({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [osakaInfos, setOsakaInfos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPrefecture, setSelectedPrefecture] = useState<PrefectureFilter>('all');
  const [stationQuery, setStationQuery] = useState('');
  const [lineQuery, setLineQuery] = useState('');
  const [keywordQuery, setKeywordQuery] = useState('');

  const settings = {
    ...DEFAULT_SETTINGS,
    ...siteConfig
  };

  const [consultationCount, setConsultationCount] = useState(
    Number(settings.consultationBaseCount) || 134
  );

  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);

  const normalizeImageSrc = (src: string | undefined) => {
    if (!src) return '';
    if (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('/') ||
      src.startsWith('data:')
    ) {
      return src;
    }
    return `/${src}`;
  };

  const normalizeSearchText = (value: unknown) => {
    return String(value ?? '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .trim();
  };

  const moveToSearchResults = () => {
    const params = new URLSearchParams();

    if (selectedPrefecture !== 'all') {
      params.set('prefecture', selectedPrefecture);
    }

    if (stationQuery.trim()) {
      params.set('station', stationQuery.trim());
    }

    if (lineQuery.trim()) {
      params.set('line', lineQuery.trim());
    }

    if (keywordQuery.trim()) {
      params.set('keyword', keywordQuery.trim());
    }

    const queryString = params.toString();
    navigate(queryString ? `/properties?${queryString}` : '/properties');
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      moveToSearchResults();
    }
  };

  useEffect(() => {
    const updateCount = () => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const jstNow = new Date(utc + (jstOffset * 60000));
      
      const startOfDay = new Date(jstNow);
      startOfDay.setHours(0, 0, 0, 0);
      
      const minutesPassed = Math.floor((jstNow.getTime() - startOfDay.getTime()) / 60000);
      setConsultationCount((Number(settings.consultationBaseCount) || 0) + Math.floor(minutesPassed / 12));
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

  const heroImageSrc =
    settings.heroImage && settings.heroImage.trim()
      ? normalizeImageSrc(settings.heroImage.trim())
      : 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2670&auto=format&fit=crop';

  const hasSearchFilters =
    selectedPrefecture !== 'all' ||
    stationQuery.trim().length > 0 ||
    lineQuery.trim().length > 0 ||
    keywordQuery.trim().length > 0;

  const clearSearchFilters = () => {
    setSelectedPrefecture('all');
    setStationQuery('');
    setLineQuery('');
    setKeywordQuery('');
  };

  const filteredProperties = properties.filter((prop) => {
    const prefectureMatch =
      selectedPrefecture === 'all' ||
      prop.prefecture === selectedPrefecture;

    const stationNeedle = normalizeSearchText(stationQuery);
    const stationHaystack = normalizeSearchText([
      prop.nearestStation,
      prop.location,
      prop.title,
    ].filter(Boolean).join(' '));

    const stationMatch =
      !stationNeedle ||
      stationHaystack.includes(stationNeedle);

    const lineNeedle = normalizeSearchText(lineQuery);
    const lineHaystack = normalizeSearchText([
      prop.nearestLine,
      prop.title,
      prop.description,
    ].filter(Boolean).join(' '));

    const lineMatch =
      !lineNeedle ||
      lineHaystack.includes(lineNeedle);

    const keywordNeedle = normalizeSearchText(keywordQuery);
    const prefectureLabel =
      prop.prefecture
        ? PREFECTURE_LABELS[prop.prefecture]
        : '';

    const keywordHaystack = normalizeSearchText([
      prop.title,
      prop.price,
      prop.location,
      prop.description,
      prop.nearestStation,
      prop.nearestLine,
      prop.floorPlan,
      prop.area,
      prop.mapAddress,
      prop.construction,
      prop.completionYear,
      Array.isArray(prop.features) ? prop.features.join(' ') : '',
      prefectureLabel,
      prop.type,
    ].filter(Boolean).join(' '));

    const keywordMatch =
      !keywordNeedle ||
      keywordHaystack.includes(keywordNeedle);

    return prefectureMatch && stationMatch && lineMatch && keywordMatch;
  });

  const osakaInfoFallbacks = [
    {
      title: "일본 거주 초기 설정 가이드",
      desc: "주소지 등록부터 건강보험 가입까지, 정착의 첫걸음을 도와드립니다.",
      tag: "생활 정보",
      img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2694&auto=format&fit=crop",
      instagramUrl: settings.instagramUrl || `https://www.instagram.com/${settings.instagramId?.replace('@', '')}/`
    },
    {
      title: "수도/가스/전기 신청 방법",
      desc: "이사 후 가장 먼저 해야 할 라이프라인 신청 절차를 정리했습니다.",
      tag: "인프라",
      img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2670&auto=format&fit=crop",
      instagramUrl: settings.instagramUrl || `https://www.instagram.com/${settings.instagramId?.replace('@', '')}/`
    },
    {
      title: "오사카 지하철 노선 완전 정복",
      desc: "미도스지선, 다니마치선 등 주요 노선 이용 팁과 교통카드 정보.",
      tag: "교통",
      img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2670&auto=format&fit=crop",
      instagramUrl: settings.instagramUrl || `https://www.instagram.com/${settings.instagramId?.replace('@', '')}/`
    }
  ];

  const visibleOsakaInfos = osakaInfos.length > 0 ? osakaInfos : osakaInfoFallbacks;

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
          font-size: clamp(34px, 10.5vw, ${heroTitleFontSizeMobile}px);
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
      <nav className="fixed top-0 w-full z-50 glass-morphism h-16 md:h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-10 flex justify-between items-center">
          <div className="flex flex-col min-w-0">
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img 
                src="https://yt3.googleusercontent.com/ZNWF_L7kuC_cHkMdodV_-R27ac-oQModzDEdDhAm6h-qFoA9-mLjbJMi05MbA66tU8U7zqVN=s160-c-k-c0x00ffffff-no-rj" 
                alt="J Logo" 
                className="w-7 h-7 md:w-8 md:h-8 rounded-sm object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="text-base md:text-xl font-bold tracking-tight text-zinc-900 truncate">오사카J부동산</span>
            </Link>
            <a 
              href="https://legalj.jp/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hidden md:flex text-xl font-bold tracking-tight text-zinc-900 hover:text-blue-600 transition-colors items-center gap-2 mt-2"
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

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <a 
              href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex blue-glow-btn px-8 py-3 items-center justify-center text-white text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse-slow hover:animate-none"
            >
              문의하기
            </a>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-zinc-600 bg-white/60 border border-zinc-200 rounded-xl p-2">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-20 px-6 md:hidden flex flex-col gap-8 justify-center items-center text-center"
          >
            <div className="flex flex-col gap-6 text-2xl font-bold">
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
      <section id="hero" className="relative min-h-[620px] h-[82svh] md:h-[80vh] md:min-h-[700px] flex flex-col items-center justify-center text-center overflow-hidden px-4">
        <motion.div 
          className="absolute inset-0 z-0 bg-zinc-950"
          animate={{ x: mousePosition.x, y: mousePosition.y }}
          transition={{ type: "spring", damping: 30, stiffness: 100 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/85 z-10" />
          <img 
            src={heroImageSrc}
            alt="Osaka Umeda Business District" 
            className="w-full h-full md:w-[115%] md:h-[115%] object-cover md:-translate-x-[7%] md:-translate-y-[7%] opacity-70 md:scale-110"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 px-2 md:px-10 w-full max-w-6xl mx-auto"
        >
          <div className="mt-12 md:mt-10 mb-6 md:mb-8 backdrop-blur-md bg-blue-600/30 border border-blue-400/30 text-white py-3 md:py-4 px-4 md:px-10 text-sm md:text-2xl font-bold tracking-tight inline-block mx-auto rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)] max-w-[92vw]">
            현재 오사카J부동산에서 <span className="text-yellow-300 underline underline-offset-4 md:underline-offset-8 decoration-yellow-400/50 decoration-2">{consultationCount}명</span>이 상담 받고 계세요 ❤️
          </div>
          <h1 className="hero-title-dynamic font-bold mb-6 md:mb-8 tracking-tighter leading-[1.08] md:leading-tight drop-shadow-2xl text-white break-keep">
            {settings.heroTitle.split('\n').map((line, i) => (
              <React.Fragment key={i}>{line}<br /></React.Fragment>
            ))}
          </h1>
          <p className="text-white max-w-2xl mx-auto text-sm md:text-xl leading-relaxed mb-8 md:mb-12 drop-shadow-lg whitespace-pre-line px-2">
            {settings.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
            <a href="#properties" className="blue-glow-btn w-full max-w-[260px] sm:w-auto px-8 md:px-12 py-4 md:py-5 flex items-center justify-center gap-2 text-sm md:text-lg">
              매물 리스트 <ArrowRight size={18} />
            </a>
            <a href="#about" className="w-full max-w-[260px] sm:w-auto bg-white text-zinc-900 px-8 md:px-12 py-4 md:py-5 rounded-full font-bold hover:bg-zinc-100 transition-all text-xs md:text-sm tracking-[0.16em] md:tracking-[0.2em] uppercase shadow-xl flex items-center justify-center">
              회사 소개
            </a>
          </div>
        </motion.div>
      </section>

      {/* Property Search Hub */}
      <section id="property-search" className="bg-slate-50 px-4 md:px-10 pt-10 md:pt-14 pb-10 md:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[26px] md:rounded-[36px] border border-zinc-200 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-5 md:p-10">
                <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] md:text-[11px] font-black tracking-[0.18em] md:tracking-[0.2em] uppercase mb-4 md:mb-5">
                  Smart Property Search
                </div>

                <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-zinc-900 leading-tight mb-3 md:mb-4 break-keep">
                  원하는 지역과 조건으로<br className="hidden md:block" />
                  매물을 빠르게 찾아보세요
                </h2>

                <p className="text-sm md:text-base text-zinc-500 leading-relaxed mb-6 md:mb-8">
                  오사카·교토·효고 지역을 고르고, 역명과 노선명, 키워드까지 조합해
                  필요한 매물만 빠르게 검색할 수 있습니다.
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] md:tracking-[0.25em] text-zinc-400 mb-3">
                      지역으로 찾기
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                      {PREFECTURE_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedPrefecture(option.id)}
                          className={`rounded-2xl border px-4 py-3 md:py-4 text-left transition-all ${
                            selectedPrefecture === option.id
                              ? 'bg-electric-blue border-electric-blue text-white shadow-lg shadow-blue-500/20'
                              : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <span className="block text-sm font-black">{option.label}</span>
                          <span className={`block text-[9px] md:text-[10px] tracking-[0.18em] md:tracking-[0.2em] font-bold mt-1 ${
                            selectedPrefecture === option.id ? 'text-blue-100' : 'text-zinc-400'
                          }`}>
                            {option.english}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.22em] md:tracking-[0.25em] text-zinc-400 mb-2 md:mb-3">
                        역명으로 찾기
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 md:py-4 focus-within:border-blue-400 focus-within:bg-white transition-all">
                        <MapPin size={18} className="text-blue-600 shrink-0" />
                        <input
                          value={stationQuery}
                          onChange={(e) => setStationQuery(e.target.value)}
                          onKeyDown={handleSearchEnter}
                          placeholder="예: 난바역, 우메다역"
                          className="w-full bg-transparent outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.22em] md:tracking-[0.25em] text-zinc-400 mb-2 md:mb-3">
                        노선으로 찾기
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 md:py-4 focus-within:border-blue-400 focus-within:bg-white transition-all">
                        <ChevronRight size={18} className="text-blue-600 shrink-0" />
                        <input
                          value={lineQuery}
                          onChange={(e) => setLineQuery(e.target.value)}
                          onKeyDown={handleSearchEnter}
                          placeholder="예: 미도스지선"
                          className="w-full bg-transparent outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[300px] md:min-h-[360px] lg:min-h-full bg-[#f7f1e7] border-t lg:border-t-0 lg:border-l border-zinc-100 overflow-hidden">
                <svg viewBox="0 0 640 420" className="absolute inset-0 w-full h-full">
                  <rect width="640" height="420" fill="#f7f1e7" />
                  <path
                    d="M0 50C85 24 155 32 228 65C279 88 316 83 376 54C432 26 538 27 640 68V0H0Z"
                    fill="#dbeafe"
                    opacity="0.75"
                  />
                  <path
                    d="M58 300C116 272 154 275 207 312C257 347 331 353 387 322C447 289 514 292 582 332C604 345 622 356 640 370V420H0V348C17 335 35 315 58 300Z"
                    fill="#dbeafe"
                    opacity="0.8"
                  />

                  <path
                    d="M92 132L174 90L284 111L302 176L250 241L155 252L82 200Z"
                    fill={selectedPrefecture === 'hyogo' ? '#bfdbfe' : '#dff3c4'}
                    stroke="#ffffff"
                    strokeWidth="6"
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedPrefecture('hyogo')}
                  />
                  <path
                    d="M286 88L414 58L530 124L496 218L377 226L318 172Z"
                    fill={selectedPrefecture === 'kyoto' ? '#bfdbfe' : '#d7efad'}
                    stroke="#ffffff"
                    strokeWidth="6"
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedPrefecture('kyoto')}
                  />
                  <path
                    d="M284 205L382 194L455 260L412 348L302 326L252 257Z"
                    fill={selectedPrefecture === 'osaka' ? '#bfdbfe' : '#cce89d'}
                    stroke="#ffffff"
                    strokeWidth="6"
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedPrefecture('osaka')}
                  />
                </svg>

                <button
                  type="button"
                  onClick={() => setSelectedPrefecture('hyogo')}
                  className={`absolute left-[28%] top-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full w-20 h-20 md:w-28 md:h-28 border-[4px] md:border-[6px] shadow-xl flex flex-col items-center justify-center transition-all ${
                    selectedPrefecture === 'hyogo'
                      ? 'bg-blue-600 border-blue-300 text-white scale-105'
                      : 'bg-white border-orange-300 text-zinc-800 hover:scale-105'
                  }`}
                >
                  <span className="text-lg md:text-2xl font-black leading-none">兵庫</span>
                  <span className={`text-[9px] md:text-xs tracking-[0.14em] md:tracking-[0.18em] mt-1 ${
                    selectedPrefecture === 'hyogo' ? 'text-blue-100' : 'text-zinc-500'
                  }`}>
                    HYOGO
                  </span>
                  <span className={`absolute top-full left-1/2 -translate-x-1/2 border-x-[11px] md:border-x-[16px] border-x-transparent border-t-[16px] md:border-t-[22px] ${
                    selectedPrefecture === 'hyogo' ? 'border-t-blue-600' : 'border-t-white'
                  }`} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPrefecture('kyoto')}
                  className={`absolute left-[64%] top-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full w-20 h-20 md:w-28 md:h-28 border-[4px] md:border-[6px] shadow-xl flex flex-col items-center justify-center transition-all ${
                    selectedPrefecture === 'kyoto'
                      ? 'bg-blue-600 border-blue-300 text-white scale-105'
                      : 'bg-white border-orange-300 text-zinc-800 hover:scale-105'
                  }`}
                >
                  <span className="text-lg md:text-2xl font-black leading-none">京都</span>
                  <span className={`text-[9px] md:text-xs tracking-[0.14em] md:tracking-[0.18em] mt-1 ${
                    selectedPrefecture === 'kyoto' ? 'text-blue-100' : 'text-zinc-500'
                  }`}>
                    KYOTO
                  </span>
                  <span className={`absolute top-full left-1/2 -translate-x-1/2 border-x-[11px] md:border-x-[16px] border-x-transparent border-t-[16px] md:border-t-[22px] ${
                    selectedPrefecture === 'kyoto' ? 'border-t-blue-600' : 'border-t-white'
                  }`} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPrefecture('osaka')}
                  className={`absolute left-[68%] top-[67%] -translate-x-1/2 -translate-y-1/2 rounded-full w-20 h-20 md:w-28 md:h-28 border-[4px] md:border-[6px] shadow-xl flex flex-col items-center justify-center transition-all ${
                    selectedPrefecture === 'osaka'
                      ? 'bg-blue-600 border-blue-300 text-white scale-105'
                      : 'bg-white border-orange-300 text-zinc-800 hover:scale-105'
                  }`}
                >
                  <span className="text-lg md:text-2xl font-black leading-none">大阪</span>
                  <span className={`text-[9px] md:text-xs tracking-[0.14em] md:tracking-[0.18em] mt-1 ${
                    selectedPrefecture === 'osaka' ? 'text-blue-100' : 'text-zinc-500'
                  }`}>
                    OSAKA
                  </span>
                  <span className={`absolute top-full left-1/2 -translate-x-1/2 border-x-[11px] md:border-x-[16px] border-x-transparent border-t-[16px] md:border-t-[22px] ${
                    selectedPrefecture === 'osaka' ? 'border-t-blue-600' : 'border-t-white'
                  }`} />
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-100 p-4 md:p-7 bg-zinc-50">
              <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:items-center">
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-3 md:gap-4 bg-white border border-zinc-200 rounded-[22px] md:rounded-[28px] px-4 md:px-5 py-3.5 md:py-4 focus-within:border-blue-400 transition-all shadow-sm">
                    <Search size={20} className="text-blue-600 shrink-0" />
                    <input
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      onKeyDown={handleSearchEnter}
                      placeholder="키워드 검색: 민박, 투자, 1LDK"
                      className="w-full bg-transparent outline-none text-sm md:text-base text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={moveToSearchResults}
                    className="w-full sm:w-auto px-8 py-4 rounded-[22px] md:rounded-[24px] bg-electric-blue text-white text-sm font-black tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <Search size={18} />
                    검색
                  </button>
                </div>

                <button
                  type="button"
                  onClick={clearSearchFilters}
                  className="w-full lg:w-auto px-7 py-4 rounded-[22px] md:rounded-[24px] border border-zinc-200 bg-white text-sm font-bold text-zinc-700 hover:bg-zinc-900 hover:text-white transition-all"
                >
                  검색조건 초기화
                </button>
              </div>

              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  지역, 역명, 노선, 키워드는 동시에 조합해서 검색할 수 있습니다.
                </p>

                <div className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600">
                  <span className="w-2 h-2 rounded-full bg-electric-blue shrink-0" />
                  {hasSearchFilters ? `현재 조건에 맞는 매물 ${filteredProperties.length}건` : `현재 표시 가능한 추천 매물 ${filteredProperties.length}건`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="pt-10 md:pt-12 pb-16 md:pb-24 px-4 md:px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6 md:gap-10">
            <div>
              <div className="text-electric-blue text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-3 md:mb-4">Properties</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-900 leading-tight">오사카 추천 프리미엄 매물</h2>
              <p className="text-[11px] text-zinc-500 font-medium mt-2 leading-relaxed">
                ※ 실시간 공실/만실 매물 상황은 무조건 문의바랍니다.
              </p>
              {hasSearchFilters && (
                <p className="text-sm text-blue-600 font-bold mt-4">
                  검색 조건이 적용되어 있습니다. 현재 {filteredProperties.length}건이 표시됩니다.
                </p>
              )}
            </div>
            
            <div className="flex overflow-x-auto gap-3 md:gap-4 pb-2 no-scrollbar w-full md:w-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 md:px-6 py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
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
            <div className="flex justify-center py-20 md:py-24">
              <Loader2 className="animate-spin text-electric-blue" size={40} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredProperties.length > 0 ? (
                  filteredProperties.slice(0, 6).map((prop, index) => (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      className="card-luxury group h-full"
                    >
                      <div className="relative h-48 md:h-52 overflow-hidden bg-zinc-800">
                        <img 
                          src={normalizeImageSrc(prop.images?.[0]) || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
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
                      
                      <div className="p-5 bg-white flex flex-col min-h-[250px]">
                        <div className="mb-2">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {prop.prefecture && (
                              <span className="text-[9px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-bold">
                                {PREFECTURE_LABELS[prop.prefecture]}
                              </span>
                            )}
                            {prop.nearestStation && (
                              <span className="text-[9px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 font-bold">
                                {prop.nearestStation}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">{prop.location}</p>
                          <h3 className="text-base font-bold tracking-tight text-zinc-900 leading-tight line-clamp-2">
                            {prop.title}
                          </h3>
                        </div>

                        <div className="flex flex-col mb-5 md:mb-6 pt-3 border-t border-zinc-100">
                          <span className="text-xl md:text-2xl font-black tracking-tighter text-zinc-900 whitespace-pre-wrap leading-tight">
                            {prop.price.replace(/상담\s*문의/g, '').trim()}
                          </span>
                        </div>
                        
                        <div className="mt-auto">
                          <Link 
                            to={`/property/${prop.id}`}
                            className="w-full py-4 bg-zinc-950 text-white text-[10px] font-bold tracking-[0.18em] md:tracking-[0.2em] uppercase transition-all rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                          >
                            매물 정보 더보기 <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 md:py-24 px-6 text-zinc-500 text-sm tracking-widest uppercase bg-white rounded-3xl border border-zinc-200">
                    <p className="mb-5">
                      {hasSearchFilters
                        ? '검색 조건에 맞는 매물이 없습니다.'
                        : '해당 카테고리에 등록된 매물이 없습니다.'}
                    </p>
                    {hasSearchFilters && (
                      <button
                        type="button"
                        onClick={clearSearchFilters}
                        className="px-6 py-3 rounded-full bg-zinc-950 text-white text-xs font-bold tracking-widest hover:bg-electric-blue transition-all"
                      >
                        검색조건 초기화
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-12 md:mt-16 flex justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/properties"
                    className="px-10 md:px-12 py-4 rounded-full bg-zinc-950 text-white text-xs md:text-sm font-bold tracking-widest hover:bg-electric-blue transition-all flex items-center gap-2 shadow-xl"
                  >
                    매물 더보기 <ChevronRight size={14} />
                  </Link>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="guide" className="py-16 md:py-24 px-4 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">고객후기</h2>
            <p className="text-sm md:text-lg text-zinc-400 font-medium tracking-tight">
              고객님들의 소중한 후기입니다.
            </p>
          </div>
          
          <div className="relative overflow-hidden py-6 md:py-10">
            {reviews.length > 0 && (
              <motion.div 
                key={`marquee-${reviews.length}`}
                className="flex gap-4 md:gap-6 w-max"
                animate={{ x: ["-50%", "0%"] }}
                transition={{
                  duration: reviews.length * 13.33,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {[...reviews, ...reviews].map((review, idx) => (
                  <div
                    key={`${review.id}-${idx}`}
                    className="min-w-[270px] md:min-w-[360px] flex-shrink-0"
                    onClick={() => setSelectedReviewImage(review.image)}
                  >
                    <div className="flex flex-col group cursor-pointer transition-all max-w-[270px] md:max-w-[360px] mx-auto">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-zinc-100 shadow-lg border border-zinc-100 relative">
                        <img 
                          src={normalizeImageSrc(review.image)} 
                          alt={review.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md rounded-full p-3 text-white border border-white/30">
                            <Search size={20} />
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[13px] md:text-[14px] font-bold text-zinc-800 mb-0.5">{review.title}</div>
                        <div className="text-[11px] md:text-[12px] text-zinc-400 font-medium">{review.subtitle}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          <div className="mt-12 md:mt-20 flex justify-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://www.google.com/search?q=%E8%A1%8C%E6%94%BF%E6%9B%B8%E5%A3%ABLegal_+J+office&sca_esv=af156264804c4707&sxsrf=ANbL-n6PTulvYeQ1YmirvQ-AV53HXGehcg%3A1778469294606&source=hp&ei=rkkBaozKIvLl2roPuaHh4A8&iflsig=AFdpzrgAAAAAagFXvl2eaiNjN4cYlTHs8BEqS-87wUCg&ved=0ahUKEwiM2a-0orCUAxXyslYBHblQGPwQ4dUDCCA&uact=5&oq=%E8%A1%8C%E6%94%BF%E6%9B%B8%E5%A3%ABLegal_+J+office&gs_lp=Egdnd3Mtd2l6IhvooYzmlL_mm7jlo6tMZWdhbF8gSiBvZmZpY2UyBBAAGB4yBRAAGO8FSOMCUABYAHAAeACQAQCYAX-gAX-qAQMwLjG4AQPIAQD4AQL4AQGYAgGgAoMBmAMAkgcDMC4xoAeDAbIHAzAuMbgHgwHCBwMwLjHIBwKACAE&sclient=gws-wiz#lrd=0x6000e7000e280a5f:0x9dd4ad1e88341176,1,,,," 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-10 md:px-12 py-4 rounded-full bg-zinc-950 text-white text-xs md:text-sm font-bold tracking-widest hover:bg-electric-blue transition-all flex items-center gap-2 shadow-xl"
            >
              후기 더보기 <ChevronRight size={14} />
            </motion.a>
          </div>
        </div>
      </section>

      {/* Osaka Info Section */}
      <section id="osaka-info" className="py-16 md:py-24 px-4 md:px-10 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 md:mb-16">
            <div className="text-electric-blue text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-4">Osaka Guide</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">오사카 정보</h2>
            <p className="text-sm md:text-lg text-zinc-500 font-medium tracking-tight">
              오사카 생활에 도움이 되는 정보
            </p>
          </div>

          <div className="relative overflow-hidden group/slider">
            <motion.div 
              animate={{ x: ["-50%", "0%"] }}
              transition={{ 
                duration: (visibleOsakaInfos.length > 0 ? visibleOsakaInfos.length : 3) * 13.33, 
                ease: "linear", 
                repeat: Infinity 
              }}
              className="flex gap-5 md:gap-8 w-max"
            >
              {[...visibleOsakaInfos, ...visibleOsakaInfos].map((info, idx) => (
                <div
                  key={info.id ? `${info.id}-${idx}` : idx}
                  className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all group/card flex flex-col h-full w-[270px] md:w-[350px] flex-none"
                >
                  <div className="relative h-52 md:h-64 bg-zinc-100 overflow-hidden flex items-center justify-center p-4">
                    <img 
                      src={normalizeImageSrc(info.img)} 
                      alt={info.title} 
                      className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover/card:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-zinc-900 border border-white/20">
                        {info.tag}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col flex-grow items-center text-center">
                    <h3 className="text-base md:text-xl font-bold text-zinc-900 mb-6 group-hover/card:text-electric-blue transition-colors leading-snug">
                      {info.title}
                    </h3>
                    <a 
                      href={info.instagramUrl?.trim() || settings.instagramUrl || `https://www.instagram.com/${settings.instagramId?.replace('@', '')}/`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-xs font-bold text-zinc-900 group/btn mt-auto px-6 py-3 border border-zinc-200 rounded-full hover:bg-zinc-50 transition-all"
                    >
                      자세히 보기 <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="mt-12 md:mt-16 flex justify-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={settings.youtubeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-10 md:px-12 py-4 rounded-full bg-zinc-950 text-white text-xs md:text-sm font-bold tracking-widest hover:bg-electric-blue transition-all flex items-center gap-2 shadow-xl"
            >
              더 많은 정보 보기 <ExternalLink size={14} />
            </motion.a>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 md:py-24 px-4 md:px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-16 items-center">
            <div className="lg:col-span-1">
              <div className="tag-blue mb-4">About Us</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6 md:mb-8 leading-tight text-zinc-900 break-keep">
                <a href="https://legalj.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                  行政書士Legal_ J office
                </a><br />
                & 오사카J부동산
              </h2>
              <p className="text-zinc-600 leading-relaxed mb-5 md:mb-6 font-light text-sm md:text-base">
                저희는 오사카 지역 전문 부동산으로서, 단순한 매물 소개를 넘어 고객님의 일본 정착과 투자의 성공을 위한 모든 행정적/법률적 지원을 아우르는 토탈 솔루션을 제공합니다.
              </p>
              <p className="text-zinc-600 leading-relaxed font-light text-sm md:text-base">
                정직과 신뢰는 저희 서비스의 핵심 가치입니다. 모든 거래 단계에서 투명성을 유지하며, 한국인 고객님들의 입장에서 가장 유리한 조건의 매칭을 약속드립니다.
              </p>
            </div>
            
            <div className="lg:col-span-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <img 
                  src="https://legalj.jp/wp-content/uploads/2025/02/Photo_25-02-05-10-38-56.243.jpg" 
                  alt="Legal J Office" 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>

            <div className="lg:col-span-1 bg-white p-6 md:p-10 rounded-3xl border border-zinc-200 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-electric-blue/5 rounded-full blur-[60px]" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-11 h-11 md:w-12 md:h-12 bg-electric-blue flex items-center justify-center rounded-lg font-bold text-xl text-white shadow-lg shadow-blue-500/20 shrink-0">J</div>
                  <span className="text-lg md:text-xl font-bold text-zinc-900">오사카 J 브랜드 철학</span>
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
                    <CheckCircle2 size={18} className="text-electric-blue shrink-0" /> <span className="font-medium">행정서사 & 宅地建物取引士 자격증 보유</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-electric-blue shrink-0" /> <span className="font-medium">부동산 전문 전담팀 운영</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Certifications Gallery */}
          <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-zinc-200">
            <div className="text-center mb-10 md:mb-12">
              <span className="text-[10px] font-bold tracking-[0.3em] text-blue-600 uppercase">Professional License</span>
              <h3 className="text-xl md:text-2xl font-bold mt-2 text-zinc-900">공인 자격 및 전문 라이선스</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-12">
              {[
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/acc7ca0397ca9757de2dadff837859e3.png", label: "行政書士試験" },
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/c53af1f0cba156493843f10955cbcc3f.png", label: "外国人雇用管理主任者" },
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/4a29f6991741fa243bc2f110898e41a4.png", label: "宅地建物取引士" },
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/3bf5e82c96385b7906d3ccf13505c5c4.png", label: "敷金診断士" }
              ].map((cert, idx) => (
                <motion.div 
                  key={idx} 
                  className="group"
                  whileHover={{ y: -10, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="aspect-[3/4] bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 mb-3 md:mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                    <img 
                      src={cert.url} 
                      className="w-full h-full object-cover" 
                      alt={cert.label} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] font-bold text-center text-zinc-500 group-hover:text-blue-600 transition-colors uppercase tracking-widest leading-relaxed whitespace-pre-wrap">{cert.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Bar */}
          <div className="mt-20 md:mt-32 bg-zinc-950 text-white rounded-[28px] md:rounded-[40px] p-5 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[360px] md:w-[500px] h-[360px] md:h-[500px] bg-electric-blue/10 rounded-full blur-[100px] md:blur-[120px] -mr-48 md:-mr-64 -mt-48 md:-mt-64 group-hover:bg-electric-blue/20 transition-colors duration-1000" />

            <div className="max-w-7xl w-full flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-8 xl:gap-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 xl:flex-1">
                {TRUST_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className="min-h-[250px] md:min-h-[285px] rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6 flex flex-col justify-start shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white flex items-center justify-center mb-5 shadow-xl shadow-black/20">
                      <img
                        src={item.icon}
                        alt={item.iconAlt}
                        className="w-10 h-10 md:w-12 md:h-12 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <span className="text-lg md:text-xl font-black tracking-tight text-white mb-4">
                      {item.title}
                    </span>

                    <div className="h-px w-full bg-white/10 mb-4" />

                    <p className="text-[12px] md:text-[13px] text-white/80 leading-[1.75] font-bold break-keep">
                      {item.headline}
                    </p>

                    <p className="mt-3 text-[11px] md:text-xs text-white/55 leading-[1.8] font-medium break-keep">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="w-full xl:w-auto xl:min-w-[300px] flex flex-col sm:flex-row xl:flex-col items-center xl:items-end justify-center gap-5 xl:gap-4 shrink-0 border-t xl:border-t-0 xl:border-l border-white/10 pt-7 xl:pt-0 xl:pl-8">
                <div className="text-center sm:text-left xl:text-right">
                  <p className="text-sm md:text-base font-black text-white leading-tight">
                    지금 바로 전문가와 상담하세요
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    카카오톡 ID: {settings.kakaoId}
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap justify-center xl:justify-end">
                  <a 
                    href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-[#FEE500] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl border-2 border-white/20"
                  >
                    <MessageCircle className="w-6 h-6 text-[#3C1E1E]" />
                  </a>

                  <a 
                    href={`https://line.me/R/ti/p/${settings.lineId.startsWith('@') ? settings.lineId : '@' + settings.lineId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <MessageSquare className="w-6 h-6 text-emerald-500" />
                  </a>

                  <a 
                    href={settings.instagramUrl || `https://www.instagram.com/${settings.instagramId?.replace('@', '')}/`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <Instagram className="w-6 h-6 text-pink-500" />
                  </a>

                  <a 
                    href={settings.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <Youtube className="w-6 h-6 text-red-600" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 py-14 md:py-20 px-4 md:px-10 border-t border-zinc-200 pb-28 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 mb-12 md:mb-20">
            <div>
              <div className="text-xl md:text-2xl font-bold mb-6 flex flex-wrap items-center gap-2 text-zinc-900">
                <div className="w-6 h-6 bg-electric-blue rounded-xs flex items-center justify-center text-sm text-white">J</div>
                <a href="https://legalj.jp/" target="_blank" rel="noopener noreferrer" className="tracking-tighter hover:text-blue-600 transition-colors">
                  行政書士Legal_ J office
                </a>
                <span className="tracking-tighter"> & 오사카J부동산</span>
              </div>
              <p className="text-zinc-600 max-w-md leading-relaxed text-sm font-medium">
                오사카 한인 경제의 중심에서 정직과 신뢰를 바탕으로 한 <br className="hidden md:block" />
                부동산 거래 문화를 선도합니다. <br className="hidden md:block" />
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
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">
                      Official Email
                    </h4>

                    <div className="space-y-2 text-zinc-600 text-sm leading-relaxed">
                      <p>
                        <span className="font-bold text-zinc-900">비자&법무 상담</span>
                        <br />
                        <a 
                          href="mailto:visa.legal.j@gmail.com"
                          className="hover:text-blue-600 transition-colors break-all"
                        >
                          visa.legal.j@gmail.com
                        </a>
                      </p>

                      <p>
                        <span className="font-bold text-zinc-900">부동산 상담</span>
                        <br />
                        <a 
                          href="mailto:budonsan.tk@gmail.com"
                          className="hover:text-blue-600 transition-colors break-all"
                        >
                          budonsan.tk@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div className="normal-case tracking-normal text-zinc-400">
              오사카J부동산은 Legal_J Office에서 운영하는 일본 부동산 서비스입니다.
            </div>
            {isAdmin && <Link to="/admin" className="text-electric-blue font-bold">ADMIN ACCESS</Link>}
          </div>
        </div>
      </footer>

      {/* Floating Social Sidebar */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-4 top-auto right-auto md:right-8 md:left-auto md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:translate-x-0 z-50 flex flex-row md:flex-col gap-3 md:gap-4 bg-white/70 md:bg-transparent backdrop-blur-xl md:backdrop-blur-0 rounded-full md:rounded-none px-3 py-2 md:p-0 shadow-xl md:shadow-none border border-white/60 md:border-0">
        <a 
          href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-11 h-11 md:w-16 md:h-16 bg-[#FEE500] rounded-full flex items-center justify-center shadow-lg md:shadow-xl border-2 md:border-4 border-white"
        >
          <MessageCircle className="w-5 h-5 md:w-8 md:h-8 text-[#3C1E1E]" />
        </a>
        
        <a 
          href={`https://line.me/R/ti/p/${settings.lineId.startsWith('@') ? settings.lineId : '@' + settings.lineId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-11 h-11 md:w-16 md:h-16 bg-[#06C755] rounded-full flex items-center justify-center shadow-lg md:shadow-xl border-2 md:border-4 border-white"
        >
          <MessageSquare className="w-5 h-5 md:w-8 md:h-8 text-white" />
        </a>

        <a 
          href={settings.instagramUrl || `https://www.instagram.com/${settings.instagramId?.replace('@', '')}/`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-11 h-11 md:w-16 md:h-16 bg-gradient-to-tr from-[#f9ce67] via-[#f07030] to-[#833ab4] rounded-full flex items-center justify-center shadow-lg md:shadow-xl border-2 md:border-4 border-white"
        >
          <Instagram className="w-5 h-5 md:w-8 md:h-8 text-white" />
        </a>

        <a 
          href={settings.youtubeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-11 h-11 md:w-16 md:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg md:shadow-xl border-2 md:border-4 border-white"
        >
          <Youtube className="w-5 h-5 md:w-8 md:h-8 text-white" />
        </a>
      </div>

      {/* Review Image Modal */}
      <AnimatePresence>
        {selectedReviewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReviewImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedReviewImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-electric-blue transition-colors p-2"
              >
                <X size={32} />
              </button>
              <img 
                src={normalizeImageSrc(selectedReviewImage || undefined)} 
                alt="Full review" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/10 shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
