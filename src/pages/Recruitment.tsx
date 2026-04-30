import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Users, 
  Heart, 
  Globe, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  Navigation,
  MessageCircle,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Recruitment = () => {
  const positions = [
    {
      title: "일본 부동산 전담팀 (신입/경력)",
      type: "정규직 / 업무위탁 / 아르바이트 / 계약직",
      location: "오사카 사무실 근무",
      tags: ["부동산", "커뮤니케이션", "일본어 가능자"],
      description: "오사카 지역의 프리미엄 매물을 발굴하고 고객 맞춤형 부동산 컨설팅 서비스를 제공합니다."
    },
    {
      title: "행정서사 서포터 / 법무팀",
      type: "정규직 / 업무위탁 / 아르바이트 / 계약직",
      location: "오사카 사무실 근무",
      tags: ["법률", "행정서사", "서류 작성"],
      description: "Legal_J Office의 행정 업무를 지원하며, 비자 및 법인 설립 등 전문 컨설팅 프로세스를 함께합니다."
    },
    {
      title: "디지털 마케터 / 콘텐츠 제작",
      type: "정규직 / 업무위탁 / 아르바이트 / 계약직",
      location: "오사카 사무실 근무",
      tags: ["SNS 마케팅", "유튜브", "콘텐츠 제작"],
      description: "오사카J부동산의 브랜드 가치를 높이고 다양한 플랫폼에서 고객들과 소통할 콘텐츠를 제작합니다."
    }
  ];

  return (
    <div className="min-h-screen bg-luxury-black text-white font-sans selection:bg-blue-600/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-luxury-black/80 backdrop-blur-xl border-b border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white leading-none">LEGAL J</span>
            <span className="text-[10px] tracking-[0.3em] font-bold text-blue-600 mt-1 uppercase">Real Estate Group</span>
          </Link>
          <div className="flex gap-10 items-center">
            <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">홈페이지로 돌아가기</Link>
            <a 
              href="https://pf.kakao.com/_TSvgxb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              채용 문의하기 <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.1),transparent)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-block py-2 px-6 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 text-xs font-bold tracking-widest uppercase mb-8">
              <a href="https://legalj.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">行政書士Legal_ J office</a> & 오사카J부동산
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight">
              오사카 한인 경제의 중심에서 <br />
              <span className="text-blue-600">함께 성장할 인재</span>를 찾습니다.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Legal_J Office & 오사카J부동산은 정직과 신뢰를 바탕으로 한 부동산 문화를 선도합니다. <br />
              도전적이고 열정적인 당신과 함께 글로벌 전문가로 거듭나고 싶습니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Heart,
                title: "Integrity",
                desc: "정직함은 우리의 최우선 가치입니다. 고객과의 신뢰를 지키는 것을 모든 업무의 근간으로 삼습니다."
              },
              {
                icon: Globe,
                title: "Global Expert",
                desc: "일본 부동산 시장을 넘어 글로벌 부동산 전문가로서의 식견과 전문성을 끊임없이 연마합니다."
              },
              {
                icon: Users,
                title: "Team Harmony",
                desc: "개인의 성장이 팀의 성공으로 이어지는 조화로운 파트너십과 서로 존중하는 문화를 지향합니다."
              }
            ].map((value, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-10 rounded-3xl bg-zinc-800/40 backdrop-blur-sm border border-white/10 hover:border-blue-600/50 transition-all group shadow-xl"
              >
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <value.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{value.title}</h3>
                <p className="text-zinc-300 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">현재 채용중인 포지션</h2>
              <p className="text-zinc-500">당신의 재능을 펼칠 기회를 확인하세요.</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-600/10 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              Recruitment Ongoing
            </div>
          </div>

          <div className="grid gap-6">
            {positions.map((pos, idx) => (
              <motion.a 
                key={idx}
                href="https://jp.indeed.com/cmp/%E8%A1%8C%E6%94%BF%E6%9B%B8%E5%A3%AB%E4%BA%8B%E5%8B%99%E6%89%80-2?campaignid=mobvjcmp&from=mobviewjob&tk=1jne7710b226j000&fromjk=08750926a1d93037"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-zinc-900 border border-white/5 rounded-3xl p-8 hover:bg-zinc-800/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-8 cursor-pointer block"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-600/30 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">{pos.type}</span>
                    <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {pos.location}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-500 transition-colors">{pos.title}</h3>
                  <p className="text-zinc-300 max-w-2xl leading-relaxed">{pos.description}</p>
                  <div className="flex gap-4 mt-6">
                    {pos.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-zinc-400 text-xs font-medium">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-full bg-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all text-zinc-500">
                  <ArrowRight className="w-8 h-8" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Welfare / CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(37,99,235,0.05),transparent)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                  오사카J부동산과 함께 <br />
                  새로운 커리어를 시작하세요
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-12">
                  {[
                    "토, 일, 공휴일 회사휴무",
                    "오전 10시 ~ 오후 6시 근무시스템 제공",
                    "잔업 없음",
                    "시프트제 OK",
                    "휴식 / 휴일 조정 유연하게 대응",
                    "비즈니스 캐주얼 사복 출근 OK"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-200" />
                      <span className="font-medium text-white/90">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="https://pf.kakao.com/_TSvgxb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" /> 카톡으로 지원하기
                  </a>
                  <a 
                    href="https://jp.indeed.com/jobs?q=%E8%A1%8C%E6%94%BF%E6%9B%B8%E5%A3%ABLegal_+J+office&l=&ts=1777519887828&from=searchOnHP&rq=1&rsIdx=0&newcount=2&fromage=last&vjk=08750926a1d93037"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-500/30 transition-all flex items-center gap-2"
                  >
                    온라인 지원하기
                  </a>
                </div>
              </div>
              <div className="w-full md:w-1/3 aspect-square bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-2">상시 채용</h4>
                <p className="text-blue-100/70 mb-8">당신의 포지션이 없더라도 주저 말고 문을 두드려주세요.</p>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Waiting for you</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimal */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-sm font-bold text-white mb-2">
              <a href="https://legalj.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">行政書士Legal_ J office</a> & OSAKA J REAL ESTATE
            </span>
            <p className="text-zinc-600 text-xs text-balance">오사카 한인 경제의 발전을 위해 노력하는 전문가 그룹입니다.</p>
          </div>
          <div className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-bold">
            © 2026 LEGAL J GROUP. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Recruitment;
