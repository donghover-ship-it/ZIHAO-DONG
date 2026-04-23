import React, { useState, useRef, useEffect } from 'react';
import { useDesignStore } from '../store/useDesignStore';
import { Backpack, Laptop, FolderOpen, Droplets, Footprints, Shield, Upload, Image as ImageIcon, Loader2, SplitSquareHorizontal, Wand2, X, Library, Download, Trash2, Check } from 'lucide-react';
import { generateContentWithRetry } from '../utils/aiUtils';
import { AssetLibraryModal } from '../components/AssetLibraryModal';
import { StructureLibraryModal } from '../components/StructureLibraryModal';
import { STYLE_CATEGORIES } from './CompetitorLibrary';
import { getDynamicRecommendations } from '../utils/recommendationUtils';

const COMPARTMENTS = [
  { id: 'main', name: '主仓 (Main Compartment)', icon: Backpack, desc: '全开合 / 顶开式' },
  { id: 'tech', name: '电脑仓 (Tech Sleeve)', icon: Laptop, desc: '防震加厚 / 悬浮结构' },
  { id: 'side', name: '水杯仓 (Water Bottle)', icon: Droplets, desc: '弹力网布 / 隐藏扩容' },
  { id: 'shoe', name: '其他仓位 (Other)', icon: Footprints, desc: '防水涂层内里' },
  { id: 'back', name: '背幅 (Back Panel)', icon: Shield, desc: '背板 / 肩带' },
];

const BACK_PANEL_INSTRUCTIONS = [
  {
    id: 'support',
    title: '支撑骨架',
    type: 'single',
    options: [
      { id: 'support_a', label: '3D 模压', value: '3D molded EVA foam back panel with deep ridges' },
      { id: 'support_b', label: '悬浮网架', value: 'Suspended mesh tensioned back panel for maximum airflow' },
      { id: 'support_c', label: '极简软背', value: 'Minimalist soft back panel without 3D texture' },
    ]
  },
  {
    id: 'ventilation',
    title: '通风导流',
    type: 'single',
    options: [
      { id: 'vent_a', label: '纵向导流', value: 'Vertical airflow channels' },
      { id: 'vent_b', label: '脊状 AirScape', value: 'AirScape-style ridged texture' },
      { id: 'vent_c', label: '蜂窝/点阵', value: 'Hexagonal or dot matrix ventilation pattern' },
    ]
  },
  {
    id: 'harness',
    title: '交互组件',
    type: 'multiple',
    options: [
      { id: 'harness_b', label: '隐藏防盗口袋', value: 'Hidden security zippered pocket at lumbar area' },
      { id: 'harness_c', label: '行李箱拉杆套', value: 'Integrated luggage handle pass-through strap' },
    ]
  }
];

const STRAP_SYSTEM_INSTRUCTIONS = [
  {
    id: 'strap_silhouette',
    title: '肩带廓形',
    type: 'single',
    options: [
      { id: 'silhouette_a', label: 'S 型人体工学', value: 'S-curve ergonomic straps, Contoured padding' },
      { id: 'silhouette_b', label: '直连机能型', value: 'Modern straight-cut wide straps, Streamlined aesthetic' },
      { id: 'silhouette_c', label: '一体化背心式', value: 'Vest-style integrated shoulder straps merging with upper back panel' },
    ]
  },
  {
    id: 'strap_padding',
    title: '填充结构',
    type: 'multiple',
    options: [
      { id: 'padding_a', label: '多层复合填充', value: 'High-density EVA foam padding, Triple-layer composite structure' },
      { id: 'padding_b', label: '重心调节带', value: 'Upper load-lifter straps, Nylon webbing reinforcement' },
    ]
  },
  {
    id: 'strap_utility',
    title: '挂载组件',
    type: 'multiple',
    options: [
      { id: 'utility_a', label: '快取弹性口袋', value: 'Integrated stretch-mesh shoulder pocket, Hidden zipper access' },
      { id: 'utility_b', label: '织带挂载系统', value: 'Laser-cut MOLLE webbing, Attachment loops' },
    ]
  }
];

