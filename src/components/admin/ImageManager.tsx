
import React, { useState, useRef } from 'react';
import { 
  CloudUpload, 
  X, 
  GripVertical, 
  Plus, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { compressImage, formatBytes, ProcessedImage } from '../../services/imageService';

interface ImageManagerProps {
  images: string[];
  onChange: (newImages: string[], newFiles: { path: string; base64: string }[], deletedPaths: string[]) => void;
  folderPath: string; // e.g., "properties/prop-1"
  maxImages?: number;
  mode?: 'single' | 'multiple';
  title?: string;
}

interface ImageItem {
  id: string;
  url: string;
  isNew?: boolean;
  base64?: string;
  originalName?: string;
  size?: number;
}

export default function ImageManager({ 
  images = [], 
  onChange, 
  folderPath, 
  maxImages = 15, 
  mode = 'multiple',
  title
}: ImageManagerProps) {
  const [items, setItems] = useState<ImageItem[]>(
    images.map((url, i) => ({ id: `old-${i}-${url}`, url, isNew: false }))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ path: string; base64: string }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop changes while preserving local 'isNew' items
  React.useEffect(() => {
    setItems(prevItems => {
      const newFiles = prevItems.filter(item => item.isNew);
      const existingUrlsFromProp = images.map((url, i) => ({ 
        id: `old-${i}-${url}`, 
        url, 
        isNew: false 
      }));
      
      // If single mode, prop usually wins unless we just uploaded something
      if (mode === 'single' && newFiles.length > 0) {
        return newFiles;
      }

      // Filter multiple mode to avoid showing duplicate if already in newFiles via some other means
      // (though usually urls won't overlap as new items use temporary blob/base64 info)
      return [...existingUrlsFromProp, ...newFiles];
    });
  }, [images, mode]);

  const notifyChange = (newItems: ImageItem[], newPending: { path: string; base64: string }[], newDeleted: string[]) => {
    const finalUrls = newItems.map(item => item.url);
    onChange(finalUrls, newPending, newDeleted);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (mode === 'single' && files.length > 0) {
      // Direct replace for single mode
      processFiles([files[0]]);
    } else {
      processFiles(files);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    if (mode === 'multiple' && items.length + files.length > maxImages) {
      setError(`최대 ${maxImages}장까지만 업로드 가능합니다.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    const newPending = [...pendingFiles];
    const newItems = mode === 'single' ? [] : [...items];

    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name}: 10MB 이하의 이미지만 가능합니다.`);
        }

        const processed = await compressImage(file, {
          maxWidth: mode === 'single' ? 800 : 1600,
          maxHeight: mode === 'single' ? 800 : 1600,
          quality: 0.8
        });

        const timestamp = Date.now();
        const index = newItems.length;
        const fileName = `${timestamp}_${index.toString().padStart(2, '0')}.webp`;
        const webpPath = `public/assets/uploads/${folderPath}/${fileName}`;
        const appPath = `/assets/uploads/${folderPath}/${fileName}`;

        newPending.push({ path: webpPath, base64: processed.base64 });
        
        newItems.push({
          id: `new-${timestamp}-${index}`,
          url: appPath,
          isNew: true,
          base64: processed.base64,
          originalName: file.name,
          size: processed.compressedSize
        });
      }

      setItems(newItems);
      setPendingFiles(newPending);
      notifyChange(newItems, newPending, deletedFiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    // If it's an existing file in our uploads folder, mark for deletion
    if (!itemToDelete.isNew && itemToDelete.url.startsWith('/assets/uploads/')) {
      const gitPath = `public${itemToDelete.url}`;
      setDeletedFiles(prev => [...prev, gitPath]);
    }

    // If it's a pending file, remove from pendingFiles
    if (itemToDelete.isNew) {
      const gitPath = `public${itemToDelete.url}`;
      setPendingFiles(prev => prev.filter(p => p.path !== gitPath));
    }

    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    
    // We need to re-notify with the updated states
    const updatedDeleted = (!itemToDelete.isNew && itemToDelete.url.startsWith('/assets/uploads/')) 
      ? [...deletedFiles, `public${itemToDelete.url}`] 
      : deletedFiles;
      
    const updatedPending = itemToDelete.isNew 
      ? pendingFiles.filter(p => p.path !== `public${itemToDelete.url}`) 
      : pendingFiles;

    notifyChange(newItems, updatedPending, updatedDeleted);
  };

  const handleReorder = (newItems: ImageItem[]) => {
    setItems(newItems);
    notifyChange(newItems, pendingFiles, deletedFiles);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newItems = [...items];
    [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    handleReorder(newItems);
  };

  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    const newItems = [...items];
    [newItems[idx + 1], newItems[idx]] = [newItems[idx], newItems[idx + 1]];
    handleReorder(newItems);
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</label>
          {mode === 'multiple' && (
            <span className="text-[8px] font-bold text-zinc-600 bg-white/5 px-2 py-0.5 rounded tracking-widest">
              {items.length} / {maxImages} MAX
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-xs text-red-500 animate-in fade-in zoom-in duration-300">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Upload Area */}
      { (mode === 'multiple' || items.length === 0) && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
            ${isProcessing ? 'border-zinc-800 bg-zinc-900/20 pointer-events-none' : 'border-white/5 hover:border-electric-blue/30 hover:bg-electric-blue/5'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple={mode === 'multiple'}
            accept="image/*"
          />
          {isProcessing ? (
            <Loader2 className="text-electric-blue animate-spin" size={32} />
          ) : (
            <CloudUpload className="text-zinc-600" size={32} />
          )}
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {isProcessing ? '이미지 압축 중...' : '이미지 추가하기'}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">WebP 자동 변환 (최대 10MB)</p>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="space-y-2">
        {mode === 'multiple' ? (
          <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
            {items.map((item, idx) => (
              <Reorder.Item 
                key={item.id} 
                value={item}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 flex items-center gap-4 group"
              >
                <div className="cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400">
                   <GripVertical size={20} />
                </div>
                
                <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/5">
                   <img 
                    src={item.isNew ? `data:image/webp;base64,${item.base64}` : item.url} 
                    alt="" 
                    className="w-full h-full object-cover"
                   />
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-zinc-200 line-clamp-1 truncate">
                      {item.isNew ? item.originalName : `Existing Image ${idx + 1}`}
                    </span>
                    {idx === 0 && (
                      <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-electric-blue text-white rounded">Cover</span>
                    )}
                    {item.isNew && (
                       <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded">New</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-mono">
                     {item.size ? formatBytes(item.size) : '---'}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                   <button onClick={() => moveUp(idx)} className="p-2 text-zinc-700 hover:text-white transition-all"><ArrowUp size={14} /></button>
                   <button onClick={() => moveDown(idx)} className="p-2 text-zinc-700 hover:text-white transition-all"><ArrowDown size={14} /></button>
                   <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-all"><X size={16} /></button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          /* Single Mode View */
          items.map((item) => (
            <div key={item.id} className="relative group rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 aspect-video">
               <img 
                 src={item.isNew ? `data:image/webp;base64,${item.base64}` : item.url} 
                 alt="" 
                 className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div className="flex items-center justify-between w-full">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">표시 이미지</span>
                        <span className="text-[9px] text-zinc-400">{item.isNew ? '새 이미지' : '기존 파일'}</span>
                     </div>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
                        >
                           <CloudUpload size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 p-3 rounded-xl text-red-500 transition-all"
                        >
                           <X size={18} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
