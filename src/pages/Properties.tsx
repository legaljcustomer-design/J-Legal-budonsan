import React, { useEffect, useMemo, useState } from 'react';
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
  Loader2,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Property } from '../types';
import { firebaseService } from '../services/firebaseService';
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

const DEFAULT_SETTINGS = {
  kakaoId: 'oosakaj',
  kakaoUrl: 'https://pf.kakao.com/_TSvgxb',
  lineId: '@845immxy',
  instagramId: 'oosaka_j',
  instagramUrl: '',
  youtubeUrl: 'https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=Fvg2lwsd-_UGjgSx',
};

export default function Properties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const initialPrefecture = searchParams.get('prefecture');
  const [selectedPrefecture, setSelectedPrefecture] = useState<PrefectureFilter>(
    initialPrefecture === 'osaka' || initialPrefecture === 'kyoto' || initialPrefecture === 'hyogo'
      ? initialPrefecture
      : 'all'
  );

  const [stationQuery, setStationQuery] = useState(searchParams.get('station') || '');
  const [lineQuery, setLineQuery] = useState(searchParams.get('line') || '');
  const [keywordQuery, setKeywordQuery] = useState(searchParams.get('keyword') || '');

  const settings = {
    ...DEFAULT_SETTINGS,
    ...siteConfig,
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

  const normalizeSearchText = (value: unknown) => {
    return String(value ?? '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .trim();
  };

  const hasSearchFilters =
    selectedPrefecture !== 'all' ||
    stationQuery.trim().length > 0 ||
    lineQuery.trim().length > 0 ||
    keywordQuery.trim().length > 0;

  const updateUrlWithSearch = () => {
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
      updateUrlWithSearch();
    }
  };

  const clearSearchFilters = () => {
    setSelectedPrefecture('all');
    setStationQuery('');
    setLineQuery('');
    setKeywordQuery('');
    navigate('/properties');
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
        prop.prefecture ? PREFECTURE_LABELS[prop.prefecture] : '';

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
  }, [properties, selectedPrefecture, stationQuery, lineQuery, keywordQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 font-sans overflow-x-hidden">
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
            <Link to="/" className="hover:text-electric-blue transition-colors">홈</Link>
            <Link to="/properties" className="text-zinc-900 border-b-2 border-electric-blue pb-1 transition-all font-bold">매물검색</Link>
            <Link to="/#guide" className="hover:text-electric-blue transition-colors">고객후기</Link>
            <Link to="/#about" className="hover:text-electric-blue transition-colors">회사소개</Link>
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
              className="hidden md:flex blue-glow-btn px-8 py-3 items-center justify-center text-white text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)]"
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
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">홈</Link>
              <Link to="/properties" onClick={() => setIsMenuOpen(false)} className="text-electric-blue">매물검색</Link>
              <Link to="/#guide" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">고객후기</Link>
              <Link to="/#about" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">회사소개</Link>
              <Link to="/recruitment" onClick={() => setIsMenuOpen(false)} className="hover:text-electric-blue">채용 정보</Link>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-electric-blue">관리자전용</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <section className="relative pt-32 md:pt-40 pb-10 md:pb-14 px-4 md:px-10 bg-zinc-950 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-electric-blue/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-blue-500/10 rounded-full blur-[100px] -ml-40 -mb-40" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-blue-200 text-[10px] md:text-xs font-black tracking-[0.22em] uppercase mb-5">
            Property Search
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight break-keep text-white">
            조건에 맞는 오사카·간사이 매물을<br className="hidden md:block" />
            빠르게 확인하세요
          </h1>
          <p className="mt-5 max-w-2xl text-sm md:text-base text-white/70 leading-relaxed">
            지역, 역명, 노선, 키워드를 조합해 고객님께 맞는 매물을 검색할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Search Panel */}
      <section className="px-4 md:px-10 -mt-6 md:-mt-8 relative z-20">
        <div className="max-w-7xl mx-auto bg-white rounded-[28px] md:rounded-[36px] border border-zinc-200 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="p-5 md:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 md:gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400 mb-3">
                  지역으로 찾기
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 md:gap-3">
                  {PREFECTURE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedPrefecture(option.id)}
                      className={`rounded-2xl border px-4 py-3.5 text-left transition-all ${
                        selectedPrefecture === option.id
                          ? 'bg-electric-blue border-electric-blue text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className="block text-sm font-black">{option.label}</span>
                      <span className={`block text-[9px] md:text-[10px] tracking-[0.18em] font-bold mt-1 ${
                        selectedPrefecture === option.id ? 'text-blue-100' : 'text-zinc-400'
                      }`}>
                        {option.english}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 mb-2">
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
                    <label className="block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 mb-2">
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

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 mb-2">
                    키워드 검색
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-[22px] px-4 py-3.5 md:py-4 focus-within:border-blue-400 focus-within:bg-white transition-all">
                      <Search size={20} className="text-blue-600 shrink-0" />
                      <input
                        value={keywordQuery}
                        onChange={(e) => setKeywordQuery(e.target.value)}
                        onKeyDown={handleSearchEnter}
                        placeholder="예: 유학생, 워홀, 애완동물, 2인거주"
                        className="w-full bg-transparent outline-none text-sm md:text-base text-zinc-900 placeholder:text-zinc-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={updateUrlWithSearch}
                      className="w-full sm:w-auto px-8 py-4 rounded-[22px] bg-electric-blue text-white text-sm font-black tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      <Search size={18} />
                      검색
                    </button>

                    <button
                      type="button"
                      onClick={clearSearchFilters}
                      className="w-full sm:w-auto px-7 py-4 rounded-[22px] border border-zinc-200 bg-white text-sm font-bold text-zinc-700 hover:bg-zinc-950 hover:text-white transition-all"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-zinc-100 pt-5">
              <p className="text-xs text-zinc-500 leading-relaxed">
                메인 화면에서 검색한 조건도 이 페이지에 자동으로 이어집니다.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-electric-blue shrink-0" />
                {hasSearchFilters ? `현재 조건에 맞는 매물 ${filteredProperties.length}건` : `전체 표시 매물 ${filteredProperties.length}건`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="pt-10 md:pt-14 pb-16 md:pb-24 px-4 md:px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 md:gap-10">
            <div>
              <div className="text-electric-blue text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-3 md:mb-4">
                Properties
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-900 leading-tight">
                매물 검색 결과
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium mt-2 leading-relaxed">
                ※ 실시간 공실/만실 매물 상황은 무조건 문의바랍니다.
              </p>
            </div>

            <div className="flex overflow-x-auto gap-3 md:gap-4 pb-2 no-scrollbar w-full md:w-auto">
              {CATEGORIES.map((cat) => (
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
                  filteredProperties.map((prop, index) => (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(index * 0.05, 0.35), duration: 0.5 }}
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

                        <span className="absolute top-4 left-4 max-w-[150px] truncate px-2.5 py-1.5 bg-electric-blue text-[10px] font-bold rounded-md tracking-wide text-white shadow-lg">
                          {prop.type === 'OneRoom'
                            ? '주거용 맨션'
                            : prop.type === 'TwoRoom'
                              ? '주거용 맨션(투룸형)'
                              : CATEGORIES.find((c) => c.id === prop.type)?.label || prop.type}
                        </span>

                        {prop.isFeatured && (
                          <div className="absolute top-4 right-4 max-w-[150px] truncate bg-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-md tracking-wide text-white shadow-lg">
                            {prop.badgeLabel?.trim() || 'FEATURED'}
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
                            {prop.nearestLine && (
                              <span className="text-[9px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 font-bold">
                                {prop.nearestLine}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">
                            {prop.location}
                          </p>
                          <h3 className="text-base font-bold tracking-tight text-zinc-900 leading-tight line-clamp-2">
                            {prop.title}
                          </h3>
                        </div>

                        <div className="flex flex-col mb-5 md:mb-6 pt-3 border-t border-zinc-100">
                          <span className="text-xl md:text-2xl font-black tracking-tighter text-zinc-900 whitespace-pre-wrap leading-tight">
                            {(prop.price || '').replace(/상담\s*문의/g, '').trim()}
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
                        : '등록된 매물이 없습니다.'}
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
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 py-14 md:py-20 px-4 md:px-10 border-t border-zinc-200 pb-28 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 mb-12 md:mb-20">
            <div>
              <div className="text-xl md:text-2xl font-bold mb-6 flex flex-wrap items-center gap-2 text-zinc-900">
                <div className="w-6 h-6 bg-electric-blue rounded-xs flex items-center justify-center text-sm text-white">
                  J
                </div>
                <a
                  href="https://legalj.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tracking-tighter hover:text-blue-600 transition-colors"
                >
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
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-4">
                    Office Address
                  </h4>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    본사주소:〒553-0003<br />
                    大阪府大阪市福島区福島7丁目20-18<br />
                    ｼﾃｨﾀﾜｰ西梅田4203号
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">
                      Representative
                    </h4>
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
            <Link to="/admin" className="text-electric-blue font-bold">ADMIN ACCESS</Link>
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
    </div>
  );
}
