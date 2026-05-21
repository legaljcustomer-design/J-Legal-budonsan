import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  Briefcase, 
  TrendingUp, 
  ChevronRight, 
  Loader2,
  Building2,
  Menu,
  X,
  MessageCircle,
  MessageSquare,
  Search
} from 'lucide-react';
import { Property } from '../types';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: HomeIcon },
  { id: 'OneRoom', label: '원룸/투룸', icon: Building2 },
  { id: 'Family', label: '타워맨션', icon: HomeIcon },
  { id: 'Office', label: '상가/사무실', icon: Briefcase },
  { id: 'Investment', label: '수익형 부동산', icon: TrendingUp },
];

type PrefectureFilter = 'all' | 'osaka' | 'kyoto' | 'hyogo';

const PREFECTURE_LABELS: Record<'osaka' | 'kyoto' | 'hyogo', string> = {
  osaka: '오사카',
  kyoto: '교토',
  hyogo: '효고',
};

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

const getPropertyTypeLabel = (type: string) => {
  if (type === 'OneRoom') return '원룸/투룸';
  if (type === 'TwoRoom') return '원룸/투룸';
  return CATEGORIES.find(c => c.id === type)?.label || type;
};

export default function Properties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const rawPrefecture = searchParams.get('prefecture');
  const selectedPrefecture: PrefectureFilter =
    rawPrefecture === 'osaka' ||
    rawPrefecture === 'kyoto' ||
    rawPrefecture === 'hyogo'
      ? rawPrefecture
      : 'all';

  const stationQuery = searchParams.get('station')?.trim() || '';
  const lineQuery = searchParams.get('line')?.trim() || '';
  const keywordQuery = searchParams.get('keyword')?.trim() || '';

  const hasSearchFilters =
    selectedPrefecture !== 'all' ||
    stationQuery.length > 0 ||
    lineQuery.length > 0 ||
    keywordQuery.length > 0;

  const normalizeSearchText = (value: unknown) => {
    return String(value ?? '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .trim();
  };

  const clearSearchFilters = () => {
    navigate('/properties');
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
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [activeCategory]);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
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
  }, [
    properties,
    selectedPrefecture,
    stationQuery,
    lineQuery,
    keywordQuery
  ]);

  return (
    <div className="min-h-screen bg-luxury-black text-zinc-900 font-sans overflow-x-hidden">
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
              <span className="text-base md:text-xl font-bold tracking-tight text-zinc-900 truncate">
                오사카J부동산
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <Link to="/" className="hover:text-electric-blue transition-colors">
              홈
            </Link>
            <Link 
              to="/properties" 
              className="text-zinc-900 border-b-2 border-electric-blue pb-1 transition-all font-bold"
            >
              전체 매물
            </Link>
            <Link to="/recruitment" className="hover:text-electric-blue transition-colors">
              채용 정보
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <a 
              href={
                settings.kakaoUrl?.trim() ||
                `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`
              } 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex blue-glow-btn px-8 py-3 items-center justify-center text-white text-sm"
            >
              문의하기
            </a>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden text-zinc-600 bg-white/60 border border-zinc-200 rounded-xl p-2"
            >
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
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)} 
                className="hover:text-electric-blue"
              >
                H O M E
              </Link>

              <Link 
                to="/properties" 
                onClick={() => setIsMenuOpen(false)} 
                className="hover:text-electric-blue text-electric-blue"
              >
                전체 매물
              </Link>

              <Link 
                to="/recruitment" 
                onClick={() => setIsMenuOpen(false)} 
                className="hover:text-electric-blue"
              >
                채용 정보
              </Link>
            </div>

            <a 
              href={
                settings.kakaoUrl?.trim() ||
                `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`
              } 
              target="_blank" 
              rel="noopener noreferrer"
              className="blue-glow-btn w-full max-w-xs py-4 text-sm font-bold text-white shadow-xl"
            >
              문의하기
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-24 md:pt-32 pb-16 md:pb-20 px-4 md:px-10 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-12">
            <div className="text-electric-blue text-[10px] md:text-xs font-bold uppercase tracking-[0.28em] md:tracking-[0.3em] mb-3 md:mb-4">
              {hasSearchFilters ? 'Search Results' : 'All Properties'}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-4 leading-tight">
              {hasSearchFilters ? '검색 결과' : '전체 매물 보기'}
            </h1>

            <p className="text-sm md:text-lg text-zinc-500 font-medium tracking-tight leading-relaxed">
              {hasSearchFilters
                ? '선택하신 조건에 맞는 매물을 확인하세요.'
                : '오사카J부동산에 등록된 매물을 한눈에 확인하세요.'}
            </p>
          </div>

          {/* Search Summary */}
          {hasSearchFilters && (
            <div className="mb-8 md:mb-12 bg-white border border-zinc-200 rounded-3xl p-5 md:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-electric-blue text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.25em] mb-4">
                    <Search size={14} />
                    Applied Search Conditions
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedPrefecture !== 'all' && (
                      <span className="px-3 md:px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs md:text-sm font-bold">
                        지역: {PREFECTURE_LABELS[selectedPrefecture]}
                      </span>
                    )}

                    {stationQuery && (
                      <span className="px-3 md:px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 text-xs md:text-sm font-bold break-all">
                        역명: {stationQuery}
                      </span>
                    )}

                    {lineQuery && (
                      <span className="px-3 md:px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 text-xs md:text-sm font-bold break-all">
                        노선: {lineQuery}
                      </span>
                    )}

                    {keywordQuery && (
                      <span className="px-3 md:px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 text-xs md:text-sm font-bold break-all">
                        키워드: {keywordQuery}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="px-5 py-3 rounded-2xl bg-zinc-950 text-white text-sm font-bold text-center">
                    검색 결과 {filteredProperties.length}건
                  </div>

                  <button
                    type="button"
                    onClick={clearSearchFilters}
                    className="px-5 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-700 text-sm font-bold hover:bg-zinc-950 hover:text-white transition-all"
                  >
                    검색조건 초기화
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex overflow-x-auto gap-3 md:gap-4 pb-5 md:pb-6 mb-8 md:mb-12 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
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

          {/* Property Grid */}
          {loading ? (
            <div className="flex justify-center py-20 md:py-24">
              <Loader2 className="animate-spin text-electric-blue" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((prop, index) => (
                  <motion.div
                    key={prop.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.5 }}
                    className="card-luxury group bg-white overflow-hidden"
                  >
                    <div className="relative h-48 md:h-56 overflow-hidden bg-zinc-800">
                      <img 
                        src={normalizeImageSrc(prop.images?.[0]) || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute top-4 left-4 px-2 py-1 bg-electric-blue text-[10px] font-bold rounded uppercase tracking-wider text-white">
                        {getPropertyTypeLabel(prop.type)}
                      </span>
                    </div>
                    
                    <div className="p-5 md:p-6 flex flex-col min-h-[280px] md:min-h-[300px]">
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {prop.prefecture && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                              {PREFECTURE_LABELS[prop.prefecture]}
                            </span>
                          )}

                          {prop.nearestStation && (
                            <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                              {prop.nearestStation}
                            </span>
                          )}

                          {prop.nearestLine && (
                            <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                              {prop.nearestLine}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">
                          {prop.location}
                        </p>

                        <h3 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 leading-tight line-clamp-2">
                          {prop.title}
                        </h3>
                      </div>

                      <div className="flex flex-col mb-5 md:mb-6 pt-4 border-t border-zinc-100">
                        <span className="text-xl md:text-2xl font-black tracking-tighter text-zinc-900 whitespace-pre-wrap leading-tight">
                          {prop.price.replace(/상담\s*문의/g, '').trim()}
                        </span>
                      </div>
                      
                      <div className="mt-auto">
                        <Link 
                          to={`/property/${prop.id}`}
                          className="w-full py-4 bg-zinc-950 text-white text-[10px] font-bold tracking-[0.18em] md:tracking-[0.2em] uppercase transition-all rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue shadow-lg active:scale-[0.98]"
                        >
                          매물 정보 더보기 <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 md:py-24 px-6 text-zinc-500 text-sm tracking-widest uppercase bg-zinc-200/50 rounded-3xl border border-zinc-200">
                  <p className="mb-6">
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
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-950 text-white py-14 md:py-20 px-4 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <div className="w-6 h-6 bg-electric-blue rounded-xs flex items-center justify-center text-sm">
                J
              </div>
              오사카J부동산
            </div>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
              오사카 한인 경제의 중심에서 정직과 신뢰를 바탕으로 한 부동산 거래 문화를 선도합니다.
            </p>
          </div>

          <div className="flex gap-4">
            <a 
              href={
                settings.kakaoUrl?.trim() ||
                `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`
              } 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-11 h-11 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-electric-blue transition-colors"
            >
              <MessageCircle size={20} />
            </a>

            <a 
              href={`https://line.me/R/ti/p/${settings.lineId.startsWith('@') ? settings.lineId : '@' + settings.lineId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-11 h-11 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-electric-blue transition-colors"
            >
              <MessageSquare size={20} />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 md:mt-20 pt-8 border-t border-white/10 text-center text-zinc-600 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-widest">
          &copy; {new Date().getFullYear()} OSAKA J REALTY. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
