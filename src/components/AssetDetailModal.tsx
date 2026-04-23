import React, { useState, useEffect } from 'react';
import { X, Save, Tag as TagIcon, Plus, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTextureClass } from '../utils/textureUtils';

interface AssetDetailModalProps {
  item: any;
  activeTab: string;
  onClose: () => void;
  onSave: (updatedItem: any) => void;
  onSelect?: (item: any) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ item, activeTab, onClose, onSave, onSelect }) => {
  const [editedItem, setEditedItem] = useState({ ...item });
  const [newTag, setNewTag] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setEditedItem({ ...item });
  }, [item]);

  const handleChange = (field: string, value: any) => {
    setEditedItem(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedItem.tags?.includes(newTag.trim())) {
      handleChange('tags', [...(editedItem.tags || []), newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleChange('tags', (editedItem.tags || []).filter((t: string) => t !== tagToRemove));
  };

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-[95vw] max-w-6xl h-[85vh] glass-panel-premium rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
        
        {/* Left Panel: Image/Texture Preview */}
        <div className="w-full md:w-2/5 h-64 md:h-full relative flex flex-col border-r border-white/5 bg-slate-900">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 via-black/20 to-transparent">
            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg max-w-[70%]">{editedItem.name || '资产预览'}</h2>
            <div className="px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-sm font-medium text-slate-300 shadow-lg">
              {activeTab === 'material' ? '面料' : activeTab === 'color' ? '色彩' : activeTab === 'hardware' ? '辅料' : '标识'}
            </div>
          </div>

          {/* Image Area */}
          <div className="flex-1 relative flex items-center justify-center">
            {activeTab === 'material' ? (
              <div className={`absolute inset-0 w-full h-full ${editedItem.image && !editedItem.image.includes('picsum.photos') ? '' : getTextureClass(editedItem.id)}`}>
                {editedItem.images && editedItem.images.length > 0 ? (
                  <>
                    <img src={editedItem.images[currentImageIndex]} alt={editedItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {editedItem.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev > 0 ? prev - 1 : editedItem.images.length - 1); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-20"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev < editedItem.images.length - 1 ? prev + 1 : 0); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-20"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                          {editedItem.images.map((_: any, idx: number) => (
                            <button 
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                              className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : editedItem.image && !editedItem.image.includes('picsum.photos') ? (
                  <img src={editedItem.image} alt={editedItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : null}
              </div>
            ) : activeTab === 'color' ? (
              <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: editedItem.hex }}></div>
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-12">
                {editedItem.images && editedItem.images.length > 0 ? (
                  <>
                    <img src={editedItem.images[currentImageIndex]} alt={editedItem.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
                    {editedItem.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev > 0 ? prev - 1 : editedItem.images.length - 1); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-20"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev < editedItem.images.length - 1 ? prev + 1 : 0); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-20"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                          {editedItem.images.map((_: any, idx: number) => (
                            <button 
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                              className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : editedItem.image && !editedItem.image.includes('picsum.photos') ? (
                  <img src={editedItem.image} alt={editedItem.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-slate-500">无预览图</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Details & Editing */}
        <div className="w-full md:w-3/5 h-full flex flex-col bg-[#1A1A1A]/80 backdrop-blur-xl relative">
          <div className="p-6 md:p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">属性设置</h2>
              <button onClick={onClose} className="p-2.5 bg-black/40 hover:bg-black/60 rounded-full transition-colors border border-white/5 text-slate-400 hover:text-white shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              {/* Basic Info Block */}
              <div className="bg-white/[0.03] p-6 rounded-[24px] border border-white/[0.05] shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-400">名称</label>
                  <input
                    type="text"
                    value={editedItem.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-black/40 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors"
                    placeholder="输入资产名称"
                  />
                </div>

                {activeTab === 'material' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-400">品牌 / 供应商</label>
                      <input
                        type="text"
                        value={editedItem.brand || ''}
                        onChange={(e) => handleChange('brand', e.target.value)}
                        className="w-full bg-black/40 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors"
                        placeholder="例如: Dimension-Polyant"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-400">分类</label>
                      <div className="relative">
                        <select
                          value={editedItem.category || (editedItem.categories && editedItem.categories[0]) || ''}
                          onChange={(e) => {
                            handleChange('category', e.target.value);
                            if (editedItem.categories) {
                              handleChange('categories', [e.target.value]);
                            }
                          }}
                          className="w-full bg-black/40 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="urban_tech" className="bg-slate-900">都市机能</option>
                          <option value="yama_style" className="bg-slate-900">山系户外</option>
                          <option value="tactical" className="bg-slate-900">户外战术</option>
                          <option value="urban_outdoor" className="bg-slate-900">都市户外</option>
                          <option value="minimalist" className="bg-slate-900">都市极简</option>
                          <option value="daily_casual" className="bg-slate-900">日常休闲</option>
                          <option value="outdoor_tech" className="bg-slate-900">户外机能</option>
                          <option value="other" className="bg-slate-900">其他</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'color' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-400">品牌</label>
                      <input
                        type="text"
                        value={editedItem.brand || ''}
                        onChange={(e) => handleChange('brand', e.target.value)}
                        className="w-full bg-black/40 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors"
                        placeholder="例如: Arc'teryx"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-400">RGB 颜色值</label>
                      <input
                        type="text"
                        value={editedItem.rgb || ''}
                        onChange={(e) => handleChange('rgb', e.target.value)}
                        className="w-full bg-black/40 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors"
                        placeholder="例如: 255, 255, 255"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-400">HEX 颜色值</label>
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-xl border border-white/10 shadow-lg shrink-0" style={{ backgroundColor: editedItem.hex }}></div>
                        <input
                          type="text"
                          value={editedItem.hex || ''}
                          onChange={(e) => {
                            const newHex = e.target.value;
                            handleChange('hex', newHex);
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(newHex);
                            if (result) {
                              handleChange('rgb', `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`);
                            }
                          }}
                          className="flex-1 bg-black/40 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors uppercase"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Block */}
              <div className="bg-white/[0.03] p-6 rounded-[24px] border border-white/[0.05] shadow-sm space-y-2">
                <label className="block text-sm font-medium text-slate-400">描述 / 参数</label>
                <textarea
                  value={editedItem.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full bg-black/40 rounded-xl px-4 py-4 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors min-h-[100px] resize-none"
                  placeholder="输入详细描述或技术参数..."
                />
              </div>

              {/* Tags Block */}
              <div className="bg-white/[0.03] p-6 rounded-[24px] border border-white/[0.05] shadow-sm space-y-4">
                <label className="block text-sm font-medium text-slate-400 flex items-center gap-2">
                  <TagIcon size={16} /> 标签
                </label>
                
                {/* Display UI Tag if available */}
                {editedItem.uiTag && (
                  <div className="mb-4">
                    <span className="text-xs text-slate-500 block mb-1">UI 原生标签</span>
                    <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-sm">
                      {editedItem.uiTag}
                    </span>
                  </div>
                )}

                {/* Display Physical Tags if available */}
                {editedItem.physicalTags && editedItem.physicalTags.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs text-slate-500 block mb-1">物理特性标签</span>
                    <div className="flex flex-wrap gap-2">
                      {editedItem.physicalTags.map((tag: string) => (
                        <span key={tag} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500 block w-full mb-1">自定义标签</span>
                  {(editedItem.tags || []).map((tag: string) => (
                    <span key={tag} className="bg-white/10 border border-white/5 text-slate-300 text-sm px-4 py-2 rounded-full flex items-center gap-2 group shadow-sm">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {(!editedItem.tags || editedItem.tags.length === 0) && (
                    <span className="text-slate-500 text-sm italic py-2 px-1">暂无标签</span>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 bg-black/40 rounded-full px-5 py-3 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors"
                    placeholder="添加新标签..."
                  />
                  <button onClick={handleAddTag} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full transition-colors flex items-center justify-center shadow-sm">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-4 shrink-0">
              <button onClick={onClose} className="px-6 py-3 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full sm:w-auto text-center">
                取消
              </button>
              <button 
                onClick={handleSave} 
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                  onSelect 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/5' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                }`}
              >
                <Save size={18} />
                保存修改
              </button>
              {onSelect && (
                <button onClick={() => onSelect(editedItem)} className="px-8 py-3 rounded-full text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                  <CheckCircle2 size={18} />
                  应用此资产
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
