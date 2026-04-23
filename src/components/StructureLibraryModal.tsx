import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Search, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import localforage from 'localforage';
import { auth, fetchStructureLibraryFromCloud, syncStructureLibraryToCloud, deleteStructureImageFromCloud } from '../utils/firebaseUtils';
import { useDesignStore } from '../store/useDesignStore';

interface StructureLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (url: string) => void;
}

const CATEGORIES = [
  { id: 'main', label: '主仓' },
  { id: 'tech', label: '电脑仓' },
  { id: 'internal', label: '其他仓位/隔层' },
  { id: 'quick', label: '快取仓' },
  { id: 'water', label: '水杯仓' },
  { id: 'back', label: '背板' },
  { id: 'strap', label: '肩带' },
  { id: 'accessory', label: '外挂配件' },
];

export const StructureLibraryModal: React.FC<StructureLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [activeTab, setActiveTab] = useState('main');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [structureLibrary, setStructureLibrary] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadLibrary = async () => {
        try {
          let stored = await localforage.getItem<Record<string, any[]>>('structureLibrary');
          const user = auth.currentUser;
          if (user) {
            const cloudData = await fetchStructureLibraryFromCloud();
            if (cloudData && Object.keys(cloudData).length > 0) {
              stored = cloudData;
              await localforage.setItem('structureLibrary', stored);
            } else if (stored && Object.keys(stored).length > 0) {
              await syncStructureLibraryToCloud(stored);
            }
          }
          if (stored) {
            setStructureLibrary(stored);
          } else {
            // Migrate from legacy useDesignStore if available
            const legacyLibrary = useDesignStore.getState().structureLibrary;
            if (legacyLibrary && Object.keys(legacyLibrary).some(k => legacyLibrary[k].length > 0)) {
              setStructureLibrary(legacyLibrary);
              await localforage.setItem('structureLibrary', legacyLibrary);
            }
          }
        } catch (err) {
          console.error("Failed to load structure library:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadLibrary();
    }
  }, [isOpen]);

  const saveLibrary = async (newLibrary: Record<string, any[]>) => {
    setStructureLibrary(newLibrary);
    try {
      await localforage.setItem('structureLibrary', newLibrary);
      if (auth.currentUser) await syncStructureLibraryToCloud(newLibrary);
    } catch (err) {
      console.error("Failed to save structure library:", err);
      alert("保存失败，可能是图片过大超出了存储限制。");
    }
  };

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map(file => {
      return new Promise<any>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            id: `struct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: event.target?.result as string,
            name: file.name,
            addedAt: Date.now()
          });
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const newItems = await Promise.all(filePromises);
      
      setStructureLibrary(prev => {
        const currentItems = prev[activeTab] || [];
        const updatedLibrary = {
          ...prev,
          [activeTab]: [...currentItems, ...newItems]
        };
        
        // Save to localforage
        localforage.setItem('structureLibrary', updatedLibrary)
          .then(() => {
            if (auth.currentUser) return syncStructureLibraryToCloud(updatedLibrary);
          })
          .catch(err => {
            console.error("Failed to save structure library:", err);
            alert("保存失败，可能是图片过大超出了存储限制。");
          });
        
        return updatedLibrary;
      });
    } catch (error) {
      console.error("Error processing files:", error);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStructureLibrary(prev => {
      const currentItems = prev[activeTab] || [];
      const updatedLibrary = {
        ...prev,
        [activeTab]: currentItems.filter(item => item.id !== id)
      };
      
      localforage.setItem('structureLibrary', updatedLibrary)
        .then(() => {
          if (auth.currentUser) return deleteStructureImageFromCloud(id);
        })
        .catch(err => {
          console.error("Failed to save structure library:", err);
        });
      
      return updatedLibrary;
    });
  };

  const currentItems = structureLibrary[activeTab] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl h-[85vh] flex flex-col bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ImageIcon className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">模块化资料库</h2>
              <p className="text-sm text-slate-400">管理和选择结构参考图</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-48 sm:w-64 border-r border-white/10 bg-black/20 flex flex-col shrink-0">
            <div className="p-4">
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === cat.id 
                        ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-white">
                {CATEGORIES.find(c => c.id === activeTab)?.label} ({currentItems.length})
              </h3>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                <Upload size={16} />
                上传图片
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
                multiple
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p>加载中...</p>
                </div>
              ) : currentItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon size={48} className="mb-4 opacity-20" />
                  <p>当前分类暂无图片</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    点击上传
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {currentItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => onSelect && onSelect(item.url)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:border-blue-500/50 transition-all"
                    >
                      <img 
                        src={item.url} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-xs text-white truncate">{item.name}</p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      {onSelect && (
                        <div className="absolute top-2 left-2 p-1 bg-blue-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
