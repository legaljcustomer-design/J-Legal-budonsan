import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Share2, 
  ChevronLeft,
  ChevronRight, 
  MessageCircle, 
  MessageSquare,
  Instagram,
  Youtube,
  ExternalLink,
  Building2,
  Edit3,
  X
} from 'lucide-react';
import { Property } from '../types';
import { firebaseService } from '../services/firebaseService';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [settings, setSettings] = useState({
    kakaoId: 'oosakaj',
    kakaoUrl: 'https://pf.kakao.com/_TSvgxb',
    lineId: '@845immxy',
    instagramId: 'oosaka_j',
    instagramUrl: '',
    youtubeUrl: 'https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=Fvg2lwsd-_UGjgSx'
  });

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

  const getPropertyTypeLabel = (type: string | undefined) => {
    if (type === 'OneRoom') return '주거용 맨션';
    if (type === 'TwoRoom') return '주거용 맨션(투룸형)';
    if (type === 'Family') return '타워맨션';
    if (type === 'Office') return '상가/사무실';
    if (type === 'Investment') return '수익형 부동산';
    return '부동산 매물';
  };

  const getYoutubeEmbedId = (url: string | undefined) => {
    if (!url) return '';

    if (url.includes('shorts/')) {
      return url.split('shorts/')[1]?.split('?')[0]?.split('&')[0] || '';
    }

    if (url.includes('v=')) {
      return url.split('v=')[1]?.split('&')[0] || '';
    }

    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
    }

    return '';
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (property?.images?.length) {
      setActiveImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (property?.images?.length) {
      setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [propData, settingsData] = await Promise.all([
          id ? firebaseService.getPropertyById(id) : null,
          firebaseService.getSettings()
        ]);
        
        if (propData) setProperty(propData);
        if (settingsData) setSettings(prev => ({ ...prev, ...settingsData }));
      } catch (error) {
        console.error("Error fetching detail data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setIsAdmin(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isZoomed) {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, property]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">매물을 찾을 수 없습니다.</h2>
        <Link to="/" className="text-blue-600 font-bold flex items-center gap-2">
          <ArrowLeft size={20} /> 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const propertyImages = property.images?.length ? property.images : [];
  const currentImage =
    propertyImages[activeImageIndex] ||
    'https://via.placeholder.com/1080x1080?text=Premium+Listing';

  const youtubeEmbedId = getYoutubeEmbedId(property.youtubeUrl);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100 h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-10 flex justify-between items-center">
          <Link to="/properties" className="flex items-center gap-2 text-zinc-900 hover:text-blue-600 transition-colors min-w-0">
            <ArrowLeft size={20} className="shrink-0" />
            <span className="font-bold text-sm tracking-tight truncate">목록으로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {isAdmin && !id?.startsWith('sample') && (
              <Link 
                to={`/admin?edit=${property.id}`}
                className="hidden sm:flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-full font-bold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Edit3 size={14} /> 
                <span>매물 수정</span>
              </Link>
            )}

            <button className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 rounded-full transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-22 md:pt-24 pb-14 md:pb-20 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Property Top Info Bar */}
          <div className="mb-6 md:mb-10 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
              <div className="p-5 md:p-6 text-center group transition-colors hover:bg-orange-50/30">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2 md:mb-3">所在地 / 最寄駅</p>
                <p className="text-sm font-bold text-zinc-900 mb-1 break-keep">{property.location}</p>
                <p className="text-xs font-medium text-zinc-400">{property.nearestStation || '-'}</p>
              </div>

              <div className="p-5 md:p-6 text-center group transition-colors hover:bg-red-50/30">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 md:mb-3">間取り / 面積</p>
                <p className="text-sm font-bold text-zinc-900 mb-1">{property.floorPlan || '-'}</p>
                <p className="text-xs font-medium text-zinc-400">{property.area || '실측대기'}</p>
              </div>

              <div className="p-5 md:p-6 text-center group transition-colors hover:bg-emerald-50/30">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 md:mb-3">物件種別 / 建築年数</p>
                <p className="text-sm font-bold text-zinc-900 mb-1">
                  {getPropertyTypeLabel(property.type)}
                </p>
                <p className="text-xs font-medium text-zinc-400">{property.completionYear || '-'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-stretch mb-8 md:mb-12">
            
            {/* Left Card: Gallery */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border border-zinc-200 shadow-xl md:shadow-2xl flex flex-col h-full justify-between">
              <div className="flex flex-col gap-4 md:gap-6 flex-1">
                {/* Main Image */}
                <div className="relative aspect-[4/3] md:aspect-square max-h-[550px] overflow-hidden rounded-2xl shadow-lg bg-zinc-200 group/main cursor-zoom-in">
                  <motion.div 
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full"
                    onClick={() => setIsZoomed(true)}
                  >
                    <img 
                      src={normalizeImageSrc(currentImage)} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-black/40 backdrop-blur-md px-3 md:px-4 py-2 rounded-full text-white text-[10px] font-bold tracking-widest uppercase">
                      {propertyImages.length ? activeImageIndex + 1 : 0} / {propertyImages.length || 0}
                    </div>

                    {propertyImages.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-3 md:px-6 opacity-100 md:opacity-0 md:group-hover/main:opacity-100 transition-opacity">
                        <button 
                          onClick={prevImage}
                          className="w-11 h-11 md:w-14 md:h-14 flex items-center justify-center bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                          title="이전 이미지"
                        >
                          <ChevronLeft size={24} />
                        </button>

                        <button 
                          onClick={nextImage}
                          className="w-11 h-11 md:w-14 md:h-14 flex items-center justify-center bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                          title="다음 이미지"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Thumbnails */}
                {propertyImages.length > 1 && (
                  <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {propertyImages.map((img, i) => (
                      <button 
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                          activeImageIndex === i ? 'border-blue-600 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={normalizeImageSrc(img)} 
                          alt={`${property.title} ${i + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-3 md:mt-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center">
                이미지를 클릭하여 전체 화면으로 보기
              </p>
            </div>

            {/* Right Card: Property Info & Contact */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border border-zinc-200 shadow-xl md:shadow-2xl relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[60px]" />
                
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-600 text-[10px] font-bold text-white uppercase tracking-widest rounded-full">
                      {getPropertyTypeLabel(property.type)}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <MapPin size={12} /> {property.location}
                    </span>
                  </div>

                  <h1 className="text-xl md:text-2xl font-bold tracking-tighter mb-3 leading-tight text-zinc-900 break-keep">
                    {property.title}
                  </h1>

                  <div className="text-xl md:text-2xl font-black text-blue-600 tracking-tighter mb-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100/40 inline-block w-full text-center whitespace-pre-wrap leading-tight">
                    {property.price.replace(/상담\s*문의/g, '').trim()}
                  </div>

                  <div className="space-y-3 mb-5 border-t border-zinc-100 pt-5 text-zinc-700">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm">담당자</span>
                      <span className="font-bold text-zinc-900">오사카J부동산 전담팀</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm">등록일</span>
                      <span className="font-bold text-zinc-900">상시공고</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm">상태</span>
                      <span className="text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        문의 요망
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
                      지금 바로 상담하기
                    </p>
                    
                    <a 
                      href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-4 md:py-5 bg-[#FEE500] text-[#3C1E1E] font-black text-base md:text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageCircle size={22} /> 카카오톡 실시간 상담
                    </a>
                    
                    <a 
                      href={`https://line.me/R/ti/p/${settings.lineId.startsWith('@') ? settings.lineId : '@' + settings.lineId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-4 md:py-5 bg-[#06C755] text-white font-black text-base md:text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageSquare size={22} /> 라인(LINE) 상담
                    </a>

                    <a 
                      href={settings.instagramUrl || `https://www.instagram.com/${settings.instagramId.replace('@', '')}/`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-4 md:py-5 bg-gradient-to-tr from-[#f9ce67] via-[#f07030] to-[#833ab4] text-white font-black text-base md:text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Instagram size={22} /> 인스타그램 문의
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            
            <div className="flex flex-col h-full">
              {property.description && (
                <div className="bg-white p-5 md:p-10 rounded-3xl border border-zinc-200 shadow-xl h-full">
                  <h2 className="text-lg md:text-xl font-bold mb-5 md:mb-6 border-b border-zinc-100 pb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" />
                    상세 설명
                  </h2>
                  <p className="text-zinc-700 leading-relaxed whitespace-pre-line font-medium text-sm md:text-[15px]">
                    {property.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col h-full">
              {/* YouTube Video or Google Maps Section */}
              {property.youtubeUrl && youtubeEmbedId ? (
                <div className="bg-zinc-950 p-5 md:p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[60px] -translate-y-12 translate-x-12" />

                  <div className="relative z-10 flex flex-col items-center h-full justify-center">
                    <div className="flex items-center gap-3 mb-6 md:mb-8 text-center">
                      <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                        <Youtube size={20} className="text-white" />
                      </div>
                      <h3 className="font-bold text-base md:text-lg text-white tracking-tight">
                        유튜브 쇼츠 현장 매물 영상
                      </h3>
                    </div>
                     
                    <div className="w-full aspect-[9/16] max-w-[300px] sm:max-w-[360px] md:max-w-[420px] rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/5">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeEmbedId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                     
                    <div className="mt-6 md:mt-8 flex flex-col items-center text-center">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-2">
                        Editor&apos;s Choice
                      </p>
                      <p className="text-xs text-zinc-400 font-medium italic">
                        &quot;현장의 감동을 영상으로 직접 확인해보세요&quot;
                      </p>
                    </div>
                  </div>
                </div>
              ) : property.mapAddress?.trim() ? (
                <div className="bg-white p-5 md:p-8 rounded-3xl border border-zinc-200 shadow-xl relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] -translate-y-12 translate-x-12" />

                  <div className="relative z-10 flex flex-col items-center h-full">
                    <div className="flex items-center gap-3 mb-6 md:mb-8 w-full border-b border-zinc-100 pb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <MapPin size={20} className="text-white" />
                      </div>
                      <h3 className="font-bold text-base md:text-lg text-zinc-900 tracking-tight">
                        매물 위치 지도 & 구조
                      </h3>
                    </div>
                     
                    <div className="w-full flex-1 flex flex-col items-center">
                      {/* Google Maps Section */}
                      <div className="w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-zinc-100 border border-zinc-200 mb-5 md:mb-6">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.google.com/maps?q=${encodeURIComponent(property.mapAddress)}&output=embed`}
                          title="Property Location Map"
                          frameBorder="0"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="w-full h-full"
                        />
                      </div>

                      {/* View Large Map Button */}
                      <div className="mb-7 md:mb-8 w-full max-w-[420px]">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.mapAddress)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
                        >
                          <ExternalLink size={16} /> Google Maps에서 크게 보기
                        </a>
                      </div>

                      {/* Floor Plan Image Section */}
                      {property.floorPlanImage && (
                        <div className="w-full flex flex-col items-center pt-7 md:pt-8 border-t border-zinc-100">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-4">
                            매물 구조도 (間取り)
                          </p>
                          <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-lg bg-white border border-zinc-100">
                            <img 
                              src={normalizeImageSrc(property.floorPlanImage)} 
                              alt="Floor Plan" 
                              className="w-full h-auto object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl flex items-center justify-center p-8 md:p-10 text-center">
                  <div className="max-w-xs">
                    <MapPin className="mx-auto text-zinc-300 mb-4" size={48} />
                    <p className="text-zinc-400 text-sm font-medium">
                      상세 위치는 담당자 상담을 통해 <br />안내해 드리고 있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-3 md:p-10"
            onClick={() => setIsZoomed(false)}
          >
            <button 
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            >
              <X size={24} />
            </button>

            <div className="relative w-full h-full flex items-center justify-center pt-10 pb-16 md:pb-20">
              <motion.img 
                key={activeImageIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={normalizeImageSrc(currentImage)} 
                alt={property.title}
                className="max-w-full max-h-full object-contain select-none"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />

              {propertyImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-2 md:left-10 w-11 h-11 md:w-16 md:h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    title="이전 이미지"
                  >
                    <ChevronLeft size={28} />
                  </button>

                  <button 
                    onClick={nextImage}
                    className="absolute right-2 md:right-10 w-11 h-11 md:w-16 md:h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    title="다음 이미지"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-8 md:bottom-10 text-white/50 text-xs font-bold tracking-widest uppercase">
              {propertyImages.length ? activeImageIndex + 1 : 0} / {propertyImages.length || 0}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white py-10 md:py-12 px-4 md:px-10 border-t border-zinc-100 text-center">
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.18em] md:tracking-[0.2em] leading-relaxed">
          © OSAKA J REAL ESTATE & LEGAL J OFFICE. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
