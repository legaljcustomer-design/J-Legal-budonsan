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
  MapPin
} from 'lucide-react';
import { auth, signInWithGoogle } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { Property } from '../types';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    type: 'OneRoom' as Property['type'],
    description: '',
    images: [''],
    features: [''],
    isFeatured: false,
  });

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const data = await firebaseService.getProperties();
      setProperties(data);
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  const claimAdmin = async () => {
    if (!auth.currentUser) return;
    setClaiming(true);
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        email: auth.currentUser.email,
        role: 'super'
      });
      window.location.reload();
    } catch (error) {
       alert("권한 승인에 실패했습니다. (이메일 불일치 또는 규칙 위반)");
       console.error(error);
    } finally {
      setClaiming(false);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleSave = async (e: React.FormEvent) => {
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
        isFeatured: false,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await firebaseService.deleteProperty(id);
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (prop: Property) => {
    setFormData({
      title: prop.title,
      price: prop.price,
      location: prop.location,
      type: prop.type,
      description: prop.description,
      images: prop.images,
      features: prop.features,
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
          <Link to="/" className="block mt-8 text-zinc-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase">홈으로 돌아가기</Link>
        </motion.div>
      </div>
    );
  }

  // Not an admin yet
  const [isAdminLocally, setIsAdminLocally] = useState<boolean | null>(null);
  useEffect(() => {
    firebaseService.checkAdminStatus(auth.currentUser!.uid).then(setIsAdminLocally);
  }, []);

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
                <div className="w-6 h-6 bg-electric-blue rounded-xs flex items-center justify-center font-bold text-xs">J</div>
                <h1 className="text-2xl font-bold tracking-tighter uppercase">Admin Management</h1>
            </div>
            <div className="tag-blue lowercase tracking-normal px-2 py-0.5">signed in as {auth.currentUser.email}</div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                  setIsAdding(true);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    price: '',
                    location: '',
                    type: 'OneRoom',
                    description: '',
                    images: [''],
                    features: [''],
                    isFeatured: false,
                  });
              }}
              className="blue-glow-btn px-8 py-3 text-xs"
            >
              <Plus size={16} className="inline mr-2" /> NEW LISTING
            </button>
            <button onClick={handleLogout} className="bg-white/5 border border-white/10 p-3 rounded-full hover:bg-white/10 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
             <div className="bg-zinc-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-10 border border-white/10 relative shadow-2xl">
                <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <div className="text-electric-blue text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Property Form</div>
                <h2 className="text-3xl font-bold mb-10 tracking-tighter">{editingId ? '매물 정보 수정' : '신규 매물 등록'}</h2>
                
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-full">
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">매물 제목</label>
                        <input 
                            required
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 focus:border-electric-blue/50 outline-none transition-all font-light"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="예: 난바역 도보 5분 신축 맨션"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">가격</label>
                        <input 
                            required
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 focus:border-electric-blue/50 outline-none transition-all font-light"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            placeholder="예: 월 8.5만엔"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">위치</label>
                        <input 
                            required
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 focus:border-electric-blue/50 outline-none transition-all font-light"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="예: 오사카시 나니와구"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">매물 유형</label>
                        <select 
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 focus:border-electric-blue/50 outline-none transition-all font-light appearance-none"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                        >
                            <option value="OneRoom">원룸/투룸</option>
                            <option value="Family">가족형 아파트</option>
                            <option value="Office">상가/사무실</option>
                            <option value="Investment">수익형 부동산</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 px-6 rounded-xl border border-white/5">
                         <input 
                            type="checkbox"
                            id="isFeatured"
                            className="w-5 h-5 accent-emerald-500 rounded-sm"
                            checked={formData.isFeatured}
                            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                         />
                         <label htmlFor="isFeatured" className="text-sm font-bold uppercase tracking-widest text-zinc-400">Featured Listing</label>
                    </div>
                    <div className="col-span-full">
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold">이미지 URL (최대 10개)</label>
                        {formData.images.map((url, idx) => (
                            <div key={idx} className="flex gap-4 mb-4">
                                <input 
                                    className="flex-1 bg-white/5 border border-white/5 rounded-xl px-5 py-4 focus:border-electric-blue/50 outline-none transition-all font-light"
                                    value={url}
                                    onChange={e => {
                                        const newImages = [...formData.images];
                                        newImages[idx] = e.target.value;
                                        setFormData({ ...formData, images: newImages });
                                    }}
                                    placeholder="https://..."
                                />
                                <button type="button" onClick={() => {
                                     const newImages = formData.images.filter((_, i) => i !== idx);
                                     setFormData({ ...formData, images: newImages.length ? newImages : [''] });
                                }} className="p-4 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={20} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })} className="text-[10px] font-bold text-electric-blue uppercase tracking-widest hover:text-blue-400 transition-colors">+ ADD IMAGE</button>
                    </div>
                    <div className="col-span-full">
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">상세 설명</label>
                        <textarea 
                            required
                            rows={6}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 focus:border-electric-blue/50 outline-none transition-all font-light resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="col-span-full pt-6">
                        <button 
                            disabled={saving}
                            className="blue-glow-btn w-full py-5 text-sm flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                           {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
                           {editingId ? '매물 정보 업데이트' : '매물 등록 완료'}
                        </button>
                    </div>
                </form>
             </div>
          </motion.div>
        )}

        {loading ? (
            <div className="flex justify-center py-40">
                <Loader2 className="animate-spin text-electric-blue" size={48} />
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {properties.map(prop => (
                    <div key={prop.id} className="bg-zinc-900 border border-white/5 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-10 group hover:border-white/10 transition-all shadow-xl">
                        <img src={prop.images[0] || 'https://via.placeholder.com/200'} className="w-full md:w-40 h-40 object-cover rounded-2xl" />
                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 justify-center md:justify-start">
                                <h3 className="font-bold text-2xl tracking-tighter">{prop.title}</h3>
                                <div className="flex gap-2 justify-center">
                                    <span className="tag-blue lowercase tracking-normal text-[10px] py-0.5">{prop.type}</span>
                                    {prop.isFeatured && <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded text-[10px] font-bold uppercase tracking-widest">Featured</span>}
                                </div>
                            </div>
                            <div className="text-zinc-500 text-sm flex flex-wrap gap-x-8 gap-y-2 justify-center md:justify-start">
                                <span className="flex items-center gap-1"><MapPin size={14} className="text-zinc-600" /> {prop.location}</span>
                                <span className="font-bold text-white text-lg tracking-tighter">{prop.price}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 md:opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleEdit(prop)} className="p-4 bg-white/5 hover:bg-white/10 hover:text-electric-blue rounded-2xl transition-all border border-white/5"><Edit3 size={20} /></button>
                            <button onClick={() => handleDelete(prop.id)} className="p-4 bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-red-500/5"><Trash2 size={20} /></button>
                        </div>
                    </div>
                ))}
                {properties.length === 0 && (
                    <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-3xl text-zinc-600 uppercase tracking-widest font-bold">
                        관리중인 매물이 없습니다.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
