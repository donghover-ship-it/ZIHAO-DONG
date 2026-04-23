import React, { useState, useEffect } from 'react';
import { Palette, Upload, FileText, ListChecks, Loader2, AlertCircle, CheckCircle2, Sparkles, ArrowRight, X, ChevronDown, Box, Edit2, User as UserIcon, Activity, TrendingUp, ShoppingCart, Users, ChevronLeft, ChevronRight, Search, Image, Maximize2, ExternalLink, Trash2 } from 'lucide-react';
import { StatusBar, CountDownTimer, ReconnectGuide, useErrorInterceptor } from '../components/ErrorSystem';
import { GoogleGenAI, Type } from "@google/genai";
import { generateContentWithRetry, parseAIError } from '../utils/aiUtils';
import { useDesignStore } from '../store/useDesignStore';
import localforage from 'localforage';
import { createDiamondParticles } from '../utils/particles';

const EditableField = ({ label, value, onChange, type = 'text', className = '', editable = false }: { label: string, value: string | number, onChange: (val: string) => void, type?: 'text' | 'textarea', className?: string, editable?: boolean }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    console.log("Saving:", tempValue);
    onChange(tempValue.toString());
    setIsEditing(false);
  };

  if (isEditing && editable) {
    return (
      <div className={`space-y-2 w-full ${className}`}>
        <p className="text-[10px] text-white uppercase font-bold tracking-wider mb-1">{label}</p>
        {type === 'textarea' ? (
          <textarea 
            value={tempValue || ''} 
            onChange={e => setTempValue(e.target.value)} 
            className="w-full glass-input-premium rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            rows={4}
          />
        ) : (
          <input 
            value={tempValue || ''} 
            onChange={e => setTempValue(e.target.value)} 
            className="w-full glass-input-premium rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />
        )}
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs rounded-md transition-all shadow-md shadow-indigo-500/25">保存</button>
          <button onClick={() => { setIsEditing(false); setTempValue(value); }} className="px-3 py-1 glass-button text-white text-xs rounded-md transition-colors">取消</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative w-full p-2 -m-2 rounded-lg transition-colors ${editable ? 'hover:bg-white/5' : ''} ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-white uppercase font-bold tracking-wider">{label}</p>
        {editable && (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Edit button clicked for", label);
              setIsEditing(true);
            }} 
            className="text-indigo-400/70 hover:text-indigo-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 size={10}/> 编辑
          </button>
        )}
      </div>
      <p 
        className={`text-sm text-gray-300 leading-relaxed whitespace-pre-wrap ${editable ? 'cursor-pointer hover:text-white transition-colors' : ''}`} 
        onClick={(e) => {
          if (editable) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Text clicked for", label);
            setIsEditing(true);
          }
        }}
      >
        {value || '待分析...'}
      </p>
    </div>
  );
};

