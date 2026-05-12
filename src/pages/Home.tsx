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
  { id: 'OneRoom', label: '원룸/투룸', icon: Building2 },
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
  const [loading, setLoading] = useState(true);
  const [consultationCount, setConsultationCount] = useState(134);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const [settings, setSettings] = useState({
    heroTitle: '오사카 최고의 매물을 찾으시나요?',
    heroSubtitle: '난바, 우메다 등 주요 거점의 신축 맨션부터 수익형 빌딩까지, 오사카 거주 한국인 및 투자자를 위한 맞춤형 럭셔리 컨설팅을 제공합니다.',
    consultationBaseCount: 102,
    kakaoId: 'oosakaj',
    lineId: '@845immxy',
    instagramId: 'oosaka_j',
    youtubeUrl: 'https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=fyvJj_s_8MHE-l7W'
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

  const getVisibleItems = () => {
    if (windowWidth >= 1024) return 3;
    if (windowWidth >= 768) return 2;
    return 1;
  };

  const getVisibleReviews = () => {
    if (windowWidth >= 1280) return 4;
    if (windowWidth >= 1024) return 3;
    if (windowWidth >= 768) return 2;
    return 1;
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
      setConsultationCount(settings.consultationBaseCount + Math.floor(minutesPassed / 12));
    };

    updateCount();
    const interval = setInterval(updateCount, 60000); // Check every minute
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
    const fetchData = async () => {
      setLoading(true);
      const [propData, reviewData] = await Promise.all([
        firebaseService.getProperties(activeCategory),
        firebaseService.getReviews()
      ]);
      
      setProperties(propData);
      setReviews(reviewData);
      setLoading(false);
      setCurrentIndex(0);
    };
    fetchData();
  }, [activeCategory]);

  useEffect(() => {
    if (loading || properties.length === 0) return;
    const interval = setInterval(() => {
      const visibleItems = getVisibleItems();
      setCurrentIndex((prev) => (prev >= properties.length - visibleItems ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, properties.length, windowWidth]);

  useEffect(() => {
    const interval = setInterval(() => {
      const visibleItems = getVisibleReviews();
      setReviewIndex((prev) => (prev >= reviews.length - visibleItems ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [windowWidth, reviews.length]);

  const nextSlide = () => {
    const visibleItems = getVisibleItems();
    setCurrentIndex((prev) => (prev >= properties.length - visibleItems ? 0 : prev + 1));
  };

  const prevSlide = () => {
    const visibleItems = getVisibleItems();
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, properties.length - visibleItems) : prev - 1));
  };

  const nextReview = () => {
    const visibleItems = getVisibleReviews();
    setReviewIndex((prev) => (prev >= reviews.length - visibleItems ? 0 : prev + 1));
  };

  const prevReview = () => {
    const visibleItems = getVisibleReviews();
    setReviewIndex((prev) => (prev === 0 ? Math.max(0, reviews.length - visibleItems) : prev - 1));
  };

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
              <a href="#guide" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">고객후기</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">회사소개</a>
              <Link to="/recruitment" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">채용 정보</Link>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-electric-blue">관리자전용</Link>
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
            <div className="relative group/slider">
              {/* Navigation Buttons */}
              {properties.length > getVisibleItems() && (
                <>
                  <button 
                    onClick={prevSlide}
                    className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-zinc-900 opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-electric-blue hover:text-white border border-zinc-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-zinc-900 opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-electric-blue hover:text-white border border-zinc-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <div className="overflow-hidden">
                <motion.div 
                  className="flex gap-8"
                  animate={{ x: `calc(-${currentIndex * (100 / getVisibleItems())}% - ${currentIndex * (32 / getVisibleItems())}px)` }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                  {properties.length > 0 ? (
                    properties.map((prop, index) => (
                      <motion.div
                        key={prop.id}
                        className="min-w-full md:min-w-[calc(50%-16px)] lg:min-w-[calc(33.333%-21.333px)] flex-shrink-0"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="card-luxury group h-full"
                        >
                          <div className="relative h-52 overflow-hidden bg-zinc-800">
                            <img 
                              src={prop.images[0] || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              referrerPolicy="no-referrer"
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
                          
                          <div className="p-5 bg-white flex flex-col h-[calc(100%-13rem)]">
                            <div className="mb-2">
                              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">{prop.location}</p>
                              <h3 className="text-base font-bold tracking-tight text-zinc-900 leading-tight line-clamp-2">
                                {prop.title}
                              </h3>
                            </div>

                            <div className="flex flex-col mb-1 pt-3 border-t border-zinc-100">
                              <span className="text-2xl font-black tracking-tighter text-zinc-900 whitespace-pre-wrap leading-tight">
                                {prop.price.replace(/상담\s*문의/g, '').trim()}
                              </span>
                            </div>
                            
                            <div className="flex gap-1.5 mb-2 flex-wrap">
                              {prop.features.slice(0, 3).map((f, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-slate-50 rounded text-[9px] text-zinc-400 font-bold border border-zinc-50 uppercase tracking-tighter">
                                      {f}
                                  </span>
                              ))}
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
                      </motion.div>
                    ))
                  ) : (
                    <div className="w-full text-center py-24 text-zinc-500 text-sm tracking-widest uppercase bg-zinc-900/20 rounded-3xl border border-white/5">
                      해당 카테고리에 등록된 매물이 없습니다.
                    </div>
                  )}
                </motion.div>
              </div>

              {/* View More Button */}
              <div className="mt-16 flex justify-center">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://pf.kakao.com/_TSvgxb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-16 py-4 rounded-full border border-zinc-600 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-all flex items-center gap-2"
                >
                  매물 더보기 <ChevronRight size={14} className="mt-0.5" />
                </motion.a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="guide" className="py-24 px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">고객후기</h2>
            <p className="text-lg text-zinc-400 font-medium tracking-tight">
              고객님들의 소중한 후기입니다.
            </p>
          </div>
          
          <div className="relative group/reviews">
            {/* Navigation Buttons */}
            <button 
              onClick={prevReview}
              className="absolute left-4 top-[140px] -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={48} strokeWidth={1} />
            </button>
            <button 
              onClick={nextReview}
              className="absolute right-4 top-[140px] -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight size={48} strokeWidth={1} />
            </button>

            <div className="overflow-hidden px-4">
              <motion.div 
                className="flex gap-6"
                animate={{ x: `calc(-${reviewIndex * (100 / getVisibleReviews())}% - ${reviewIndex * (24 / getVisibleReviews())}px)` }}
                transition={{ type: "spring", stiffness: 150, damping: 25 }}
              >
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    className="min-w-full md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] xl:min-w-[calc(25%-18px)] flex-shrink-0"
                  >
                    <div className="flex flex-col group cursor-pointer transition-all max-w-[280px] mx-auto">
                      <div className="aspect-[3/2] rounded-lg overflow-hidden mb-4 bg-zinc-100">
                        <img 
                          src={review.image} 
                          alt={review.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-[14px] font-bold text-zinc-800 mb-0.5">{review.title}</div>
                        <div className="text-[12px] text-zinc-400 font-medium">{review.subtitle}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="mt-20 flex justify-center">
            <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://www.google.com/search?q=%E8%A1%8C%E6%94%BF%E6%9B%B8%E5%A3%ABLegal_+J+office&sca_esv=af156264804c4707&sxsrf=ANbL-n6PTulvYeQ1YmirvQ-AV53HXGehcg%3A1778469294606&source=hp&ei=rkkBaozKIvLl2roPuaHh4A8&iflsig=AFdpzrgAAAAAagFXvl2eaiNjN4cYlTHs8BEqS-87wUCg&ved=0ahUKEwiM2a-0orCUAxXyslYBHblQGPwQ4dUDCCA&uact=5&oq=%E8%A1%8C%E6%94%BF%E6%9B%B8%E5%A3%ABLegal_+J+office&gs_lp=Egdnd3Mtd2l6IhvooYzmlL_mm7jlo6tMZWdhbF8gSiBvZmZpY2UyBBAAGB4yBRAAGO8FSOMCUABYAHAAeACQAQCYAX-gAX-qAQMwLjG4AQPIAQD4AQL4AQGYAgGgAoMBmAMAkgcDMC4xoAeDAbIHAzAuMbgHgwHCBwMwLjHIBwKACAE&sclient=gws-wiz#lrd=0x6000e7000e280a5f:0x9dd4ad1e88341176,1,,,," 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-16 py-4 rounded-full border border-zinc-600 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-all flex items-center gap-2"
            >
              후기 더보기 <ChevronRight size={14} className="mt-0.5" />
            </motion.a>
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
                  referrerPolicy="no-referrer"
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
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/acc7ca0397ca9757de2dadff837859e3.png", label: "行政書士시험" },
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/c53af1f0cba156493843f10955cbcc3f.png", label: "외국인고용관리주임자" },
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/4a29f6991741fa243bc2f110898e41a4.png", label: "택지건물거래사" },
                { url: "https://images.weserv.nl/?url=https://legalj.jp/wp-content/uploads/2025/01/3bf5e82c96385b7906d3ccf13505c5c4.png", label: "부증금진단사" }
              ].map((cert, idx) => (
                <motion.div 
                  key={idx} 
                  className="group"
                  whileHover={{ y: -16, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="aspect-[3/4] bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                    <img 
                      src={cert.url} 
                      className="w-full h-full object-cover" 
                      alt={cert.label} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-center text-zinc-500 group-hover:text-blue-600 transition-colors uppercase tracking-widest leading-relaxed whitespace-pre-wrap">{cert.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Bar */}
          <div className="mt-32 bg-zinc-950 text-white rounded-[40px] p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric-blue/10 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-electric-blue/20 transition-colors duration-1000" />
            <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
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
                <div className="hidden lg:flex flex-col items-end text-right">
                  <p className="text-sm font-bold">지금 바로 전문가와 상담하세요</p>
                  <p className="text-xs opacity-80">카카오톡 ID: {settings.kakaoId}</p>
                </div>
                <div className="flex gap-3">
                    <a 
                      href={`https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl border border-white/10"
                    >
                       <MessageCircle className="w-6 h-6 text-yellow-400" />
                    </a>
                    <a 
                      href={`https://line.me/R/ti/p/${settings.lineId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                    >
                       <MessageSquare className="w-6 h-6 text-emerald-500" />
                    </a>
                    <a 
                      href={`https://www.instagram.com/${settings.instagramId}/`} 
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