export const StructureFunction: React.FC = () => {
  const { designData, updateDesignData, assetLibraryTrigger, setAssetLibraryTrigger } = useDesignStore();
  const [activeCompartment, setActiveCompartment] = useState<string>('main');
  const [viewMode, setViewMode] = useState<'exterior' | 'interior'>('interior');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [libraryInitialTab, setLibraryInitialTab] = useState<'material' | 'color'>('material');
  const [isStructureLibraryOpen, setIsStructureLibraryOpen] = useState(false);
  const [isBackPanelModalOpen, setIsBackPanelModalOpen] = useState(false);
  const [customRequirement, setCustomRequirement] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exteriorImageInputRef = useRef<HTMLInputElement>(null);

  const compartmentData = designData.structure?.compartments?.[activeCompartment] || {};
  const exteriorImage = designData.structure?.exteriorImage || designData.appearance?.effectImageUrl?.[0] || designData.appearance?.imageUrl?.[0];
  const imageHistory = designData.appearance?.imageHistory || [];

  useEffect(() => {
    if (assetLibraryTrigger && assetLibraryTrigger.isOpen) {
      setLibraryInitialTab(assetLibraryTrigger.tab as 'material' | 'color');
      setIsLibraryModalOpen(true);
      setAssetLibraryTrigger({ ...assetLibraryTrigger, isOpen: false });
    }
  }, [assetLibraryTrigger, setAssetLibraryTrigger]);

  const handleCompartmentChange = (id: string) => {
    setActiveCompartment(id);
    if (id === 'back') {
      setIsBackPanelModalOpen(true);
    }
  };

  const updateCompartmentData = (data: any) => {
    updateDesignData('structure', {
      ...designData.structure,
      compartments: {
        ...(designData.structure?.compartments || {}),
        [activeCompartment]: {
          ...compartmentData,
          ...data
        }
      }
    });
  };

  const toggleBackPanelOption = (moduleId: string, value: string, type: 'single' | 'multiple') => {
    const currentOptions = compartmentData.backPanelOptions || [];
    let newOptions = [...currentOptions];

    if (type === 'single') {
      const moduleOptionValues = BACK_PANEL_INSTRUCTIONS.find(m => m.id === moduleId)?.options.map(o => o.value) || [];
      // Remove any existing options from this module
      newOptions = newOptions.filter(o => !moduleOptionValues.includes(o));
      // If the clicked value wasn't already selected, add it
      if (!currentOptions.includes(value)) {
        newOptions.push(value);
      }
    } else {
      if (newOptions.includes(value)) {
        newOptions = newOptions.filter((o: string) => o !== value);
      } else {
        newOptions.push(value);
      }
    }
    
    updateCompartmentData({ backPanelOptions: newOptions });
  };

  const toggleStrapOption = (moduleId: string, value: string, type: 'single' | 'multiple') => {
    const currentOptions = compartmentData.strapOptions || [];
    let newOptions = [...currentOptions];

    if (type === 'single') {
      const moduleOptionValues = STRAP_SYSTEM_INSTRUCTIONS.find(m => m.id === moduleId)?.options.map(o => o.value) || [];
      newOptions = newOptions.filter(o => !moduleOptionValues.includes(o));
      if (!currentOptions.includes(value)) {
        newOptions.push(value);
      }
    } else {
      if (newOptions.includes(value)) {
        newOptions = newOptions.filter((o: string) => o !== value);
      } else {
        newOptions.push(value);
      }
    }
    
    updateCompartmentData({ strapOptions: newOptions });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const currentImages = compartmentData.referenceImages || [];
      if (compartmentData.referenceImage && !currentImages.includes(compartmentData.referenceImage)) {
        currentImages.push(compartmentData.referenceImage);
      }
      
      const readers = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(newImages => {
        updateCompartmentData({ 
          referenceImages: [...currentImages, ...newImages],
          referenceImage: undefined 
        });
      });
    }
    // reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleExteriorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateDesignData('structure', {
          ...designData.structure,
          exteriorImage: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getBase64FromUrl = async (url: string): Promise<{ base64: string, mimeType: string }> => {
    if (url.startsWith('data:')) {
      const parts = url.split(',');
      const mimeType = parts[0].split(':')[1].split(';')[0];
      return { base64: parts[1], mimeType };
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const parts = dataUrl.split(',');
        resolve({ base64: parts[1], mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const combineImages = async (imageUrls: string[]): Promise<string> => {
    if (imageUrls.length === 0) return '';
    if (imageUrls.length === 1) return imageUrls[0];
    
    const imgs = await Promise.all(imageUrls.map(url => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    }));
    
    const canvas = document.createElement("canvas");
    const cols = Math.ceil(Math.sqrt(imgs.length));
    const rows = Math.ceil(imgs.length / cols);
    const CELL_SIZE = 512;
    canvas.width = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageUrls[0];
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    imgs.forEach((img, i) => {
       let drawW = img.width;
       let drawH = img.height;
       const ratio = Math.min(CELL_SIZE / drawW, CELL_SIZE / drawH);
       drawW *= ratio;
       drawH *= ratio;
       const x = (i % cols) * CELL_SIZE + (CELL_SIZE - drawW) / 2;
       const y = Math.floor(i / cols) * CELL_SIZE + (CELL_SIZE - drawH) / 2;
       ctx.drawImage(img, x, y, drawW, drawH);
    });
    
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const handleGenerateInterior = async () => {
    if (!exteriorImage) {
      alert('请先在“外观定义”中生成外观效果图。');
      return;
    }

    setIsGenerating(true);
    try {
      const compName = COMPARTMENTS.find(c => c.id === activeCompartment)?.name || '内部结构';
      
      let prompt = '';
      if (activeCompartment === 'back') {
        prompt = `Generate a highly detailed, photorealistic view of the BACK PANEL and SHOULDER STRAPS of the backpack.
        The image MUST ONLY show the back side of the backpack in a closed, normal state. 
        CRITICAL: DO NOT show the back panel peeling away, opening up, or revealing any internal compartments. It must be a solid, closed back panel.
        The outer silhouette and contour of the backpack MUST perfectly match the provided exterior reference image.
        Focus entirely on the ergonomic design, padding, mesh materials, and strap structures.
        Octane render, high contrast lighting, professional product photography.`;
      } else if (activeCompartment === 'tech') {
        prompt = `Generate a highly detailed, photorealistic interior view of a backpack's ${compName}. 
        CRITICAL VIEWPOINT: The backpack MUST be shown fully opened 180 degrees in a clamshell style from the BACK PANEL (背幅全开180度). 
        The back panel with shoulder straps should be folded down flat or wide open, revealing the dedicated laptop sleeve and tech organization on the inside.
        DO NOT show it opening from the front zipper. It MUST be a back-panel access design.
        Show a padded, suspended laptop sleeve, tablet pocket, and cable organization.
        The exterior silhouette of the bag should match the provided reference image perfectly.
        Show seamless transition with binding tape and waterproof seam tape.
        Octane render, high contrast lighting, professional product photography.`;
      } else if (activeCompartment === 'main') {
        prompt = `Generate a highly detailed, photorealistic interior view of a backpack's ${compName}. 
        The view should show the main compartment fully opened (clamshell or wide top-loading) to reveal the spacious internal structure.
        The exterior of the bag should match the provided reference image perfectly.
        Show seamless transition with binding tape and waterproof seam tape.
        Octane render, high contrast lighting, professional product photography.`;
      } else {
        prompt = `Generate a highly detailed, photorealistic interior view of a backpack's ${compName}. 
        The view should be dynamic, like a zipper opened halfway at a 45-degree angle to reveal the internal structure.
        The exterior of the bag should match the provided reference image perfectly.
        Show seamless transition with binding tape and waterproof seam tape.
        Octane render, high contrast lighting, professional product photography.`;
      }

      if (compartmentData.liningMaterial || compartmentData.liningColor) {
        prompt += `\nThe interior lining MUST feature ${compartmentData.liningColor || 'a specific color'} ${compartmentData.liningMaterial || 'material'}.`;
      }

      if (activeCompartment === 'back') {
        if (compartmentData.backPanelOptions && compartmentData.backPanelOptions.length > 0) {
          prompt += `\nBack Panel Specific Features:\n- ${compartmentData.backPanelOptions.join('\n- ')}`;
        }
        if (compartmentData.strapOptions && compartmentData.strapOptions.length > 0) {
          prompt += `\nStrap System Features:\n- ${compartmentData.strapOptions.join('\n- ')}`;
        }
      }

      if (customRequirement) {
        prompt += `\nAdditional Custom Requirements:\n${customRequirement}`;
      }

      prompt += `\nNEGATIVE PROMPTS: people, humans, hands, fingers, face, models, lifestyle, outdoor, indoor room, messy background, text, logo, watermark, distorted geometry, physically impossible structure, low quality, blurry.`;

      const parts: any[] = [{ text: prompt }];

      // Add ONLY ONE image to prevent 500 API errors with flash-image
      let targetImageToUse = exteriorImage;
      let isReferenceImage = false;
      const refImages = compartmentData.referenceImages || (compartmentData.referenceImage ? [compartmentData.referenceImage] : []);
      
      if (refImages.length > 0) {
        targetImageToUse = await combineImages(refImages);
        isReferenceImage = true;
      }
      
      if (targetImageToUse) {
        try {
          const { base64, mimeType } = await getBase64FromUrl(targetImageToUse);
          parts.push({
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          });
          if (isReferenceImage) {
             parts[0].text += `\n[CRITICAL SKETCH/LINE-ART DIRECTIVE]: The provided image is a sketch/line-art or structural reference (composed of one or multiple references). You MUST use it as a strict structural foundation. Generate a photorealistic rendering that perfectly aligns with the shapes, pockets, and spatial layout shown in this sketch, while applying the requested materials, colors, and styling requirements.`;
          } else {
             parts[0].text += `\nEnsure the interior style and colors match the exterior bag provided.`;
          }
        } catch (error) {
          console.error("Failed to process image:", error);
        }
      }

      const response = await generateContentWithRetry({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      let generatedImageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (generatedImageUrl) {
        updateCompartmentData({ generatedImage: generatedImageUrl });
        setViewMode('interior');
      }

    } catch (error) {
      console.error('Error generating interior:', error);
      alert('生成内部结构图失败，请重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">4. 结构设计</h2>
          <p className="text-base text-slate-400 max-w-3xl leading-relaxed">定义包袋的内部构造、空间分割与材质细节。</p>
        </div>
        <button
          onClick={() => setIsStructureLibraryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-xl transition-all"
        >
          <Library size={18} />
          <span className="font-bold">模块化资料库</span>
        </button>
      </header>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Column: Compartment Navigation */}
        <div className="w-48 flex flex-col gap-2 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-2">舱室类目 (Compartments)</h3>
          {COMPARTMENTS.map((comp) => {
            const isActive = activeCompartment === comp.id;
            const hasGenerated = !!designData.structure?.compartments?.[comp.id]?.generatedImage;
            return (
              <div key={comp.id} className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleCompartmentChange(comp.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-slate-500/20 border border-slate-500/40 ring-1 ring-slate-500/20'
                      : 'glass-panel hover:bg-slate-500/10 border border-transparent'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-slate-500/30 text-white' : 'bg-slate-500/10 text-gray-400'}`}>
                    <comp.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {comp.name.split(' ')[0]}
                      </span>
                      {hasGenerated && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />}
                    </div>
                    <p className="text-[9px] text-gray-500 mt-0.5 truncate">{comp.desc}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Middle Column: Main Canvas */}
        <div className="flex-1 flex flex-col min-w-0 glass-panel rounded-2xl overflow-hidden border border-white/5 relative">
          <div className="absolute top-4 left-4 z-10 flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode('exterior')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'exterior' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <SplitSquareHorizontal size={14} />
              外观闭合
            </button>
            <button
              onClick={() => setViewMode('interior')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'interior' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FolderOpen size={14} />
              内部展开
            </button>
          </div>

          <div className="flex-1 relative bg-black/20 flex items-center justify-center p-8">
            {viewMode === 'exterior' ? (
              exteriorImage ? (
                <img src={exteriorImage} alt="Exterior" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              ) : (
                <div className="text-center text-gray-500 flex flex-col items-center gap-3">
                  <ImageIcon size={48} className="opacity-20" />
                  <p className="text-sm">尚未生成外观图</p>
                </div>
              )
            ) : (
              compartmentData.generatedImage ? (
                <div className="relative group max-w-full max-h-full flex items-center justify-center">
                  <img src={compartmentData.generatedImage} alt="Interior" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = compartmentData.generatedImage;
                        link.download = `interior-${activeCompartment}-${Date.now()}.png`;
                        link.click();
                      }}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                      title="保存到本地"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        updateCompartmentData({ generatedImage: undefined });
                      }}
                      className="w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-md border border-red-500/50 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                      title="删除此图片"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 flex flex-col items-center gap-3">
                  <FolderOpen size={48} className="opacity-20" />
                  <p className="text-sm">点击右侧面板生成 {COMPARTMENTS.find(c => c.id === activeCompartment)?.name.split(' ')[0]} 内部结构图</p>
                </div>
              )
            )}
            
            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <Loader2 size={48} className="text-slate-400 animate-spin mb-4" />
                <p className="text-white font-medium tracking-widest uppercase text-sm">AI 正在生成内部结构...</p>
                <p className="text-gray-400 text-xs mt-2">融合外观轮廓与材质细节</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Control Panel */}
        <div className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">结构定义控制台</h3>
          
          {/* Module A: Exterior Anchor */}
          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                外观锚点绑定
              </h4>
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                更换外观图
              </button>
            </div>
            {exteriorImage ? (
              <div className="flex gap-3 items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <img src={exteriorImage} alt="Anchor" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-400 font-medium flex items-center gap-1 mb-1">
                    ✓ 已自动绑定外观母版
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    AI 将提取边缘轮廓与外部面料，确保内外 100% 一致。
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-orange-400 bg-orange-400/10 p-2 rounded border border-orange-400/20">
                未检测到外观图，请先完成外观生成。
              </p>
            )}
          </div>

          {/* Module B: Reference Image */}
          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              内部结构参考图
            </h4>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              上传竞品内部隔层图，AI 将提取空间分割逻辑（如网兜位置）并替换为您的品牌风格。
            </p>
            
            {((compartmentData.referenceImages && compartmentData.referenceImages.length > 0) || compartmentData.referenceImage) ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Handle legacy single image */}
                  {compartmentData.referenceImage && !compartmentData.referenceImages && (
                    <div className="relative group rounded-lg overflow-hidden border border-white/10 h-32">
                      <img src={compartmentData.referenceImage} alt="Reference" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => updateCompartmentData({ referenceImage: undefined })}
                          className="text-xs text-white bg-red-500/80 px-3 py-1.5 rounded-md hover:bg-red-500"
                        >
                          移除图片
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Handle multiple images */}
                  {compartmentData.referenceImages && compartmentData.referenceImages.map((img: string, idx: number) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/10 h-32">
                      <img src={img} alt={`Reference ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => {
                            const newArr = [...compartmentData.referenceImages];
                            newArr.splice(idx, 1);
                            updateCompartmentData({ referenceImages: newArr });
                          }}
                          className="text-xs text-white bg-red-500/80 px-3 py-1.5 rounded-md hover:bg-red-500"
                        >
                          移除图片
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Add more button */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all group"
                  >
                    <Upload size={20} className="text-gray-500 group-hover:text-gray-300 mb-2" />
                    <span className="text-xs text-gray-500 group-hover:text-gray-300">继续添加</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all group"
                >
                  <Upload size={24} className="text-gray-500 group-hover:text-gray-300 mb-2" />
                  <span className="text-xs text-gray-500 group-hover:text-gray-300">本地上传</span>
                </div>
                <div 
                  onClick={() => setIsStructureLibraryOpen(true)}
                  className="border-2 border-dashed border-blue-500/30 bg-blue-500/5 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group"
                >
                  <Library size={24} className="text-blue-400 group-hover:text-blue-300 mb-2" />
                  <span className="text-xs text-blue-400 group-hover:text-blue-300">从资料库选择</span>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
              multiple
            />
          </div>

          {/* Module C: Lining Material & Color */}
          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
              内衬材质与色彩
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">材质 (Material)</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2.5 rounded-lg bg-black/20 border border-white/10 text-left text-sm text-gray-300 flex items-center">
                    <span className="truncate">{compartmentData.liningMaterial || '未选择材质'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
                      const recommendedFabrics = selectedCategories.flatMap(id => getDynamicRecommendations(id, designData.definition?.result)?.fabrics || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.fabrics || []);
                      const recommendedColors = selectedCategories.flatMap(id => getDynamicRecommendations(id, designData.definition?.result)?.colors || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.colors || []);
                      setAssetLibraryTrigger({ isOpen: true, tab: 'material', filters: { fabrics: recommendedFabrics, colors: recommendedColors } });
                    }}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    title="从资产库选择"
                  >
                    <Library size={16} />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">色彩 (Color)</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2.5 rounded-lg bg-black/20 border border-white/10 text-left text-sm text-gray-300 flex items-center gap-2">
                    {compartmentData.liningColor && (
                      <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: compartmentData.liningColor }}></div>
                    )}
                    <span className="truncate">{compartmentData.liningColor || '未选择颜色'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
                      const recommendedFabrics = selectedCategories.flatMap(id => getDynamicRecommendations(id, designData.definition?.result)?.fabrics || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.fabrics || []);
                      const recommendedColors = selectedCategories.flatMap(id => getDynamicRecommendations(id, designData.definition?.result)?.colors || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.colors || []);
                      setAssetLibraryTrigger({ isOpen: true, tab: 'color', filters: { fabrics: recommendedFabrics, colors: recommendedColors } });
                    }}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    title="从资产库选择"
                  >
                    <Library size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Requirement */}
          <div className="mb-4">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">自定义需求 (Custom Requirements)</label>
            <div className="flex flex-col gap-2">
              <textarea
                value={customRequirement}
                onChange={(e) => setCustomRequirement(e.target.value)}
                placeholder="输入其他设计需求，例如：需要增加一个隐藏的拉链口袋..."
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none h-20"
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    multiple
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 font-medium transition-colors flex items-center gap-2"
                  >
                    <Upload size={14} />
                    上传线稿图
                  </button>
                  {((compartmentData.referenceImages && compartmentData.referenceImages.length > 0) || compartmentData.referenceImage) && (
                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                      <Check size={14} className="text-blue-400" />
                      <span className="text-xs text-blue-300">
                        已上传 {Math.max((compartmentData.referenceImages?.length || 0), (compartmentData.referenceImage ? 1 : 0))} 张图
                      </span>
                      <button 
                        onClick={() => updateCompartmentData({ referenceImages: undefined, referenceImage: undefined })}
                        className="ml-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateInterior}
            disabled={isGenerating || !exteriorImage}
            className={`mt-auto w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              isGenerating || !exteriorImage
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                生成内部结构图
              </>
            )}
          </button>
        </div>
      </div>
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">选择外观闭合图</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="mb-6">
                <button 
                  onClick={() => exteriorImageInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Upload size={24} />
                  <span>点击上传本地图片</span>
                </button>
                <input 
                  type="file" 
                  ref={exteriorImageInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    handleExteriorImageUpload(e);
                    setShowHistoryModal(false);
                  }} 
                />
              </div>
              
              {imageHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">从历史记录中选择</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageHistory.map((item: any, index: number) => {
                      const url = typeof item === 'string' ? item : item.url;
                      return (
                        <div 
                          key={index} 
                          className="relative group cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-blue-500 transition-all aspect-square"
                          onClick={() => {
                            updateDesignData('structure', {
                              ...designData.structure,
                              exteriorImage: url
                            });
                            setShowHistoryModal(false);
                          }}
                        >
                          <img src={url} alt={`History ${index}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium bg-blue-500/80 px-3 py-1 rounded-full">选择</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Library Modal */}
      <AssetLibraryModal 
        isOpen={isLibraryModalOpen} 
        onClose={() => setIsLibraryModalOpen(false)} 
        initialTab={libraryInitialTab} 
        onSelect={(type, value) => {
          if (type === 'material') {
            updateCompartmentData({ liningMaterial: value.name });
          } else if (type === 'color') {
            updateCompartmentData({ liningColor: value.hex || value.color });
          }
        }}
      />

      {/* Structure Library Modal */}
      <StructureLibraryModal
        isOpen={isStructureLibraryOpen}
        onClose={() => setIsStructureLibraryOpen(false)}
        onSelect={(url) => {
          updateCompartmentData({ referenceImage: url });
          setIsStructureLibraryOpen(false);
        }}
      />

      {/* Back Panel Configuration Modal */}
      {isBackPanelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Shield size={20} className="text-purple-400" />
                背负系统高级配置 (Back Panel & Strap System)
              </h3>
              <button onClick={() => setIsBackPanelModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Back Panel */}
                <div className="space-y-6">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    背板组件 (Back Panel)
                  </h4>
                  <div className="space-y-5">
                    {BACK_PANEL_INSTRUCTIONS.map((module) => (
                      <div key={module.id} className="space-y-2.5">
                        <h5 className="text-xs font-semibold text-gray-300">{module.title}</h5>
                        <div className="flex flex-wrap gap-2">
                          {module.options.map((opt) => {
                            const isSelected = (compartmentData.backPanelOptions || []).includes(opt.value);
                            return (
                              <button
                                key={opt.id}
                                onClick={() => toggleBackPanelOption(module.id, opt.value, module.type as 'single' | 'multiple')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                  isSelected 
                                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                                    : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Strap System */}
                <div className="space-y-6">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    肩带系统 (Strap System)
                  </h4>
                  <div className="space-y-5">
                    {STRAP_SYSTEM_INSTRUCTIONS.map((module) => (
                      <div key={module.id} className="space-y-2.5">
                        <h5 className="text-xs font-semibold text-gray-300">{module.title}</h5>
                        <div className="flex flex-wrap gap-2">
                          {module.options.map((opt) => {
                            const isSelected = (compartmentData.strapOptions || []).includes(opt.value);
                            return (
                              <button
                                key={opt.id}
                                onClick={() => toggleStrapOption(module.id, opt.value, module.type as 'single' | 'multiple')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                  isSelected 
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                                    : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
              <button
                onClick={() => setIsBackPanelModalOpen(false)}
                className="px-6 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                完成配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

