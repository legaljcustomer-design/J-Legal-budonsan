import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  Briefcase, 
  TrendingUp, 
  ChevronRight, 
  Loader2,
  Building2,
  ArrowRight,
  Menu,
  X,
  ExternalLink,
  MessageCircle,
  MessageSquare,
  Instagram,
  Youtube
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

export default function Properties() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    kakaoId: 'oosakaj',
    kakaoUrl: 'https://pf.kakao.com/_TSvgxb',
    lineId: '@845immxy',
    instagramId: 'oosaka_j',
    instagramUrl: '',
    youtubeUrl: 'https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=Fvg2lwsd-_UGjgSx'
  });

  // 이미지 경로 보정 함수
  const normalizeImageSrc = (src: string | undefined) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:')) {
      return src;
    }
    // assets/uploads/... 형태를 /assets/uploads/... 로 보정
    return `/${src}`;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await firebaseService.getSettings();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const propData = await firebaseService.getProperties(activeCategory);
        setProperties(propData);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
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
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <Link to="/" className="hover:text-electric-blue transition-colors">홈</Link>
            <Link to="/properties" className="text-zinc-900 border-b-2 border-electric-blue pb-1 transition-all font-bold">전체 매물</Link>
            <Link to="/recruitment" className="hover:text-electric-blue transition-colors">채용 정보</Link>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex blue-glow-btn px-8 py-3 items-center justify-center text-white text-sm"
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
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">H O M E</Link>
              <Link to="/properties" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue text-electric-blue">전체 매물</Link>
              <Link to="/recruitment" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">채용 정보</Link>
            </div>
            <a 
              href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="blue-glow-btn w-full max-w-xs py-4 text-sm font-bold text-white shadow-xl"
            >
              문의하기
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-32 pb-20 px-10 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="text-electric-blue text-xs font-bold uppercase tracking-[0.3em] mb-4">All Properties</div>
            <h1 className="text-5xl font-bold tracking-tighter text-zinc-900 mb-4">전체 매물 보기</h1>
            <p className="text-lg text-zinc-500 font-medium tracking-tight">
              오사카J부동산에 등록된 매물을 한눈에 확인하세요.
            </p>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-6 mb-12 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
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

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-electric-blue" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {properties.length > 0 ? (
                properties.map((prop, index) => (
                  <motion.div
                    key={prop.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="card-luxury group bg-white"
                  >
                    <div className="relative h-56 overflow-hidden bg-zinc-800">
                      <img 
                        src={normalizeImageSrc(prop.images[0]) || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute top-4 left-4 px-2 py-1 bg-electric-blue text-[10px] font-bold rounded uppercase tracking-wider text-white">
                        {/* 주거용 맨션 명칭 통합 처리 */}
                        {prop.type === 'OneRoom' ? '주거용 맨션' : 
                         prop.type === 'TwoRoom' ? '주거용 맨션(투룸형)' : 
                         CATEGORIES.find(c => c.id === prop.type)?.label || prop.type}
                      </span>
                    </div>
                    
                    <div className="p-6 flex flex-col h-[280px]">
                      <div className="mb-4">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">{prop.location}</p>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900 leading-tight line-clamp-2">
                          {prop.title}
                        </h3>
                      </div>

                      <div className="flex flex-col mb-6 pt-4 border-t border-zinc-100">
                        <span className="text-2xl font-black tracking-tighter text-zinc-900 whitespace-pre-wrap leading-tight">
                          {prop.price.replace(/상담\s*문의/g, '').trim()}
                        </span>
                      </div>
                      
                      <div className="mt-auto">
                        <Link 
                          to={`/property/${prop.id}`}
                          className="w-full py-4 bg-zinc-950 text-white text-[10px] font-bold tracking-[0.2em] uppercase transition-all rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue shadow-lg active:scale-[0.98]"
                        >
                          매물 정보 더보기 <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-24 text-zinc-500 text-sm tracking-widest uppercase bg-zinc-200/50 rounded-3xl border border-zinc-200">
                  해당 카테고리에 등록된 매물이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-950 text-white py-20 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-4">
            <div className="text-2xl font-bold flex items-center gap-2">
              <div className="w-6 h-6 bg-electric-blue rounded-xs flex items-center justify-center text-sm">J</div>
              오사카J부동산
            </div>
            <p className="text-zinc-500 text-sm max-w-md">
              오사카 한인 경제의 중심에서 정직과 신뢰를 바탕으로 한 부동산 거래 문화를 선도합니다.
            </p>
          </div>
          <div className="flex gap-4">
            <a 
              href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-electric-blue transition-colors"
            >
              <MessageCircle size={20} />
            </a>
            <a 
              href={`https://line.me/R/ti/p/${settings.lineId.startsWith('@') ? settings.lineId : '@' + settings.lineId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-electric-blue transition-colors"
            >
              <MessageSquare size={20} />
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 text-center text-zinc-600 text-xs uppercase tracking-widest">
          &copy; {new Date().getFullYear()} OSAKA J REALTY. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
