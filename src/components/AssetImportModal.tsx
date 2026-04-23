import React, { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, Image as ImageIcon, Check, Plus, Trash2, Layers, Settings2, Palette, FileText } from 'lucide-react';
import { useDesignStore } from '../store/useDesignStore';

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'material' | 'color' | 'hardware' | 'logo';
  selectedDir: string;
}

export const AssetImportModal: React.FC<AssetImportModalProps> = ({ isOpen, onClose, activeTab, selectedDir }) => {
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; file: File; url: string; selected: boolean }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [importMode, setImportMode] = useState<'image' | 'manual'>('image');
  const [manualColor, setManualColor] = useState({ hex: '#6366f1', name: '', code: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateDesignData, designData } = useDesignStore();

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    const newFiles = await Promise.all(validFiles.map(async (file) => {
      return new Promise<{ id: string; file: File; url: string; selected: boolean }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            file,
            url: reader.result as string,
            selected: false
          });
        };
        reader.readAsDataURL(file);
      });
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const toggleFileSelection = (id: string) => {
    setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateAsset = () => {
    const selectedFiles = uploadedFiles.filter(f => f.selected);
    if (selectedFiles.length === 0) return;

    // Create a new asset draft
    const newAsset = {
      id: `custom_${Date.now()}`,
      name: '新资产',
      type: '自定义',
      description: '',
      tags: [],
      category: selectedDir === 'all' ? 'unassigned' : selectedDir,
      image: selectedFiles[0].url, // Use the first selected image
      images: selectedFiles.map(f => f.url), // Store all selected images if needed
      isCustom: true,
      originalFiles: selectedFiles.map(f => f.id)
    };
    
    setEditingAsset(newAsset);
  };

  const handleSaveAsset = () => {
    if (!editingAsset) return;
    
    const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
    const currentAssets = currentLibrary[activeTab] || [];
    
    updateDesignData('library', {
      [activeTab]: [...currentAssets, editingAsset]
    });
    
    // Remove the files that were used to create this asset
    setUploadedFiles(prev => prev.filter(f => !editingAsset.originalFiles.includes(f.id)));
    setEditingAsset(null);
  };

  const handleSaveManualColor = () => {
    const newAsset = {
      id: `custom_color_${Date.now()}`,
      name: manualColor.name || manualColor.code || '自定义色彩',
      type: manualColor.code ? 'Pantone' : '自定义',
      description: manualColor.code ? `Pantone: ${manualColor.code}` : '',
      hex: manualColor.hex,
      tags: [],
      category: selectedDir === 'all' ? 'unassigned' : selectedDir,
      isCustom: true,
    };
    
    const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
    const currentAssets = currentLibrary['color'] || [];
    
    updateDesignData('library', {
      color: [...currentAssets, newAsset]
    });
    
    onClose();
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'material': return <Layers size={18} className="text-indigo-300" />;
      case 'color': return <Palette size={18} className="text-fuchsia-300" />;
      case 'hardware': return <Settings2 size={18} className="text-amber-100/70" />;
      case 'logo': return <FileText size={18} className="text-teal-100/70" />;
    }
  };

  const getTabName = () => {
    switch (activeTab) {
      case 'material': return '面料';
      case 'color': return '色彩';
      case 'hardware': return '辅料';
      case 'logo': return '标识';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl h-[80vh] glass-panel-premium rounded-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <UploadCloud size={18} className="text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-glow-white tracking-tight">导入{getTabName()}资产</h2>
            
            {activeTab === 'color' && (
              <div className="ml-4 flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setImportMode('image')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${importMode === 'image' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  图片上传
                </button>
                <button
                  onClick={() => setImportMode('manual')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${importMode === 'manual' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Pantone / 手动添加
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'color' && importMode === 'manual' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-md glass-panel-premium rounded-2xl p-6 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full mx-auto border-4 border-white/10 shadow-lg" style={{ backgroundColor: manualColor.hex }}></div>
                  <h3 className="text-lg font-bold text-white">添加自定义色彩</h3>
                  <p className="text-xs text-slate-400">输入 Pantone 色号或直接选择颜色</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">颜色值 (HEX)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={manualColor.hex}
                        onChange={(e) => setManualColor({...manualColor, hex: e.target.value})}
                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <input 
                        type="text" 
                        value={manualColor.hex}
                        onChange={(e) => setManualColor({...manualColor, hex: e.target.value})}
                        className="flex-1 glass-input-premium rounded-lg px-3 py-2 text-sm font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pantone 色号 (可选)</label>
                    <input 
                      type="text" 
                      value={manualColor.code}
                      onChange={(e) => setManualColor({...manualColor, code: e.target.value})}
                      className="w-full glass-input-premium rounded-lg px-3 py-2 text-sm"
                      placeholder="例如: 19-4052 TCX"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">色彩名称</label>
                    <input 
                      type="text" 
                      value={manualColor.name}
                      onChange={(e) => setManualColor({...manualColor, name: e.target.value})}
                      className="w-full glass-input-premium rounded-lg px-3 py-2 text-sm"
                      placeholder="例如: 经典蓝 (Classic Blue)"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                  <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleSaveManualColor}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Check size={16} />
                    保存并入库
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Left side: Upload & Selection */}
              <div className={`flex-1 flex flex-col border-r border-white/5 ${editingAsset ? 'w-1/2 max-w-[50%]' : 'w-full'}`}>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              
              {/* Upload Area */}
              <div 
                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 hover:border-white/40 glass-tile-premium'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileInput} multiple accept="image/*" className="hidden" />
                <UploadCloud size={32} className={`mb-2 ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} />
                <p className="text-sm text-slate-300 font-medium">点击或拖拽图片到此处上传</p>
                <p className="text-xs text-slate-500 mt-1">支持多选，可一次上传多张图片</p>
              </div>

              {/* Uploaded Files Grid */}
              {uploadedFiles.filter(f => !editingAsset?.originalFiles.includes(f.id)).length > 0 && (
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-300">已上传图片 ({uploadedFiles.filter(f => !editingAsset?.originalFiles.includes(f.id)).length})</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setUploadedFiles(prev => prev.map(f => !editingAsset?.originalFiles.includes(f.id) ? { ...f, selected: true } : f))}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        全选
                      </button>
                      <button 
                        onClick={() => setUploadedFiles(prev => prev.map(f => !editingAsset?.originalFiles.includes(f.id) ? { ...f, selected: false } : f))}
                        className="text-xs text-slate-400 hover:text-slate-300"
                      >
                        取消全选
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {uploadedFiles.filter(f => !editingAsset?.originalFiles.includes(f.id)).map(file => (
                      <div 
                        key={file.id}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer group transition-all ${file.selected ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'border-white/10 hover:border-white/30'}`}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <img src={file.url} alt="Uploaded" className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-black/40 transition-opacity ${file.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                        
                        {/* Selection Checkbox */}
                        <div className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-all ${file.selected ? 'bg-indigo-500 border-indigo-500' : 'bg-black/60 border-white/50'}`}>
                          {file.selected && <Check size={12} className="text-white" />}
                        </div>
                        
                        {/* Delete Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Bottom Action Bar */}
            {!editingAsset && uploadedFiles.length > 0 && (
              <div className="p-4 border-t border-white/5 glass-panel-premium flex items-center justify-between">
                <span className="text-xs text-slate-400">已选择 {uploadedFiles.filter(f => f.selected).length} 张图片</span>
                <button 
                  onClick={handleCreateAsset}
                  disabled={uploadedFiles.filter(f => f.selected).length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  建立名片
                </button>
              </div>
            )}
          </div>

          {/* Right side: Edit Asset Form */}
          {editingAsset && (
            <div className="w-1/2 flex flex-col glass-panel-premium animate-in slide-in-from-right-8 duration-300">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {getTabIcon()}
                  编辑资产信息
                </h3>
                <button onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Preview Images */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {editingAsset.images?.map((url: string, idx: number) => (
                    <div key={idx} className="w-24 h-24 shrink-0 rounded-lg border border-white/10 overflow-hidden relative">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      {idx === 0 && <div className="absolute top-1 left-1 bg-indigo-500 text-[8px] text-white px-1.5 py-0.5 rounded font-bold">主图</div>}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">资产名称</label>
                    <input 
                      type="text" 
                      value={editingAsset.name}
                      onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})}
                      className="w-full glass-input-premium rounded-lg px-3 py-2 text-sm"
                      placeholder="输入名称..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">类型/工艺</label>
                    <input 
                      type="text" 
                      value={editingAsset.type}
                      onChange={(e) => setEditingAsset({...editingAsset, type: e.target.value})}
                      className="w-full glass-input-premium rounded-lg px-3 py-2 text-sm"
                      placeholder="输入类型..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">描述</label>
                    <textarea 
                      value={editingAsset.description}
                      onChange={(e) => setEditingAsset({...editingAsset, description: e.target.value})}
                      className="w-full glass-input-premium rounded-lg px-3 py-2 text-sm h-24 resize-none"
                      placeholder="输入详细描述..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveAsset}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Check size={16} />
                  保存并入库
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
