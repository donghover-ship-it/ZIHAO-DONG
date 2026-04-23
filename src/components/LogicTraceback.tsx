import React, { useState } from 'react';
import { 
  Activity, 
  Copy, 
  Fingerprint, 
  Layers, 
  Crosshair, 
  Box, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Target,
  Palette
} from 'lucide-react';

interface LogicTracebackProps {
  isGenerating: boolean;
  definitionResult: any;
  referenceImages: string[];
  effectImageUrl?: string;
  selectedMaterials: { part: string; materialId: string }[];
  materials: any[];
  selectedAccessories: string[];
  accessories: any[];
  accessoryStyle: any;
  designData: any;
  currentSeed: number;
  onCopyTechPack: () => void;
  onViewImage?: (url: string) => void;
}

const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block group" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded border border-white/10 shadow-xl z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-1">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export const LogicTraceback: React.FC<LogicTracebackProps> = ({
  isGenerating,
  definitionResult,
  referenceImages,
  effectImageUrl,
  selectedMaterials,
  materials,
  selectedAccessories,
  accessories,
  accessoryStyle,
  designData,
  currentSeed,
  onCopyTechPack,
  onViewImage
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyTechPack();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWeight = (idx: number) => (0.85 - idx * 0.1).toFixed(2);

  return (
    <div className="mt-8 glass-panel-premium rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${isGenerating ? 'bg-slate-500/20 text-slate-400 animate-pulse' : 'bg-slate-500/20 text-slate-400'}`}>
            <Activity size={20} />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                全链路逻辑回显
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Logic Traceback</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isGenerating ? '正在实时提取设计基因与渲染参数...' : '设计意图到生成结果的逻辑映射已完成'}
              </p>
            </div>
            
            {effectImageUrl && (
              <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                <div className="text-[10px] text-gray-500 uppercase font-mono">Target Image</div>
                <div 
                  className="w-10 h-10 rounded bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-slate-500/50 transition-all"
                  onClick={() => onViewImage?.(effectImageUrl)}
                >
                  <img src={effectImageUrl} alt="Target" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 border ${
            copied 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
          }`}
        >
          {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
          {copied ? '已复制技术包' : '一键复制 Tech Pack'}
        </button>
      </div>

      {/* Four Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pillar 1: Design Intent Integration */}
        <div className="group relative glass-tile-premium border border-white/10 rounded-xl p-4 hover:border-slate-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Box size={18} className="text-slate-400" />
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">设计定义整合</h4>
            </div>
            <span className="text-[9px] text-gray-600 font-mono">INTENT</span>
          </div>
          
          <div className="space-y-3">
            <div className="glass-tile-premium p-2.5 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase mb-1">容量/包型 (Capacity/Type)</p>
              <p className="text-xs text-slate-300 font-medium">
                {definitionResult?.specifications?.size || '30L'} / {definitionResult?.specifications?.name || 'Urban Photography'}
              </p>
            </div>
            <div className="glass-tile-premium p-2.5 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase mb-1">核心功能词 (Core Functions)</p>
              <div className="flex flex-wrap gap-1">
                {(definitionResult?.specifications?.functions || 'Professional, Anti-theft, Modular').split(',').map((f: string, i: number) => (
                  <span key={i} className="text-[9px] bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded border border-slate-500/20">
                    {f.trim()}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass-tile-premium p-2.5 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase mb-1">品牌定位 (Brand Positioning)</p>
              <p className="text-xs text-gray-300 italic">
                {definitionResult?.personas?.[0]?.occupation || definitionResult?.persona?.occupation || 'Urban Nomad Explorer'}
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Reference Genetic Trace */}
        <div className="group relative glass-tile-premium border border-white/10 rounded-xl p-4 hover:border-slate-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fingerprint size={18} className="text-slate-400" />
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">参考基因提取</h4>
            </div>
            <span className="text-[9px] text-gray-600 font-mono">GENETICS</span>
          </div>
          
          <div className="space-y-3">
            <div className="glass-tile-premium p-2.5 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase mb-2">灵感来源 (Inspiration Source)</p>
              <div className="flex items-center gap-3">
                {referenceImages.length > 0 ? (
                  <>
                    <div 
                      className="w-12 h-12 rounded bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-slate-500/50 transition-all group/img"
                      onClick={() => onViewImage?.(referenceImages[0])}
                    >
                      <img src={referenceImages[0]} alt="Ref" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col">
                      <Tooltip text="点击查看原始参考图">
                        <button 
                          onClick={() => onViewImage?.(referenceImages[0])}
                          className="text-xs text-slate-400 hover:text-slate-300 font-bold underline underline-offset-4 decoration-slate-500/30 hover:decoration-slate-400 transition-all text-left"
                        >
                          Ref_1_Style_ID
                        </button>
                      </Tooltip>
                      <span className="text-[9px] text-gray-600 font-mono mt-1">Source: User Upload</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-500/20 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-500/30">
                      AI
                    </div>
                    <p className="text-xs text-gray-300 truncate">Base Model Knowledge</p>
                  </div>
                )}
              </div>
            </div>
            <div className="glass-tile-premium p-2.5 rounded-lg space-y-2">
              <p className="text-[10px] text-gray-500 uppercase">特征权重 (Feature Weights)</p>
              <div className="space-y-1.5">
                {[
                  { label: '廓形 (Silhouette)', weight: 0.85, color: 'bg-slate-500' },
                  { label: '纹理 (Texture)', weight: 0.70, color: 'bg-slate-500' },
                  { label: '色调 (Palette)', weight: 0.90, color: 'bg-slate-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="text-[9px] text-gray-400">{item.label}</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.weight * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-gray-300">{item.weight.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Visual BOM Mapping */}
        <div className={`group relative glass-tile-premium border border-white/10 rounded-xl p-4 hover:border-slate-500/30 transition-all duration-300 ${!isGenerating && selectedMaterials.length > 0 ? 'ring-1 ring-slate-500/20 animate-pulse-subtle' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-slate-400" />
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">BOM 材质映射</h4>
            </div>
            <span className="text-[9px] text-gray-600 font-mono">MAPPING</span>
          </div>
          
          <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
            {selectedMaterials.length > 0 ? selectedMaterials.map((sm, idx) => {
              const mat = materials.find(m => m.id === sm.materialId);
              return (
                <div key={`${sm.part}-${sm.materialId}`} className="glass-tile-premium p-2 rounded-lg flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-300 font-bold">[{sm.part}]</span>
                    <span className="text-[9px] text-gray-500">{mat?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400 bg-white/5 px-1.5 py-1 rounded">
                    <Zap size={10} className="text-slate-500" />
                    <span className="font-mono truncate">指令: (rugged high-density texture:1.5)</span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-600 italic text-[10px] flex flex-col items-center gap-2">
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
                    <span>AI 正在分析材质映射...</span>
                  </>
                ) : (
                  <span>等待材质分配...</span>
                )}
              </div>
            )}
            {selectedAccessories && selectedAccessories.length > 0 && selectedAccessories.map((accId, idx) => {
              const currentAccessoryStyle = designData.appearance?.accessoryStyles?.[accId] || {};
              const accessoryItem = accessories.find(a => a.id === accId);
              
              return (
                <div key={`${accId}-${idx}`} className="glass-tile-premium p-2 rounded-lg flex flex-col gap-1 mb-2 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-300 font-bold">
                      {accId === 'zipper' ? '[拉链部位]' : '[辅料]'}
                    </span>
                    <span className="text-[9px] text-gray-500">
                      {accId === 'zipper' ? (
                        `${currentAccessoryStyle?.brand && currentAccessoryStyle.brand !== '默认' ? currentAccessoryStyle.brand.split(' ')[0] : '默认'} ${currentAccessoryStyle?.chainType && currentAccessoryStyle.chainType !== '默认' ? 'No.' + currentAccessoryStyle.chainType.split(' ')[0].replace('号', '') : ''} ${currentAccessoryStyle?.pullCord && currentAccessoryStyle.pullCord !== '默认' ? '+ ' + currentAccessoryStyle.pullCord.split(' ')[0] + '拉头' : ''}`.trim() || '默认拉链'
                      ) : (
                        accessoryItem?.name || accId
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400 bg-white/5 px-1.5 py-1 rounded">
                    <Zap size={10} className="text-slate-500" />
                    <span className="font-mono truncate">
                      指令: {accId === 'zipper' ? (
                        [
                          currentAccessoryStyle?.brand === 'RIRI (瑞士)' ? '(High-end Swiss RIRI zipper:1.3)' : '',
                          currentAccessoryStyle?.pullCord === '热缩管 (Heat-shrink)' ? '(Heat-shrink tubing zipper pull:1.4)' : ''
                        ].filter(Boolean).join(', ') || '(standard zipper:1.2)'
                      ) : '(magnetic mechanical structure:1.4)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pillar 4: Engine Runtime Status */}
        <div className="group relative glass-tile-premium border border-white/10 rounded-xl p-4 hover:border-slate-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-slate-400" />
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">模型运行状态</h4>
            </div>
            <span className="text-[9px] text-gray-600 font-mono">RUNTIME</span>
          </div>
          
          <div className="space-y-3">
            <div className="glass-tile-premium p-2.5 rounded-lg flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-gray-500 uppercase">Seed (种子值)</p>
                  <Tooltip text="种子值决定了生成的随机性。相同的种子配合相同的参数可以复现相同的设计。">
                    <Info size={10} className="text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-sm font-mono text-slate-400 font-bold">{currentSeed || '842910'}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-slate-500 font-bold uppercase mb-1">Status</span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/10 rounded border border-slate-500/20">
                  <Target size={10} className="text-slate-400" />
                  <span className="text-[9px] text-slate-300 font-bold">LOCKED</span>
                </div>
              </div>
            </div>

            <div className="glass-tile-premium p-2.5 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-gray-500 uppercase">Denoising (重绘强度)</p>
                  <Tooltip text="控制 AI 对原始结构的修改程度。0.52 是材质替换与结构保持的平衡点。">
                    <Info size={10} className="text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">0.52</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: '52%' }} />
              </div>
              <p className="text-[8px] text-gray-600 mt-1">材质替换平衡点 (Material Balance Point)</p>
            </div>

            <div className="glass-tile-premium p-2.5 rounded-lg flex items-center justify-between">
              <p className="text-[10px] text-gray-500 uppercase">API Status</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-slate-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className={`text-[10px] font-mono ${isGenerating ? 'text-slate-400' : 'text-emerald-400'}`}>
                  {isGenerating ? 'PROCESSING' : 'STABLE (1.2s)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-3 py-2 bg-slate-500/5 rounded-xl border border-slate-500/10">
          <Zap size={14} className="text-slate-400 animate-bounce" />
          <span className="text-xs text-slate-300 font-medium tracking-wide">正在提取设计基因并同步渲染引擎...</span>
        </div>
      )}
    </div>
  );
};
