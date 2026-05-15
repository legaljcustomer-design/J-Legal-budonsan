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
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  CloudUpload,
  ArrowLeft,
  Youtube,
  Link as LinkIcon,
  Search,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createGithubService, GithubService } from '../services/githubService';
import ImageManager from '../components/admin/ImageManager';

interface StorageData {
  token: string;
  owner: string;
  repo: string;
}

type TabType = 'overview' | 'properties' | 'reviews' | 'osakaInfo' | 'siteConfig';

export default function Admin() {
  const [authData, setAuthData] = useState<StorageData | null>(null);
  const [inputData, setInputData] = useState<StorageData>({
    token: '',
    owner: '',
    repo: 'legalj-osaka'
  });
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ghService, setGhService] = useState<GithubService | null>(null);
  
  // Data States
  const [originalData, setOriginalData] = useState<any>(null);
  const [pendingData, setPendingData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Editor States
  const [editingItem, setEditingItem] = useState<{ type: string; item: any; index: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // New Image States for Stage 3
  const [pendingImageFiles, setPendingImageFiles] = useState<{ path: string; base64: string }[]>([]);
  const [deletedImagePaths, setDeletedImagePaths] = useState<string[]>([]);

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
        setOriginalData(ghRaw);
        setPendingData(JSON.parse(JSON.stringify(ghRaw))); // Deep clone for editing
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
    setOriginalData(null);
    setPendingData(null);
  };

  // CRUD Helpers
  const hasChanges = () => {
    const jsonChanged = JSON.stringify(originalData) !== JSON.stringify(pendingData);
    const imagesChanged = pendingImageFiles.length > 0 || deletedImagePaths.length > 0;
    return jsonChanged || imagesChanged;
  };

  // Handle Save Status Timeout
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => {
        setSaveStatus(null);
      }, 8000); // 8 seconds
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const saveToGitHub = async () => {
    if (!ghService || !pendingData) return;
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // 1. JSON 파일 변경사항 수집
      const filesToUpdate: { path: string; content?: string; base64?: string; delete?: boolean }[] = [];
      
      if (JSON.stringify(originalData.properties) !== JSON.stringify(pendingData.properties)) {
        filesToUpdate.push({ path: 'src/data/properties.json', content: JSON.stringify(pendingData.properties, null, 2) });
      }
      if (JSON.stringify(originalData.reviews) !== JSON.stringify(pendingData.reviews)) {
        filesToUpdate.push({ path: 'src/data/reviews.json', content: JSON.stringify(pendingData.reviews, null, 2) });
      }
      if (JSON.stringify(originalData.osakaInfo) !== JSON.stringify(pendingData.osakaInfo)) {
        filesToUpdate.push({ path: 'src/data/osakaInfo.json', content: JSON.stringify(pendingData.osakaInfo, null, 2) });
      }
      if (JSON.stringify(originalData.siteConfig) !== JSON.stringify(pendingData.siteConfig)) {
        filesToUpdate.push({ path: 'src/data/siteConfig.json', content: JSON.stringify(pendingData.siteConfig, null, 2) });
      }

      // 2. 새로운 이미지 파일 추가
      pendingImageFiles.forEach(file => {
        filesToUpdate.push({ path: file.path, base64: file.base64 });
      });

      // 3. 삭제 요청된 이미지 처리
      deletedImagePaths.forEach(path => {
        filesToUpdate.push({ path, delete: true });
      });

      if (filesToUpdate.length === 0) {
         setSaveStatus({ success: true, message: '변경사항이 없습니다.' });
         setIsSaving(false);
         return;
      }

      // 4. 단일 커밋 실행
      await ghService.commitMultipleFiles(filesToUpdate, 'chore: update site content and assets via admin CMS');
      
      // 5. 성공 후 상태 동기화
      setOriginalData(JSON.parse(JSON.stringify(pendingData)));
      setPendingImageFiles([]);
      setDeletedImagePaths([]);
      
      setSaveStatus({ 
        success: true, 
        message: '이미지와 데이터 반영이 완료되었습니다! Cloudflare Pages 배포 후 공개 홈페이지에 반영됩니다. (1~2분 소요)' 
      });
    } catch (err: any) {
      console.error(err);
      let errorMsg = `저장 실패: ${err.message}`;
      if (err.message.includes('401')) {
        errorMsg = '저장 실패: GitHub 토큰이 만료되었거나 권한(Contents: Write)이 부족합니다.';
      } else if (err.message.includes('409')) {
        errorMsg = '저장 실패: GitHub 저장소에 병렬적인 변경이 발생했습니다. 새로고침 후 다시 시도해 주세요.';
      }
      setSaveStatus({ success: false, message: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Sub-components (Editors) ---

  const PropertyEditor = () => {
    const list = pendingData.properties || [];
    
    const handleDelete = (index: number) => {
      if (window.confirm('이 매물을 정말 삭제하시겠습니까?')) {
        const newList = [...list];
        newList.splice(index, 1);
        setPendingData({ ...pendingData, properties: newList });
      }
    };

    const handleEdit = (item: any, index: number) => {
      setEditingItem({ type: 'property', item: { ...item }, index });
    };

    const handleAdd = () => {
      const newItem = {
        id: `prop-${Date.now()}`,
        title: '',
        price: '¥0',
        location: '',
        type: 'OneRoom',
        description: '',
        images: [],
        features: [],
        construction: '',
        completionYear: '',
        nearestStation: '',
        youtubeUrl: '',
        floorPlan: '',
        area: '',
        isFeatured: false,
        createdAt: Date.now(),
        ownerId: 'system'
      };
      setEditingItem({ type: 'property', item: newItem, index: -1 });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">매물 데이터 관리</h2>
          <button onClick={handleAdd} className="flex items-center gap-2 bg-electric-blue px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-electric-blue/20 hover:scale-[1.02] transition-all">
            <Plus size={16} /> 매물 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((prop: any, idx: number) => (
            <div key={prop.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl group hover:border-electric-blue/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${prop.isFeatured ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                    {prop.isFeatured ? 'featured' : 'standard'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(prop, idx)} className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(idx)} className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-1 line-clamp-1">{prop.title}</h3>
                <p className="text-electric-blue text-xs font-bold mb-3">{prop.price}</p>
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded italic">{prop.type}</span>
                  <span>{prop.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ReviewEditor = () => {
    const list = pendingData.reviews || [];
    
    const handleDelete = (index: number) => {
      if (window.confirm('후기를 삭제하시겠습니까?')) {
        const newList = [...list];
        newList.splice(index, 1);
        setPendingData({ ...pendingData, reviews: newList });
      }
    };

    const handleEdit = (item: any, index: number) => {
      setEditingItem({ type: 'review', item: { ...item }, index });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">고객 후기 관리</h2>
          <button onClick={() => setEditingItem({ type: 'review', item: { id: `rev-${Date.now()}`, title: '', content: '', author: '', image: '', createdAt: Date.now() }, index: -1 })} className="flex items-center gap-2 bg-zinc-800 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
            <Plus size={16} /> 후기 추가
          </button>
        </div>

        <div className="space-y-3">
          {list.map((rev: any, idx: number) => (
            <div key={rev.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden border border-white/10">
                   {rev.image && (
                     <img 
                       src={normalizeImageSrc(rev.image)} 
                       alt="" 
                       className="w-full h-full object-cover" 
                       referrerPolicy="no-referrer"
                       onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                       }}
                     />
                   )}
                 </div>
                 <div>
                   <h3 className="font-bold text-sm">{rev.title}</h3>
                   <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{rev.author}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(rev, idx)} className="p-2 text-zinc-500 hover:text-white transition-all"><Edit3 size={16} /></button>
                <button onClick={() => handleDelete(idx)} className="p-2 text-zinc-500 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ConfigEditor = () => {
    const config = pendingData.siteConfig;
    if (!config) return null;

    const handleChange = (key: string, value: any) => {
      setPendingData({
        ...pendingData,
        siteConfig: { ...config, [key]: value }
      });
    };

    return (
      <div className="max-w-2xl space-y-10">
        <h2 className="text-2xl font-bold tracking-tight mb-8">사이트 기본 설정</h2>
        
        <div className="space-y-8">
           <section>
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b border-white/5 pb-2">Hero Section</h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-2">Main Title</label>
                 <input 
                   className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 text-sm"
                   value={config.heroTitle}
                   onChange={e => handleChange('heroTitle', e.target.value)}
                 />
               </div>
               <div>
                 <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-2">Subtitle</label>
                 <input 
                   className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 text-sm"
                   value={config.heroSubtitle}
                   onChange={e => handleChange('heroSubtitle', e.target.value)}
                 />
               </div>
             </div>
           </section>

           <section>
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b border-white/5 pb-2">Contact & SNS</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-2">Kakao ID</label>
                  <input 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 text-sm"
                    value={config.kakaoId}
                    onChange={e => handleChange('kakaoId', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-2">LINE ID</label>
                  <input 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 text-sm"
                    value={config.lineId}
                    onChange={e => handleChange('lineId', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-2">YouTube URL</label>
                  <input 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-3 outline-none focus:border-electric-blue/50 text-sm"
                    value={config.youtubeUrl}
                    onChange={e => handleChange('youtubeUrl', e.target.value)}
                  />
                </div>
             </div>
           </section>
        </div>
      </div>
    );
  };

  const OsakaInfoEditor = () => {
    const list = pendingData.osakaInfo || [];
    
    const handleDelete = (index: number) => {
      if (window.confirm('정보글을 삭제하시겠습니까?')) {
        const newList = [...list];
        newList.splice(index, 1);
        setPendingData({ ...pendingData, osakaInfo: newList });
      }
    };

    const handleEdit = (item: any, index: number) => {
      setEditingItem({ type: 'osakaInfo', item: { ...item }, index });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">오사카 지역 정보 관리</h2>
          <button onClick={() => setEditingItem({ type: 'osakaInfo', item: { id: `info-${Date.now()}`, title: '', description: '', img: '', createdAt: Date.now() }, index: -1 })} className="flex items-center gap-2 bg-zinc-800 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
            <Plus size={16} /> 정보글 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((info: any, idx: number) => (
            <div key={info.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex gap-6 items-start">
               <div className="w-24 h-24 bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0">
                 {info.img && (
                   <img 
                     src={normalizeImageSrc(info.img)} 
                     alt="" 
                     className="w-full h-full object-cover" 
                     referrerPolicy="no-referrer"
                     onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                     }}
                   />
                 )}
               </div>
               <div className="flex-grow">
                 <h3 className="font-bold text-sm mb-1">{info.title}</h3>
                 <p className="text-zinc-500 text-xs line-clamp-2 mb-4">{info.description}</p>
                 <div className="flex gap-2">
                    <button onClick={() => handleEdit(info, idx)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all underline outline-offset-4">수정</button>
                    <button onClick={() => handleDelete(idx)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-all underline outline-offset-4">삭제</button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Global Helpers ---
  
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

  // Dashboard Editor Screen
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <AnimatePresence>
        {editingItem && (
          <ModalForm 
            editingItem={editingItem} 
            setEditingItem={setEditingItem}
            pendingData={pendingData}
            setPendingData={setPendingData}
            setPendingImageFiles={setPendingImageFiles}
            setDeletedImagePaths={setDeletedImagePaths}
          />
        )}
      </AnimatePresence>

      {/* Persistence Notification/Top Bar for Mobile */}
      {hasChanges() && (
        <div className="absolute top-0 inset-x-0 bg-amber-500 text-black py-2 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] z-50 animate-pulse">
           저장되지 않은 변경사항이 있습니다. 사이트에 반영하기 버튼을 눌러주세요.
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-80 bg-zinc-900 border-r border-white/5 p-8 flex flex-col justify-between h-auto md:h-screen md:sticky top-0 pt-16 md:pt-8">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-electric-blue rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-electric-blue/20">J</div>
            <div className="flex flex-col">
               <h1 className="text-lg font-black tracking-tighter leading-none mb-1">OSA-J CMS</h1>
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stage 2 Editor</span>
            </div>
          </div>

          <nav className="space-y-1">
             {[
               { id: 'overview', icon: Eye, label: 'Overview' },
               { id: 'properties', icon: Building2, label: 'Properties' },
               { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
               { id: 'osakaInfo', icon: Info, label: 'Osaka Info' },
               { id: 'siteConfig', icon: Settings, label: 'Site Settings' },
             ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-zinc-900 shadow-xl' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="tab-active" className="ml-auto"><ChevronRight size={14} /></motion.div>}
                </button>
             ))}
          </nav>
        </div>

        <div className="mt-12 space-y-4">
           <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5"><Github size={14} className="text-zinc-500" /></div>
              <div className="overflow-hidden">
                 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">{authData.owner}/{authData.repo}</p>
                 <p className="text-[10px] font-black text-emerald-500 uppercase">Live Main Branch</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
             <LogOut size={14} /> 시스템 로그아웃
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow min-h-screen bg-zinc-950 p-8 md:p-16 relative">
        {/* Global Save Action Floating Bar & Notifications */}
        <div className="fixed bottom-10 inset-x-0 md:left-auto md:right-10 flex flex-col items-end gap-3 z-40 p-6 pointer-events-none md:p-0">
          <AnimatePresence>
            {saveStatus && (
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className={`px-6 py-4 rounded-2xl border flex items-center gap-3 text-[11px] font-black uppercase tracking-widest pointer-events-auto shadow-2xl backdrop-blur-md max-w-sm ${
                  saveStatus.success 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}
              >
                {saveStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <div className="flex-grow">
                  <p className="leading-tight">{saveStatus.message}</p>
                </div>
                <button onClick={() => setSaveStatus(null)} className="p-1 hover:bg-white/5 rounded-md transition-all"><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {hasChanges() && (
            <motion.button 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={saveToGitHub}
              disabled={isSaving}
              className={`pointer-events-auto flex items-center gap-3 px-10 py-5 text-sm shadow-2xl scale-110 md:scale-100 rounded-2xl font-black uppercase tracking-widest transition-all ${
                isSaving 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-electric-blue text-white hover:scale-105 active:scale-95 shadow-electric-blue/20'
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CloudUpload size={18} />}
              {isSaving ? 'GitHub 반영 중...' : '사이트에 반영하기'}
            </motion.button>
          )}
        </div>

        <div className="max-w-5xl mx-auto">
          {activeTab === 'overview' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-16">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                    <Database className="text-electric-blue" size={24} />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">DASHBOARD OVERVIEW</h1>
                  <p className="text-zinc-500 text-lg font-light leading-relaxed max-w-2xl">
                    현재 GitHub에 저장된 실시간 데이터를 관리하고 있습니다. 좌측 메뉴를 통해 각 섹션별 콘텐츠를 수정할 수 있으며, 모든 수정사항은 마지막에 한꺼번에 반영됩니다.
                  </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { label: 'Total Properties', value: pendingData?.properties?.length || 0, icon: Building2, color: 'text-zinc-100' },
                     { label: 'Active Reviews', value: pendingData?.reviews?.length || 0, icon: MessageSquare, color: 'text-emerald-500' },
                     { label: 'Area Articles', value: pendingData?.osakaInfo?.length || 0, icon: Info, color: 'text-electric-blue' },
                     { label: 'Pending Changes', value: hasChanges() ? 'Yes' : 'No', icon: AlertCircle, color: hasChanges() ? 'text-amber-500' : 'text-zinc-800' },
                   ].map((stat, i) => (
                      <div key={i} className="bg-zinc-900 border border-white/5 p-8 rounded-3xl group hover:border-white/10 transition-all">
                        <stat.icon className={`mb-6 ${stat.color}`} size={24} />
                        <div className="text-3xl font-black mb-2">{stat.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{stat.label}</div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          <div className="animate-in fade-in duration-500">
            {activeTab === 'properties' && <PropertyEditor />}
            {activeTab === 'reviews' && <ReviewEditor />}
            {activeTab === 'osakaInfo' && <OsakaInfoEditor />}
            {activeTab === 'siteConfig' && <ConfigEditor />}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Standalone Modal Form Component ---

interface ModalFormProps {
  editingItem: { type: string; item: any; index: number } | null;
  setEditingItem: (val: { type: string; item: any; index: number } | null) => void;
  pendingData: any;
  setPendingData: (val: any) => void;
  setPendingImageFiles: React.Dispatch<React.SetStateAction<{ path: string; base64: string }[]>>;
  setDeletedImagePaths: React.Dispatch<React.SetStateAction<string[]>>;
}

const ModalForm = ({ 
  editingItem, 
  setEditingItem, 
  pendingData, 
  setPendingData, 
  setPendingImageFiles, 
  setDeletedImagePaths 
}: ModalFormProps) => {
  if (!editingItem) return null;

  const { type, item, index } = editingItem;
  
  const handleFormChange = (key: string, value: any) => {
    setEditingItem({ ...editingItem, item: { ...item, [key]: value } });
  };

  const handleImageChange = (
    newUrls: string[],
    newFiles: { path: string; base64: string }[],
    deletedPaths: string[],
    type: string
  ) => {
    const isReview = type === 'review';
    const isInfo = type === 'osakaInfo';
    
    const updatedItem = { ...item };
    if (isReview) updatedItem.image = newUrls[0] || '';
    else if (isInfo) updatedItem.img = newUrls[0] || '';
    else updatedItem.images = newUrls;

    setEditingItem({ ...editingItem, item: updatedItem });
    
    // Update pending image files state
    setPendingImageFiles(prev => {
      // Filter out any existing pending files for this specific ID/item to avoid duplicates or stale files
      const folderRef = isReview ? 'reviews' : isInfo ? 'osaka-info' : `properties/${item.id}`;
      const filtered = prev.filter(f => !f.path.includes(folderRef));
      return [...filtered, ...newFiles];
    });

    // Update deleted image paths state
    setDeletedImagePaths(prev => {
      const combined = new Set([...prev, ...deletedPaths]);
      return Array.from(combined);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPending = { ...pendingData };
    const key = type === 'property' ? 'properties' : type === 'review' ? 'reviews' : 'osakaInfo';
    const list = [...updatedPending[key]];

    if (index === -1) {
      list.unshift(item);
    } else {
      list[index] = item;
    }

    updatedPending[key] = list;
    setPendingData(updatedPending);
    setEditingItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
           <h3 className="text-xl font-bold uppercase tracking-tight">{index === -1 ? '신규 등록' : '내용 수정'} - {type}</h3>
           <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        
        <form id="modal-form" onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-grow space-y-10 custom-scrollbar">
          {type === 'property' && (
            <div className="space-y-8">
               <ImageManager 
                title="매물 이미지 관리"
                folderPath={`properties/${item.id}`}
                images={item.images || []}
                mode="multiple"
                onChange={(urls, files, deleted) => handleImageChange(urls, files, deleted, 'property')}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">매물 제목</label>
                  <input className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.title} onChange={e => handleFormChange('title', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">가격</label>
                  <input className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.price} onChange={e => handleFormChange('price', e.target.value)} placeholder="예: ¥188,000" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">위치 (구/동)</label>
                  <input className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.location} onChange={e => handleFormChange('location', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">타입</label>
                  <select className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.type} onChange={e => handleFormChange('type', e.target.value)}>
                    <option value="OneRoom">OneRoom</option>
                    <option value="Family">Family</option>
                    <option value="TwoRoom">TwoRoom</option>
                    <option value="Investment">Investment</option>
                    <option value="Office">Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">가까운 역</label>
                  <input className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.nearestStation} onChange={e => handleFormChange('nearestStation', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">유튜브 쇼츠 URL</label>
                  <input
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all"
                    value={item.youtubeUrl || ''}
                    onChange={e => handleFormChange('youtubeUrl', e.target.value)}
                    placeholder="예: https://www.youtube.com/shorts/VIDEO_ID 또는 https://www.youtube.com/watch?v=VIDEO_ID"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">상세 설명</label>
                  <textarea rows={6} className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm leading-relaxed focus:border-electric-blue/50 outline-none transition-all" value={item.description} onChange={e => handleFormChange('description', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {type === 'review' && (
            <div className="space-y-8">
              <ImageManager 
                title="후기 대표 이미지"
                folderPath={`reviews`}
                images={item.image ? [item.image] : []}
                mode="single"
                onChange={(urls, files, deleted) => handleImageChange(urls, files, deleted, 'review')}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">리뷰 제목</label>
                  <input className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.title} onChange={e => handleFormChange('title', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">작성자</label>
                  <input className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.author} onChange={e => handleFormChange('author', e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">후기 내용</label>
                  <textarea rows={6} className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm leading-relaxed focus:border-electric-blue/50 outline-none transition-all" value={item.content} onChange={e => handleFormChange('content', e.target.value)} required />
                </div>
              </div>
            </div>
          )}

          {type === 'osakaInfo' && (
            <div className="space-y-8">
              <ImageManager 
                title="정보글 대표 이미지"
                folderPath={`osaka-info`}
                images={item.img ? [item.img] : []}
                mode="single"
                onChange={(urls, files, deleted) => handleImageChange(urls, files, deleted, 'osakaInfo')}
              />
              <div className="space-y-8">
                 <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">글 제목</label>
                  <input className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm focus:border-electric-blue/50 outline-none transition-all" value={item.title} onChange={e => handleFormChange('title', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">설명 (요약)</label>
                  <textarea rows={4} className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-4 text-sm leading-relaxed focus:border-electric-blue/50 outline-none transition-all" value={item.description} onChange={e => handleFormChange('description', e.target.value)} required />
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="p-8 border-t border-white/5 bg-zinc-950/50 flex justify-end gap-4">
           <button onClick={() => setEditingItem(null)} className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all">취소</button>
           <button form="modal-form" type="submit" className="px-10 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all">저장하기</button>
        </div>
      </motion.div>
    </div>
  );
};
