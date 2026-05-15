import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Edit3,
  X
} from 'lucide-react';
import { Property } from '../types';
import { firebaseService } from '../services/firebaseService';
import { AnimatePresence } from 'motion/react';

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

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (property) {
      setActiveImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (property) {
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
    // Admin check logic removed in static mode
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
             {isAdmin && !id?.startsWith('sample') && (
               <Link 
                to={`/admin?edit=${property.id}`}
                className="flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-full font-bold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
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

      <main className="pt-24 pb-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Property Top Info Bar */}
          <div className="mb-10 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
               <div className="p-6 text-center group transition-colors hover:bg-orange-50/30">
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">所在地 / 最寄駅</p>
                  <p className="text-[13px] font-bold text-zinc-900 mb-1">{property.location}</p>
                  <p className="text-xs font-medium text-zinc-400">{property.nearestStation || '-'}</p>
               </div>
               <div className="p-6 text-center group transition-colors hover:bg-red-50/30">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">間取り / 面積</p>
                  <p className="text-[13px] font-bold text-zinc-900 mb-1">{property.floorPlan || '-'}</p>
                  <p className="text-xs font-medium text-zinc-400">{property.area || '실측대기'}</p>
               </div>
                <div className="p-6 text-center group transition-colors hover:bg-emerald-50/30">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">物件種別 / 建築年数</p>
                  <p className="text-[13px] font-bold text-zinc-900 mb-1">
                    {property.type === 'OneRoom'
                      ? '원룸/투룸'
                      : property.type === 'Family'
                        ? '타워맨션'
                        : property.type === 'Office'
                          ? '상가/사무실'
                          : '수익형 부동산'}
                  </p>
                  <p className="text-xs font-medium text-zinc-400">{property.completionYear || '-'}</p>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch mb-12">
            
            {/* Left Card: Gallery */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-2xl flex flex-col h-full justify-between">
              <div className="flex flex-col gap-6 flex-1">
                 <div className="relative aspect-square max-h-[550px] overflow-hidden rounded-2xl shadow-lg bg-zinc-200 group/main cursor-zoom-in">
                    <motion.div 
                      key={activeImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full"
                      onClick={() => setIsZoomed(true)}
                    >
                      <img 
                        src={property.images[activeImageIndex] || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-bold tracking-widest uppercase">
                         {activeImageIndex + 1} / {property.images.length}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover/main:opacity-100 transition-opacity">
                         <button 
                          onClick={prevImage}
                          className="w-14 h-14 flex items-center justify-center bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                          title="이전 이미지"
                         >
                           <ChevronLeft size={28} />
                         </button>
                         <button 
                          onClick={nextImage}
                          className="w-14 h-14 flex items-center justify-center bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                          title="다음 이미지"
                         >
                           <ChevronRight size={28} />
                         </button>
                      </div>
                    </motion.div>
                 </div>

                 <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {property.images.map((img, i) => (
                       <button 
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                          activeImageIndex === i ? 'border-blue-600 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                       >
                          <img 
                            src={img} 
                            alt={`${property.title} ${i + 1}`} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                       </button>
                    ))}
                 </div>
              </div>
              <p className="mt-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center">
                이미지를 클릭하여 전체 화면으로 보기
              </p>
            </div>

            {/* Right Card: Property Info & Contact */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-2xl relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[60px]" />
                
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-600 text-[10px] font-bold text-white uppercase tracking-widest rounded-full">
                      {property.type}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <MapPin size={12} /> {property.location}
                    </span>
                  </div>

                  <h1 className="text-xl md:text-2xl font-bold tracking-tighter mb-3 leading-tight text-zinc-900">
                    {property.title}
                  </h1>

                  <div className="text-2xl font-black text-blue-600 tracking-tighter mb-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100/20 inline-block w-full text-center whitespace-pre-wrap">
                    {property.price.replace(/상담\s*문의/g, '').trim()}
                  </div>

                  <div className="space-y-3 mb-4 border-t border-zinc-100 pt-5 text-zinc-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">담당자</span>
                      <span className="font-bold text-zinc-900">오사카J부동산 전담팀</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">등록일</span>
                      <span className="font-bold text-zinc-900">상시공고</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">상태</span>
                      <span className="text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1">
                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                         문의 요망
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
                      지금 바로 상담하기
                    </p>
                    
                    <a 
                      href={settings.kakaoUrl?.trim() || `https://pf.kakao.com/${settings.kakaoId.startsWith('_') ? settings.kakaoId : '_' + settings.kakaoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-5 bg-[#FEE500] text-[#3C1E1E] font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageCircle size={24} /> 카카오톡 실시간 상담
                    </a>
                    
                    <a 
                      href={`https://line.me/R/ti/p/${settings.lineId.startsWith('@') ? settings.lineId : '@' + settings.lineId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-5 bg-[#06C755] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageSquare size={24} /> 라인(LINE) 상담
                    </a>

                    <a 
                      href={settings.instagramUrl || `https://www.instagram.com/${settings.instagramId.replace('@', '')}/`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-5 bg-gradient-to-tr from-[#f9ce67] via-[#f07030] to-[#833ab4] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Instagram size={24} /> 인스타그램 문의
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            <div className="flex flex-col h-full">
              {property.description && (
                <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-200 shadow-xl h-full">
                  <h2 className="text-xl font-bold mb-6 border-b border-zinc-100 pb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" />
                    상세 설명
                  </h2>
                  <p className="text-zinc-700 leading-relaxed whitespace-pre-line font-medium text-sm">
                    {property.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col h-full">
              {property.youtubeUrl && (
                <div className="bg-zinc-950 p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[60px] -translate-y-12 translate-x-12" />
                  <div className="relative z-10 flex flex-col items-center h-full justify-center">
                     <div className="flex items-center gap-3 mb-8">
                       <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                         <Youtube size={20} className="text-white" />
                       </div>
                       <h3 className="font-bold text-lg text-white tracking-tight">
                         유튜브 쇼츠 현장 매물 영상
                       </h3>
                     </div>
                     
                     <div className="w-full aspect-[9/16] max-w-[280px] rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/5">
                       <iframe
                         width="100%"
                         height="100%"
                         src={`https://www.youtube.com/embed/${property.youtubeUrl.includes('shorts/') ? property.youtubeUrl.split('shorts/')[1].split('?')[0] : property.youtubeUrl.split('v=')[1]?.split('&')[0]}`}
                         title="YouTube video player"
                         frameBorder="0"
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                         allowFullScreen
                         className="w-full h-full"
                       ></iframe>
                     </div>
                     
                     <div className="mt-8 flex flex-col items-center">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-2">
                          Editor&apos;s Choice
                        </p>
                        <p className="text-xs text-zinc-400 font-medium italic">
                          "현장의 감동을 영상으로 직접 확인해보세요"
                        </p>
                     </div>
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
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-4 md:p-10"
            onClick={() => setIsZoomed(false)}
          >
            <button 
              onClick={() => setIsZoomed(false)}
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            >
              <X size={24} />
            </button>

            <div className="relative w-full h-full flex items-center justify-center pt-10 pb-20">
              <motion.img 
                key={activeImageIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={property.images[activeImageIndex]} 
                alt={property.title}
                className="max-w-full max-h-full object-contain select-none"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />

              <button 
                onClick={prevImage}
                className="absolute left-4 md:left-10 w-16 h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="이전 이미지"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 md:right-10 w-16 h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="다음 이미지"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            <div className="absolute bottom-10 text-white/50 text-xs font-bold tracking-widest uppercase">
              {activeImageIndex + 1} / {property.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 md:px-10 border-t border-zinc-100 text-center">
         <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            © OSAKA J REAL ESTATE & LEGAL J OFFICE. ALL RIGHTS RESERVED.
         </p>
      </footer>
    </div>
  );
}
