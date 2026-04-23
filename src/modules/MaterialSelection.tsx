import React, { useState, useMemo } from 'react';
import { Check, ShieldAlert, Feather, Droplets, ShieldCheck, ChevronRight, Folder, AlertTriangle, Sparkles } from 'lucide-react';
import { materials as defaultMaterials, Material } from '../data/materials';
import { getTextureClass } from '../utils/textureUtils';
import { useDesignStore } from '../store/useDesignStore';

interface MaterialSelectionProps {
  onSelect: (material: Material) => void;
  selectedIds?: string[];
  selectedPart?: string;
}

const getTagIcon = (tag: string) => {
  if (tag.includes('轻量')) return <Feather size={10} />;
  if (tag.includes('防水')) return <Droplets size={10} />;
  if (tag.includes('耐磨') || tag.includes('强悍') || tag.includes('刚性')) return <ShieldCheck size={10} />;
  return null;
};

export const MaterialSelection: React.FC<MaterialSelectionProps> = ({ onSelect, selectedIds = [], selectedPart = '' }) => {
  const { designData } = useDesignStore();
  const materialDirs = (designData.library?.directories?.material || []).filter(d => d.id !== 'all');
  const customMaterials = designData.library?.material || [];
  
  const [selectedDirId, setSelectedDirId] = useState<string>('all');

  // Build breadcrumbs
  const getBreadcrumbs = (dirId: string) => {
    if (dirId === 'all') return [{ id: 'all', label: '面料库' }];
    const crumbs = [];
    let current = materialDirs.find(d => d.id === dirId);
    while (current) {
      crumbs.unshift(current);
      current = materialDirs.find(d => d.id === current?.parentId);
    }
    return [{ id: 'all', label: '面料库' }, ...crumbs];
  };

  const breadcrumbs = getBreadcrumbs(selectedDirId);
  const childDirs = materialDirs.filter(d => d.parentId === (selectedDirId === 'all' ? undefined : selectedDirId) && d.id !== 'unassigned');

  const styleCategoryMap: Record<string, string> = {
    'urban-outdoor': 'urban_outdoor',
    'urban-techwear': 'urban_tech',
    'urban-minimalist': 'minimalist',
    'daily-casual': 'daily_casual',
    'yama-outdoor': 'yama_style',
    'outdoor-techwear': 'outdoor_tech',
    'outdoor-tactical': 'tactical'
  };

  const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
  const activeStyleCategories = selectedCategories.map(id => styleCategoryMap[id]).filter(Boolean);

  const filteredMaterials = useMemo(() => {
    // Combine default and custom materials
    const itemNames = designData.library?.itemNames || {};
    const allMaterials = [
      ...defaultMaterials.map(m => ({
        ...m,
        name: itemNames[m.id] || m.name,
        categoryId: m.category
      })),
      ...customMaterials.map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.type || '自定义面料',
        category: 'CUSTOM',
        categoryId: m.category,
        tags: m.tags || [],
        uiTag: m.uiTag,
        physicalTags: m.physicalTags,
        grade: 2,
        textureUrl: m.image || '',
        strength: '中',
        weight: '中等',
        weatherResistance: '一般'
      }))
    ];

    const sortMaterials = (materials: any[]) => {
      return [...materials].sort((a, b) => {
        // 1. Top priority: matches active style categories
        const aMatchesStyle = a.categories?.some((cat: string) => activeStyleCategories.includes(cat));
        const bMatchesStyle = b.categories?.some((cat: string) => activeStyleCategories.includes(cat));
        if (aMatchesStyle && !bMatchesStyle) return -1;
        if (!aMatchesStyle && bMatchesStyle) return 1;

        // 2. Keep original order
        return 0;
      });
    };

    if (selectedDirId === 'all') return sortMaterials(allMaterials);
    
    // Get all descendant directory IDs
    const getDescendantIds = (parentId: string): string[] => {
      const children = materialDirs.filter(d => d.parentId === parentId).map(d => d.id);
      let descendants = [...children];
      for (const childId of children) {
        descendants = [...descendants, ...getDescendantIds(childId)];
      }
      return descendants;
    };
    
    const validDirIds = [selectedDirId, ...getDescendantIds(selectedDirId)];
    const filtered = allMaterials.filter(m => validDirIds.includes(m.categoryId)).map(m => {
      // Build full path
      const path = [];
      let current = materialDirs.find(d => d.id === m.categoryId);
      while (current) {
        path.unshift(current.label);
        current = materialDirs.find(d => d.id === current?.parentId);
      }
      return { ...m, fullPath: ['面料库', ...path].join(' / ') };
    });
    
    return sortMaterials(filtered);
  }, [selectedDirId, customMaterials, materialDirs, designData.competitor?.styleCategories, designData.competitor?.styleCategory, designData.library?.itemNames, activeStyleCategories]);

  return (
    <div className="space-y-4 p-2">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-xs text-gray-400 overflow-x-auto custom-scrollbar pb-1">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            {idx > 0 && <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />}
            <button 
              onClick={() => setSelectedDirId(crumb.id)}
              className={`whitespace-nowrap transition-colors ${idx === breadcrumbs.length - 1 ? 'text-slate-300 font-bold' : 'hover:text-white'}`}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Child Directories as Tags */}
      {childDirs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {childDirs.map(dir => (
            <button
              key={dir.id}
              onClick={() => setSelectedDirId(dir.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-300 transition-all"
            >
              <Folder size={10} className="text-slate-400" />
              {dir.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
        {(() => {
          const recommended: any[] = [];
          const others: any[] = [];

          if (activeStyleCategories.length > 0) {
            filteredMaterials.forEach(m => {
              if (m.categories?.some((cat: string) => activeStyleCategories.includes(cat))) {
                recommended.push(m);
              } else {
                others.push(m);
              }
            });
          } else {
            others.push(...filteredMaterials);
          }

          const renderMaterial = (m: any) => {
            const isSelected = selectedIds.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m as any)}
                className={`relative h-28 rounded-xl border-2 p-3 text-center transition-all overflow-hidden ${m.textureUrl ? '' : getTextureClass(m.id)} ${
                  isSelected 
                    ? 'border-slate-500 bg-slate-900/20' 
                    : 'glass-tile-premium border-white/10 hover:border-slate-500/50 hover:scale-[1.02]'
                }`}
              >
                {m.textureUrl && (
                  <img src={m.textureUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {(m.id === 'DP_CORDURA500D' || m.id === 'DP_XPAC_VX21') ? (
                  <div className="absolute top-2 left-2 bg-blue-500/80 px-1.5 py-0.5 rounded text-[9px] text-white font-bold uppercase tracking-wider flex items-center gap-1 z-20">
                    通用
                  </div>
                ) : (m.uiTag || (m.tags && m.tags.length > 0)) && (
                  <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-bold uppercase tracking-wider flex items-center gap-1 z-20">
                    {getTagIcon(m.uiTag || m.tags[0])}
                    {m.uiTag || m.tags[0]}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 z-20 bg-black/50 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 text-left">
                  <h4 className="text-[11px] font-bold text-white leading-tight truncate">{m.name}</h4>
                  <p className="text-[9px] text-gray-300 mt-0.5 leading-tight truncate">{m.description}</p>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                  {(m.id === 'DP_210DRIPSTOP' || (m.tags && m.tags.includes('轻量'))) && selectedPart && !selectedPart.includes('内里') && (
                    <div className="group/warning relative">
                      <div className="bg-slate-300 rounded-full p-0.5">
                        <AlertTriangle size={10} className="text-slate-800" />
                      </div>
                      <div className="absolute bottom-full right-0 mb-2 z-50">
                        <div className="w-48 p-2 glass-panel-premium border border-slate-600 rounded-lg text-[10px] text-slate-200 opacity-0 group-hover/warning:opacity-100 pointer-events-none transition-opacity shadow-xl text-left">
                          检测到轻量材质，建议仅用于非承重/低磨损区
                        </div>
                      </div>
                    </div>
                  )}
                  {isSelected && (
                    <div className="bg-slate-500 rounded-full p-0.5">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          };

          return (
            <>
              {recommended.length > 0 && (
                <>
                  <div className="col-span-2 text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-1 mb-1 flex items-center gap-1">
                    <Sparkles size={12} /> 推荐面料 (匹配当前风格)
                  </div>
                  {recommended.map(renderMaterial)}
                  {others.length > 0 && (
                    <div className="col-span-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-3 mb-1">
                      其他面料
                    </div>
                  )}
                </>
              )}
              {others.map(renderMaterial)}
              {filteredMaterials.length === 0 && (
                <div className="col-span-2 py-8 text-center text-gray-500 text-xs">
                  该目录下暂无面料
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};
