import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Github, 
  Database, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut,
  Building2,
  MessageSquare,
  Info,
  Settings,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createGithubService, GithubService } from '../services/githubService';

interface StorageData {
  token: string;
  owner: string;
  repo: string;
}

export default function Admin() {
  const [authData, setAuthData] = useState<StorageData | null>(null);
  const [inputData, setInputData] = useState<StorageData>({
    token: '',
    owner: '',
    repo: 'legalj-osaka' // Default fallback or common name
  });
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ghService, setGhService] = useState<GithubService | null>(null);
  const [gitHubData, setGitHubData] = useState<any>(null);
  const [activeView, setActiveView] = useState<'overview' | 'raw'>('overview');

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_gh_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      verifyAndInitialize(parsed);
    } else {
      setIsVerifying(false);
    }
  }, []);

  const verifyAndInitialize = async (data: StorageData) => {
    setIsVerifying(true);
    setError(null);
    try {
      const service = createGithubService(data.token, data.owner, data.repo);
      const isValid = await service.validateAuth();
      if (isValid) {
        setAuthData(data);
        setGhService(service);
        sessionStorage.setItem('admin_gh_auth', JSON.stringify(data));
        
        // Fetch data
        const ghRaw = await service.getAllConfigData();
        setGitHubData(ghRaw);
      } else {
        throw new Error('유효하지 않은 토큰이거나 저장소 권한이 없습니다.');
      }
    } catch (err: any) {
      setError(err.message || 'GitHub 인증에 실패했습니다.');
      sessionStorage.removeItem('admin_gh_auth');
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputData.token || !inputData.owner || !inputData.repo) {
      setError('모든 필드를 입력해 주세요.');
      return;
    }
    setLoading(true);
    verifyAndInitialize(inputData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_gh_auth');
    setAuthData(null);
    setGhService(null);
    setGitHubData(null);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="animate-spin text-electric-blue mx-auto mb-4" size={48} />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">인증 정보를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  // Token Input Screen
  if (!authData) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-white/5 p-12 rounded-3xl max-w-md w-full shadow-2xl"
        >
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-8 mx-auto">
            <Key className="text-electric-blue" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">Admin CMS 접속</h1>
          <p className="text-zinc-500 text-center text-sm mb-10 font-light">GitHub Personal Access Token이 필요합니다.</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">Repository Owner</label>
              <input 
                className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 transition-all text-sm"
                value={inputData.owner}
                onChange={e => setInputData({...inputData, owner: e.target.value})}
                placeholder="GitHub Username"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">Repository Name</label>
              <input 
                className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 transition-all text-sm"
                value={inputData.repo}
                onChange={e => setInputData({...inputData, repo: e.target.value})}
                placeholder="Repository Name"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">Personal Access Token (Fine-grained)</label>
              <input 
                type="password"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 transition-all text-sm"
                value={inputData.token}
                onChange={e => setInputData({...inputData, token: e.target.value})}
                placeholder="github_pat_..."
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="blue-glow-btn w-full py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Github size={16} />}
              인증 및 접속
            </button>
          </form>

          <Link to="/" className="block text-center mt-8 text-zinc-600 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em]">
            홈으로 돌아가기
          </Link>
        </motion.div>
      </div>
    );
  }

  // Dashboard Screen (Stage 1: Read Only)
  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-electric-blue rounded-lg flex items-center justify-center font-black">J</div>
              <h1 className="text-2xl font-bold tracking-tight uppercase">Admin CMS <span className="text-zinc-600">Stage 1</span></h1>
            </div>
            <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><Github size={12} /> {authData.owner}/{authData.repo}</span>
              <span className="text-zinc-800">|</span>
              <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Authenticated</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10"
          >
            <LogOut size={14} /> 로그아웃
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold tracking-tight">가져온 데이터 개요</h2>
                <div className="flex bg-zinc-950 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveView('overview')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeView === 'overview' ? 'bg-electric-blue text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    요약 보기
                  </button>
                  <button 
                    onClick={() => setActiveView('raw')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeView === 'raw' ? 'bg-electric-blue text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    RAW JSON
                  </button>
                </div>
              </div>

              {activeView === 'overview' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stats Cards */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4 text-electric-blue">
                      <Building2 size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">매물 데이터</span>
                    </div>
                    <div className="text-3xl font-bold mb-4">{gitHubData?.properties?.length || 0} <span className="text-sm font-normal text-zinc-600">Items</span></div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">src/data/properties.json</div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                      <MessageSquare size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">고객 후기</span>
                    </div>
                    <div className="text-3xl font-bold mb-4">{gitHubData?.reviews?.length || 0} <span className="text-sm font-normal text-zinc-600">Reviews</span></div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">src/data/reviews.json</div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                      <Info size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">오사카 정보</span>
                    </div>
                    <div className="text-3xl font-bold mb-4">{gitHubData?.osakaInfo?.length || 0} <span className="text-sm font-normal text-zinc-600">Articles</span></div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">src/data/osakaInfo.json</div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                      <Settings size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">사이트 설정</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-500 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={14} /> OK
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">src/data/siteConfig.json</div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 rounded-2xl p-6 overflow-hidden border border-white/5">
                   <pre className="text-[10px] text-zinc-500 font-mono overflow-auto max-h-[400px]">
                     {JSON.stringify(gitHubData, null, 2)}
                   </pre>
                </div>
              )}
            </div>

            <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Database className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">1단계: 실시간 데이터 동기화 완료</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                    현재 GitHub 저장소의 `main` 브랜치에 있는 실제 JSON 데이터를 읽어오는 데 성공했습니다. 
                    다음 단계(2단계)에서는 이 인터페이스를 통해 직접 데이터를 수정하고 저장하는 기능이 추가될 예정입니다.
                  </p>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                       <CheckCircle2 size={12} /> JSON 전환 완료
                     </div>
                     <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                       <CheckCircle2 size={12} /> 토큰 보안 통실
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info / Coming Soon */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-white/5 pb-4">시스템 정보</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">배포 방식</span>
                  <span className="font-bold">Static (GitHub API)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">인증 세션</span>
                  <span className="font-bold">SessionMemory</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">GitHub Branch</span>
                  <span className="font-bold">main</span>
                </div>
              </div>
            </div>

            <div className="bg-electric-blue/5 border border-electric-blue/20 p-8 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-electric-blue opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
               <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Phase 2: 편집 기능</h3>
               <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                 각 항목 옆에 '수정' 버튼이 추가되며, 변경된 데이터는 임시 보관되었다가 한 번의 커밋으로 GitHub에 반영됩니다.
               </p>
               <div className="space-y-2 opacity-50">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                     <span>매물 등록/수정/삭제</span>
                     <ChevronRight size={12} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                     <span>사진 업로드 (압축 자동화)</span>
                     <ChevronRight size={12} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                     <span>다중 파일 통합 커밋</span>
                     <ChevronRight size={12} />
                  </div>
               </div>
            </div>

            <a 
              href={`https://github.com/${authData.owner}/${authData.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-4 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-zinc-500"
            >
              <ExternalLink className="inline mr-2" size={12} /> GitHub 저장소 방문
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
