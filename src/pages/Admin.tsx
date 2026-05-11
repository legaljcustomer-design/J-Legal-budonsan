import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  Save, 
  X, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Upload
} from 'lucide-react';
import { auth, signInWithGoogle, db } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { Property } from '../types';
import { Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { compressImage } from '../lib/imageUtils';

function ImageUpload({ 
    label, 
    value, 
    onChange, 
    onRemove 
}: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void,
    onRemove?: () => void
}) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Compress image to ~1024px width to stay within Firestore 1MB limit
            const base64 = await compressImage(file, 1024, 0.7);
            onChange(base64);
        } catch (error) {
            console.error("Compression error:", error);
            alert("이미지 처리 중 오류가 발생했습니다.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{label}</label>
            <div className="flex gap-4 items-start">
                {value ? (
                    <div className="relative group w-32 h-32 flex-shrink-0">
                        <img src={value} className="w-full h-full object-cover rounded-xl border border-white/10" alt="Preview" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <button 
                                type="button" 
                                onClick={onRemove}
                                className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="w-32 h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-electric-blue/50 hover:bg-electric-blue/5 transition-all text-zinc-500 hover:text-electric-blue">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                        <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">{uploading ? '처리 중...' : '이미지 선택'}</span>
                    </label>
                )}
                {value && !onRemove && (
                    <label className="text-[10px] font-bold text-electric-blue hover:text-blue-400 cursor-pointer transition-colors uppercase tracking-widest mt-2">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                        이미지 변경
                    </label>
                )}
            </div>
        </div>
    );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'properties' | 'reviews' | 'settings'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAdminLocally, setIsAdminLocally] = useState<boolean | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    type: 'OneRoom' as Property['type'],
    description: '',
    images: [''],
    features: [''],
    construction: '',
    completionYear: '',
    isFeatured: false,
  });

  const [reviewData, setReviewData] = useState({
    title: '',
    subtitle: '',
    image: '',
  });

  const [settingsData, setSettingsData] = useState({
    heroTitle: '오사카 최고의 매물을 찾으시나요?',
    heroSubtitle: '난바, 우메다 등 주요 거점의 신축 맨션부터 수익형 빌딩까지, 오사카 거주 한국인 및 투자자를 위한 맞춤형 럭셔리 컨설팅을 제공합니다.',
    consultationBaseCount: 102,
    kakaoId: 'oosakaj',
    lineId: '@845immxy',
    instagramId: 'oosaka_j',
    youtubeUrl: 'https://youtube.com/channel/UC7DZHrosVAYHdfP6VzSPvog?si=fyvJj_s_8MHE-l7W'
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (activeTab === 'properties') {
        const data = await firebaseService.getProperties();
        setProperties(data);
      } else if (activeTab === 'reviews') {
        const data = await firebaseService.getReviews();
        setReviews(data);
      } else if (activeTab === 'settings') {
        const data = await firebaseService.getSettings();
        if (data) setSettingsData(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    };
    if (isAdminLocally) {
      fetchData();
    }
  }, [activeTab, isAdminLocally]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        firebaseService.checkAdminStatus(user.uid).then(status => {
          setIsAdminLocally(status);
        });
      } else {
        setIsAdminLocally(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('로그인 팝업이 닫혔습니다. 로그인 버튼을 눌러 다시 시도해 주세요.');
      } else if (error.code === 'auth/popup-blocked') {
        setLoginError('브라우저의 팝업 차단 설정을 해제해 주세요.');
      } else {
        setLoginError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
      console.error(error);
    }
  };

  const claimAdmin = async () => {
    if (!auth.currentUser) return;
    setLoginError(null);
    setClaiming(true);
    try {
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        email: auth.currentUser.email,
        role: 'super'
      });
      setIsAdminLocally(true);
    } catch (error: any) {
       setLoginError('권한 승인에 실패했습니다. (이메일 불일치 또는 규칙 위반)');
       console.error(error);
    } finally {
      setClaiming(false);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await firebaseService.updateProperty(editingId, formData);
        setProperties(properties.map(p => p.id === editingId ? { ...p, ...formData } : p));
      } else {
        const id = await firebaseService.addProperty(formData);
        if (id) {
          const freshData = await firebaseService.getProperties();
          setProperties(freshData);
        }
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({
        title: '',
        price: '',
        location: '',
        type: 'OneRoom',
        description: '',
        images: [''],
        features: [''],
        construction: '',
        completionYear: '',
        isFeatured: false,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await firebaseService.addReview(reviewData);
      const freshData = await firebaseService.getReviews();
      setReviews(freshData);
      setIsAdding(false);
      setReviewData({ title: '', subtitle: '', image: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await firebaseService.updateSettings(settingsData);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await firebaseService.deleteProperty(id);
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("후기를 삭제하시겠습니까?")) return;
    try {
      await firebaseService.deleteReview(id);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditProperty = (prop: Property) => {
    setFormData({
      title: prop.title,
      price: prop.price,
      location: prop.location,
      type: prop.type,
      description: prop.description,
      images: prop.images,
      features: prop.features,
      construction: prop.construction || '',
      completionYear: prop.completionYear || '',
      isFeatured: prop.isFeatured,
    });
    setEditingId(prop.id);
    setIsAdding(true);
  };

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center p-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-white/5 p-12 rounded-3xl max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-12 h-12 bg-electric-blue rounded-lg mx-auto flex items-center justify-center font-bold text-2xl mb-8">J</div>
          <h1 className="text-3xl font-bold mb-4 tracking-tighter uppercase">Admin Portal</h1>
          <p className="text-zinc-500 mb-10 font-light text-sm tracking-wide">관리자 계정으로 로그인이 필요합니다.</p>
          <button 
            onClick={handleLogin}
            className="blue-glow-btn w-full py-4 flex items-center justify-center gap-3 text-sm"
          >
            Google 계정으로 로그인
          </button>
          
          {loginError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-medium"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              <p>{loginError}</p>
            </motion.div>
          )}
          
          <Link to="/" className="block mt-8 text-zinc-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase">홈으로 돌아가기</Link>
        </motion.div>
      </div>
    );
  }

  if (isAdminLocally === null) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <Loader2 className="animate-spin text-electric-blue" size={48} />
      </div>
    );
  }

  if (isAdminLocally === false) {
    return (
        <div className="min-h-screen bg-luxury-black flex items-center justify-center p-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/5 p-12 rounded-3xl max-w-md w-full text-center"
          >
            <AlertCircle size={48} className="text-electric-blue mx-auto mb-8 opacity-50" />
            <h1 className="text-3xl font-bold mb-4 tracking-tighter uppercase">Access Pending</h1>
            <p className="text-zinc-500 mb-10 font-light text-sm">
                <span className="text-white marker:">{auth.currentUser.email}</span> 계정은 <br />현재 관리자로 등록되지 않았습니다.
            </p>
            {auth.currentUser.email === 'legalj.customer@gmail.com' && (
                <button 
                    disabled={claiming}
                    onClick={claimAdmin}
                    className="blue-glow-btn w-full py-4 text-xs"
                >
                    {claiming ? <Loader2 className="animate-spin inline mr-2" /> : '관리자 권한 승인하기'}
                </button>
            )}

            {loginError && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-medium"
                >
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <p>{loginError}</p>
                </motion.div>
            )}

            <button onClick={handleLogout} className="block w-full mt-6 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">로그아웃</button>
            <Link to="/" className="block mt-10 text-zinc-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">홈으로 돌아가기</Link>
          </motion.div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://yt3.googleusercontent.com/ZNWF_L7kuC_cHkMdodV_-R27ac-oQModzDEdDhAm6h-qFoA9-mLjbJMi05MbA66tU8U7zqVN=s160-c-k-c0x00ffffff-no-rj" 
                  alt="J Logo" 
                  className="w-6 h-6 rounded-xs object-cover"
                  referrerPolicy="no-referrer"
                />
                <h1 className="text-2xl font-bold tracking-tighter uppercase">Admin Management</h1>
            </div>
            <div className="tag-blue lowercase tracking-normal px-2 py-0.5">signed in as {auth.currentUser.email}</div>
          </div>
          <div className="flex gap-4">
            <button onClick={handleLogout} className="bg-white/5 border border-white/10 p-3 rounded-full hover:bg-white/10 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-10 border-b border-white/5 pb-1">
            <button 
                onClick={() => setActiveTab('properties')}
                className={`pb-4 px-2 text-xs font-bold tracking-widest transition-all relative ${activeTab === 'properties' ? 'text-electric-blue' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                매물 관리
                {activeTab === 'properties' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue shadow-[0_0_10px_#2563eb]" />}
            </button>
            <button 
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 px-2 text-xs font-bold tracking-widest transition-all relative ${activeTab === 'reviews' ? 'text-electric-blue' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                후기 관리
                {activeTab === 'reviews' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue shadow-[0_0_10px_#2563eb]" />}
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`pb-4 px-2 text-xs font-bold tracking-widest transition-all relative ${activeTab === 'settings' ? 'text-electric-blue' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                사이트 설정
                {activeTab === 'settings' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue shadow-[0_0_10px_#2563eb]" />}
            </button>
        </div>

        {/* Tab Content Actions */}
        {activeTab !== 'settings' && (
            <div className="flex justify-end mb-8">
                 <button 
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        if (activeTab === 'properties') {
                            setFormData({
                                title: '',
                                price: '',
                                location: '',
                                type: 'OneRoom',
                                description: '',
                                images: [''],
                                features: [''],
                                construction: '',
                                completionYear: '',
                                isFeatured: false,
                            });
                        } else {
                            setReviewData({ title: '', subtitle: '', image: '' });
                        }
                    }}
                    className="blue-glow-btn px-8 py-3 text-[10px]"
                >
                    <Plus size={14} className="inline mr-2" /> 
                    {activeTab === 'properties' ? '신규 매물 등록' : '신규 후기 등록'}
                </button>
            </div>
        )}

        {/* Modals & Forms */}
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
             <div className="bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-10 border border-white/10 relative shadow-2xl">
                <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                {activeTab === 'properties' ? (
                    <>
                        <div className="text-electric-blue text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Property Form</div>
                        <h2 className="text-3xl font-bold mb-10 tracking-tighter">{editingId ? '매물 정보 수정' : '신규 매물 등록'}</h2>
                        <form onSubmit={handleSaveProperty} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">매물 제목</label>
                                <input required className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="예: 난바역 도보 5분 신축 맨션" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">가격</label>
                                <input required className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="예: 월 8.5만엔" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">위치</label>
                                <input required className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="예: 오사카시 나니와구" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">건물 구조 (철근, 목조 등)</label>
                                <input required className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={formData.construction} onChange={e => setFormData({ ...formData, construction: e.target.value })} placeholder="예: 철근 콘크리트(RC)" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">완공 연도 (축년)</label>
                                <input required className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={formData.completionYear} onChange={e => setFormData({ ...formData, completionYear: e.target.value })} placeholder="예: 2024년 10월" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">매물 유형</label>
                                <select className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all appearance-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                                    <option value="OneRoom">원룸/투룸</option>
                                    <option value="Family">타워맨션</option>
                                    <option value="Office">상가/사무실</option>
                                    <option value="Investment">수익형 부동산</option>
                                    <option value="1LDK+S">1LDK+S</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 px-6 rounded-xl border border-white/5">
                                <input type="checkbox" id="isFeatured" className="w-5 h-5 accent-emerald-500" checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} />
                                <label htmlFor="isFeatured" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Featured Listing</label>
                            </div>
                            <div className="col-span-full">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold">매물 이미지 (최대 10개)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                                    {formData.images.filter(img => img !== '').map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square">
                                            <img src={url} className="w-full h-full object-cover rounded-xl border border-white/10" alt={`Property ${idx}`} />
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newImages = formData.images.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, images: newImages.length ? newImages : [''] });
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.images.filter(img => img !== '').length < 10 && (
                                        <label className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-electric-blue/50 hover:bg-electric-blue/5 transition-all text-zinc-500 hover:text-electric-blue">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const base64 = await compressImage(file, 1024, 0.7);
                                                    const currentImages = formData.images.filter(img => img !== '');
                                                    setFormData({ ...formData, images: [...currentImages, base64] });
                                                }} 
                                            />
                                            <Plus size={20} />
                                            <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">사진 추가</span>
                                        </label>
                                    )}
                                </div>
                                <p className="text-[10px] text-zinc-600">※ 파일 첨부 시 자동으로 최적화되어 업로드됩니다.</p>
                            </div>
                            <div className="col-span-full">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">상세 설명</label>
                                <textarea required rows={4} className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="col-span-full pt-4">
                                <button disabled={saving} className="blue-glow-btn w-full py-4 text-xs flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-electric-blue text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Review Form</div>
                        <h2 className="text-3xl font-bold mb-10 tracking-tighter">신규 후기 등록</h2>
                        <form onSubmit={handleSaveReview} className="space-y-6">
                            <ImageUpload 
                                label="후기 이미지" 
                                value={reviewData.image} 
                                onChange={(val) => setReviewData({ ...reviewData, image: val })}
                                onRemove={() => setReviewData({ ...reviewData, image: '' })}
                            />
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">제목 (예: 아베노구 / 1K / 남향)</label>
                                <input required className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={reviewData.title} onChange={e => setReviewData({ ...reviewData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">부제목 (예: 阿倍野区 / 1K / 南向き)</label>
                                <input required className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={reviewData.subtitle} onChange={e => setReviewData({ ...reviewData, subtitle: e.target.value })} />
                            </div>
                            <div className="pt-4">
                                <button disabled={saving} className="blue-glow-btn w-full py-4 text-xs">
                                    {saving ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Save size={16} className="inline mr-2" />}
                                    후기 등록 완료
                                </button>
                            </div>
                        </form>
                    </>
                )}
             </div>
          </motion.div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
            <div className="max-w-3xl">
                <form onSubmit={handleSaveSettings} className="space-y-8 bg-zinc-900 p-10 rounded-3xl border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="col-span-full">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Hero Title</label>
                            <input className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={settingsData.heroTitle} onChange={e => setSettingsData({ ...settingsData, heroTitle: e.target.value })} />
                        </div>
                        <div className="col-span-full">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Hero Subtitle</label>
                            <textarea rows={3} className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all resize-none" value={settingsData.heroSubtitle} onChange={e => setSettingsData({ ...settingsData, heroSubtitle: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">상담 시작 인원 정보</label>
                            <input type="number" className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={settingsData.consultationBaseCount} onChange={e => setSettingsData({ ...settingsData, consultationBaseCount: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Kakao ID</label>
                            <input className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={settingsData.kakaoId} onChange={e => setSettingsData({ ...settingsData, kakaoId: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Line ID</label>
                            <input className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={settingsData.lineId} onChange={e => setSettingsData({ ...settingsData, lineId: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Instagram ID</label>
                            <input className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={settingsData.instagramId} onChange={e => setSettingsData({ ...settingsData, instagramId: e.target.value })} />
                        </div>
                        <div className="col-span-full">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">YouTube Channel URL</label>
                            <input className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 focus:border-electric-blue/50 outline-none transition-all" value={settingsData.youtubeUrl} onChange={e => setSettingsData({ ...settingsData, youtubeUrl: e.target.value })} />
                        </div>
                    </div>
                    <div className="pt-4">
                        <button disabled={saving} className="blue-glow-btn w-full py-4 text-xs">
                             {saving ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Save size={16} className="inline mr-2" />}
                             설정 저장하기
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* List Content */}
        {!loading && activeTab === 'properties' && (
            <div className="grid grid-cols-1 gap-4">
                {properties.map(prop => (
                    <div key={prop.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-all">
                        <img src={prop.images[0] || 'https://via.placeholder.com/200'} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex gap-2 mb-1">
                                <span className="text-[8px] text-electric-blue font-bold uppercase tracking-widest">{prop.type}</span>
                                {prop.isFeatured && <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">• Featured</span>}
                            </div>
                            <h3 className="font-bold text-lg mb-1">{prop.title}</h3>
                            <p className="text-zinc-500 text-xs">{prop.location} • <span className="text-white font-bold">{prop.price}</span></p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleEditProperty(prop)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><Edit3 size={16} /></button>
                             <button onClick={() => handleDeleteProperty(prop.id)} className="p-3 bg-red-500/5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {!loading && activeTab === 'reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map(review => (
                    <div key={review.id} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all">
                        <div className="aspect-[3/2] relative">
                            <img src={review.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => handleDeleteReview(review.id)} className="p-3 bg-red-500 rounded-full text-white shadow-xl">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="font-bold text-sm mb-1">{review.title}</div>
                            <div className="text-zinc-500 text-xs">{review.subtitle}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {loading && (
            <div className="flex justify-center py-40">
                <Loader2 className="animate-spin text-electric-blue" size={48} />
            </div>
        )}
      </div>
    </div>
  );
}
