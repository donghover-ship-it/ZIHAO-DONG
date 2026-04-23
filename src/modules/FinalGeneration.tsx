import React, { useState } from 'react';
import { Sparkles, Download, Share2, Printer, X, CheckCircle2, FileText, Box as BoxIcon, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { LogicTraceback } from '../components/LogicTraceback';
import { useDesignStore } from '../store/useDesignStore';
import { materials } from '../data/materials';
import { accessories } from '../data/accessories';

export const FinalGeneration = () => {
  const { designData } = useDesignStore();
  const [selectedViewerUrl, setSelectedViewerUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const definitionResult = designData.definition?.result;
  const referenceImages = [
    ...(Array.isArray(designData.appearance?.imageUrl) ? designData.appearance.imageUrl : []),
    ...(Array.isArray(designData.appearance?.competitorImageUrl) ? designData.appearance.competitorImageUrl : [])
  ];
  const effectImageUrl = designData.appearance?.effectImageUrl?.[0] || '';
  const selectedMaterials = designData.appearance?.selectedMaterials || [];
  const selectedAccessories = designData.appearance?.selectedAccessories || [];
  const accessoryStyle = designData.appearance?.accessoryStyle || {};
  const currentSeed = designData.appearance?.currentSeed || 0;

  const handleCopyTechPack = () => {
    let md = `# BagCraft AI - 技术文档\n\n`;
    
    md += `## 1. 设计定义\n`;
    if (definitionResult) {
      md += `- **产品名称**: ${definitionResult.specifications?.name || ''}\n`;
      md += `- **目标受众**: ${definitionResult.personas?.[0]?.occupation || definitionResult.persona?.occupation || ''}\n`;
      md += `- **核心功能**: ${definitionResult.specifications?.functions || ''}\n`;
    }
    md += `\n`;

    md += `## 2. 材质与辅料\n`;
    selectedMaterials.forEach((sm) => {
      const mat = materials.find(m => m.id === sm.materialId);
      md += `- **[${sm.part}]**: ${mat?.name} (${mat?.description})\n`;
    });
    if (selectedAccessories && selectedAccessories.length > 0) {
      const names = selectedAccessories.map(id => accessories.find(a => a.id === id)?.name).filter(Boolean).join(', ');
      md += `- **[配件]**: ${names}\n`;
      Object.entries(accessoryStyle).forEach(([key, value]) => {
        if (value !== '默认') md += `  - ${key}: ${value}\n`;
      });
    }
    md += `\n`;

    md += `## 3. 结构与功能\n`;
    const structure = designData.structure?.structure || [];
    const smart = designData.structure?.smart || [];
    if (structure.length > 0) md += `- **物理结构**: ${structure.join(', ')}\n`;
    if (smart.length > 0) md += `- **智能模组**: ${smart.join(', ')}\n`;
    md += `\n`;

    md += `## 4. 渲染参数\n`;
    md += `- **Seed**: ${currentSeed}\n`;
    md += `- **Model**: Gemini 3 Flash\n`;
    
    md += `\n---\n*由 BagCraft AI 生成*`;

    navigator.clipboard.writeText(md);
    alert('技术文档已复制到剪贴板');
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('设计文件已准备就绪，开始下载...');
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto w-full">
      <header className="space-y-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">6. 设计方案</h2>
          <p className="text-base text-slate-400 max-w-3xl leading-relaxed">生成高精度渲染图、工艺说明书及 3D 模型文件。</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopyTechPack}
            className="flex items-center gap-2 px-4 py-2 glass-button text-white rounded-lg text-xs font-medium transition-all"
          >
            <FileText size={14} />
            复制 Tech Pack
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-indigo-800 disabled:to-blue-800 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-indigo-500/25"
          >
            {isExporting ? <Sparkles size={14} className="animate-spin" /> : <Download size={14} />}
            {isExporting ? '导出中...' : '导出全部文件'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Render View */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="aspect-video glass-panel-premium rounded-3xl relative overflow-hidden group">
            {effectImageUrl ? (
              <img 
                src={effectImageUrl} 
                alt="Final Render" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center">
                  <Sparkles size={32} className="text-slate-500 animate-pulse" />
                </div>
                <p className="text-sm text-gray-500 italic">等待外观设计完成以生成最终渲染图</p>
              </div>
            )}
            
            {effectImageUrl && (
              <button 
                onClick={() => setSelectedViewerUrl(effectImageUrl)}
                className="absolute bottom-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 size={20} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square glass-panel rounded-3xl overflow-hidden hover:border-slate-500/50 transition-all cursor-pointer group">
                <div className="w-full h-full flex items-center justify-center text-gray-700 italic text-[10px]">
                  视图 {i}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables & Stats */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">交付清单</h3>
            <div className="space-y-3">
              {[
                { label: '4K 超写实渲染图', icon: ImageIcon, size: '24MB' },
                { label: '完整工艺说明书 (PDF)', icon: FileText, size: '12MB' },
                { label: '3D 结构模型 (GLB)', icon: BoxIcon, size: '45MB' },
                { label: 'BOM 物料清单 (Excel)', icon: CheckCircle2, size: '1.2MB' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 glass-panel rounded-xl group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 glass-panel rounded-lg text-gray-400 group-hover:text-slate-400 transition-colors">
                      <item.icon size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-gray-200">{item.label}</p>
                      <p className="text-[9px] text-gray-500">{item.size}</p>
                    </div>
                  </div>
                  <Download size={14} className="text-gray-600 group-hover:text-white transition-colors cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-500/5 border border-slate-500/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">设计完整度</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-light text-white">98%</span>
              <span className="text-[10px] text-slate-500 mb-1.5">READY FOR PRODUCTION</span>
            </div>
            <div className="w-full h-1 glass-panel rounded-full overflow-hidden">
              <div className="h-full bg-slate-500 w-[98%]" />
            </div>
            <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
              所有关键设计决策均已通过 AI 逻辑校验，物料清单与工艺说明书已同步更新。
            </p>
          </div>
        </div>
      </div>

      {effectImageUrl && (
        <LogicTraceback 
          isGenerating={false}
          definitionResult={definitionResult}
          referenceImages={referenceImages}
          effectImageUrl={effectImageUrl}
          materials={materials}
          selectedMaterials={selectedMaterials}
          selectedAccessories={selectedAccessories}
          accessories={accessories}
          accessoryStyle={accessoryStyle}
          designData={designData}
          currentSeed={currentSeed}
          onCopyTechPack={handleCopyTechPack}
          onViewImage={(url) => setSelectedViewerUrl(url)}
        />
      )}

      {selectedViewerUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <button 
            onClick={() => setSelectedViewerUrl(null)} 
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
          <img 
            src={selectedViewerUrl} 
            alt="Viewer" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
            referrerPolicy="no-referrer" 
          />
        </div>
      )}
    </div>
  );
};
