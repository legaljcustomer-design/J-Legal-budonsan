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
  Building2,
  Edit3
} from 'lucide-react';
import { Property } from '../types';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../lib/firebase';
import { SAMPLE_PROPERTIES } from '../constants';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        firebaseService.checkAdminStatus(user.uid).then(status => {
          setIsAdmin(status);
        });
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
          
          {/* Property Top Info Bar (Simulating the user's reference) */}
          <div className="mb-10 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
               <div className="p-6 text-center group transition-colors hover:bg-orange-50/30">
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">所在地 / 最寄駅</p>
                  <p className="text-[13px] font-bold text-zinc-900 mb-1">{property.location}</p>
                  <p className="text-xs font-medium text-zinc-500">{property.nearestStation || '상담 문의'}</p>
               </div>
               <div className="p-6 text-center group transition-colors hover:bg-red-50/30">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">間取り / 面積</p>
                  <p className="text-[13px] font-bold text-zinc-900 mb-1">{property.floorPlan || '상담 문의'}</p>
                  <p className="text-xs font-medium text-zinc-500">{property.area || '실측 중'}</p>
               </div>
               <div className="p-6 text-center group transition-colors hover:bg-emerald-50/30">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">物件種別 / 建築年数</p>
                  <p className="text-[13px] font-bold text-zinc-900 mb-1">{property.type === 'OneRoom' ? '원룸/투룸' : property.type === 'Family' ? '타워맨션' : property.type === 'Office' ? '상가/사무실' : '수익형 부동산'}</p>
                  <p className="text-xs font-medium text-zinc-500">{property.completionYear || '상담 문의'}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Left Column: Gallery & Description */}
            <div className="space-y-10">
              {/* Photo Gallery System */}
              <div className="flex flex-col md:flex-row gap-4">
                 {/* Main Image */}
                 <div className="flex-1">
                    <motion.div 
                      key={activeImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-3xl overflow-hidden shadow-2xl bg-zinc-200 aspect-square relative"
                    >
                      <img 
                        src={property.images[activeImageIndex] || 'https://via.placeholder.com/1080x1080?text=Premium+Listing'} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-bold tracking-widest uppercase">
                         Exterior View
                      </div>
                    </motion.div>
                 </div>

                 {/* Thumbnails Sidebar */}
                 <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] no-scrollbar">
                    {property.images.map((img, i) => (
                       <button 
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative w-20 h-24 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
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

                    <div className="text-4xl font-black text-blue-600 tracking-tighter mb-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 inline-block w-full text-center whitespace-pre-wrap">
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