const EditableTags = ({ label, tags, onChange, className = '' }: { label: string, tags: string[], onChange: (tags: string[]) => void, className?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTags, setTempTags] = useState<string[]>(tags || []);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setTempTags(tags || []);
  }, [tags]);

  const handleSave = () => {
    onChange(tempTags);
    setIsEditing(false);
  };

  const addTag = () => {
    if (inputValue.trim() && !tempTags.includes(inputValue.trim())) {
      setTempTags([...tempTags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTempTags(tempTags.filter(tag => tag !== tagToRemove));
  };

  if (isEditing) {
    return (
      <div className={`space-y-2 w-full ${className}`}>
        <p className="text-[10px] text-white uppercase font-bold tracking-wider mb-1">{label}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {tempTags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs flex items-center gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            value={inputValue} 
            onChange={e => setInputValue(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="输入标签后按回车添加"
            className="flex-1 glass-input-premium rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />
          <button onClick={addTag} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors">添加</button>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={handleSave} className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs rounded-md transition-all shadow-md shadow-indigo-500/25">保存</button>
          <button onClick={() => { setIsEditing(false); setTempTags(tags || []); setInputValue(''); }} className="px-3 py-1 glass-button text-white text-xs rounded-md transition-colors">取消</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative w-full p-2 -m-2 rounded-lg transition-colors hover:bg-white/5 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-white uppercase font-bold tracking-wider">{label}</p>
        <button 
          onClick={() => setIsEditing(true)} 
          className="text-indigo-400/70 hover:text-indigo-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit2 size={10}/> 添加/编辑
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags && tags.length > 0 ? tags.map((tag, i) => (
          <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 text-white/80 rounded-full text-xs flex items-center gap-1 group/tag">
            {tag}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const newTags = tags.filter(t => t !== tag);
                onChange(newTags);
              }} 
              className="opacity-50 hover:opacity-100 hover:text-red-400 transition-all"
              title="删除标签"
            >
              <X size={12} />
            </button>
          </span>
        )) : <span className="text-sm text-gray-400">暂无标签...</span>}
      </div>
    </div>
  );
};

const EXAMPLE_MRD = `市场需求文档 (MRD) 示例：

1. 目标市场：城市通勤白领，年龄25-35岁。
2. 市场痛点：传统双肩包内部空间规划不合理，找东西困难；背负系统不透气，夏天容易出汗；外观不够时尚，难以搭配商务休闲装。
3. 竞品分析：
   - 竞品A：功能齐全但外观过于硬核，不够日常。
   - 竞品B：外观时尚但容量小，无法装下15寸电脑。
4. 产品定位：一款兼顾商务与休闲，具有强大收纳功能和舒适背负体验的城市通勤双肩包。
5. 核心卖点：
   - 模块化收纳系统
   - 3D透气背板
   - 极简流线型外观`;

const EXAMPLE_PRD = `产品名称：Urban Nomad 2.0 城市游牧者双肩包
目标人群：25-35岁，生活在一线城市的数字游民、自由职业者及大厂程序员。
使用场景：日常城市通勤、共享办公空间往返、3天以内的短途差旅。
产品规格：
- 容量：24L
- 尺寸：48 x 32 x 16 cm
- 重量：目标控制在 950g 以内
- 材质：主体采用 840D 弹道尼龙，具备防泼水涂层；拉链使用 YKK 防水系列；扣具采用 Duraflex 聚甲醛扣具。
- 功能：独立 16 寸加厚电脑仓；隐藏式防盗背袋；侧边快取水壶/雨伞袋；人体工学 S 型肩带，带胸扣。
- 色彩：主色调为炭黑色（Carbon Black），搭配极地银（Arctic Silver）反光织带。
设计风格：极简主义与硬核机能风的结合，强调专业感与耐用性。`;

export interface AnalysisResult {
  mrdAnalysis?: {
    marketResearch: string;
    userBehavior: string;
    salesAndReviews: string;
    platformTrends: string;
  };
  specifications: {
    name: string;
    size: string;
    weight: string;
    materials: string;
    functions: string;
    colors: string;
    pantoneColors?: any[];
  };
  userScenario: {
    targetMarket: string;
    profession: string;
    secondaryUser: string;
    scenario: string;
  };
  personas: {
    name: string;
    age: number;
    occupation: string;
    income: string;
    travelNeeds: string;
    values: string;
    painPoints: string;
    portraitPrompt: string;
    portraitPromptChinese: string;
  }[];
  designConcept: string[];
  summary: string;
  missingInfo: string[];
}

export const DesignDefinition = () => {
  const { designData, updateDesignData, setActiveModule } = useDesignStore();
  const { error: globalError, clearError: clearGlobalError, busyCountdown } = useErrorInterceptor();
  const [mrdText, setMrdText] = useState('');
  const [prdText, setPrdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(designData.definition?.result || null);
  const [error, setError] = useState<string | null>(null);
  // Removed local busyCountdown state
  const [mrdFile, setMrdFile] = useState<File | null>(null);
  const [prdFile, setPrdFile] = useState<File | null>(null);
  const [portraitUrls, setPortraitUrls] = useState<string[]>(designData.definition?.portraitUrls || []);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Brand Positioning & Style Library State
  const [brandDoc, setBrandDoc] = useState<{ name: string, data: string } | null>(null);
  const [brandDocAnalysis, setBrandDocAnalysis] = useState<string | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandImages, setBrandImages] = useState<{ id: string, data: string }[]>([]);
  const [isStyleCalibrationCollapsed, setIsStyleCalibrationCollapsed] = useState(true);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const handleUpdateResult = (category: keyof AnalysisResult, field: string | null, value: any, index?: number) => {
    if (!result) return;
    const newResult = { ...result };
    if (category === 'designConcept') {
      newResult.designConcept = Array.isArray(value) ? value : value.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (category === 'summary') {
      newResult.summary = value;
    } else if (category === 'personas' && typeof index === 'number' && field) {
      if (newResult.personas && newResult.personas[index]) {
        (newResult.personas[index] as any)[field] = value;
      }
    } else if (field) {
      (newResult[category] as any)[field] = value;
    }
    setResult(newResult);
    updateDesignData('definition', { result: newResult });
  };

  // Load stored data on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedDoc = await localforage.getItem<{ name: string, data: string }>('brandDoc');
        if (storedDoc) setBrandDoc(storedDoc);
        
        const storedAnalysis = await localforage.getItem<string>('brandDocAnalysis');
        if (storedAnalysis) setBrandDocAnalysis(storedAnalysis);
        
        const storedImages = await localforage.getItem<{ id: string, data: string }[]>('brandImages');
        if (storedImages) {
          setBrandImages(storedImages);
          updateDesignData('definition', { brandImages: storedImages.map(img => img.data) });
        }
      } catch (err) {
        console.error("Failed to load stored data:", err);
      }
    };
    loadStoredData();
  }, []);

  // Sync state to store when it changes
  useEffect(() => {
    if (result) {
      updateDesignData('definition', { result, portraitUrls });
    }
  }, [result, portraitUrls, updateDesignData]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const generatePortraits = async (prompts: string[]) => {
    setIsGeneratingImage(true);
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      
      const urls: string[] = [];
      for (const prompt of prompts) {
        try {
          const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                {
                  text: `A high-quality professional studio portrait of a Caucasian/Western person. ${prompt}. Realistic, cinematic lighting, neutral background, high detail.`,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
              },
              seed: Math.floor(Math.random() * 1000000)
            }
          });
          
          let found = false;
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64EncodeString = part.inlineData.data;
              urls.push(`data:image/png;base64,${base64EncodeString}`);
              found = true;
              break;
            }
          }
          if (!found) {
            urls.push(`https://picsum.photos/seed/${encodeURIComponent(prompt)}/400/400`);
          }
        } catch (err) {
          console.error("Image generation failed for prompt:", prompt, err);
          urls.push(`https://picsum.photos/seed/${encodeURIComponent(prompt)}/400/400`);
        }
      }
      setPortraitUrls(urls);
    } catch (err) {
      console.error("Overall image generation failed:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAnalyze = async () => {
    if (!mrdText.trim() && !prdText.trim() && !mrdFile && !prdFile) return;

    setIsAnalyzing(true);
    setError(null);
    setPortraitUrls([]);
    setCurrentPersonaIndex(0);

    try {
      let parts: any[] = [];

      if (mrdFile) {
        const base64Data = await fileToBase64(mrdFile);
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data
          }
        });
        parts.push({ text: "以上是 MRD 文档。" });
      } else if (mrdText.trim()) {
        parts.push({ text: `MRD 文档内容：\n${mrdText}` });
      }

      if (prdFile) {
        const base64Data = await fileToBase64(prdFile);
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data
          }
        });
        parts.push({ text: "以上是 PRD 文档。" });
      } else if (prdText.trim()) {
        parts.push({ text: `PRD 文档内容：\n${prdText}` });
      }

      parts.push({
        text: `你是一位资深的背包产品分析师与工业设计专家。请解析提供的 MRD 和 PRD 文档内容，并将其转化为结构化的设计指令。
        
        【关键指令1：MRD 深度解析】：在生成用户画像之前，请首先根据 MRD 文档内容，提取并生成以下四个维度的数据分析：
        1. 市场调研数据 (Market Research Data)
        2. 用户行为数据 (User Behavior Data)
        3. 销售与评论数据 (Sales and Review Data)
        4. 平台趋势数据 (Platform Trend Data)
        如果提供的 MRD 内容较少，请基于行业先验知识进行合理的推演和补充，确保数据详实、专业且具有指导意义。

        【关键指令2：结合 PRD 生成用户画像】：随后，结合 PRD 文档的具体产品定义，虚构**三个**极具代表性的【典型用户画像】。
        这三个画像必须满足：**核心需求一致，但人物特征、职业、年龄和具体使用场景有明显差异化**。
        每个画像必须包含：姓名（英文名，但用中文标注）、年龄、职业、年收入水平、具体的出行需求、核心价值观、以及对背包使用的痛点。
        
        【关键指令3：深度场景发散】：在生成“具体出行需求”和“背包使用痛点”时，请**不要仅仅依赖文档中的简短描述**。你需要发挥专家的洞察力，进行**深度的场景发散和痛点挖掘**，提供丰富、详细且有画面感的内容。
        - **出行需求**：详细描述他们典型的通勤路线、携带的物品清单（如特定尺寸的电脑、健身装备、水杯等）、在不同交通工具（地铁、骑行、飞行）上的具体动作和需求。
        - **使用痛点**：深入挖掘他们在过往使用背包时遇到的尴尬或不便，例如：雨天拉链渗水、找钥匙不方便、背部闷热出汗、装满后重心后坠、肩带勒肩膀、拿取底部物品困难等具体痛点。
        
        人物设定必须为【欧美面孔/高加索人种】，不要出现亚裔特征。
        同时为每个人物提供一个用于生成该人物肖像的英文提示词 (portraitPrompt)，提示词中必须包含 "Caucasian" 或 "Western" 关键词。
        
        【关键指令4：Pantone色号识别】：仔细检查PRD文档中是否包含任何Pantone色号（如 PANTONE 19-4052 TCX 等）。如果有，请将它们提取出来，并尽你所能将其转换为对应的HEX颜色值（如 #0F4C81）和颜色名称。这些颜色将用于在界面中生成色块。
        
        请严格按照要求提取信息。如果某些信息缺失，请在 missingInfo 数组中列出。`
      });

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mrdAnalysis: {
                type: Type.OBJECT,
                properties: {
                  marketResearch: { type: Type.STRING, description: "市场调研数据" },
                  userBehavior: { type: Type.STRING, description: "用户行为数据" },
                  salesAndReviews: { type: Type.STRING, description: "销售与评论数据" },
                  platformTrends: { type: Type.STRING, description: "平台趋势数据" },
                },
                required: ["marketResearch", "userBehavior", "salesAndReviews", "platformTrends"]
              },
              specifications: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "产品名称" },
                  size: { type: Type.STRING, description: "尺寸/容量" },
                  weight: { type: Type.STRING, description: "重量" },
                  materials: { type: Type.STRING, description: "关键面辅料" },
                  functions: { type: Type.STRING, description: "结构功能" },
                  colors: { type: Type.STRING, description: "色彩" },
                  pantoneColors: {
                    type: Type.ARRAY,
                    description: "从PRD中提取的所有Pantone色号",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        code: { type: Type.STRING, description: "Pantone色号，如 PANTONE 19-4052" },
                        hex: { type: Type.STRING, description: "对应的HEX颜色值，如 #0F4C81" },
                        name: { type: Type.STRING, description: "颜色名称，如 Classic Blue" }
                      },
                      required: ["code", "hex", "name"]
                    }
                  }
                },
                required: ["name", "size", "weight", "materials", "functions", "colors"]
              },
              userScenario: {
                type: Type.OBJECT,
                properties: {
                  targetMarket: { type: Type.STRING, description: "目标市场与核心用户" },
                  profession: { type: Type.STRING, description: "身份职业" },
                  secondaryUser: { type: Type.STRING, description: "次级用户" },
                  scenario: { type: Type.STRING, description: "出行方式与场景" },
                },
                required: ["targetMarket", "profession", "secondaryUser", "scenario"]
              },
              personas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "姓名" },
                    age: { type: Type.NUMBER, description: "年龄" },
                    occupation: { type: Type.STRING, description: "职业" },
                    income: { type: Type.STRING, description: "年收入" },
                    travelNeeds: { type: Type.STRING, description: "出行需求" },
                    values: { type: Type.STRING, description: "价值观" },
                    painPoints: { type: Type.STRING, description: "背包痛点" },
                    portraitPrompt: { type: Type.STRING, description: "人物肖像生成提示词(英文)" },
                    portraitPromptChinese: { type: Type.STRING, description: "人物肖像生成提示词(中文翻译)" },
                  },
                  required: ["name", "age", "occupation", "income", "travelNeeds", "values", "painPoints", "portraitPrompt", "portraitPromptChinese"]
                },
                description: "生成三个不同的人物画像，核心需求一致但人物特征有差异"
              },
              designConcept: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "设计风格词汇"
              },
              summary: {
                type: Type.STRING,
                description: "综合的用户画像与设计导向总结，用于 AI 绘画提示词生成"
              },
              missingInfo: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "缺失的信息列表"
              }
            },
            required: ["mrdAnalysis", "specifications", "userScenario", "personas", "designConcept", "summary", "missingInfo"]
          },
          tools: [{ googleSearch: {} }]
        }
      });

      const data = JSON.parse(response.text);
      setResult(data);
      
      // Generate portraits after analysis is done
      if (data.personas && data.personas.length > 0) {
        const prompts = data.personas.map((p: any) => p.portraitPrompt).filter(Boolean);
        if (prompts.length > 0) {
          generatePortraits(prompts);
        }
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      const parsedError = parseAIError(err, "分析失败");
      if (parsedError === "AI_BUSY_429") {
        setError("AI 正在忙碌中，请稍后再试");
      } else {
        setError(parsedError);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onBrandDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const base64Data = await fileToBase64(file);
        const docData = { name: file.name, data: base64Data };
        setBrandDoc(docData);
        await localforage.setItem('brandDoc', docData);
        
        // Automatically parse
        analyzeBrandDoc(base64Data);
      } catch (err) {
        console.error("Failed to process brand document:", err);
      }
    }
  };

  const analyzeBrandDoc = async (base64Data: string) => {
    setIsAnalyzingBrand(true);
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data
              }
            },
            {
              text: `你是一位资深的品牌分析师。请解析上传的品牌定位文档，并提取出核心的品牌定位、目标受众、品牌调性和核心价值观。请用简明扼要的几句话进行总结。`
            }
          ]
        }
      });
      const analysis = response.text;
      setBrandDocAnalysis(analysis);
      await localforage.setItem('brandDocAnalysis', analysis);
    } catch (err) {
      console.error("Brand analysis failed:", err);
      const parsedError = parseAIError(err, "品牌文档分析失败");
      if (parsedError === "AI_BUSY_429") {
        setError("AI 正在忙碌中，请稍后再试");
      } else {
        setError(parsedError);
      }
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  const deleteBrandDoc = async () => {
    setBrandDoc(null);
    setBrandDocAnalysis(null);
    await localforage.removeItem('brandDoc');
    await localforage.removeItem('brandDocAnalysis');
  };

  const onBrandImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    try {
      const newImages = await Promise.all(files.map(async (file) => {
        const base64Data = await fileToBase64(file);
        return { id: Math.random().toString(36).substring(7), data: `data:${file.type};base64,${base64Data}` };
      }));
      
      const updatedImages = [...brandImages, ...newImages];
      setBrandImages(updatedImages);
      updateDesignData('definition', { brandImages: updatedImages.map(img => img.data) });
      await localforage.setItem('brandImages', updatedImages);
    } catch (err) {
      console.error("Failed to process brand images:", err);
    }
  };

  const deleteBrandImage = async (id: string) => {
    const updatedImages = brandImages.filter(img => img.id !== id);
    setBrandImages(updatedImages);
    updateDesignData('definition', { brandImages: updatedImages.map(img => img.data) });
    await localforage.setItem('brandImages', updatedImages);
  };

  const onMrdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setMrdFile(file);
      setMrdText(`已上传 MRD PDF: ${file.name}`);
    }
  };

  const onPrdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPrdFile(file);
      setPrdText(`已上传 PRD PDF: ${file.name}`);
    }
  };

  const loadExample = () => {
    setMrdFile(null);
    setPrdFile(null);
    setMrdText("产品定位：城市高端通勤背包。目标市场：一线城市精英。");
    setPrdText(EXAMPLE_PRD);
  };

  const handleClearAll = () => {
    // Clear local state
    setMrdText('');
    setPrdText('');
    setMrdFile(null);
    setPrdFile(null);
    setResult(null);
    setPortraitUrls([]);
    setError(null);
    
    // Clear global store
    updateDesignData('definition', {
      result: null,
      portraitUrls: []
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StatusBar error={globalError} onClear={clearGlobalError} />
      {globalError?.type === '429' && <CountDownTimer seconds={busyCountdown} />}
      {globalError?.type === 'CONNECTION_CLOSED' && <ReconnectGuide />}
      
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white">2. 设计定义中心</h2>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors border border-red-400/20"
          >
            <Trash2 size={16} />
            一键清空
          </button>
        </div>
        <p className="text-base text-slate-400 max-w-3xl leading-relaxed">整合风格校准与文档分析，确立设计的核心方向。</p>
      </header>

      {/* Section 1: Style Calibration */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-indigo-300" />
            <h3 className="text-xl font-bold text-white tracking-wide">风格校准</h3>
          </div>
          <button 
            onClick={() => setIsStyleCalibrationCollapsed(!isStyleCalibrationCollapsed)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isStyleCalibrationCollapsed ? '展开' : '收起'}
            <ChevronDown size={16} className={`transition-transform duration-300 ${isStyleCalibrationCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
        
        {!isStyleCalibrationCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Left: Brand Positioning */}
          <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-slate-400" size={20} />
                <h4 className="text-lg font-bold text-white">品牌定位 (Brand Positioning)</h4>
              </div>
              {brandDoc && (
                <button onClick={deleteBrandDoc} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
                  删除文档
                </button>
              )}
            </div>
            
            {!brandDoc ? (
              <label className="aspect-video border-2 border-dashed border-white/10 bg-white/[0.02] rounded-[24px] flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload className="text-slate-400 group-hover:text-blue-400 transition-colors" size={28} />
                </div>
                <p className="text-base font-medium text-slate-400 group-hover:text-slate-300 text-center px-4">点击或拖拽上传品牌定位文档 (PDF)</p>
                <input type="file" accept="application/pdf" className="hidden" onChange={onBrandDocChange} />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="p-5 bg-white/[0.03] border border-white/[0.05] rounded-[20px] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <FileText className="text-blue-400" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-white truncate">{brandDoc.name}</p>
                    <p className="text-sm text-slate-500">已上传并保存</p>
                  </div>
                </div>
                
                {isAnalyzingBrand ? (
                  <div className="flex items-center gap-3 text-sm font-medium text-blue-400 p-4">
                    <Loader2 size={18} className="animate-spin" />
                    正在解析品牌定位...
                  </div>
                ) : brandDocAnalysis ? (
                  <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-[24px] space-y-3">
                    <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest">解析结果</p>
                    <p className="text-sm md:text-base text-slate-300 leading-relaxed">{brandDocAnalysis}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right: Brand Style Library */}
          <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="text-slate-400" size={20} />
                <h4 className="text-xl font-bold text-white">品牌风格库 (Brand Style Library)</h4>
              </div>
              <label className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                继续上传
                <input type="file" accept="image/*" multiple className="hidden" onChange={onBrandImagesChange} />
              </label>
            </div>
            
            {brandImages.length === 0 ? (
              <label className="aspect-video border-2 border-dashed border-white/10 bg-white/[0.02] rounded-[24px] flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload className="text-slate-400 group-hover:text-blue-400 transition-colors" size={28} />
                </div>
                <p className="text-base font-medium text-slate-400 group-hover:text-slate-300 text-center px-4">点击或拖拽上传背包图片</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onBrandImagesChange} />
              </label>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {brandImages.map(img => (
                  <div 
                    key={img.id} 
                    className="relative aspect-square rounded-[20px] overflow-hidden group border border-white/10 cursor-pointer shadow-md"
                    onDoubleClick={() => setViewingImage(img.data)}
                  >
                    <img src={img.data} alt="Brand Style" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteBrandImage(img.id); }}
                      className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </section>

      {/* Divider */}
      <div className="h-[1px] bg-white/10" />

      {/* Section 2: Doc Analysis */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-purple-400" />
          <h3 className="text-xl font-bold text-white tracking-tight">文档输入</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col gap-4">
              {/* MRD Input */}
              <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">MRD 市场需求文档</h4>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setMrdText(EXAMPLE_MRD)}
                      className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5"
                    >
                      <FileText size={14} /> 导入示例
                    </button>
                    <label className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                      <Upload size={14} /> 上传 PDF
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={onMrdFileChange}
                      />
                    </label>
                  </div>
                </div>
                <textarea 
                  value={mrdText}
                  onChange={(e) => setMrdText(e.target.value)}
                  className="w-full h-32 bg-black/40 rounded-[20px] p-4 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors resize-none"
                  placeholder="粘贴市场需求、竞品分析、目标人群等..."
                />
              </div>

              {/* PRD Input */}
              <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">PRD 产品需求文档</h4>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setPrdText(EXAMPLE_PRD)}
                      className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5"
                    >
                      <FileText size={14} /> 导入示例
                    </button>
                    <label className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                      <Upload size={14} /> 上传 PDF
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={onPrdFileChange}
                      />
                    </label>
                  </div>
                </div>
                <textarea 
                  value={prdText}
                  onChange={(e) => setPrdText(e.target.value)}
                  className="w-full h-32 bg-black/40 rounded-[20px] p-4 text-sm text-white focus:outline-none border border-transparent focus:border-white/10 transition-colors resize-none"
                  placeholder="粘贴功能规格、尺寸重量、材质要求等..."
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button 
                onMouseEnter={(e) => createDiamondParticles(e)}
                onClick={() => {
                  handleAnalyze();
                }}
                disabled={isAnalyzing || (!mrdText.trim() && !prdText.trim() && !mrdFile && !prdFile)}
                className="celestian-button w-1/2 mx-auto py-3 text-base"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    正在深度解析文档...
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    执行 AI 专家解析
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* MRD Analysis Card */}
                {result.mrdAnalysis && (
                  <div className="glass-panel-premium rounded-[32px] overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
                      <Activity size={20} className="text-blue-400" />
                      <h4 className="font-bold text-base text-white">MRD 深度解析 (MRD Analysis)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                          <TrendingUp size={16} />
                          <span>市场调研数据</span>
                        </div>
                        <div className="text-sm text-slate-300 bg-white/[0.02] border border-white/[0.05] p-4 rounded-[20px] leading-relaxed">
                          {result.mrdAnalysis.marketResearch}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
                          <Users size={16} />
                          <span>用户行为数据</span>
                        </div>
                        <div className="text-sm text-slate-300 bg-white/[0.02] border border-white/[0.05] p-4 rounded-[20px] leading-relaxed">
                          {result.mrdAnalysis.userBehavior}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                          <ShoppingCart size={16} />
                          <span>销售与评论数据</span>
                        </div>
                        <div className="text-sm text-slate-300 bg-white/[0.02] border border-white/[0.05] p-4 rounded-[20px] leading-relaxed">
                          {result.mrdAnalysis.salesAndReviews}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                          <Activity size={16} />
                          <span>平台趋势数据</span>
                        </div>
                        <div className="text-sm text-slate-300 bg-white/[0.02] border border-white/[0.05] p-4 rounded-[20px] leading-relaxed">
                          {result.mrdAnalysis.platformTrends}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Persona Card */}
                {(() => {
                  const personas = result.personas || ((result as any).persona ? [(result as any).persona] : []);
                  if (personas.length === 0) return null;
                  const currentPersona = personas[currentPersonaIndex] || personas[0];
                  
                  return (
                    <div className="glass-panel-premium rounded-[32px] overflow-hidden">
                      <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserIcon size={20} className="text-blue-400" />
                          <h4 className="font-bold text-lg text-white">典型用户画像 (User Persona)</h4>
                        </div>
                        {personas.length > 1 && (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setCurrentPersonaIndex(prev => Math.max(0, prev - 1))}
                              disabled={currentPersonaIndex === 0}
                              className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/5"
                            >
                              <ChevronLeft size={20} className="text-white" />
                            </button>
                            <span className="text-sm font-medium text-slate-400">
                              {currentPersonaIndex + 1} / {personas.length}
                            </span>
                            <button 
                              onClick={() => setCurrentPersonaIndex(prev => Math.min(personas.length - 1, prev + 1))}
                              disabled={currentPersonaIndex === personas.length - 1}
                              className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/5"
                            >
                              <ChevronRight size={20} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="p-8 border-r border-white/10 flex flex-col items-center justify-center space-y-6 bg-white/[0.01]">
                          <div className="relative w-56 h-56 rounded-[24px] overflow-hidden border border-white/10 shadow-xl">
                            {isGeneratingImage ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                                <Loader2 size={32} className="text-blue-400 animate-spin mb-3" />
                                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">生成中...</span>
                              </div>
                            ) : portraitUrls[currentPersonaIndex] ? (
                              <img src={portraitUrls[currentPersonaIndex]} alt="User Portrait" className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <UserIcon size={64} className="text-slate-600" />
                              </div>
                            )}
                          </div>
                          <div className="text-center w-full space-y-2">
                            <EditableField 
                              label="姓名" 
                              value={currentPersona.name} 
                              onChange={(val) => handleUpdateResult('personas', 'name', val, currentPersonaIndex)} 
                              className="text-2xl font-bold text-center text-white" 
                            />
                            <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
                              <EditableField 
                                label="年龄" 
                                value={currentPersona.age} 
                                onChange={(val) => handleUpdateResult('personas', 'age', parseInt(val) || 0, currentPersonaIndex)} 
                              />
                              <span className="text-slate-600">·</span>
                              <EditableField 
                                label="职业" 
                                value={currentPersona.occupation} 
                                onChange={(val) => handleUpdateResult('personas', 'occupation', val, currentPersonaIndex)} 
                              />
                            </div>
                          </div>
                          <div className="w-full pt-6 border-t border-white/10">
                            <EditableField 
                              label="年收入水平" 
                              value={currentPersona.income} 
                              onChange={(val) => handleUpdateResult('personas', 'income', val, currentPersonaIndex)} 
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2 p-8 space-y-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <EditableField 
                              label="核心价值观" 
                              value={currentPersona.values} 
                              onChange={(val) => handleUpdateResult('personas', 'values', val, currentPersonaIndex)} 
                              type="textarea" 
                            />
                            <EditableField 
                              label="具体出行需求" 
                              value={currentPersona.travelNeeds} 
                              onChange={(val) => handleUpdateResult('personas', 'travelNeeds', val, currentPersonaIndex)} 
                              type="textarea" 
                            />
                          </div>
                          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-[20px] space-y-2">
                            <EditableField 
                              label="背包使用痛点 (Pain Points)" 
                              value={currentPersona.painPoints} 
                              onChange={(val) => handleUpdateResult('personas', 'painPoints', val, currentPersonaIndex)} 
                              type="textarea" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Summary Card */}
                <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-400" />
                    <h4 className="font-bold text-lg text-white">用户画像与设计导向总结</h4>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md p-4 rounded-[24px] border border-white/5">
                    <EditableField label="总结" value={result.summary} onChange={(val) => handleUpdateResult('summary', null, val)} type="textarea" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-widest font-bold">
                    <CheckCircle2 size={14} className="text-green-400" />
                    Ready for AI Generation
                  </div>
                </div>

                {/* Missing Info Warning */}
                {result.missingInfo.length > 0 && (
                  <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-[24px] space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 text-sm font-bold">
                      <AlertCircle size={18} />
                      检测到关键信息缺失
                    </div>
                    <ul className="text-sm text-slate-300 list-disc list-inside space-y-2">
                      {result.missingInfo.map((info, i) => (
                        <li key={i}>{info}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-400 mt-3 italic">建议补充以上信息以获得更精准的设计导向。</p>
                  </div>
                )}

              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Specifications */}
            <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ListChecks className="text-blue-400" size={20} />
                <h4 className="font-bold text-lg text-white">1. 产品规格</h4>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="产品名称" value={result?.specifications.name || ''} onChange={(val) => handleUpdateResult('specifications', 'name', val)} />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="尺寸/容量" value={result?.specifications.size || ''} onChange={(val) => handleUpdateResult('specifications', 'size', val)} />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="重量" value={result?.specifications.weight || ''} onChange={(val) => handleUpdateResult('specifications', 'weight', val)} />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="关键面辅料" value={result?.specifications.materials || ''} onChange={(val) => handleUpdateResult('specifications', 'materials', val)} type="textarea" />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="结构功能" value={result?.specifications.functions || ''} onChange={(val) => handleUpdateResult('specifications', 'functions', val)} type="textarea" editable={true} />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="色彩" value={result?.specifications.colors || ''} onChange={(val) => handleUpdateResult('specifications', 'colors', val)} />
                  {result?.specifications.pantoneColors && result.specifications.pantoneColors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-white uppercase font-bold tracking-wider mb-3">识别到的 Pantone 色彩</p>
                      <div className="flex flex-wrap gap-3">
                        {result.specifications.pantoneColors.map((color: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                            <div className="w-8 h-8 rounded-md shadow-inner" style={{ backgroundColor: color.hex }}></div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">{color.code}</span>
                              <span className="text-[10px] text-slate-400">{color.name} ({color.hex})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User & Scenario */}
            <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon size={20} className="text-blue-400" />
                <h4 className="font-bold text-lg text-white">2. 目标用户与场景</h4>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="核心用户" value={result?.userScenario.targetMarket || ''} onChange={(val) => handleUpdateResult('userScenario', 'targetMarket', val)} />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="身份职业" value={result?.userScenario.profession || ''} onChange={(val) => handleUpdateResult('userScenario', 'profession', val)} />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="次级用户" value={result?.userScenario.secondaryUser || ''} onChange={(val) => handleUpdateResult('userScenario', 'secondaryUser', val)} />
                </div>
                <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                  <EditableField label="出行场景" value={result?.userScenario.scenario || ''} onChange={(val) => handleUpdateResult('userScenario', 'scenario', val)} type="textarea" />
                </div>
              </div>
            </div>

            {/* Design Concept */}
            <div className="glass-panel-premium rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Palette size={20} className="text-blue-400" />
                <h4 className="font-bold text-lg text-white">3. 设计风格</h4>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-[20px] border border-white/5">
                <EditableTags 
                  label="设计风格" 
                  tags={result?.designConcept || []} 
                  onChange={(val) => handleUpdateResult('designConcept', null, val)} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Navigation Button */}
      {result && (
        <div className="flex justify-center pt-8 border-t border-white/10">
          <button
            onMouseEnter={(e) => createDiamondParticles(e)}
            onClick={() => {
              setActiveModule('appearance');
            }}
            className="w-full max-w-md py-4 celestian-button text-lg group"
          >
            <Sparkles size={24} />
            确认并生成外观设计方案
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Image Viewing Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setViewingImage(null)}
        >
          <img 
            src={viewingImage} 
            alt="Enlarged view" 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
          <button 
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setViewingImage(null); }}
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

const User = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
