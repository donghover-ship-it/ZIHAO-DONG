import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box, Upload, X, Tag, Edit2, Check, Sparkles, Loader2, Palette, Layers, ChevronDown, ChevronUp, Plus, Zap, AlertTriangle, RotateCcw, Search, BookOpen, RefreshCw } from 'lucide-react';
import { useDesignStore } from '../store/useDesignStore';
import localforage from 'localforage';
import { generateContentWithRetry } from '../utils/aiUtils';
import Markdown from 'react-markdown';
import { getTextureClass } from '../utils/textureUtils';
import { getDynamicRecommendations } from '../utils/recommendationUtils';
import { PANTONE_COLORS } from '../constants/pantoneColors';

interface ParsedImageData {
  brand: string;
  colors: string[];
  material: string;
  tags: string[];
  isMatch?: boolean;
  matchReason?: string;
}

interface EditingImage {
  categoryId: string;
  file: File;
  previewUrl: string;
  parsedData: ParsedImageData;
  isSmart: boolean;
  isAnalyzing: boolean;
}

export const STYLE_CATEGORIES = [
  {
    id: 'urban-outdoor',
    name: '都市户外 (Urban Outdoor)',
    abbreviation: 'UOD',
    description: '【设计特征】融合城市通勤的便捷性与轻度户外的耐候性，外观相对内敛，但具备防泼水、多隔层等实用功能，背负系统适中。\n【关键词】轻量化、场景无缝切换、防泼水、多功能收纳、通勤友好。\n【代表品牌】The North Face (Purple Label), Patagonia, Gregory (日常系列), Osprey (城市系列)。',
    recommended_assets: {
      colors: ['#4A5D23', '#2F4F4F', '#8B4513', '#A9A9A9', '#000000'],
      fabrics: ['DP_400D_RECYCLED_NYLON', 'DP_XPAC_RX30', 'DP_ECOPAK_EPX200', 'DP_TPU_COATED_420D']
    }
  },
  {
    id: 'urban-techwear',
    name: '都市机能 (Urban Techwear)',
    abbreviation: 'UTC',
    description: '【设计特征】极具未来感与赛博朋克美学，大量使用高科技面料（如X-Pac、Dyneema、防水拉链），强调模块化、快拆磁吸扣具与不对称设计。\n【关键词】赛博朋克、高科技面料、防水拉链、快取系统、磁吸扣具、暗黑美学。\n【代表品牌】ACRONYM, OrbitGear, Code of Bell, DSPTCH, Bagjack。',
    recommended_assets: {
      colors: ['#050505', '#121213', '#1C1C1E', '#2C2C2C', '#242526'],
      fabrics: ['DP_ULTRA200', 'DP_ULTRA400', 'DP_SPECTRA_GRID', 'DP_BALLISTIC1680D', 'DP_DCF']
    }
  },
  {
    id: 'urban-minimalist',
    name: '都市极简 (Urban Minimalist)',
    abbreviation: 'UMI',
    description: '【设计特征】外观极致干净利落，几乎看不到外露的拉链和口袋，采用隐藏式收纳设计。材质多为硬挺的尼龙或皮革，保持包身立体感。\n【关键词】极简主义、隐藏式收纳、立体挺括、商务通勤、无缝线视觉。\n【代表品牌】Aer, Bellroy, Cote&Ciel, Rains, Veilance。',
    recommended_assets: {
      colors: ['#F5F5F5', '#333333', '#808080', '#1A1A1A', '#E0E0E0'],
      fabrics: ['DP_XPAC_V15', 'DP_CORDURA330D_LP', 'DP_NANO_REPAIR']
    }
  },
  {
    id: 'daily-casual',
    name: '日常休闲 (Daily Casual)',
    abbreviation: 'CAS',
    description: '【设计特征】设计回归基础与百搭，注重日常使用的舒适度与亲和力。材质多为帆布、软质尼龙或灯芯绒，色彩丰富，适合学生或休闲出行。\n【关键词】百搭舒适、亲和力、色彩丰富、帆布/软尼龙、基础实用。\n【代表品牌】JanSport, Herschel Supply Co., Fjällräven (Kånken), MUJI。',
    recommended_assets: {
      colors: ['#1E3A8A', '#B91C1C', '#D97706', '#047857', '#4B5563'],
      fabrics: ['DP_30D_SILNYLON', 'DP_3D_SPACER_MESH', 'DP_RVX25']
    }
  },
  {
    id: 'yama-outdoor',
    name: '山系户外 (Yama Style Outdoor)',
    abbreviation: 'YAM',
    description: '【设计特征】带有浓厚的复古与自然气息，常采用大地色系（军绿、卡其、棕色）。注重层次感穿搭，常配有外挂织带、抽绳和复古金属扣件。\n【关键词】复古自然、大地色系、外挂抽绳、层次感、露营美学、Yama Style。\n【代表品牌】Snow Peak, meanswhile, F/CE., And Wander, Mystery Ranch (复古线)。',
    recommended_assets: {
      colors: ['#556B2F', '#8B4513', '#D2B48C', '#A0522D', '#2F4F4F'],
      fabrics: ['DP_WAXEDCANVAS', 'DP_VX21_TERRAIN', 'DP_VX07']
    }
  },
  {
    id: 'outdoor-techwear',
    name: '户外机能 (Outdoor Techwear)',
    abbreviation: 'OTC',
    description: '【设计特征】专为复杂多变的严酷户外环境设计，强调极致的防护性（全防水、抗撕裂）与专业背负系统。外观硬核，功能导向。\n【关键词】极致防护、抗撕裂、专业背负、全天候、硬核功能、轻量化高强。\n【代表品牌】Arc\'teryx, Hyperlite Mountain Gear (HMG), Klättermusen (攀山鼠), Salomon (S-Lab)。',
    recommended_assets: {
      colors: ['#FF4500', '#FFD700', '#000000', '#4169E1', '#32CD32'],
      fabrics: ['DP_XPAC_X50', 'DP_KEVLAR_REINFORCED', 'DP_DYNEEMA_HYBRID']
    }
  },
  {
    id: 'outdoor-tactical',
    name: '户外战术 (Outdoor Tactical)',
    abbreviation: 'OTA',
    description: '【设计特征】源自军警装备，采用军工级耐磨面料（如1000D Cordura），标志性的MOLLE织带系统提供强大的模块化拓展能力，外观硬朗。\n【关键词】军工级耐磨、MOLLE系统、模块化拓展、硬朗粗犷、生存狂、魔术贴。\n【代表品牌】Mystery Ranch (军规线), 5.11 Tactical, Magforce, TAD Gear。',
    recommended_assets: {
      colors: ['#4B5320', '#C2B280', '#000000', '#808080', '#8B4513'],
      fabrics: ['DP_CORDURA1000D', 'DP_XPAC_X51', 'DP_BALLISTIC1260D', 'DP_LASER_LAMINATE']
    }
  }
];

