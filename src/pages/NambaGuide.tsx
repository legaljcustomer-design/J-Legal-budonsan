import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Train, 
  ShoppingBag, 
  Coffee, 
  Utensils,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NambaGuide() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-10 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-zinc-600 hover:text-electric-blue transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-tight">홈으로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-2">
            <img 
              src="https://yt3.googleusercontent.com/ZNWF_L7kuC_cHkMdodV_-R27ac-oQModzDEdDhAm6h-qFoA9-mLjbJMi05MbA66tU8U7zqVN=s160-c-k-c0x00ffffff-no-rj" 
              alt="J Logo" 
              className="w-8 h-8 rounded-sm object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold tracking-tight">오사카J부동산</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -z-10 rounded-l-[100px]" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="tag-blue mb-6">Area Guide #01</div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 leading-tight">
              난바 & 도톤보리<br />
              <span className="text-electric-blue text-3xl md:text-4xl">오사카의 심장이 뛰는 곳</span>
            </h1>
            <p className="text-zinc-600 text-lg leading-relaxed mb-10 font-light">
              오사카 하면 가장 먼저 떠오르는 도심 지역입니다. <br />
              전 세계의 여행객이 모이는 화려한 네온사인과 미식의 거리, <br />
              그리고 주요 철도 노선이 집결하는 최고의 교통 요충지입니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <Train className="text-blue-600" size={24} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Main Station</p>
                  <p className="font-bold">난바역 (6개 노선)</p>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <Utensils className="text-blue-600" size={24} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Lifestyle</p>
                  <p className="font-bold">미식 & 쇼핑의 중심</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-electric-blue/10 rounded-full blur-3xl opacity-50" />
            <div className="rounded-[40px] overflow-hidden shadow-2xl relative">
              <img 
                src="https://i.namu.wiki/i/h972-p_G-i13DqN13Ulh4ktKLuwmaDrKsUCff62Ye7fstKQMlGTL9BK2K6rbqyJdutM7FWnvollhRsUDRVLGDr0NXsQpiOZQYraAfmzXkk_jl_kGpf1Vocoy2xFtfB9QHtZ9PR2shhdDiDxiY6jAZF47AzTgRsCTO7qZJSfX8Cs.webp" 
                alt="Dotonbori Night" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-sm font-bold flex items-center gap-2">
                  <MapPin size={16} /> Osaka, Chuo-ku, Namba
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Details */}
      <section className="py-24 px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <ShoppingBag className="text-electric-blue" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4 italic">Shopping & Entertainment</h3>
              <p className="text-zinc-600 text-sm leading-relaxed font-light">
                신사이바시 수지, 난바 파크스, 빅카메라 등 대형 쇼핑몰이 밀집해 있습니다. 일상 속에서도 모든 생활 편의를 누릴 수 있는 최신식 인프라를 제공합니다.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <Coffee className="text-electric-blue" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4 italic">Global Vibe</h3>
              <p className="text-zinc-600 text-sm leading-relaxed font-light">
                외국인 거주 비율이 높고 글로벌 오피스가 많아 매우 열린 분위기를 자랑합니다. 임대 수요가 끊이지 않아 투자용 부동산으로도 최고의 선택지입니다.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <Train className="text-electric-blue" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4 italic">Transport hub</h3>
              <p className="text-zinc-600 text-sm leading-relaxed font-light">
                미도스지선, 센니치마에선, 난카이선 등 오사카 전체를 연결하는 허브입니다. 간사이 공항까지 직통으로 이동 가능하여 출장이 잦은 직장인들에게 인기가 많습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Area Properties */}
      <section className="py-24 px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="tag-blue mb-4">Properties</div>
              <h2 className="text-4xl font-bold tracking-tighter">난바/도톤보리 추천 매물</h2>
            </div>
            <Link to="/#properties" className="text-sm font-bold text-blue-600 flex items-center gap-2 group">
              전체 매물 보러가기 <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sample Property */}
            <div className="group border border-zinc-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop" 
                  alt="Property" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-electric-blue text-[10px] text-white font-bold rounded-lg group-hover:bg-zinc-900 transition-colors">
                  BEST RECOMENDED
                </div>
              </div>
              <div className="p-8">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">Chuo-ku, Namba</p>
                <h3 className="text-xl font-bold mb-4 tracking-tight">난바 스테이션 자이 1LDK</h3>
                <div className="flex justify-between items-center border-t border-zinc-100 pt-6">
                  <p className="text-2xl font-bold tracking-tighter">¥145,000 / 월</p>
                  <a 
                    href="https://pf.kakao.com/_TSvgxb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <MessageCircle size={20} className="text-[#3C1E1E]" />
                  </a>
                </div>
              </div>
            </div>

            <div className="group border border-zinc-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=2070&auto=format&fit=crop" 
                  alt="Property" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-electric-blue text-[10px] text-white font-bold rounded-lg group-hover:bg-zinc-900 transition-colors">
                   MODERN TOWER
                </div>
              </div>
              <div className="p-8">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">Chuo-ku, Dotonbori</p>
                <h3 className="text-xl font-bold mb-4 tracking-tight">도톤보리 리버뷰 펜트하우스</h3>
                <div className="flex justify-between items-center border-t border-zinc-100 pt-6">
                  <p className="text-2xl font-bold tracking-tighter">¥2,300,000 / 월</p>
                  <a 
                    href="https://pf.kakao.com/_TSvgxb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <MessageCircle size={20} className="text-[#3C1E1E]" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-zinc-200 rounded-3xl p-8 hover:border-electric-blue transition-colors group cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle size={32} className="text-yellow-500" />
              </div>
              <p className="font-bold text-center mb-2">이외에도 더 많은<br/>비공개 매물이 있습니다</p>
              <p className="text-xs text-zinc-500 mb-6 font-light">원하시는 조건으로 찾아드려요!</p>
              <a 
                href="https://pf.kakao.com/_TSvgxb" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                1:1 전문가 상담
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 py-20 px-10 text-white">
        <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter mb-8">찾으시는 난바 지역 매물이 있으신가요?</h2>
            <p className="text-zinc-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              오사카J부동산은 실시간 공실 정보를 바탕으로 가장 빠르고 정확한 컨설팅을 제공합니다. <br />
              한국어 완벽 대응으로 계약부터 입주까지 함께하겠습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="https://pf.kakao.com/_TSvgxb" className="bg-yellow-400 text-black px-12 py-5 rounded-full font-bold hover:bg-yellow-300 transition-all flex items-center justify-center gap-2">
                <MessageCircle size={20} /> 카카오톡 상담하기
              </a>
              <Link to="/#hero" className="border border-white/20 px-12 py-5 rounded-full font-bold hover:bg-white/10 transition-all">
                포트폴리오 더 보기
              </Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