const EditableDescription = ({ 
  categoryId, 
  defaultDescription, 
  customDescription, 
  onSave 
}: { 
  categoryId: string, 
  defaultDescription: string, 
  customDescription?: string, 
  onSave: (id: string, text: string) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(customDescription || defaultDescription);

  const handleSave = () => {
    onSave(categoryId, tempValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mt-2 space-y-4 w-full max-w-5xl">
        <textarea 
          value={tempValue} 
          onChange={e => setTempValue(e.target.value)} 
          className="w-full bg-black/40 rounded-2xl p-5 text-sm md:text-base text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors resize-none"
          rows={5}
        />
        <div className="flex gap-3">
          <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-full transition-all shadow-lg flex items-center gap-2">
            <Check size={16} /> 保存
          </button>
          <button onClick={() => { setIsEditing(false); setTempValue(customDescription || defaultDescription); }} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full transition-colors flex items-center gap-2">
            <X size={16} /> 取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative mt-1 w-full max-w-5xl rounded-xl -ml-2 p-2 hover:bg-white/[0.03] transition-colors cursor-text border border-transparent hover:border-white/[0.05]" onClick={() => setIsEditing(true)}>
      <p className="text-xs md:text-sm text-slate-400 whitespace-pre-wrap leading-relaxed pr-10">
        {customDescription || defaultDescription}
      </p>
      <div className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-xs shadow-sm">
        <Edit2 size={14} />
      </div>
    </div>
  );
};

export const CompetitorLibrary = React.memo(() => {
  const designData = useDesignStore(state => state.designData);
  const updateDesignData = useDesignStore(state => state.updateDesignData);
  const setActiveModule = useDesignStore(state => state.setActiveModule);
  const setAssetLibraryTrigger = useDesignStore(state => state.setAssetLibraryTrigger);
  const setActiveStyleCategory = useDesignStore(state => state.setActiveStyleCategory);
  const [competitorImages, setCompetitorImages] = useState<Record<string, { id: string, data: string, parsedData?: any }[]>>({});
  const [scanningImages, setScanningImages] = useState<Record<string, boolean>>({});
  const [viewingImage, setViewingImage] = useState<{ id: string, data: string, parsedData?: any, categoryId: string } | null>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [activeTextureFilter, setActiveTextureFilter] = useState<string | null>(null);
  const [activeColorGlow, setActiveColorGlow] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<EditingImage | null>(null);
  const [imageQueue, setImageQueue] = useState<{ categoryId: string, file: File, previewUrl: string, isSmart: boolean }[]>([]);
  const [addedColors, setAddedColors] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [searchOpen, setSearchOpen] = useState<Record<string, boolean>>({});

  const getImageNumber = (categoryId: string, imageId: string) => {
    const category = STYLE_CATEGORIES.find(c => c.id === categoryId);
    if (!category || !category.abbreviation) return '';
    const images = competitorImages[categoryId] || [];
    let analyzedCount = 0;
    for (const img of images) {
      if (img.parsedData) {
        analyzedCount++;
        if (img.id === imageId) {
          return `${category.abbreviation}-${String(analyzedCount).padStart(3, '0')}`;
        }
      }
    }
    return '';
  };

  const getPredictedImageNumber = (categoryId: string) => {
    const category = STYLE_CATEGORIES.find(c => c.id === categoryId);
    if (!category || !category.abbreviation) return '';
    const images = competitorImages[categoryId] || [];
    const analyzedCount = images.filter(img => img.parsedData).length;
    return `${category.abbreviation}-${String(analyzedCount + 1).padStart(3, '0')}`;
  };

  const [addedColorIdx, setAddedColorIdx] = useState<number | null>(null);
  const [deletedImageInfo, setDeletedImageInfo] = useState<{
    categoryId: string;
    image: { id: string, data: string, parsedData?: any };
    timeoutId: NodeJS.Timeout;
  } | null>(null);
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const colorOverrides = designData.competitor?.colorOverrides || {};
  const [colorReplacePopover, setColorReplacePopover] = useState<{
    isOpen: boolean;
    categoryId: string;
    index: number;
    x: number;
    y: number;
    currentColor: string;
  } | null>(null);

  const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
  const fusionAnalysis = designData.competitor?.fusionAnalysis;
  const isAnalyzingFusion = designData.competitor?.isAnalyzingFusion;
  const [summarizingCategories, setSummarizingCategories] = useState<Record<string, boolean>>({});
  const [isUpgradingImages, setIsUpgradingImages] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState({ current: 0, total: 0 });

  const upgradeLegacyImages = async () => {
    setIsUpgradingImages(true);
    let totalToUpgrade = 0;
    
    // First, count how many need an upgrade
    for (const [categoryId, images] of Object.entries(competitorImages)) {
      for (const img of images) {
        if (img.parsedData && !img.parsedData.designPrompt) {
          totalToUpgrade++;
        }
      }
    }

    setUpgradeProgress({ current: 0, total: totalToUpgrade });

    if (totalToUpgrade === 0) {
      setIsUpgradingImages(false);
      return;
    }

    let currentProgress = 0;
    const updatedImages = { ...competitorImages };

    for (const [categoryId, images] of Object.entries(competitorImages)) {
      const categoryInfo = STYLE_CATEGORIES.find(c => c.id === categoryId);
      if (!categoryInfo) continue;

      const upgradedImages = await Promise.all(images.map(async (img) => {
        if (img.parsedData && !img.parsedData.designPrompt) {
          try {
            // Re-analyze just for prompt
            const promptStr = `Analyze this backpack image against the target style category: "${categoryInfo.name}".
Category Description: ${categoryInfo.description}

Extract the following information and return it strictly as a JSON object:
- designPrompt: A detailed Chinese image generation prompt (around 50-80 words) describing the backpack's shape, structure, materials, and key design features. It MUST BE IN CHINESE. (e.g., "一款都市机能风格的背包，采用防水尼龙面料...")

Return ONLY valid JSON without any markdown formatting.`;

            const response = await generateContentWithRetry({
              model: 'gemini-3.1-pro-preview',
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        data: img.data.split(',')[1],
                        mimeType: 'image/jpeg' 
                      }
                    },
                    { text: promptStr }
                  ]
                }
              ],
              config: { responseMimeType: "application/json" }
            });

            const parsed = JSON.parse(response.text || "{}");
            if (parsed.designPrompt) {
              img.parsedData.designPrompt = parsed.designPrompt;
            }
          } catch (e) {
            console.error("Failed to upgrade legacy image:", e);
          }
          currentProgress++;
          setUpgradeProgress(prev => ({ ...prev, current: currentProgress }));
        }
        return img;
      }));
      updatedImages[categoryId] = upgradedImages;
    }

    setCompetitorImages(updatedImages);
    await localforage.setItem('competitorImages', updatedImages);
    setIsUpgradingImages(false);
  };

  useEffect(() => {
    // Only run this when competitorImages changes and has actual data
    if (Object.keys(competitorImages).length > 0 && !isUpgradingImages) {
      let shouldUpgrade = false;
      for (const images of Object.values(competitorImages)) {
        if (images.some(img => img.parsedData && !img.parsedData.designPrompt)) {
          shouldUpgrade = true;
          break;
        }
      }
      if (shouldUpgrade) {
        upgradeLegacyImages();
      }
    }
  }, [competitorImages]);

  const generateCategorySummary = async (category: any, images: any[]) => {
    if (!images || images.length === 0) return;
    const prompts = images
      .filter(img => img.parsedData && img.parsedData.designPrompt)
      .map((img, i) => `Image ${i + 1}: ${img.parsedData.designPrompt}`)
      .join('\n');

    if (!prompts) return;

    setSummarizingCategories(prev => ({ ...prev, [category.id]: true }));

    try {
      const promptStr = `You are an expert AI image generation prompt engineer and industrial designer. 
Analyze the following design prompts derived from several backpack images belonging to the style category: "${category.name}". 
Your task is to synthesize and summarize these individual prompts into a single, highly detailed, and comprehensive Master Prompt that perfectly represents the essence of this style category. 

The resulting prompt must:
- Be in Chinese (中文).
- Be extremely descriptive and rich in detail, starting with the main subject (e.g., "一款${category.name}风格的背包...").
- EXHAUSTIVELY cover the following dimensions based on the aggregated traits of the individual prompts:
  1. 整体风格与氛围 (Overall aesthetic, style, and visual vibe)
  2. 核心面料与材质搭配 (Primary fabrics, material splicing, textures, coatings like TPU/DWR)
  3. 标志性配色方案 (Dominant base colors and specific accent colors)
  4. 结构与造型特点 (Silhouettes, structural shapes, closure types like roll-top or rigid panels)
  5. 关键功能细节与五金 (Zippers, buckles, straps, webbing, pockets, and hardware specifics)
- Be highly suitable for direct use in a professional text-to-image AI model (like Midjourney) to generate a photorealistic product rendering.
- Length: Around 150-300 words. Do not be overly concise; embrace rich, descriptive vocabulary.
- Return ONLY the prompt text, with no markdown, quotes, title, or conversational filler.

Individual Prompts:
${prompts}`;

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: promptStr,
      });

      const summary = response.text?.trim() || "";
      if (summary) {
        const currentPrompts = designData.competitor?.categoryPrompts || {};
        updateDesignData('competitor', {
          ...designData.competitor,
          categoryPrompts: { ...currentPrompts, [category.id]: summary }
        });
      }
    } catch (error) {
      console.error("Failed to generate category summary:", error);
    } finally {
      setSummarizingCategories(prev => ({ ...prev, [category.id]: false }));
    }
  };

  useEffect(() => {
    const visibilityMap = new Map<string, number>();
    let debounceTimeout: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id.replace('style-category-', '');
          visibilityMap.set(id, entry.intersectionRatio);
        });

        let maxRatio = 0;
        let activeId = null;
        visibilityMap.forEach((ratio, id) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            activeId = id;
          }
        });

        if (activeId) {
          if (debounceTimeout) clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            setActiveStyleCategory(activeId);
          }, 100); // 100ms debounce to prevent rapid re-renders during fast scrolling
        }
      },
      {
        root: null, // Use the viewport
        rootMargin: '-10% 0px -20% 0px', // Focus on the middle-upper part of the screen
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], // Granular thresholds for smooth tracking
      }
    );

    STYLE_CATEGORIES.forEach((category) => {
      const element = document.getElementById(`style-category-${category.id}`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      observer.disconnect();
    };
  }, [setActiveStyleCategory]);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const stored = await localforage.getItem<any>('competitorImages');
        if (stored) {
          if (Array.isArray(stored)) {
            // Migrate old flat array to the first category
            const defaultCategory = STYLE_CATEGORIES[0].id;
            const migrated = { [defaultCategory]: stored };
            setCompetitorImages(migrated);
            updateDesignData('competitor', { 
              ...designData.competitor, 
              competitorImages: { [defaultCategory]: stored.map(img => img.data) } 
            });
            await localforage.setItem('competitorImages', migrated);
          } else {
            setCompetitorImages(stored);
            const forStore: Record<string, string[]> = {};
            Object.keys(stored).forEach(key => {
              forStore[key] = stored[key].map((img: any) => img.data);
            });
            updateDesignData('competitor', { ...designData.competitor, competitorImages: forStore });
          }
        }
      } catch (err) {
        console.error("Failed to load stored data:", err);
      }
    };
    loadStoredData();
  }, []);

  const generateFusionAnalysis = async (categories: string[]) => {
    if (categories.length !== 2) return;
    
    updateDesignData('competitor', { ...designData.competitor, styleCategories: categories, isAnalyzingFusion: true, fusionAnalysis: '' });
    
    const cat1 = STYLE_CATEGORIES.find(c => c.id === categories[0]);
    const cat2 = STYLE_CATEGORIES.find(c => c.id === categories[1]);
    
    if (!cat1 || !cat2) return;

    const customDesc1 = designData.competitor?.customDescriptions?.[cat1.id] || cat1.description;
    const customDesc2 = designData.competitor?.customDescriptions?.[cat2.id] || cat2.description;

    const prompt = `
你是一位资深的箱包产品设计师。用户选择了两种不同的箱包设计风格，请你分析这两种风格如何完美融合，并给出设计建议。

风格一：${cat1.name}
特征描述：${customDesc1}

风格二：${cat2.name}
特征描述：${customDesc2}

请从以下几个方面输出分析结果（使用Markdown格式，语言精炼专业）：
1. **融合概念**：一句话总结这两种风格融合后的核心设计理念。
2. **材质与色彩建议**：推荐适合这种融合风格的面料、配件材质及色彩搭配方案。
3. **结构与功能设计**：在包体结构、收纳系统、背负系统上如何平衡两者的特点。
4. **目标人群与场景**：这种融合风格最适合什么样的用户在什么场景下使用。
`;

    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      updateDesignData('competitor', { 
        ...designData.competitor, 
        styleCategories: categories,
        isAnalyzingFusion: false, 
        fusionAnalysis: response.text 
      });
    } catch (error) {
      console.error("Fusion analysis failed:", error);
      updateDesignData('competitor', { 
        ...designData.competitor, 
        styleCategories: categories,
        isAnalyzingFusion: false, 
        fusionAnalysis: "分析失败，请稍后重试或检查网络连接。" 
      });
    }
  };

  useEffect(() => {
    const handleSelectStyleCategory = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      handleCategorySelect(customEvent.detail);
    };
    window.addEventListener('select-style-category', handleSelectStyleCategory);
    return () => {
      window.removeEventListener('select-style-category', handleSelectStyleCategory);
    };
  }, [selectedCategories, designData.competitor]);

  const handleCategorySelect = (categoryId: string) => {
    let newCategories: string[];
    
    if (selectedCategories.includes(categoryId)) {
      newCategories = selectedCategories.filter(id => id !== categoryId);
    } else {
      if (selectedCategories.length >= 2) {
        newCategories = [selectedCategories[1], categoryId];
      } else {
        newCategories = [...selectedCategories, categoryId];
      }
    }
    
    if (newCategories.length === 2) {
      generateFusionAnalysis(newCategories);
    } else {
      updateDesignData('competitor', { ...designData.competitor, styleCategories: newCategories, fusionAnalysis: '', isAnalyzingFusion: false });
    }
  };

  const handleDescriptionSave = (categoryId: string, text: string) => {
    const currentDescriptions = designData.competitor?.customDescriptions || {};
    updateDesignData('competitor', { 
      ...designData.competitor, 
      customDescriptions: { ...currentDescriptions, [categoryId]: text } 
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const updateImageParsedData = async (categoryId: string, imageId: string, field: string, value: any) => {
    const updatedCategoryImages = (competitorImages[categoryId] || []).map(img => {
      if (img.id === imageId) {
        return {
          ...img,
          parsedData: {
            ...img.parsedData,
            [field]: value
          }
        };
      }
      return img;
    });
    
    const updatedImages = { ...competitorImages, [categoryId]: updatedCategoryImages };
    setCompetitorImages(updatedImages);
    await localforage.setItem('competitorImages', updatedImages);
  };

  const onCompetitorImagesChange = async (categoryId: string, e: React.ChangeEvent<HTMLInputElement>, isSmart: boolean = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newQueueItems = await Promise.all(files.map(async (file) => {
      const previewUrl = await fileToBase64(file);
      return { categoryId, file, previewUrl, isSmart };
    }));

    setImageQueue(prev => [...prev, ...newQueueItems]);
    
    // Reset the input value so the same files can be selected again if needed
    e.target.value = '';
  };

  useEffect(() => {
    if (!editingImage && imageQueue.length > 0) {
      const nextItem = imageQueue[0];
      setImageQueue(prev => prev.slice(1));
      
      const categoryInfo = STYLE_CATEGORIES.find(c => c.id === nextItem.categoryId);
      const categoryName = categoryInfo?.name || '';
      const categoryDesc = categoryInfo?.description || '';

      setEditingImage({
        categoryId: nextItem.categoryId,
        file: nextItem.file,
        previewUrl: nextItem.previewUrl,
        parsedData: {
          brand: '',
          colors: [],
          material: '',
          tags: [],
          isMatch: true,
          matchReason: ''
        },
        isSmart: nextItem.isSmart,
        isAnalyzing: nextItem.isSmart
      });

      if (nextItem.isSmart) {
        const analyze = async () => {
          try {
            const response = await generateContentWithRetry({
              model: 'gemini-3.1-pro-preview',
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        data: nextItem.previewUrl.split(',')[1],
                        mimeType: nextItem.file.type
                      }
                    },
                    {
                      text: `Analyze this backpack image against the target style category: "${categoryName}".
Category Description: ${categoryDesc}

Extract the following information and return it strictly as a JSON object:
- brand: The brand name of the backpack. If you are not completely certain, prepend "预测: " to the brand name (e.g., "预测: The North Face"). If completely unknown, leave empty.
- colors: An array containing exactly 1 dominant hex color code found on the backpack (e.g., ['#AABBCC']). Do not return more than one color.
- material: The primary material of the backpack. If you are not completely certain, prepend "预测: " to the material name (e.g., "预测: Cordura 500D").
- tags: An array of 3 to 6 style or functional tags. Crucially, you MUST scan for and include hardware/accessory details as tags if present, such as '弹力绳' (bungee cords), '织带' (webbing), '扣具' (buckles), '拉链' (zippers), etc. (e.g., ['防泼水', '耐磨', '弹力绳', '织带']).
- designPrompt: A detailed Chinese image generation prompt (around 50-80 words) describing the backpack's shape, structure, materials, and key design features. It MUST BE IN CHINESE. (e.g., "一款都市机能风格的背包，采用防水尼龙面料...")
- isMatch: boolean (true or false). Does this backpack's design and style fit the target category "${categoryName}"?
- matchReason: A short sentence explaining why it matches or doesn't match the target category.

Return ONLY valid JSON without any markdown formatting.`
                    }
                  ]
                }
              ],
              config: {
                responseMimeType: "application/json"
              }
            });

            const jsonText = response.text || "{}";
            const parsed = JSON.parse(jsonText);

            setEditingImage(prev => {
              if (!prev) return null;
              return {
                ...prev,
                parsedData: {
                  brand: parsed.brand || '',
                  colors: parsed.colors || [],
                  material: parsed.material || '',
                  tags: parsed.tags || [],
                  designPrompt: parsed.designPrompt || '',
                  isMatch: parsed.isMatch !== undefined ? parsed.isMatch : true,
                  matchReason: parsed.matchReason || ''
                },
                isAnalyzing: false
              };
            });
          } catch (error) {
            console.error("Error analyzing image:", error);
            setEditingImage(prev => {
              if (!prev) return null;
              return {
                ...prev,
                isAnalyzing: false
              };
            });
          }
        };
        analyze();
      }
    }
  }, [editingImage, imageQueue]);

  const saveEditingImage = async () => {
    if (!editingImage) return;
    
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    const newImage = {
      id,
      data: editingImage.previewUrl,
      parsedData: editingImage.parsedData
    };

    const categoryId = editingImage.categoryId;
    const updatedCategoryImages = [...(competitorImages[categoryId] || []), newImage];
    const updatedImages = { ...competitorImages, [categoryId]: updatedCategoryImages };
    
    setCompetitorImages(updatedImages);
    await localforage.setItem('competitorImages', updatedImages);
    
    const forStore: Record<string, string[]> = {};
    Object.keys(updatedImages).forEach(key => {
      forStore[key] = updatedImages[key].map((img: any) => img.data);
    });
    updateDesignData('competitor', { ...designData.competitor, competitorImages: forStore });

    setEditingImage(null);
  };

  const deleteCompetitorImage = async (categoryId: string, id: string) => {
    const categoryImages = competitorImages[categoryId] || [];
    const imageToDelete = categoryImages.find(img => img.id === id);
    if (!imageToDelete) return;

    const updatedCategoryImages = categoryImages.filter(img => img.id !== id);
    const updatedImages = { ...competitorImages, [categoryId]: updatedCategoryImages };
    
    setCompetitorImages(updatedImages);
    await localforage.setItem('competitorImages', updatedImages);
    
    const forStore: Record<string, string[]> = {};
    Object.keys(updatedImages).forEach(key => {
      forStore[key] = updatedImages[key].map((img: any) => img.data);
    });
    updateDesignData('competitor', { ...designData.competitor, competitorImages: forStore });

    const currentSelected = designData.appearance?.competitorImageUrl || [];
    if (currentSelected.includes(imageToDelete.data)) {
      updateDesignData('appearance', {
        ...designData.appearance,
        competitorImageUrl: currentSelected.filter(url => url !== imageToDelete.data)
      });
    }

    if (deletedImageInfo?.timeoutId) {
      clearTimeout(deletedImageInfo.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      setDeletedImageInfo(null);
    }, 5000);

    setDeletedImageInfo({
      categoryId,
      image: imageToDelete,
      timeoutId
    });
  };

  const undoDelete = async () => {
    if (!deletedImageInfo) return;

    const { categoryId, image, timeoutId } = deletedImageInfo;
    clearTimeout(timeoutId);

    const updatedCategoryImages = [...(competitorImages[categoryId] || []), image];
    const updatedImages = { ...competitorImages, [categoryId]: updatedCategoryImages };
    
    setCompetitorImages(updatedImages);
    await localforage.setItem('competitorImages', updatedImages);
    
    const forStore: Record<string, string[]> = {};
    Object.keys(updatedImages).forEach(key => {
      forStore[key] = updatedImages[key].map((img: any) => img.data);
    });
    updateDesignData('competitor', { ...designData.competitor, competitorImages: forStore });

    setDeletedImageInfo(null);
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const toggleReferenceImage = (imageData: string) => {
    const currentSelected = designData.appearance?.competitorImageUrl || [];
    let newSelected;
    if (currentSelected.includes(imageData)) {
      newSelected = currentSelected.filter(url => url !== imageData);
    } else {
      newSelected = [...currentSelected, imageData];
    }
    updateDesignData('appearance', {
      ...designData.appearance,
      competitorImageUrl: newSelected
    });
  };

  const dynamicRecommendations = React.useMemo(() => {
    const recs: Record<string, any> = {};
    STYLE_CATEGORIES.forEach(cat => {
      const baseRecs = getDynamicRecommendations(cat.id, designData.definition?.result) || cat.recommended_assets;
      if (baseRecs && baseRecs.colors) {
        const overriddenColors = [...baseRecs.colors];
        if (colorOverrides[cat.id]) {
          Object.entries(colorOverrides[cat.id]).forEach(([idx, color]) => {
            overriddenColors[parseInt(idx)] = color;
          });
        }
        recs[cat.id] = { ...baseRecs, colors: overriddenColors };
      } else {
        recs[cat.id] = baseRecs;
      }
    });
    return recs;
  }, [designData.definition?.result, colorOverrides]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Global Texture Filter */}
      {activeTextureFilter && (
        <div className={`fixed inset-0 pointer-events-none z-50 opacity-20 transition-opacity duration-500 ${getTextureClass(activeTextureFilter)}`} />
      )}
      
      {/* Global Color Glow */}
      {activeColorGlow && (
        <div 
          className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-1000 opacity-30 mix-blend-screen"
          style={{
            boxShadow: `inset 0 0 150px 50px ${activeColorGlow}`
          }}
        />
      )}

      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">1. CMF风格库</h2>
        <p className="text-base text-slate-400 max-w-3xl leading-relaxed">管理和分析竞品风格，为设计提供参考。请选择主打风格（最多可选2种进行融合分析）并在各分类下上传参考图。</p>
      </header>

      {isUpgradingImages && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-3 mb-4">
          <RefreshCw size={16} className="text-blue-400 animate-spin" />
          <span className="text-sm font-medium text-blue-400">
            正在后台自动提取图库设计特征 ({upgradeProgress.current}/{upgradeProgress.total})...
          </span>
        </div>
      )}

      {(isAnalyzingFusion || fusionAnalysis) && (
        <div className="glass-panel-premium rounded-[32px] p-6 ring-1 ring-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles size={16} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">AI 风格融合分析</h3>
            {isAnalyzingFusion && (
              <div className="ml-auto flex items-center gap-2 text-indigo-400 text-sm">
                <Loader2 size={16} className="animate-spin" />
                正在生成融合方案...
              </div>
            )}
          </div>
          
          <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-li:text-gray-300 prose-headings:text-white prose-strong:text-indigo-300">
            {isAnalyzingFusion ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            ) : (
              <Markdown>{fusionAnalysis}</Markdown>
            )}
          </div>
        </div>
      )}

      <section className="space-y-4">
        {STYLE_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const images = competitorImages[category.id] || [];
          const query = (searchQueries[category.id] || '').toLowerCase();
          const filteredImages = images.filter(img => {
            if (!query) return true;
            const parsed = img.parsedData;
            const imgNum = getImageNumber(category.id, img.id).toLowerCase();
            if (imgNum.includes(query)) return true;
            if (!parsed) return false;
            const brand = (parsed.brand || '').toLowerCase();
            const tags = (parsed.tags || []).map((t: string) => t.toLowerCase());
            return brand.includes(query) || tags.some((t: string) => t.includes(query));
          });
          const dynamicAssets = dynamicRecommendations[category.id];
          const primaryFabric = dynamicAssets?.fabrics?.[0];
          
          return (
          <div 
            key={category.id} 
            id={`style-category-${category.id}`}
            className={`glass-panel-premium rounded-2xl p-4 relative overflow-hidden transition-all duration-500 group ${
              isSelected 
                ? 'ring-2 ring-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.2)]' 
                : 'hover:ring-1 hover:ring-white/20'
            }`}
          >
            {/* Dynamic Texture Background on Hover */}
            {primaryFabric && (
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none ${getTextureClass(primaryFabric)}`} />
            )}
            
            {/* Decorative background glow */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none transition-colors duration-700 ${isSelected ? 'bg-[radial-gradient(circle,rgba(37,99,235,0.1)_0%,transparent_70%)]' : 'bg-transparent'}`} style={{ transform: 'translateZ(0)', willChange: 'transform' }} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110' 
                      : 'border-slate-500 bg-black/20 hover:border-slate-400 hover:bg-black/40'
                  }`}
                >
                  <Check size={14} strokeWidth={isSelected ? 3 : 2} className={isSelected ? "text-white opacity-100" : "opacity-0"} />
                </div>
                <h4 
                  onClick={() => handleCategorySelect(category.id)}
                  className={`text-lg font-bold tracking-tight cursor-pointer transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {category.name}
                </h4>
              </div>
              
              <div className="shrink-0 relative flex flex-col items-end gap-2">
                <label 
                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer"
                >
                  <Upload size={14} />
                  <span className="text-xs font-medium">上传竞品图</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onCompetitorImagesChange(category.id, e, true)} />
                </label>
                <div className="flex items-center gap-2">
                  {searchOpen[category.id] && (
                    <input
                      type="text"
                      placeholder="搜索编号/品牌/标签..."
                      value={searchQueries[category.id] || ''}
                      onChange={(e) => setSearchQueries(prev => ({ ...prev, [category.id]: e.target.value }))}
                      className="bg-black/20 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 w-40 transition-all"
                      autoFocus
                    />
                  )}
                  <button
                    onClick={() => setSearchOpen(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                    className={`p-2 rounded-full transition-colors ${searchOpen[category.id] ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'}`}
                    title="搜索"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative z-10 pl-8 mb-3">
              <EditableDescription 
                categoryId={category.id}
                defaultDescription={category.description}
                customDescription={designData.competitor?.customDescriptions?.[category.id]}
                onSave={handleDescriptionSave}
              />
            </div>
            
            <div className="relative z-10">
              {images.length === 0 ? (
                <label 
                  className="w-full h-32 border-2 border-dashed border-white/10 bg-white/[0.02] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Upload className="text-slate-400 group-hover:text-blue-400 transition-colors" size={20} />
                  </div>
                  <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300">点击上传此风格的竞品图片</p>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onCompetitorImagesChange(category.id, e, true)} />
                </label>
              ) : (
                <>
                  {filteredImages.length === 0 ? (
                    <div className="w-full py-8 text-center text-slate-400 text-sm bg-white/5 rounded-xl border border-white/10">
                      未找到匹配的图片
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-2">
                      {(expandedCategories[category.id] ? filteredImages : filteredImages.slice(0, 11)).map(img => {
                        const isScanning = scanningImages[img.id];
                      const isSelectedReference = designData.appearance?.competitorImageUrl?.includes(img.data) || false;
                    return (
                    <div 
                      key={img.id} 
                      className={`bg-white/5 border ${isSelected && isSelectedReference ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/10'} rounded-xl overflow-hidden flex flex-col group shadow-lg transition-all`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/50 cursor-pointer" onClick={() => !isScanning && setViewingImage({ ...img, categoryId: category.id })}>
                        <img src={img.data} alt="Competitor Style" loading="lazy" decoding="async" className={`w-full h-full object-cover transition-all duration-700 ${isScanning ? 'grayscale contrast-75 brightness-75' : 'group-hover:scale-105'}`} />
                        
                        {isScanning && (
                          <>
                            {/* Laser Sweep */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] animate-[scan_3s_ease-in-out_infinite]" />
                              <div className="absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-b from-cyan-400/20 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
                            </div>
                            {/* Floating Labels */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute top-[30%] left-[20%] flex items-center gap-1 animate-[popIn_0.3s_ease-out_0.5s_both]">
                                <Plus size={12} className="text-white animate-pulse" />
                                <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded border border-white/20 backdrop-blur-md">[分析涂层...]</span>
                              </div>
                              <div className="absolute top-[60%] right-[15%] flex items-center gap-1 animate-[popIn_0.3s_ease-out_1.5s_both]">
                                <Plus size={12} className="text-white animate-pulse" />
                                <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded border border-white/20 backdrop-blur-md">[提取色准...]</span>
                              </div>
                              <div className="absolute top-[15%] right-[30%] flex items-center gap-1 animate-[popIn_0.3s_ease-out_2.2s_both]">
                                <Plus size={12} className="text-white animate-pulse" />
                                <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded border border-white/20 backdrop-blur-md">[识别品牌标...]</span>
                              </div>
                            </div>
                          </>
                        )}

                        {!isScanning && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteCompetitorImage(category.id, img.id); }}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0 z-20"
                              title="删除图片"
                            >
                              <X size={14} />
                            </button>
                            {isSelected && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleReferenceImage(img.data); }}
                                className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-30 ${
                                  isSelectedReference 
                                    ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110 opacity-100' 
                                    : 'bg-black/60 border-white/50 text-white/70 hover:text-white hover:border-white hover:bg-black/80 hover:scale-105 opacity-0 group-hover:opacity-100'
                                }`}
                                title={isSelectedReference ? "取消作为参考图" : "设为参考图"}
                              >
                                <Check size={16} strokeWidth={isSelectedReference ? 3 : 2} />
                              </button>
                            )}
                          </>
                        )}

                        {/* Hover Quick Bar */}
                        {!isScanning && img.parsedData && (
                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 backdrop-blur-[4px] bg-black/40 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {img.parsedData.colors.slice(0, 4).map((color: string, i: number) => (
                                <div key={i} className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color }} />
                              ))}
                              {img.parsedData.colors.length > 4 && (
                                <span className="text-[10px] text-white/70 ml-1">+{img.parsedData.colors.length - 4}</span>
                              )}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImage({ ...img, categoryId: category.id });
                              }}
                              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                              title="查看详情"
                            >
                              <Plus size={12} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                  <label 
                    className="aspect-[4/3] w-full border-2 border-dashed border-white/10 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Upload className="text-slate-400 group-hover:text-blue-400 transition-colors" size={20} />
                    </div>
                    <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300">继续上传</p>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onCompetitorImagesChange(category.id, e, true)} />
                  </label>
                  </div>
                  )}
                  {filteredImages.length > 11 && (
                    <div className="mt-3 flex justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(category.id); }}
                        className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-full transition-colors flex items-center gap-1.5 border border-white/10 hover:border-white/20"
                      >
                        {expandedCategories[category.id] ? (
                          <>收起 <ChevronUp size={14} /></>
                        ) : (
                          <>查看更多 ({filteredImages.length - 11}) <ChevronDown size={14} /></>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Category Summary Prompt Section */}
              {images.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles size={14} className="text-blue-400" />
                      风格基调提示词 (Style Master Prompt)
                    </h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); generateCategorySummary(category, images); }}
                      disabled={summarizingCategories[category.id] || images.length === 0}
                      className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/40 disabled:opacity-50 text-blue-400 text-xs rounded-full transition-colors flex items-center gap-1.5"
                    >
                      {summarizingCategories[category.id] ? (
                        <><RefreshCw size={12} className="animate-spin" /> 总结中...</>
                      ) : (
                        <><Sparkles size={12} /> {designData.competitor?.categoryPrompts?.[category.id] ? '重新总结' : '生成总结'}</>
                      )}
                    </button>
                  </div>
                  {designData.competitor?.categoryPrompts?.[category.id] ? (
                    <div className="text-xs text-slate-300 leading-relaxed font-mono bg-black/30 p-3 rounded-lg select-all">
                      {designData.competitor.categoryPrompts[category.id]}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      点击生成总结，AI 将提取该风格下所有竞品图片的设计特征，生成融合的生图提示词。
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
          );
        })}
      </section>

      {/* Fullscreen Image Detail Modal */}
      {viewingImage && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 md:p-8 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setViewingImage(null)}
        >
          <div 
            className="w-full max-w-6xl max-h-[90vh] bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-[1.05] duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: HD Image */}
            <div className="flex-1 bg-black/50 flex items-center justify-center p-4 relative min-h-[40vh]">
              <img 
                src={viewingImage.data} 
                alt="Full size detail" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
              <button 
                className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors border border-white/20 backdrop-blur-md md:hidden"
                onClick={() => setViewingImage(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Right: AI Parsed Details */}
            {viewingImage.parsedData ? (
              <div className="w-full md:w-[400px] bg-white/5 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white tracking-wide">AI 解析参数</h3>
                    <span className="text-xs text-blue-400 font-mono mt-1">{getImageNumber(viewingImage.categoryId, viewingImage.id)}</span>
                  </div>
                  <button 
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors hidden md:flex"
                    onClick={() => setViewingImage(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Editable Brand */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">品牌 (Brand)</label>
                  <input 
                    type="text" 
                    value={viewingImage.parsedData.brand || ''} 
                    onChange={(e) => {
                      setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, brand: e.target.value } });
                    }}
                    onBlur={(e) => {
                      updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'brand', e.target.value);
                    }}
                    placeholder="输入品牌名称"
                    className="bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg outline-none text-sm font-bold text-white uppercase tracking-wider transition-colors px-3 py-2 w-full"
                  />
                </div>
                
                {/* Editable Colors */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">提取色彩 (Colors)</label>
                    {viewingImage.parsedData.colors?.length > 0 && (
                      <button
                        onClick={() => {
                          const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                          const currentColors = currentLibrary.color || [];
                          
                          const newColors = [...currentColors];
                          let addedCount = 0;
                          
                          const hexToRgb = (hex: string) => {
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '';
                          };
                          
                          viewingImage.parsedData.colors.forEach((colorHex: string) => {
                            if (!newColors.some((c: any) => c.hex === colorHex)) {
                              const imgNumber = getImageNumber(viewingImage.categoryId, viewingImage.id);
                              const colorName = viewingImage.parsedData.brand ? `${viewingImage.parsedData.brand} (${imgNumber})` : `提取颜色 (${imgNumber})`;
                              newColors.push({ 
                                id: `C${Date.now()}_${addedCount}`,
                                name: colorName, 
                                brand: viewingImage.parsedData.brand || '',
                                rgb: hexToRgb(colorHex),
                                hex: colorHex, 
                                category: 'brand',
                                cat: 'brand',
                                application: '品牌色'
                              });
                              addedCount++;
                            }
                          });
                          
                          if (addedCount > 0) {
                            updateDesignData('library', {
                              ...currentLibrary,
                              color: newColors
                            });
                          }
                          
                          setAddedColors(true);
                          setTimeout(() => setAddedColors(false), 2000);
                        }}
                        className={`text-xs flex items-center gap-1 transition-colors ${addedColors ? 'text-green-400' : 'text-blue-400 hover:text-blue-300'}`}
                        disabled={addedColors}
                      >
                        {addedColors ? (
                          <>
                            <Check size={12} />
                            已添加至资产库
                          </>
                        ) : (
                          <>
                            <Plus size={12} />
                            添加至资产库
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap bg-black/20 p-3 rounded-lg border border-white/10">
                    {viewingImage.parsedData.colors.map((color: string, i: number) => (
                      <div key={i} className="relative group/color">
                        <input 
                          type="color" 
                          value={color}
                          onChange={(e) => {
                            const newColors = [...viewingImage.parsedData.colors];
                            newColors[i] = e.target.value;
                            setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, colors: newColors } });
                          }}
                          onBlur={(e) => {
                            const newColors = [...viewingImage.parsedData.colors];
                            newColors[i] = e.target.value;
                            updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'colors', newColors);
                          }}
                          className="w-8 h-8 rounded-full border border-white/20 cursor-pointer opacity-0 absolute inset-0 z-10"
                        />
                        <div className="w-8 h-8 rounded-full border border-white/20 shadow-sm flex items-center justify-center" style={{ backgroundColor: color }}>
                          {addedColorIdx === i && <Check size={14} className="text-white drop-shadow-md z-20" />}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                            const currentColors = currentLibrary.color || [];
                            
                            const hexToRgb = (hex: string) => {
                              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                              return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '';
                            };
                            
                            if (!currentColors.some((c: any) => c.hex === color)) {
                              const imgNumber = getImageNumber(viewingImage.categoryId, viewingImage.id);
                              const colorName = viewingImage.parsedData.brand ? `${viewingImage.parsedData.brand} (${imgNumber})` : `提取颜色 (${imgNumber})`;
                              const newColors = [...currentColors, { 
                                id: `C${Date.now()}`,
                                name: colorName, 
                                brand: viewingImage.parsedData.brand || '',
                                rgb: hexToRgb(color),
                                hex: color, 
                                category: 'brand',
                                cat: 'brand',
                                application: '品牌色'
                              }];
                              
                              updateDesignData('library', {
                                ...currentLibrary,
                                color: newColors
                              });
                            }
                            
                            setAddedColorIdx(i);
                            setTimeout(() => setAddedColorIdx(null), 2000);
                          }}
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 hover:bg-blue-400 rounded-full text-white flex items-center justify-center opacity-0 group-hover/color:opacity-100 z-20 transition-all shadow-md"
                          title="添加至资产库"
                        >
                          <Plus size={10} />
                        </button>
                        <button 
                          onClick={() => {
                            const newColors = viewingImage.parsedData.colors.filter((_: any, idx: number) => idx !== i);
                            updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'colors', newColors);
                            setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, colors: newColors } });
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-400 rounded-full text-white flex items-center justify-center opacity-0 group-hover/color:opacity-100 z-20 transition-all shadow-md"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newColors = [...(viewingImage.parsedData?.colors || []), '#ffffff'];
                        updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'colors', newColors);
                        setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, colors: newColors } });
                      }}
                      className="w-8 h-8 rounded-full border border-dashed border-white/30 flex items-center justify-center hover:border-white/60 hover:bg-white/10 transition-colors"
                    >
                      <Plus size={14} className="text-white/60" />
                    </button>
                  </div>
                </div>

                {/* Editable Material */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">主要材质 (Material)</label>
                  <input 
                    type="text"
                    value={viewingImage.parsedData.material || ''}
                    onChange={(e) => {
                      setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, material: e.target.value } });
                    }}
                    onBlur={(e) => {
                      updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'material', e.target.value);
                    }}
                    placeholder="输入面料材质"
                    className="bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg outline-none text-sm text-white transition-colors px-3 py-2 w-full"
                  />
                </div>

                {/* Editable Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">设计标签 (Tags)</label>
                  <div className="flex flex-wrap gap-2 bg-black/20 p-3 rounded-lg border border-white/10">
                    {viewingImage.parsedData.tags.map((tag: string, i: number) => (
                      <div key={i} className="group/tag relative">
                        <input 
                          type="text"
                          value={tag}
                          onChange={(e) => {
                            const newTags = [...viewingImage.parsedData.tags];
                            newTags[i] = e.target.value;
                            setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, tags: newTags } });
                          }}
                          onBlur={(e) => {
                            const newTags = [...viewingImage.parsedData.tags];
                            newTags[i] = e.target.value;
                            updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'tags', newTags);
                          }}
                          className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-slate-200 outline-none focus:bg-white/20 focus:border-white/30 w-20 text-center transition-colors"
                        />
                        <button 
                          onClick={() => {
                            const newTags = viewingImage.parsedData.tags.filter((_: any, idx: number) => idx !== i);
                            updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'tags', newTags);
                            setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, tags: newTags } });
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-400 rounded-full text-white flex items-center justify-center opacity-0 group-hover/tag:opacity-100 z-20 transition-all shadow-md"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newTags = [...(viewingImage.parsedData?.tags || []), '新标签'];
                        updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'tags', newTags);
                        setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, tags: newTags } });
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-transparent border border-dashed border-white/30 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      + 添加标签
                    </button>
                  </div>
                </div>

                {/* Editable Design Prompt */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
                    设计/生图提示词 (Prompt)
                  </label>
                  <textarea
                    value={viewingImage.parsedData.designPrompt || ''}
                    onChange={(e) => {
                      setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, designPrompt: e.target.value } });
                    }}
                    onBlur={(e) => {
                      updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'designPrompt', e.target.value);
                    }}
                    placeholder="AI generated design prompt will appear here..."
                    className="bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg outline-none text-xs font-mono text-slate-300 transition-colors px-3 py-2 w-full min-h-[80px] resize-none"
                  />
                </div>

                {/* Editable Style Analysis */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs text-slate-400 font-medium">风格解析 (Analysis)</label>
                  <textarea
                    value={viewingImage.parsedData.analysis || ''}
                    onChange={(e) => {
                      setViewingImage({ ...viewingImage, parsedData: { ...viewingImage.parsedData, analysis: e.target.value } });
                    }}
                    onBlur={(e) => {
                      updateImageParsedData(viewingImage.categoryId, viewingImage.id, 'analysis', e.target.value);
                    }}
                    placeholder="输入风格解析内容..."
                    className="w-full flex-1 min-h-[120px] bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-slate-300 outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all resize-none custom-scrollbar"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full md:w-[400px] bg-white/5 border-l border-white/10 p-6 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-white/20">无数据</span>
                </div>
                <p className="text-sm text-slate-400 text-center">该图片暂无 AI 解析参数</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Color Replace Popover */}
      {colorReplacePopover && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setColorReplacePopover(null)}
          />
          <div 
            className="fixed z-[9999] w-64 glass-panel rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150"
            style={{ 
              left: Math.min(colorReplacePopover.x, window.innerWidth - 256), 
              top: Math.min(colorReplacePopover.y, window.innerHeight - 300) 
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette size={14} className="text-blue-400" />
                更换颜色
              </h4>
              <button 
                onClick={() => setColorReplacePopover(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {PANTONE_COLORS.map((pantone) => (
                <div
                  key={pantone.id}
                  className={`w-8 h-8 rounded-full shrink-0 border border-white/10 shadow-sm cursor-pointer hover:scale-110 transition-all duration-300 ${colorReplacePopover.currentColor === pantone.hex ? 'ring-2 ring-offset-2 ring-offset-black ring-blue-400' : ''}`}
                  style={{ backgroundColor: pantone.hex }}
                  title={`${pantone.zhName} (${pantone.pantone})`}
                  onClick={() => {
                    const newOverrides = {
                      ...colorOverrides,
                      [colorReplacePopover.categoryId]: {
                        ...(colorOverrides[colorReplacePopover.categoryId] || {}),
                        [colorReplacePopover.index]: pantone.hex
                      }
                    };
                    updateDesignData('competitor', {
                      ...designData.competitor,
                      colorOverrides: newOverrides
                    });
                    setColorReplacePopover(null);
                  }}
                />
              ))}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Editing Image Modal */}
      {editingImage && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-[900px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                {editingImage.isAnalyzing ? (
                  <><Loader2 size={18} className="animate-spin text-blue-400" /> AI 正在解析图片... {imageQueue.length > 0 && <span className="text-sm text-slate-400 font-normal ml-2">(还有 {imageQueue.length} 张待处理)</span>}</>
                ) : (
                  <><Edit2 size={18} className="text-blue-400" /> 编辑图片信息 {imageQueue.length > 0 && <span className="text-sm text-slate-400 font-normal ml-2">(还有 {imageQueue.length} 张待处理)</span>}</>
                )}
              </h3>
              <button 
                onClick={() => setEditingImage(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                disabled={editingImage.isAnalyzing}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Image Preview */}
              <div className="w-1/2 bg-black/50 p-6 flex items-center justify-center relative">
                <img 
                  src={editingImage.previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
                {editingImage.isAnalyzing && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-1 bg-blue-500/80 absolute top-0 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                )}
              </div>
              
              {/* Right: Editable Fields */}
              <div className="w-1/2 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative">
                {editingImage.isAnalyzing && (
                  <div className="absolute inset-0 z-10 bg-[#0f172a]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <Loader2 size={32} className="animate-spin text-blue-400" />
                    <p className="text-blue-400 font-medium animate-pulse">正在提取品牌、色彩、面料及风格标签...</p>
                  </div>
                )}

                {/* Match Warning */}
                {!editingImage.isAnalyzing && editingImage.parsedData.isMatch === false && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex flex-col gap-3">
                    <div className="flex gap-3 items-start">
                      <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                      <div>
                        <h4 className="text-sm font-medium text-red-400">风格不匹配提示</h4>
                        <p className="text-xs text-red-300/80 mt-1">{editingImage.parsedData.matchReason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-7">
                      <span className="text-xs text-slate-400">移动到其他风格库：</span>
                      <select
                        value={editingImage.categoryId}
                        onChange={(e) => setEditingImage(prev => prev ? { ...prev, categoryId: e.target.value } : null)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 flex-1"
                      >
                        {STYLE_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Brand */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">品牌 (Brand)</label>
                  <input 
                    type="text" 
                    value={editingImage.parsedData.brand}
                    onChange={(e) => setEditingImage(prev => prev ? { ...prev, parsedData: { ...prev.parsedData, brand: e.target.value } } : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="例如: Arc'teryx"
                  />
                </div>
                
                {/* Colors */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-400">提取色块 (Colors)</label>
                    {editingImage.parsedData.colors.length > 0 && (
                      <button
                        onClick={() => {
                          const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                          const currentColors = currentLibrary.color || [];
                          
                          const newColors = [...currentColors];
                          let addedCount = 0;
                          
                          const hexToRgb = (hex: string) => {
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '';
                          };
                          
                          editingImage.parsedData.colors.forEach((colorHex: string) => {
                            if (!newColors.some((c: any) => c.hex === colorHex)) {
                              const imgNumber = getPredictedImageNumber(editingImage.categoryId);
                              const colorName = editingImage.parsedData.brand ? `${editingImage.parsedData.brand} (${imgNumber})` : `提取颜色 (${imgNumber})`;
                              newColors.push({ 
                                id: `C${Date.now()}_${addedCount}`,
                                name: colorName, 
                                brand: editingImage.parsedData.brand || '',
                                rgb: hexToRgb(colorHex),
                                hex: colorHex, 
                                category: 'brand',
                                cat: 'brand',
                                application: '品牌色'
                              });
                              addedCount++;
                            }
                          });
                          
                          if (addedCount > 0) {
                            updateDesignData('library', {
                              ...currentLibrary,
                              color: newColors
                            });
                          }
                          
                          setAddedColors(true);
                          setTimeout(() => setAddedColors(false), 2000);
                        }}
                        className={`text-xs flex items-center gap-1 transition-colors ${addedColors ? 'text-green-400' : 'text-blue-400 hover:text-blue-300'}`}
                        disabled={addedColors}
                      >
                        {addedColors ? (
                          <>
                            <Check size={12} />
                            已添加至资产库
                          </>
                        ) : (
                          <>
                            <Plus size={12} />
                            添加至资产库
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingImage.parsedData.colors.map((color, idx) => (
                      <div key={idx} className="relative group/color">
                        <div 
                          onClick={() => {
                            const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                            const currentColors = currentLibrary.color || [];
                            
                            const hexToRgb = (hex: string) => {
                              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                              return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '';
                            };
                            
                            if (!currentColors.some((c: any) => c.hex === color)) {
                              const imgNumber = getPredictedImageNumber(editingImage.categoryId);
                              const colorName = editingImage.parsedData.brand ? `${editingImage.parsedData.brand} (${imgNumber})` : `提取颜色 (${imgNumber})`;
                              const newColor = {
                                id: `C${Date.now()}`,
                                name: colorName,
                                brand: editingImage.parsedData.brand || '',
                                rgb: hexToRgb(color),
                                hex: color,
                                category: 'brand',
                                cat: 'brand',
                                application: '品牌色'
                              };
                              
                              updateDesignData('library', {
                                ...currentLibrary,
                                color: [...currentColors, newColor]
                              });
                              
                              setAddedColorIdx(idx);
                              setTimeout(() => setAddedColorIdx(null), 2000);
                            }
                          }}
                          className="w-8 h-8 rounded-full border border-white/20 shadow-sm cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                          style={{ backgroundColor: color }}
                          title="点击添加至资产库-品牌板块"
                        >
                          {addedColorIdx === idx && <Check size={14} className="text-white drop-shadow-md" />}
                        </div>
                        <button 
                          onClick={() => {
                            const newColors = [...editingImage.parsedData.colors];
                            newColors.splice(idx, 1);
                            setEditingImage(prev => prev ? { ...prev, parsedData: { ...prev.parsedData, colors: newColors } } : null);
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover/color:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newColor = prompt("请输入Hex颜色代码 (例如: #FFFFFF):", "#");
                        if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
                          setEditingImage(prev => prev ? { ...prev, parsedData: { ...prev.parsedData, colors: [...prev.parsedData.colors, newColor] } } : null);
                        }
                      }}
                      className="w-8 h-8 rounded-full border border-dashed border-white/30 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Material */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">面料 (Material)</label>
                  <input 
                    type="text" 
                    value={editingImage.parsedData.material}
                    onChange={(e) => setEditingImage(prev => prev ? { ...prev, parsedData: { ...prev.parsedData, material: e.target.value } } : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="例如: Cordura 500D"
                  />
                </div>
                
                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">标签 (Tags)</label>
                  <div className="flex flex-wrap gap-2">
                    {editingImage.parsedData.tags.map((tag, idx) => (
                      <div key={idx} className="px-2 py-1 rounded-md bg-white/10 border border-white/5 text-xs text-slate-300 flex items-center gap-1 group/tag">
                        {tag}
                        <button 
                          onClick={() => {
                            const newTags = [...editingImage.parsedData.tags];
                            newTags.splice(idx, 1);
                            setEditingImage(prev => prev ? { ...prev, parsedData: { ...prev.parsedData, tags: newTags } } : null);
                          }}
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newTag = prompt("请输入新标签:");
                        if (newTag && newTag.trim()) {
                          setEditingImage(prev => prev ? { ...prev, parsedData: { ...prev.parsedData, tags: [...prev.parsedData.tags, newTag.trim()] } } : null);
                        }
                      }}
                      className="px-2 py-1 rounded-md border border-dashed border-white/30 text-xs text-white/50 hover:text-white hover:border-white/50 transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} /> 添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              {imageQueue.length > 0 && (
                <button 
                  onClick={() => {
                    setImageQueue([]);
                    setEditingImage(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors mr-auto"
                  disabled={editingImage.isAnalyzing}
                >
                  取消全部
                </button>
              )}
              <button 
                onClick={() => setEditingImage(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                disabled={editingImage.isAnalyzing}
              >
                取消
              </button>
              <button 
                onClick={saveEditingImage}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={editingImage.isAnalyzing}
              >
                <Check size={16} /> {imageQueue.length > 0 ? '保存并处理下一张' : '保存并添加到图库'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Undo Toast */}
      {deletedImageInfo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <span className="text-sm">已删除图片</span>
          <button 
            onClick={undoDelete}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <RotateCcw size={14} />
            撤回
          </button>
          <button 
            onClick={() => {
              clearTimeout(deletedImageInfo.timeoutId);
              setDeletedImageInfo(null);
            }}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
});
