import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Save, Plus, Box, Layers, Target, CheckCircle2, Sparkles, Palette, FileText, Loader2, MousePointer2, Brush, Ruler, Sliders, X, Download, ChevronDown, ChevronRight, ChevronLeft, Maximize, Undo, Wand2, ScanSearch, Settings2, Activity, Copy, Fingerprint, Crosshair, Library, Info, AlertCircle, Droplets, Type, RefreshCw, Image as ImageIcon, Check, Network, Upload, Pipette, Wind, Circle, Shield, Archive, Camera } from 'lucide-react';
import { StatusBar, CountDownTimer, ReconnectGuide, useErrorInterceptor } from '../components/ErrorSystem';
import { CanvasMaskLayer } from '../components/CanvasMaskLayer';
import { AssetLibraryModal } from '../components/AssetLibraryModal';
import { generateContentWithRetry, parseAIError } from '../utils/aiUtils';
import { useDesignStore } from '../store/useDesignStore';
import { AnalysisResult } from './DesignDefinition';
import { MaterialSelection } from './MaterialSelection';
import { AdvancedColorPicker } from '../components/AdvancedColorPicker';
import { materials } from '../data/materials';
import { accessories, accessoryStyles, accessoryBrandPrompts } from '../data/accessories';
import { STYLE_CATEGORIES } from './CompetitorLibrary';
import { getDynamicRecommendations } from '../utils/recommendationUtils';
import Markdown from 'react-markdown';
import { createDiamondParticles, createPanelClickParticles } from '../utils/particles';

const DebouncedTextarea = ({ value, onChange, placeholder, className, onBlur }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string, onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <textarea
      value={localValue}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onChange(newVal);
        }, 300);
      }}
      onBlur={(e) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onChange(e.target.value);
        if (onBlur) onBlur(e);
      }}
    />
  );
};

const HIGH_QUALITY_RENDERING = `
Professional commercial product photography, shot on 85mm lens, f/5.6 for sharp focus.
LIGHTING & SHADOWS: Use soft, even studio lighting (softbox) to create a natural, realistic product shot. Shadows should be realistic and subtle, defining the shape without being overly dramatic. Avoid harsh, high-contrast industrial lighting.
TEXTURES (CRITICAL): Render materials with EXTREME photorealism. Fabrics MUST look like real woven nylon, canvas, leather, or polyester. You MUST show realistic fabric drape and tension at the seams. WARNING: Do NOT over-exaggerate the weave or texture to the point where it looks like holes, pores, perforations, or a mesh net. It must be solid, cohesive fabric. ABSOLUTELY NO overly rigid, plastic, smooth, or computer-generated 3D-render looks.
DETAILS: Zippers, straps, and buckles must look like standard, functional bag hardware. Show realistic stitching lines, seams, and fabric folds. The bag should look like a mass-produced, physical product you can buy in a store.
COMPOSITION: 4k resolution, clean catalog-style composition. 
FORBIDDEN: NO humans, NO models, NO hands, NO feet, NO faces. NO background scenes, NO indoor/outdoor environments. MUST be on a clean white background. NO sketches, NO 3D renders, NO digital art, NO overly mechanical/sci-fi aesthetics.
NO LOGOS: Absolutely no brand logos, no text, no watermarks, no letters, no symbols. Clean unbranded surface.
`;

const AVANT_GARDE_DESIGN_DNA = `
INNOVATION DNA:
- SILHOUETTE: Focus on clean, functional, and aesthetically pleasing shapes that fit the user's selected style.
- STRUCTURE: Ensure the bag structure is physically plausible and suitable for real-world manufacturing.
- DETAILS: Focus on premium execution of standard bag making techniques.
- AVOID: Avoid overly complex, chaotic, or "sci-fi armor" aesthetics unless explicitly requested by the user's style choices.
`;

const GLOBAL_RENDERING_PROTOCOL = `
PHYSICAL RENDERING STANDARD:
- ARCHETYPE & RENDERING: The prototype skeleton takes absolute priority. The generated bag MUST anchor to the selected [PROTOTYPE GEOMETRY].
- MATERIAL OVERRIDE: Use the specified [BOM Materials] or reference materials for high-definition rendering.
- TEXTURE QUALITY: Ensure the surface presents a realistic, professional texture appropriate for the bag's style. STRICTLY FORBIDDEN: Cheap, overly smooth, or glossy plastic-like textures.
- HARDWARE: Hardware should look realistic and functional.
- Inpaint Constraint: Force hard-edge masking. Strictly contain hardware generation within the user-defined bounding box.
`;

const ANTI_SIMILARITY_ENGINE = `
DIFFERENTIATED INNOVATION ENGINE:
- PROHIBITED: 1:1 reproduction of reference images or existing products is strictly forbidden.
- GENETIC RECOMBINATION: Extract design "genes" (e.g., vibe, specific color palette) and recombine them into a NEW visual variable.
- WEIGHT CONTROL LOGIC:
  1. Brand Style (20%): Use only as a visual baseline.
  2. Competitor Style (30%): Use as a negative reference to avoid occupied design points.
  3. Appearance Reference (50%): Use as a core guide, but MUST perform silhouette micro-adjustment.
`;

const BAGCRAFT_MASTER_PROTOCOL = `
[MORPHOLOGY REALISM PROTOCOL]
1. GEOMETRY: Ensure the backpack has a realistic, functional volume and shape. Avoid physically impossible floating parts or overly complex sci-fi armor plating.
2. CONSTRUCTION (CRITICAL): The bag MUST appear to be constructed entirely from sewn fabric panels. Emphasize realistic seams, gussets, and hems. ABSOLUTELY NO molded plastic bases, NO thermoformed EVA shells, NO hard plastic panels. Even supported areas must look like fabric stretched over a hidden frame, NOT exposed plastic.
3. HARDWARE: Zippers, buckles, and adjusters should be placed logically where they would function in reality.
4. NEGATIVES: Forbid text, logos, brand ID, patterns, shiny nylon, flat surfaces, clone, exact copy, molded plastic, hard shell.
`;

const MINIMALIST_SIMPLIFICATION_CONSTRAINTS = `
MINIMALIST & APPEARANCE PROTOCOL:
- APPEARANCE SEGMENTATION: Segmentation must serve a functional or aesthetic purpose (e.g., color blocking, functional seams). Limit the number of panels; prioritize clean, large material areas.
- DESIGN LINES: Use purposeful design lines (symmetrical, diagonal, or flowing) to generate design sense, avoiding a "shredded" or overly complex look.
- VISUAL BALANCE: Whether the design is symmetrical or asymmetrical, it MUST achieve overall visual balance. Symmetrical designs should focus on proportion and detail; asymmetrical designs must balance visual weight.
- HIERARCHY: Maintain a clear "primary-secondary" relationship; strictly forbid visual chaos from multiple focal points.
- HARDWARE FOCUS: Limit to 1-3 core hardware pieces (e.g., magnetic buckle, custom puller) as visual focal points.
- MINIMALIST HARDWARE: Auxiliary parts should be integrated cleanly or color-matched (e.g., hidden AquaGuard zippers).
- PRODUCTION LOGIC: All hardware/accessories must be located at reasonable stress points or interaction positions. No decorative-only webbing in non-load-bearing areas.
`;

const MANDATORY_ANATOMY_PROMPT = `
[CRITICAL ANATOMY & BRANDING OVERRIDE]
(strictly two shoulder straps:1.8), (standard backpack anatomy:1.5), single top handle, realistic physical structure, clear visibility of exactly two shoulder straps. The shoulder straps MUST be attached to the back panel and curve naturally over the shoulders. The bag MUST have a coherent, functional, and structurally sound shape. Avoid overly complex or chaotic strap arrangements.
(clean unbranded surface:1.5), absolutely no logos, no text, no brand marks.
The resulting description must imply that the bag is 'Assembled' through industrial sewing and heat-bonding, not 3D-printed as a single piece. Use words like 'Seams', 'Anchor points', 'Panels', and 'Gussets' instead of 'Plates' or 'Mechanical parts'.
`;

const NEGATIVE_ANATOMY_PROMPT = `(holes:2.0), (pores:2.0), (perforations:2.0), (trypophobia:2.0), (dotted pattern:2.0), (exaggerated mesh:2.0), (square shape:2.0), (boxy:2.0), (rectangular prism:2.0), (briefcase shape:1.8), (perfectly square:2.0), strictly rectangular, rigid box, square backpack, boxy silhouette, cube shape, (elastic mesh pocket:2.0), (mesh side pocket:2.0), (netting pocket:1.8), (elastic binding edge:2.0), cheap mesh, (3D render:2.0), (CGI:2.0), (octane render:2.0), (unreal engine:2.0), (plastic texture:2.0), (smooth surface:1.8), (artificial lighting:1.5), (computer generated:2.0), (cyberpunk armor:2.0), (hardshell:2.0), (mech:2.0), (rigid body:1.8), overly perfect, clinical, fake, illustration, drawing, painting, (diagrams:2.0), (infographics:2.0), (annotations:2.0), (labels:2.0), (arrows:2.0), (callout lines:2.0), (pointers:2.0), (text descriptions:2.0), dimensions, measurements, (logos:2.0), (brand marks:2.0), (text:2.0), (watermarks:2.0), letters, words, typography, symbols, emblems, badges, trademark, copyright, other brands, competitor logos, any brand logo, (three shoulder straps:2.0), (extra straps:1.8), (multiple handles:1.5), floating straps, illogical anatomy, mutated parts, physically impossible geometry, extra limbs, extra buckles, detached straps, straps attached to the front, deformed bag shape, asymmetrical body, chaotic strap arrangement, weird bag shape, `;

const logoCrafts = [
  { name: '默认', prompt: '', visual: '' },
  { name: '真皮压印', prompt: '(deep debossing effect:1.4), 2mm material depth, realistic ambient occlusion shadows within the logo, heavy leather compression.', visual: '阴影：模拟皮革受压后的深色边缘，带有自然的压力形变感。' },
  { name: '高密刺绣', prompt: '(hyper-detailed thread-count texture:1.6), individual silk thread direction, 3D stitched relief, micro-tension fabric wrinkles at edges.', visual: '线迹：表现单根丝线的交织感，边缘有微小的布料拉紧褶皱。' },
  { name: '哑光丝印', prompt: 'Industrial matte silk-screen print, ultra-flat ink deposit, zero specular reflection, ink absorbed into fabric fibers, crisp sharp edges, high-opacity pigment with subtle porous texture.', visual: '工业级哑光印刷，油墨完全渗入布料纤维，表面无反光，边缘极其锐利且无厚度感。' },
  { name: '热压胶印', prompt: 'Heat-transferred TPU film logo, ultra-thin 0.3mm profile, seamless edge bonding with technical fabric, smooth semi-matte finish, high-precision geometric sharpness, flexible rubberized texture.', visual: '超薄TPU热转印，与机能面料无缝融合，边缘如刀刻般锐利，表面呈高级半哑光质感。' },
  { name: '立体硅胶', prompt: '3D raised silicone injection, smooth rounded rubberized edges, subtle matte reflections, significant physical thickness.', visual: '立体感：3D硅胶注塑效果，边缘圆润且具有明显的物理厚度。' },
  { name: '高周波压印', prompt: 'High-frequency welding, sharp 3D relief, crisp polymer edges, dual-tone texture contrast.', visual: '立体感：强调类似浮雕的硬挺边缘，具有极强的结构感和立体深度。' },
  { name: '激光镭射', prompt: 'Precision laser etching, subtle tonal shift, micro-burnt texture, no physical thickness, matte finish.', visual: '焦灼感：通过色差表现而非厚度表现，细节极其丰富且低调。' },
  { name: '织唛缝标', prompt: 'High-definition damask woven label, visible warp and weft interlacing, folded end-fold finish, perimeter overlock stitching, vintage heritage texture, slight fabric elevation.', visual: '高密经纬线交织织标，边缘带有细腻的包边缝线，呈现出复古且精致的布艺质感。' },
  { name: '滴胶工艺', prompt: 'Crystal clear epoxy resin dome, high-gloss 3D lens effect, refractive highlights, smooth liquid-like surface.', visual: '折射：模拟透明玻璃罩的高反光，表面具有强烈的弧形反光和放大镜效果。' },
  { name: '反光印刷', prompt: 'Retroreflective silver coating, 3M Scotchlite effect, microscopic glass bead texture, glowing under high-contrast light.', visual: '颗粒感：模拟反光涂料特有的微小晶体，在光线直射下迸发出强烈的银白色金属光泽。' },
  { name: '金属标牌', prompt: 'Brushed zinc alloy texture, micro-rivet attachment details, specular highlights, sharp CNC-cut edges.', visual: '质感：拉丝锌合金材质，带有微型铆钉固定细节，边缘锐利。' }
];

const logoSizes = [
  { value: '5', label: '5% (Minimal)', prompt: 'micro-branding or subtle logo. AI will refer to the webbing width to treat it as a decorative detail.' },
  { value: '10', label: '10% (Standard)', prompt: 'balanced scale, standard logo size.' },
  { value: '15', label: '15% (Bold)', prompt: 'prominent placement. AI will enlarge the Logo to make it the visual core of the bag surface.' }
];

const logoPlacements = [
  { label: '默认', prompt: '' },
  { label: '上方居中 (Top Center)', prompt: 'centered on the upper front panel, vertically aligned with the handle.' },
  { label: '左下角 (Bottom Left Corner)', prompt: 'anchored to the lower left corner, 20mm margin from side and bottom seams.' },
  { label: '右下角 (Bottom Right Corner)', prompt: 'anchored to the lower right corner, 20mm margin from side and bottom seams.' },
  { label: '垂直织带排列 (Webbing Alignment)', prompt: 'vertically repeated on the center nylon webbing strap.' },
  { label: '正中央 (Center)', prompt: 'centered on the front panel.' },
  { label: '自定义-紫色选框手动选取', prompt: 'placed exactly at the specified coordinates.' }
];

const PROTOTYPES = [
  { id: 'roll-top', label: '卷顶型', icon: Layers, desc: '强调垂直延伸感，顶部圆润卷折', reason: '匹配您的“骑行防水”需求' },
  { id: 'teardrop', label: '水滴型', icon: Droplets, desc: '侧视图呈饱满弧形', reason: '匹配您的“轻量通勤”需求' },
  { id: 'streamlined', label: '流线弧面', icon: Wind, desc: '追求极致破风弧度，整体中轴对称' },
  { id: 'pebble', label: '圆润卵石', icon: Circle, desc: '极大的 R 角处理，一体化压胶视觉' },
  { id: 'classic-arch', label: '经典橄榄', icon: Shield, desc: '经典的弧形顶部，重心下移' },
  { id: 'trapezoid', label: '梯形桶', icon: Archive, desc: '底部加宽提供稳定性，前幅弧面化处理' },
];

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    }
  }
}

const LogoBoundingBox = ({ position, scale, onTransformChange, onManualMove }: { position: string, scale: string, onTransformChange?: (transform: { x: number, y: number, rotation: number, scale: string }) => void, onManualMove?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const getInitialPos = () => {
    let top = 50;
    let left = 50;
    if (position.includes('上方居中')) {
      top = 30;
    } else if (position.includes('左下角')) {
      top = 75;
      left = 35;
    } else if (position.includes('右下角')) {
      top = 75;
      left = 65;
    }
    return { x: left, y: top };
  };

  const [pos, setPos] = useState(getInitialPos());
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    if (position !== '自定义-紫色选框手动选取') {
      setPos(getInitialPos());
      setRotation(0);
    }
  }, [position]);

  let width = '15%';
  let height = '8%';
  if (scale.includes('5%')) { width = '8%'; height = '4%'; }
  if (scale.includes('15%')) { width = '25%'; height = '12%'; }
  if (position.includes('垂直织带排列')) {
    height = '50%';
    width = '6%';
  }

  useEffect(() => {
    if (onTransformChange) {
      onTransformChange({ x: pos.x, y: pos.y, rotation, scale });
    }
  }, [pos, rotation, scale, onTransformChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (onManualMove) onManualMove();
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging && containerRef.current?.parentElement) {
        const parentRect = containerRef.current.parentElement.getBoundingClientRect();
        const newX = ((e.clientX - parentRect.left) / parentRect.width) * 100;
        const newY = ((e.clientY - parentRect.top) / parentRect.height) * 100;
        setPos({ 
          x: Math.max(0, Math.min(100, newX)), 
          y: Math.max(0, Math.min(100, newY)) 
        });
      } else if (isRotating && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        let newRotation = angle + 90;
        newRotation = Math.max(-45, Math.min(45, newRotation));
        setRotation(newRotation);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsRotating(false);
    };

    if (isDragging || isRotating) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isRotating]);

  const handleRotatePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
    if (onManualMove) onManualMove();
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute border-2 border-dashed border-slate-400/80 bg-slate-500/20 transition-all duration-75 z-30 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        width,
        height,
        top: `${pos.y}%`,
        left: `${pos.x}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`
      }}
      onPointerDown={handlePointerDown}
    >
      <span className="text-[10px] text-slate-200 font-mono bg-black/50 px-1 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-full pointer-events-none">LOGO</span>
      
      <div 
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-500 rounded-full cursor-crosshair flex items-center justify-center hover:scale-110 transition-transform"
        onPointerDown={handleRotatePointerDown}
      >
        <div className="w-0.5 h-4 bg-slate-300 absolute top-4"></div>
      </div>
    </div>
  );
};

const filterHardcoreWords = (prompt: string): string => {
  if (!prompt) return prompt;
  
  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // 1. Specific phrase replacements (Morphology-First Protocol) - Dynamic & Concise
  let filtered = prompt
    .replace(/\b(disassembled into independent blocks|independent blocks|disassembled blocks)\b/gi, () => getRandom(['undulating volume', 'overlapping fabric', 'fluid mass', 'soft structural folds']))
    .replace(/\b(z-axis offset|z axis offset|gap|gaps)\b/gi, () => getRandom(['deep shadow lines', 'natural fabric recesses', 'soft spatial depth', 'breathing room']))
    .replace(/\b(inner core|rigid shell|hard shell)\b/gi, () => getRandom(['flexible wrapping', 'tensioned fabric skin', 'plump inner support', 'soft protective layer']))
    .replace(/\b(interlock|anchor|penetrate)\b/gi, () => getRandom(['organic curves', 'tension arcs', 'seamless fabric transitions', 'fluid integration']))
    .replace(/\b(90 degrees|90-degree|rigid structure)\b/gi, () => getRandom(['natural creases', 'soft geometric folds', 'relaxed fabric corners', 'organic draping']));

  // 2. General hardcore words replacement
  const replacements = [
    'fabric undulation', 
    'natural drape', 
    'fabric tension', 
    'micro-wrinkles', 
    'matte finish',
    'visible seams',
    'natural sag',
    'soft silhouette',
    'woven texture'
  ];
  const forbiddenRegex = /\b(armor|plate|robot|robotic|cyber|rigid|plastic|shield|shield-plate|mechanical|sharp-edges|metal|heavy-duty|molded|exoskeleton|carapace|polycarbonate|eva|thermoformed|shell|hard|stiff|solid|structure|disassemble|deconstruct|volume|block|offset|layering)\b/gi;
  return filtered.replace(forbiddenRegex, () => getRandom(replacements));
};

const filterHardcoreWordsChinese = (prompt: string): string => {
  if (!prompt) return prompt;
  
  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // 1. Specific phrase replacements (Morphology-First Protocol) - Dynamic & Concise
  let filtered = prompt
    .replace(/(拆解为独立体块|独立体块|拆解体块)/g, () => getRandom(['起伏的体量感', '层叠的织物轮廓', '流畅的面料堆叠', '柔和的形态过渡']))
    .replace(/(Z轴偏移|z轴偏移|缝隙)/g, () => getRandom(['深邃的阴影断层', '自然的面料凹陷', '柔性的空间层次', '呼吸感留白']))
    .replace(/(内部 Core|内部core|刚性 Shell|刚性shell|硬壳)/g, () => getRandom(['柔韧的包覆外壳', '张力织物表皮', '饱满的内层支撑', '软质防护层']))
    .replace(/(咬合|锚定|穿插)/g, () => getRandom(['有机的张力弧线', '流畅的面料过渡', '自然的缝制衔接', '柔性融合']))
    .replace(/(90度|刚性结构)/g, () => getRandom(['自然折叠的褶皱', '软质几何折角', '松弛的面料边缘', '有机的垂坠形态']));

  // 2. General hardcore words replacement
  const replacements = [
    '起伏', 
    '张力', 
    '折痕', 
    '哑光', 
    '缝纫线',
    '重力感',
    '面料垂坠',
    '柔和轮廓',
    '织物肌理'
  ];
  const forbiddenRegex = /(装甲|板材|机器人|赛博|刚性|塑料|盾牌|机械|锐利边缘|金属|重型外观|模压|外骨骼|甲壳|聚碳酸酯|热压成型|壳体|坚硬|僵硬|实体|结构|拆解|体块|偏移|层叠)/g;
  return filtered.replace(forbiddenRegex, () => getRandom(replacements));
};

export const AppearanceAnalysis = () => {
  const { designData, updateDesignData, assetLibraryTrigger, setAssetLibraryTrigger } = useDesignStore();
  const { error: globalError, clearError: clearGlobalError, busyCountdown } = useErrorInterceptor();
  const definitionResult = designData.definition?.result as AnalysisResult | undefined;
  console.log("AppearanceAnalysis: definitionResult =", definitionResult);
  
  const [activeEditMode, setActiveEditMode] = useState<string | null>(null);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [libraryModalContext, setLibraryModalContext] = useState<'global' | 'benchmark'>('global');
  const [libraryInitialTab, setLibraryInitialTab] = useState<'material' | 'color' | 'hardware' | 'logo'>('material');
  const [libraryFilters, setLibraryFilters] = useState<{colors?: string[], fabrics?: string[]}>({});
  const [libraryHighlightColor, setLibraryHighlightColor] = useState<string | undefined>(undefined);
  const [libraryAmbientLight, setLibraryAmbientLight] = useState<string | undefined>(undefined);
  const [flashingTile, setFlashingTile] = useState<'material' | 'color' | 'hardware' | 'logo' | 'all' | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isPrototypeMatrixOpen, setIsPrototypeMatrixOpen] = useState(false);

  useEffect(() => {
    if (assetLibraryTrigger && assetLibraryTrigger.isOpen) {
      setLibraryInitialTab(assetLibraryTrigger.tab);
      setLibraryFilters(assetLibraryTrigger.filters || {});
      setLibraryHighlightColor(assetLibraryTrigger.highlightColor);
      setLibraryAmbientLight(assetLibraryTrigger.ambientLight);
      setLibraryModalContext('global');
      setIsLibraryModalOpen(true);
      
      // Clear the trigger so it doesn't re-fire
      setAssetLibraryTrigger({ ...assetLibraryTrigger, isOpen: false });
    }
  }, [assetLibraryTrigger, setAssetLibraryTrigger]);
  const [globalAttributes, setGlobalAttributes] = useState<{
    material: any[];
    color: any[];
    hardware: any[];
    logo: any[];
  }>(() => {
    const saved: any = designData.appearance?.globalAttributes || {};
    return {
      material: Array.isArray(saved.material) ? saved.material : [],
      color: Array.isArray(saved.color) ? saved.color : [],
      hardware: Array.isArray(saved.hardware) ? saved.hardware : [],
      logo: Array.isArray(saved.logo) ? saved.logo : []
    };
  });

  // Removed local busyCountdown state

  const [logoTransform, setLogoTransform] = useState({ x: 50, y: 50, rotation: 0, scale: '10% (Standard)' });
  const [brushType, setBrushType] = useState<'freehand' | 'polygon'>('freehand');
  const [polygonPoints, setPolygonPoints] = useState<{x: number, y: number}[] | null>(null);
  const [useBrandStyleLibrary, setUseBrandStyleLibrary] = useState(false);

  const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
  const fusionAnalysis = designData.competitor?.fusionAnalysis;
  const isAnalyzingFusion = designData.competitor?.isAnalyzingFusion;

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
  const [tempPoints, setTempPoints] = useState<{x: number, y: number}[]>([]);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushMode, setBrushMode] = useState<'add' | 'subtract'>('add');
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const isDrawingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const undoHistoryRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [isLogoCollapsed, setIsLogoCollapsed] = useState(true);
  const [isFoundationCollapsed, setIsFoundationCollapsed] = useState(false);
  const [isEvolutionCollapsed, setIsEvolutionCollapsed] = useState(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [showPromptOptimized, setShowPromptOptimized] = useState(false);
  const [designRequirements, setDesignRequirements] = useState<string>(designData.appearance?.designRequirements || '');
  const [activeTool, setActiveTool] = useState<'box' | 'brush' | 'scale' | null>('box');

  const [isImageToImageModalOpen, setIsImageToImageModalOpen] = useState(false);
  const [retouchMode, setRetouchMode] = useState<'i2i' | 'e2r'>('i2i');
  const [i2iReferenceImage, setI2iReferenceImage] = useState<string | null>(null);
  const [i2iSimilarity, setI2iSimilarity] = useState<number>(50);
  const [i2iCustomPrompt, setI2iCustomPrompt] = useState<string>('');
  const [isI2iGenerating, setIsI2iGenerating] = useState(false);
  const [i2iResultImage, setI2iResultImage] = useState<string | null>(null);
  const [isDraggingI2i, setIsDraggingI2i] = useState(false);
  const [isDraggingE2r, setIsDraggingE2r] = useState(false);

  const handleRetouchGenerate = async () => {
    if (retouchMode === 'i2i' && !i2iReferenceImage) return;
    if (retouchMode === 'e2r' && !effectImageUrl[0]) return;
    
    setIsI2iGenerating(true);
    setError(null);
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }

      const sourceImage = retouchMode === 'i2i' ? i2iReferenceImage! : effectImageUrl[0];
      const img = new Image();
      if (!sourceImage.startsWith('data:') && !sourceImage.startsWith('blob:')) {
        img.crossOrigin = "anonymous";
      }
      img.src = sourceImage;
      await new Promise((resolve, reject) => { 
        img.onload = resolve; 
        img.onerror = reject;
      });

      const MAX_DIMENSION = 1024;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = width;
      originalCanvas.height = height;
      const originalCtx = originalCanvas.getContext('2d');
      if (originalCtx) {
        originalCtx.fillStyle = '#FFFFFF';
        originalCtx.fillRect(0, 0, width, height);
        originalCtx.drawImage(img, 0, 0, width, height);
      }
      const base64Data = originalCanvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      const mimeType = 'image/jpeg';

      let prompt = '';
      if (retouchMode === 'i2i') {
        prompt = `
          [IMAGE EDITING TASK]
          You are an expert industrial designer. Edit the provided backpack image according to the following instructions.
          
          ${i2iSimilarity < 80 ? 'CRITICAL: You MUST make noticeable changes to the design. Do not return the exact same image.' : ''}
          
          Similarity Level: ${i2iSimilarity}%
          
          ${i2iSimilarity > 80 ? 'Make only very minor refinements. Keep the design almost identical to the reference image.' : ''}
          ${i2iSimilarity > 40 && i2iSimilarity <= 80 ? 'Keep the core vibe and main structure, but introduce noticeable design variations, new paneling, or different hardware.' : ''}
          ${i2iSimilarity <= 40 ? 'Use the reference image only as a loose inspiration. Create a significantly different and innovative backpack design.' : ''}
          
          ${i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\n${i2iCustomPrompt}\n(Please prioritize these requirements in your generation while respecting the similarity level.)` : ''}
          
          CRITICAL VIEWPOINT & COMPOSITION:
          - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.
          - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).
          - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.
          
          ${MANDATORY_ANATOMY_PROMPT}
          
          NEGATIVE PROMPTS:
          ${NEGATIVE_ANATOMY_PROMPT}people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.
          
          ${HIGH_QUALITY_RENDERING}
        `;
      } else {
        prompt = `
          [IMAGE EDITING TASK]
          You are an expert product photographer and retoucher. Your task is to transform the provided design concept/effect image into a highly realistic, physical product photograph.
          
          CRITICAL REQUIREMENTS:
          - The result MUST look like a real, physical bag that has been manufactured.
          - Add realistic fabric textures, natural wrinkles, and subtle imperfections that exist in real products.
          - Enhance lighting to look like a professional studio photoshoot (softbox lighting, realistic shadows, ambient occlusion).
          - Ensure hardware (zippers, buckles) looks like real metal or high-grade plastic with appropriate reflections.
          - Maintain the exact same silhouette, proportions, and design details of the original image.
          - The background MUST remain pure white (#FFFFFF).
          
          ${i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\n${i2iCustomPrompt}\n(Please prioritize these requirements in your generation.)` : ''}
          
          NEGATIVE PROMPTS:
          sketches, drawings, 3d renders, flat colors, artificial look, plastic look, floating elements, text, logos, watermarks, people, hands, background scenes.
        `;
      }

      const response = await generateContentWithRetry({
        model: 'gemini-2.5-flash-image',
        contents: { 
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          setI2iResultImage(newImageUrl);
          break;
        }
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      setError(`图片生成失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsI2iGenerating(false);
    }
  };

  const applyI2iResult = () => {
    if (i2iResultImage) {
      setEffectImageUrl([i2iResultImage]);
      addHistoryItem(i2iResultImage, [], []);
      updateDesignData('appearance', { effectImageUrl: [i2iResultImage] });
      setIsImageToImageModalOpen(false);
    }
  };

  const saveUndoState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    undoHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoHistoryRef.current.length > 20) {
      undoHistoryRef.current.shift();
    }
    setCanUndo(true);
  };

  const handleUndo = () => {
    if (undoHistoryRef.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const previousState = undoHistoryRef.current.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    }
    setCanUndo(undoHistoryRef.current.length > 0);
  };

  const startDrawing = (e: React.MouseEvent) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    saveUndoState();

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (brushType === 'polygon' && !polygonPoints) {
      setTempPoints([{x, y}]);
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();

    if (brushType === 'polygon' && !polygonPoints && tempPoints.length > 0) {
      handleUndo(); // Revert the temporary stroke
      
      const minX = Math.min(...tempPoints.map(p => p.x));
      const maxX = Math.max(...tempPoints.map(p => p.x));
      const minY = Math.min(...tempPoints.map(p => p.y));
      const maxY = Math.max(...tempPoints.map(p => p.y));
      
      // Only create polygon if the stroke is large enough
      if (maxX - minX > 10 || maxY - minY > 10) {
        setPolygonPoints([
          {x: minX, y: minY},
          {x: maxX, y: minY},
          {x: maxX, y: maxY},
          {x: minX, y: maxY}
        ]);
      }
      setTempPoints([]);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (brushType === 'polygon' && !polygonPoints) {
      setTempPoints(prev => [...prev, {x, y}]);
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePolygonMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingPointIndex !== null && polygonPoints) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      const newPoints = [...polygonPoints];
      newPoints[draggingPointIndex] = { x, y };
      setPolygonPoints(newPoints);
    }
  };

  const handlePolygonMouseUp = () => {
    setDraggingPointIndex(null);
  };

  const handlePolygonEdgeClick = (e: React.MouseEvent) => {
    if (!polygonPoints) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    let minDistance = Infinity;
    let insertIndex = -1;

    for (let i = 0; i < polygonPoints.length; i++) {
      const p1 = polygonPoints[i];
      const p2 = polygonPoints[(i + 1) % polygonPoints.length];
      
      const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
      if (l2 === 0) continue;
      
      let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = p1.x + t * (p2.x - p1.x);
      const projY = p1.y + t * (p2.y - p1.y);
      const distance = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));

      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
      }
    }

    if (minDistance < 20 * Math.max(scaleX, scaleY)) {
      const newPoints = [...polygonPoints];
      newPoints.splice(insertIndex, 0, { x, y });
      setPolygonPoints(newPoints);
    }
  };

  const confirmPolygon = () => {
    if (!polygonPoints) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    saveUndoState();

    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    setPolygonPoints(null);
  };

  const cancelPolygon = () => {
    setPolygonPoints(null);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
      if (draggingPointIndex !== null) {
        handlePolygonMouseMove(e as any);
      }
    };
    const handleGlobalMouseUp = () => {
      if (draggingPointIndex !== null) {
        handlePolygonMouseUp();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove, { passive: false });
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [draggingPointIndex, polygonPoints]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  const effectImageUrl = designData.appearance?.effectImageUrl || [];
  const imageHistory = designData.appearance?.imageHistory || [];

  const setEffectImageUrl = (urls: string[]) => updateDesignData('appearance', { effectImageUrl: urls });
  
  useEffect(() => {
    // Backend sync removed to prevent Failed to fetch errors and rely on localforage
  }, []);

  const addHistoryItem = async (url: string, styles: string[] = [], colors: string[] = []) => {
    const newItem = { url, styles, colors, id: Date.now() }; // Add a local ID
    const currentHistory = useDesignStore.getState().designData.appearance?.imageHistory || [];
    // Limit history to 10 items to prevent out-of-memory crashes
    updateDesignData('appearance', { imageHistory: [newItem, ...currentHistory].slice(0, 10) });
  };

  const removeHistoryItem = async (index: number) => {
    const currentHistory = useDesignStore.getState().designData.appearance?.imageHistory || [];
    updateDesignData('appearance', { imageHistory: currentHistory.filter((_, i) => i !== index) });
  };
  
  const getCurrentColors = () => {
    return globalAttributes.color.length > 0 
      ? globalAttributes.color.map((c: any) => c.hex) 
      : (selectedColor ? [selectedColor] : []);
  };

  const getApproximateColorName = (hex: string) => {
    if (!hex) return '';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const colors = [
      { name: 'black', r: 0, g: 0, b: 0 },
      { name: 'white', r: 255, g: 255, b: 255 },
      { name: 'red', r: 255, g: 0, b: 0 },
      { name: 'green', r: 0, g: 255, b: 0 },
      { name: 'blue', r: 0, g: 0, b: 255 },
      { name: 'yellow', r: 255, g: 255, b: 0 },
      { name: 'cyan', r: 0, g: 255, b: 255 },
      { name: 'magenta', r: 255, g: 0, b: 255 },
      { name: 'gray', r: 128, g: 128, b: 128 },
      { name: 'dark red', r: 139, g: 0, b: 0 },
      { name: 'dark green', r: 0, g: 100, b: 0 },
      { name: 'dark blue', r: 0, g: 0, b: 139 },
      { name: 'olive', r: 128, g: 128, b: 0 },
      { name: 'purple', r: 128, g: 0, b: 128 },
      { name: 'teal', r: 0, g: 128, b: 128 },
      { name: 'navy', r: 0, g: 0, b: 128 },
      { name: 'orange', r: 255, g: 165, b: 0 },
      { name: 'brown', r: 165, g: 42, b: 42 },
      { name: 'pink', r: 255, g: 192, b: 203 },
      { name: 'khaki', r: 240, g: 230, b: 140 },
      { name: 'beige', r: 245, g: 245, b: 220 },
      { name: 'mustard', r: 255, g: 219, b: 88 },
      { name: 'army green', r: 75, g: 83, b: 32 },
      { name: 'light blue', r: 173, g: 216, b: 230 },
      { name: 'dark gray', r: 169, g: 169, b: 169 },
      { name: 'maroon', r: 128, g: 0, b: 0 },
      { name: 'coral', r: 255, g: 127, b: 80 }
    ];
    
    let minDistance = Infinity;
    let closestColor = '';
    
    for (const color of colors) {
      const distance = Math.sqrt(
        Math.pow(r - color.r, 2) + 
        Math.pow(g - color.g, 2) + 
        Math.pow(b - color.b, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color.name;
      }
    }
    
    return closestColor;
  };

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [isDiverging, setIsDiverging] = useState(false);
  const [divergeProgress, setDivergeProgress] = useState(0);
  const [generatingAction, setGeneratingAction] = useState<'none' | 'effect' | 'color' | 'inpaint' | 'smartInpaint' | 'optimize'>('none');
  const [isOptimizingLogo, setIsOptimizingLogo] = useState(false);
  const [isMaterialPartCollapsed, setIsMaterialPartCollapsed] = useState(false);
  const [isColorPartCollapsed, setIsColorPartCollapsed] = useState(false);
  const [currentSeed, setCurrentSeed] = useState<number>(Math.floor(Math.random() * 1000000));

  const handleExecuteOptimization = async () => {
    setIsOptimizingLogo(true);
    setError(null);
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      
      const uploadedLogoUrl = designData.appearance?.logoBranding?.imageUrl;
      const backpackImageUrl = effectImageUrl[0];
      if (!uploadedLogoUrl) {
        setError("请先上传 Logo 图片。");
        setIsOptimizingLogo(false);
        return;
      }
      if (!backpackImageUrl) {
        setError("请先生成或选择背包效果图。");
        setIsOptimizingLogo(false);
        return;
      }

      const logoBranding = designData.appearance?.logoBranding || {};
      const position = logoBranding.position || '默认';
      const material = logoBranding.material || '默认';
      const color = logoBranding.color || '默认';

      const applyMaterialEffect = (logoImg: HTMLImageElement, material: string, color: string, width: number, height: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return logoImg;

        ctx.drawImage(logoImg, 0, 0, width, height);

        let tintColor = color;
        if (color === '默认' || color === '保持原色') tintColor = '';
        else if (color === '单色白') tintColor = '#FFFFFF';
        else if (color === '单色黑') tintColor = '#222222';
        else if (color === '金属金') tintColor = '#FFD700';
        else if (color === '金属银') tintColor = '#E0E0E0';
        else if (color === '红色') tintColor = '#CC0000';
        else if (color === '蓝色') tintColor = '#0033CC';
        else if (color === '绿色') tintColor = '#009900';
        else if (color === '黄色') tintColor = '#FFCC00';
        else if (color === '橙色') tintColor = '#FF6600';
        else if (color === '紫色') tintColor = '#660099';
        else if (color === '粉色') tintColor = '#FF99CC';
        else if (color === '棕色') tintColor = '#663300';
        else if (color === '灰色') tintColor = '#666666';
        else if (color === '同色系隐形') tintColor = 'rgba(0,0,0,0.15)';
        
        if (tintColor) {
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillStyle = tintColor;
          ctx.fillRect(0, 0, width, height);
        }

        const effectCanvas = document.createElement('canvas');
        effectCanvas.width = width;
        effectCanvas.height = height;
        const eCtx = effectCanvas.getContext('2d');
        if (!eCtx) return canvas;

        eCtx.drawImage(canvas, 0, 0);
        const s = Math.max(width, height) / 100;

        if (material === '高密刺绣' || material === '织唛缝标') {
          eCtx.globalCompositeOperation = 'source-atop';
          eCtx.strokeStyle = 'rgba(0,0,0,0.8)';
          eCtx.lineWidth = s * 1.2;
          for (let i = -height; i < width + height; i += s * 2) {
            eCtx.beginPath();
            eCtx.moveTo(i, 0);
            eCtx.lineTo(i + height, height);
            eCtx.stroke();
          }
          eCtx.strokeStyle = 'rgba(255,255,255,0.5)';
          eCtx.lineWidth = s * 0.8;
          for (let i = -height; i < width + height; i += s * 4) {
            eCtx.beginPath();
            eCtx.moveTo(i + s, 0);
            eCtx.lineTo(i + height + s, height);
            eCtx.stroke();
          }
          if (material === '织唛缝标') {
            eCtx.strokeStyle = 'rgba(0,0,0,0.5)';
            eCtx.lineWidth = s * 1.0;
            for (let i = -height; i < width + height; i += s * 3) {
              eCtx.beginPath();
              eCtx.moveTo(0, i);
              eCtx.lineTo(width, i + width);
              eCtx.stroke();
            }
          }
        } else if (material === '滴胶工艺' || material === '高周波压印' || material === '立体硅胶') {
          eCtx.globalCompositeOperation = 'source-atop';
          if (material === '滴胶工艺') {
            const grad = eCtx.createRadialGradient(width * 0.3, height * 0.3, 0, width * 0.5, height * 0.5, width);
            grad.addColorStop(0, 'rgba(255,255,255,0.9)');
            grad.addColorStop(0.1, 'rgba(255,255,255,0.4)');
            grad.addColorStop(0.4, 'rgba(0,0,0,0)');
            grad.addColorStop(0.8, 'rgba(0,0,0,0.3)');
            eCtx.fillStyle = grad;
            eCtx.fillRect(0, 0, width, height);
          } else if (material === '立体硅胶') {
            const grad = eCtx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, 'rgba(255,255,255,0.3)');
            grad.addColorStop(0.5, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.2)');
            eCtx.fillStyle = grad;
            eCtx.fillRect(0, 0, width, height);
          } else {
            const grad = eCtx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, 'rgba(255,255,255,0.8)');
            grad.addColorStop(0.4, 'rgba(0,0,0,0)');
            grad.addColorStop(0.6, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.4)');
            eCtx.fillStyle = grad;
            eCtx.fillRect(0, 0, width, height);
          }
        } else if (material === '金属标牌') {
          eCtx.globalCompositeOperation = 'source-atop';
          const grad = eCtx.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, 'rgba(200,200,200,0.8)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
          grad.addColorStop(1, 'rgba(200,200,200,0.8)');
          eCtx.fillStyle = grad;
          eCtx.fillRect(0, 0, width, height);
          eCtx.strokeStyle = 'rgba(0,0,0,0.1)';
          eCtx.lineWidth = 1;
          for (let i = 0; i < height; i += 2) {
            eCtx.beginPath();
            eCtx.moveTo(0, i);
            eCtx.lineTo(width, i);
            eCtx.stroke();
          }
          eCtx.fillStyle = 'rgba(255,255,255,0.3)';
          eCtx.fillRect(width * 0.7, 0, width * 0.1, height);
        } else if (material === '真皮压印' || material === '热压胶印') {
          eCtx.globalCompositeOperation = 'source-atop';
          const grad = eCtx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, 'rgba(0,0,0,0.7)');
          grad.addColorStop(0.3, 'rgba(0,0,0,0.1)');
          grad.addColorStop(0.7, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(255,255,255,0.3)');
          eCtx.fillStyle = grad;
          eCtx.fillRect(0, 0, width, height);
        } else if (material === '反光印刷') {
          eCtx.globalCompositeOperation = 'source-atop';
          eCtx.fillStyle = 'rgba(255,255,255,0.5)';
          eCtx.fillRect(0, 0, width, height);
          for (let i = 0; i < 500; i++) {
            eCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
            eCtx.fillRect(Math.random() * width, Math.random() * height, s, s);
          }
        } else if (material === '激光镭射') {
          eCtx.globalCompositeOperation = 'source-atop';
          eCtx.fillStyle = 'rgba(0,0,0,0.3)';
          eCtx.fillRect(0, 0, width, height);
          for (let i = 0; i < 200; i++) {
            eCtx.fillStyle = `rgba(0,0,0,${Math.random() * 0.4})`;
            eCtx.fillRect(Math.random() * width, Math.random() * height, s * 0.5, s * 0.5);
          }
        }
        return effectCanvas;
      };

      const generateAccurateLogo = async () => {
        const imgElement = document.getElementById('appearance-main-image') as HTMLImageElement;
        if (!imgElement) return null;

        const containerElement = imgElement.parentElement;
        if (!containerElement) return null;

        const CW = containerElement.clientWidth;
        const CH = containerElement.clientHeight;
        const IW = imgElement.naturalWidth;
        const IH = imgElement.naturalHeight;

        const scaleFit = Math.min(CW / IW, CH / IH);
        const RW = IW * scaleFit;
        const RH = IH * scaleFit;
        const offsetX = (CW - RW) / 2;
        const offsetY = (CH - RH) / 2;

        const centerXContainer = CW * (logoTransform.x / 100);
        const centerYContainer = CH * (logoTransform.y / 100);

        const centerXImage = centerXContainer - offsetX;
        const centerYImage = centerYContainer - offsetY;

        const centerXNatural = centerXImage / scaleFit;
        const centerYNatural = centerYImage / scaleFit;

        let boxWidthPercent = 15;
        let boxHeightPercent = 8;
        if (logoTransform.scale.includes('5%')) { boxWidthPercent = 8; boxHeightPercent = 4; }
        if (logoTransform.scale.includes('15%')) { boxWidthPercent = 25; boxHeightPercent = 12; }
        if (position.includes('垂直织带排列')) {
          boxHeightPercent = 50;
          boxWidthPercent = 6;
        }

        const boxWidthContainer = CW * (boxWidthPercent / 100);
        const boxHeightContainer = CH * (boxHeightPercent / 100);

        const logoWidthNatural = boxWidthContainer / scaleFit;
        const logoHeightNatural = boxHeightContainer / scaleFit;

        const canvas = document.createElement('canvas');
        canvas.width = IW;
        canvas.height = IH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const backpackImg = new Image();
        backpackImg.crossOrigin = "anonymous";
        backpackImg.src = backpackImageUrl;
        await new Promise((resolve) => { backpackImg.onload = resolve; });
        ctx.drawImage(backpackImg, 0, 0, IW, IH);

        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = uploadedLogoUrl;
        await new Promise((resolve) => { logoImg.onload = resolve; });

        ctx.save();
        ctx.translate(centerXNatural, centerYNatural);
        ctx.rotate((logoTransform.rotation) * Math.PI / 180);
        
        const logoAspect = logoImg.width / logoImg.height;
        const boxAspect = logoWidthNatural / logoHeightNatural;
        
        let drawWidth = logoWidthNatural;
        let drawHeight = logoHeightNatural;
        
        if (logoAspect > boxAspect) {
          drawHeight = logoWidthNatural / logoAspect;
        } else {
          drawWidth = logoHeightNatural * logoAspect;
        }

        const processedLogo = applyMaterialEffect(logoImg, material, color, drawWidth, drawHeight);
        const s = Math.max(drawWidth, drawHeight) / 50;

        if (material === '高密刺绣' || material === '织唛缝标' || material === '真皮压印') {
          ctx.save();
          ctx.strokeStyle = material === '真皮压印' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)';
          ctx.lineWidth = s * 2;
          ctx.filter = 'blur(4px)';
          const wrinkleCount = material === '真皮压印' ? 8 : 12;
          const wrinkleLength = s * 10;
          for (let i = 0; i < 360; i += 360 / wrinkleCount) {
            const angle = i * Math.PI / 180;
            const startX = Math.cos(angle) * (drawWidth / 2.2);
            const startY = Math.sin(angle) * (drawHeight / 2.2);
            const endX = Math.cos(angle) * (drawWidth / 2 + wrinkleLength);
            const endY = Math.sin(angle) * (drawHeight / 2 + wrinkleLength);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.save();
        if (material === '高密刺绣' || material === '织唛缝标') {
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = s * 4;
          ctx.shadowOffsetY = s * 2;
          ctx.drawImage(processedLogo, -drawWidth / 2, -drawHeight / 2);
          ctx.shadowColor = 'rgba(255,255,255,0.2)';
          ctx.shadowBlur = s * 1;
          ctx.shadowOffsetY = -s * 0.5;
          ctx.drawImage(processedLogo, -drawWidth / 2, -drawHeight / 2);
          ctx.shadowColor = 'transparent';
        } else if (material === '滴胶工艺' || material === '高周波压印' || material === '立体硅胶') {
          ctx.globalCompositeOperation = 'screen';
          ctx.shadowColor = 'rgba(255,255,255,0.3)';
          ctx.shadowBlur = s * 1;
          ctx.shadowOffsetY = -s * 1;
          ctx.drawImage(processedLogo, -drawWidth / 2, -drawHeight / 2);
          ctx.shadowColor = 'transparent';
          ctx.globalCompositeOperation = 'source-over';
        } else if (material === '哑光丝印') {
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = s * 0.5;
          ctx.shadowOffsetY = s * 0.2;
          ctx.drawImage(processedLogo, -drawWidth / 2, -drawHeight / 2);
          ctx.shadowColor = 'transparent';
        } else if (material === '激光镭射') {
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = 0.5;
          ctx.drawImage(processedLogo, -drawWidth / 2, -drawHeight / 2);
          ctx.globalAlpha = 1.0;
        } else if (material === '反光印刷') {
          ctx.shadowColor = 'rgba(255,255,255,0.8)';
          ctx.shadowBlur = s * 2;
          ctx.drawImage(processedLogo, -drawWidth / 2, -drawHeight / 2);
          ctx.shadowColor = 'transparent';
        } else {
          ctx.drawImage(processedLogo, -drawWidth / 2, -drawHeight / 2);
        }
        ctx.restore();
        ctx.restore(); // Restore the save() from line 782
        return canvas.toDataURL('image/jpeg');
      };

      const resultImageUrl = await generateAccurateLogo();
      if (resultImageUrl) {
        setEffectImageUrl([resultImageUrl, ...effectImageUrl]);
        addHistoryItem(resultImageUrl, [], []);
      }
    } catch (err: any) {
      console.error(err);
      setError("生成 Logo 效果图失败，请稍后再试");
    } finally {
      setIsOptimizingLogo(false);
    }
  };

  const prevStyleCategoriesRef = useRef<string[]>([]);
  
  useEffect(() => {
    const currentCategories = designData.competitor?.styleCategories || [];
    const prevCategories = prevStyleCategoriesRef.current;
    
    // Check if categories have changed
    const hasChanged = currentCategories.length !== prevCategories.length || 
                       !currentCategories.every((val: string, index: number) => val === prevCategories[index]);
                       
    if (hasChanged && currentCategories.length > 0) {
      prevStyleCategoriesRef.current = currentCategories;
      // Only auto-update if we have a definition result
      if (definitionResult) {
        handleOptimizePrompt();
      }
    }
  }, [designData.competitor?.styleCategories, definitionResult]);

  const handleOptimizePrompt = async () => {
    setIsOptimizingPrompt(true);
    setError(null);
    try {
      const hasCustomRequirements = !!designRequirements;
      const hasMaterialOrColor = globalAttributes.material.length > 0 || globalAttributes.color.length > 0 || selectedMaterialNames || selectedColors.length > 0;

      const systemInstruction = `Role: 你是一个资深高级箱包产品设计师与工程打样专家。当用户给你一段 PRD 描述（包含规格、功能、草图或材质）时，请按照以下规则将其转化为极度具象、细节丰满的 AI 绘图描述词。不要使用任何虚无缥缈的情绪化或抽象词汇，必须直接描述可见的物理结构、面料组合、部件布局和工艺细节。

      【具象化物理细节协议 (Concrete Structural Protocol)】
      你的输出必须严格遵守以下四个维度的具象化描述：

      A. 整体廓形与主空间结构 (Silhouette & Main Anatomy)
      指令重点：直接描述包袋的具体形状（如水滴形饱满、流线型、圆润边缘等）、主开口的闭合方式（如大U型防水拉链、翻盖、卷边插扣等），以及承托包体的拼接切面。切忌设计成死板的正方形或呆板的立体方块。
      示例：“这款背包呈现出流畅的水滴形廓形，边缘圆润过度，顶部为卷边式(Roll-top)折叠开口并由金属快拆插扣固定。正面由三块具有几何切角的独立裁片拼接而成，赋予了包体有机流线型的三维立体感。”

      B. 功能分区与外部收纳布局 (Compartments & Pouches)
      指令重点：精确指出口袋所在位置、开合形式、物理层次关系。比如上下分割、隐藏侧袋、隐藏前拉链袋等。绝对禁止在水杯袋/侧袋使用廉价的“包边弹力网布(elastic mesh pocket)”或“网兜”，侧袋必须使用与主身同面料的隐藏式、风琴褶式或拉链扩容式结构。
      示例：“包身前幅设有一个贯穿式的防水拉链前袋，表面附有隐藏式风雨挡片。左右两侧各自配置了一个使用主面料制成的隐形式拉链扩容水杯袋，闭合时与包身融为一体，保持了外观的极简干净。底部设计了带透气孔的独立舱室。”

      C. 面料肌理与工艺表现 (Material Texture & Construction)
      指令重点：描述面料的视觉纹理（哑光、十字纹理、涂层光泽）、不同面料的拼接碰撞，以及接缝或包边工艺。
      示例：“主面料使用了粗犷且耐磨赖造的哑光弹道尼龙(Ballistic Nylon)，展现出清晰的十字编织肌理。底布额外拼接了带有微弱油脂光泽的TPU防水涂层材质。各边角均采用了加宽的织带进行包边处理，受力缝合处可见精密的双针补强。”

      D. 辅料系统与五金细节 (Hardware & Trim System)
      指令重点：详尽刻画拉链头、扣件、织带（Webbing）、捆扎带等附件的设计风格及其物理位置。
      示例：“所有外露拉链均采用细齿防水压胶工艺，并配有便于抓握的U型伞绳拉链头。正面外挂系统由四排高密度尼龙织带(MOLLE)平行排列构成。肩带呈现出贴合人体躯干的流线型微弧宽体构造，内侧覆盖厚实的蜂窝透气网眼布。”

      【词汇使用禁令 (CRITICAL PROHIBITIONS)】
      - 绝对禁止使用空泛抽象词汇：呼吸感、张力、生动、神秘、充满力量感、虚实变化等。
      - 绝对禁止硬壳/机甲类词汇：armor, hard-shell, plastic plate, cyber, exoskeleton, molded box (必须确保依然是柔软且缝制的织物产品)。
      - 绝对禁止方形/四方体感的设计：禁止使用 square, boxy, strictly rectangular, briefcase shape 等词汇，严禁设计成方方正正的公文包或书呆子电脑包外观。
      - 绝对禁止廉价网布水杯袋：严禁出现网兜或包边弹力网布。必须禁用 mesh pocket, elastic mesh pocket, net pocket, elastic edge binding 等词汇。

      【输出格式】
      请严格以以下格式输出（不要输出多余的解释）：
      【英文提示词】
      (直接输出用于 Midjourney 的英文 Prompt。使用逗号分隔，按照 A->B->C->D 具象化维度进行描述。必须充满具体部件名词和材质词，强调真实的商业产品摄影。)
      
      【中文翻译】
      (将英文提示词翻译成具象、详尽的中文设计陈述。使用专业的产品设计语汇，如“前幅”、“侧幅”、“拉链门襟”、“插扣织带”、“哑光尼龙”等。不要写抒情散文，直接说明产品长什么样。
      注意：如果输入层包含参考图数量信息（如“参考图数量: X张”），请在末尾补充一段根据具象结构的参考声明。例如：“借鉴了图1的卷边开口设计（占比40%），采用图2中展示的侧面水壶袋结构和底部防磨拼料（占比40%），并在五金扣具上提取了图3的机能元素（占比20%）”。)
      
      【核心标签】
      (3-5个具体的设计名词标签，如：卷边开口, 隐形拉链袋, MOLLE织带, 哑光尼龙, 插扣锁定)
      `;

      // Construct a core prompt without appearance constraints
      const materialPrompt = selectedMaterialNames || (globalAttributes.material.length > 0 ? globalAttributes.material.map((m: any) => m.name).join(', ') : "未指定材质");
      const colorPrompt = benchmarkColorString || (globalAttributes.color.length > 0 ? globalAttributes.color.map((c: any) => {
        if (!c.name || c.name === '自定义颜色' || c.name === '提取颜色') return `hex color ${c.hex}`;
        return `${c.name} (hex color ${c.hex})`;
      }).join(', ') : (selectedColors.length > 0 ? selectedColors.join(', ') : "未指定颜色"));
      
      const selectedCategoriesForPrompt = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
      const selectedStyleNamesForPrompt = selectedCategoriesForPrompt.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
      const styleForPrompt = selectedStyleNamesForPrompt.length > 0 ? selectedStyleNamesForPrompt.join(', ') : (definitionResult?.designConcept || []).join(', ');
      
      const coreProductPrompt = definitionResult ? `产品名称: ${definitionResult?.specifications?.name || ''}. 设计风格 (Vibe): ${styleForPrompt}. 核心功能 (Core_Function): ${definitionResult?.specifications?.functions || ''}. 目标用户: ${definitionResult?.userScenario?.targetMarket || ''}. 使用场景: ${definitionResult?.userScenario?.scenario || ''}.` : '';
      
      const userRequirementsPrompt = hasCustomRequirements ? `自定义需求: ${designRequirements}` : '';
      const colorBlockingText = globalAttributes.color.length >= 2 ? ' (采用拼色设计/Color Blocking Design)' : '';
      const assetsPrompt = hasMaterialOrColor ? `材质 (Material_Block): ${materialPrompt}. 颜色: ${colorPrompt}${colorBlockingText}.` : '';
      
      const appearanceImagesCount = Array.isArray(designData.appearance?.imageUrl) ? designData.appearance.imageUrl.length : 0;
      const competitorImagesCount = Array.isArray(designData.appearance?.competitorImageUrl) ? designData.appearance.competitorImageUrl.length : 0;
      const totalReferenceImagesCount = appearanceImagesCount + competitorImagesCount;
      const referenceImagesPrompt = totalReferenceImagesCount > 0 ? `参考图数量: ${totalReferenceImagesCount}张` : '';

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [{ text: `输入层 (PRD 文本):\n设计定义基础词: ${foundationPrompt}\n产品规格说明书: ${coreProductPrompt}\n${userRequirementsPrompt}\n${assetsPrompt}\n${referenceImagesPrompt}\n\n请提取 Core_Function 和 Vibe，结合 Material_Block 和 Fixed_Block，映射到对应的结构创新公式，并生成最终的巨型 Prompt。\n\n[随机种子: ${Math.random()}] 这是一个全新的生成请求。请彻底打破上一次的思维定势，使用完全不同的形容词、结构描述和画面构图来重写提示词。确保本次输出与之前有显著的视觉差异！` }],
        },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
        },
      });

      if (response.text) {
        const text = response.text;
        // More robust regex to handle potential formatting variations
        const englishMatch = text.match(/【英文提示词】\s*([\s\S]*?)(?=\s*【中文翻译】|$)/);
        const chineseMatch = text.match(/【中文翻译】\s*([\s\S]*?)(?=\s*【核心标签】|$)/);
        const tagsMatch = text.match(/【核心标签】\s*([\s\S]*?)$/);
        
        let english = englishMatch ? englishMatch[1].trim() : text;
        let chinese = chineseMatch ? chineseMatch[1].trim() : '';
        let tagsStr = tagsMatch ? tagsMatch[1].trim() : '';

        // Fallback: if chinese is empty but the header exists, try splitting
        if (!chinese && text.includes('【中文翻译】')) {
          const parts = text.split('【中文翻译】');
          if (parts.length > 1) {
            chinese = parts[1].split('【核心标签】')[0].trim();
          }
        }

        // Final fallback: if no headers found at all, assume the whole text is the prompt
        if (!englishMatch && !chineseMatch) {
          chinese = text;
          english = text;
        }

        let tags: string[] = [];
        if (tagsStr) {
          tags = tagsStr.split(/[,，、|]/).map(t => t.trim()).filter(t => t.length > 0);
        } else if (chinese) {
          // Fallback: extract some keywords from chinese if tags are missing
          tags = chinese.split(/[,，。]/).map(t => t.trim()).filter(t => t.length > 2 && t.length < 10).slice(0, 3);
        }

        english = filterHardcoreWords(english);
        chinese = filterHardcoreWordsChinese(chinese);

        setCustomPrompt(english);
        setCustomPromptChinese(chinese);
        setEvolutionTags(tags);
        updateDesignData('appearance', { 
          customPrompt: english, 
          customPromptChinese: chinese,
          evolutionTags: tags
        });
        setShowPromptOptimized(true);
        setTimeout(() => setShowPromptOptimized(false), 3000);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "AI_BUSY_429") {
        // Handled by hook
      } else {
        setError("优化提示词失败，请稍后再试");
      }
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  useEffect(() => {
    if (activeEditMode === '画笔') {
      setActiveTool('brush');
    } else {
      setActiveTool('box');
    }
  }, [activeEditMode]);

  const handleInpainting = async () => {
    if (!effectImageUrl[0]) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 1. Check if user has drawn anything
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasStrokes = imageData.data.some(channel => channel !== 0);
    
    if (!hasStrokes) {
      setError("请先在左侧图片上涂抹需要重绘的区域");
      return;
    }
    
    setIsGenerating(true);
    setGeneratingAction('inpaint');
    setError(null);

    try {
      let finalInstruction = instruction;
      console.log("Starting inpainting...");
    console.log("Instruction:", finalInstruction);
    console.log("Image URL:", effectImageUrl[0]);
    console.log("partsData:", partsData);

    // 2. Expand mask using partsData
    const img = new Image();
    if (!effectImageUrl[0].startsWith('data:') && !effectImageUrl[0].startsWith('blob:')) {
      img.crossOrigin = "anonymous";
    }
    img.src = effectImageUrl[0];
    await new Promise((resolve, reject) => { 
      img.onload = resolve; 
      img.onerror = reject;
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    // Get original image as base64
    const originalCanvas = document.createElement('canvas');
    originalCanvas.width = imgWidth;
    originalCanvas.height = imgHeight;
    const originalCtx = originalCanvas.getContext('2d');
    if (originalCtx) {
      originalCtx.drawImage(img, 0, 0);
    }
    const originalBase64 = originalCanvas.toDataURL('image/jpeg').split(',')[1];

    // Calculate object-contain dimensions
    const containerWidth = canvas.width;
    const containerHeight = canvas.height;
    const imgRatio = imgWidth / imgHeight;
    const containerRatio = containerWidth / containerHeight;

    let renderWidth, renderHeight, renderX, renderY;
    if (imgRatio > containerRatio) {
      renderWidth = containerWidth;
      renderHeight = containerWidth / imgRatio;
      renderX = 0;
      renderY = (containerHeight - renderHeight) / 2;
    } else {
      renderHeight = containerHeight;
      renderWidth = containerHeight * imgRatio;
      renderY = 0;
      renderX = (containerWidth - renderWidth) / 2;
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = imgWidth;
    maskCanvas.height = imgHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
      setIsGenerating(false);
      return;
    }
    
    // Draw original mask (strokes), mapping the rendered area to the full mask canvas
    maskCtx.drawImage(
      canvas,
      renderX, renderY, renderWidth, renderHeight,
      0, 0, imgWidth, imgHeight
    );
    
    // Check for intersection with partsData
    const imageData = maskCtx.getImageData(0, 0, imgWidth, imgHeight);
    const data = imageData.data;
    let hasMask = false;
    for (let i = 0; i < data.length; i += 4) {
      // Check if any pixel is not fully transparent (A > 0)
      if (data[i + 3] > 0) {
        hasMask = true;
        break;
      }
    }

    const intersectedPartNames: string[] = [];

    if (hasMask) {
      // Find intersected parts to provide context to the AI
      Object.entries(partsData).forEach(([category, { subParts }]) => {
        Object.entries(subParts).forEach(([subPartName, part]) => {
          const startX = Math.max(0, Math.floor((part.x / 100) * imgWidth));
          const startY = Math.max(0, Math.floor((part.y / 100) * imgHeight));
          const endX = Math.min(imgWidth, Math.floor(((part.x + part.width) / 100) * imgWidth));
          const endY = Math.min(imgHeight, Math.floor(((part.y + part.height) / 100) * imgHeight));
          
          let partHasMask = false;
          // Check all pixels within the bounding box
          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const pixelIndex = (y * imgWidth + x) * 4; // Check Alpha channel
              if (data[pixelIndex + 3] > 0) {
                partHasMask = true;
                break;
              }
            }
            if (partHasMask) break;
          }

          if (partHasMask) {
            intersectedPartNames.push(subPartName);
          }
        });
      });
    } else {
      setError("请先涂抹要重绘的区域");
      setIsGenerating(false);
      return;
    }

    // 1. Rewrite instruction with context
    finalInstruction = instruction;
    try {
      const contextStr = intersectedPartNames.length > 0 
        ? " The area being modified corresponds to these parts: " + intersectedPartNames.join(', ') + "."
        : "";
      
      const rewriteResponse = await generateContentWithRetry({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [{ text: "You are a professional product retoucher. The user wants to modify a specific area of a backpack. \n" +
            "User instruction: \"" + instruction + "\".\n" +
            contextStr + "\n" +
            "Rewrite the instruction to be highly descriptive and professional for an AI inpainting model. \n" +
            "Focus on material texture, lighting, and seamless integration. \n" +
            "If the user wants a color change, specify the target color and ensure the texture of the " + (intersectedPartNames[0] || 'fabric') + " is preserved or enhanced.\n" +
            "CRITICAL: If the user instruction contains a specific hex color code (e.g., #bfb4a2), you MUST include the semantic color name (like 'olive' or 'navy') and 'Strictly use exact hex color [CODE]' in your rewritten instruction.\n" +
            "Keep it concise." }],
        },
      });
      if (rewriteResponse.text) {
        finalInstruction = rewriteResponse.text.trim();
      }
    } catch (err) {
      console.error("Instruction rewrite failed, using original:", err);
    }
    
    // Create composite image with transparent area based on the actual mask
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = imgWidth;
    compositeCanvas.height = imgHeight;
    const compositeCtx = compositeCanvas.getContext('2d');
    if (!compositeCtx) throw new Error("Composite context error");
    
    compositeCtx.drawImage(img, 0, 0);
    
    // Use the actual mask to clear the area
    compositeCtx.globalCompositeOperation = 'destination-out';
    // Draw mask multiple times with slight offsets to "dilate" it slightly for better blending
    const dilation = 2; 
    for(let dx = -dilation; dx <= dilation; dx++) {
      for(let dy = -dilation; dy <= dilation; dy++) {
        compositeCtx.drawImage(maskCanvas, dx, dy);
      }
    }
    compositeCtx.globalCompositeOperation = 'source-over';
    
    const compositeBase64 = compositeCanvas.toDataURL('image/png').split(',')[1];
    
    // Gemini inpainting
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
      
      const parts: any[] = [
        {
          inlineData: {
            data: compositeBase64,
            mimeType: 'image/png',
          },
        },
        { text: `[INPAINTING TASK]
          Instruction: "${finalInstruction}"
          
          Your task is to fill in the transparent area in the image. 
          Apply the changes requested in the instruction (e.g., change its color, material, or replace it).
          
          [COLOR ACCURACY DIRECTIVE]
          - If a hex color code is provided in the instruction, you MUST strictly match that exact hex color code.
          - Ensure the base color of the modified area matches the hex code exactly.
          - DO NOT apply heavy shadows, dark lighting, or color grading that alters the perceived color. The color must look exactly like the hex code under neutral, bright studio lighting.
          
          IMPORTANT: Keep the rest of the backpack exactly the same.
          Ensure seamless edge blending, consistent lighting/shadows with the original image, and structural consistency.
          
          NEGATIVE PROMPTS:
          ${NEGATIVE_ANATOMY_PROMPT}meaningless diagonal lines, random diagonal cuts, chaotic structural lines, unnecessary slanted seams, people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers, unzipped, open compartments, exposing interior, changing bag shape, altering backpack silhouette, distorted geometry, reinventing structure, changing background, changing lighting${selectedColor && selectedColor.toLowerCase() !== '#ffffff' && selectedColor.toLowerCase() !== 'white' ? ', white backpack, all-white product' : ''}.
          
          ${MANDATORY_ANATOMY_PROMPT}
          ${HIGH_QUALITY_RENDERING}
          ${BAGCRAFT_MASTER_PROTOCOL}
          ${MINIMALIST_SIMPLIFICATION_CONSTRAINTS}
          CONSTRAINTS: ${EXTERIOR_ANALYSIS_CONSTRAINTS}` },
      ];

      if (instructionImage) {
        // gemini-2.5-flash-image does not support multiple images for inpainting.
        // We will just append the text instruction.
        parts[1].text += `\n\n[CRITICAL REFERENCE DIRECTIVE]: The user has provided a reference image (not attached due to API limits). Please strictly follow the text instruction to replicate the requested features.`;
      }

      const response = await generateContentWithRetry({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });
      
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const newImageUrl = "data:" + part.inlineData.mimeType + ";base64," + part.inlineData.data;
          
          // Composite the generated image with the original image to ensure unmasked parts are EXACTLY the same
          const generatedImg = new Image();
          generatedImg.crossOrigin = "anonymous";
          generatedImg.src = newImageUrl;
          await new Promise((resolve, reject) => {
            generatedImg.onload = resolve;
            generatedImg.onerror = reject;
          });

          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = imgWidth;
          finalCanvas.height = imgHeight;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (finalCtx) {
            // 1. Draw original image
            finalCtx.drawImage(img, 0, 0);
            
            // 2. Create a soft mask from the user's strokes
            const softMaskCanvas = document.createElement('canvas');
            softMaskCanvas.width = imgWidth;
            softMaskCanvas.height = imgHeight;
            const softMaskCtx = softMaskCanvas.getContext('2d');
            
            if (softMaskCtx) {
              // Draw the mask with a slight blur to soften edges
              softMaskCtx.filter = 'blur(10px)';
              // Draw mask multiple times to ensure it's fully opaque in the center
              for(let i=0; i<5; i++) {
                softMaskCtx.drawImage(maskCanvas, 0, 0);
              }
              
              // 3. Draw generated image onto soft mask canvas using source-in
              softMaskCtx.filter = 'none';
              softMaskCtx.globalCompositeOperation = 'source-in';
              softMaskCtx.drawImage(generatedImg, 0, 0);
              
              // 4. Draw the masked generated image over the original image
              finalCtx.drawImage(softMaskCanvas, 0, 0);
            }
            
            const finalImageUrl = finalCanvas.toDataURL('image/jpeg');
            
            const selectedCategoriesForGen = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
            const selectedStyleNamesForGen = selectedCategoriesForGen.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
            addHistoryItem(finalImageUrl, selectedStyleNamesForGen, getCurrentColors());
            setEffectImageUrl([finalImageUrl]);
            updateDesignData('appearance', { effectImageUrl: [finalImageUrl] });
          }
          
          // Clear canvas
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            undoHistoryRef.current = [];
            setCanUndo(false);
          }
          
          break;
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("局部重绘失败: " + (err.message || '未知错误'));
    } finally {
      setIsGenerating(false);
      setGeneratingAction('none');
    }
  };

  const handleSmartIntentInpainting = async () => {
    if (!effectImageUrl[0]) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if user has drawn anything
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasStrokes = imageData.data.some(channel => channel !== 0);
    
    if (!hasStrokes) {
      setError("请先在左侧图片上画线示意修改位置");
      return;
    }
    
    setIsGenerating(true);
    setGeneratingAction('smartInpaint');
    setError(null);

    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }

      // 1. Rewrite instruction
      let finalInstruction = instruction;
      try {
        const rewriteResponse = await generateContentWithRetry({
          model: 'gemini-3.1-pro-preview',
          contents: {
            parts: [{ text: `Rewrite this inpainting instruction for a professional product retoucher: "${instruction}". If it involves changing a part's size or shape (like making a pocket taller), enhance it with descriptive details. \nCRITICAL: If the user instruction contains a specific hex color code (e.g., #bfb4a2), you MUST include the semantic color name (like 'olive' or 'navy') and 'Strictly use exact hex color [CODE]' in your rewritten instruction.\nKeep it concise.` }],
          },
        });
        if (rewriteResponse.text) {
          finalInstruction = rewriteResponse.text.trim();
        }
      } catch (err) {
        console.error("Instruction rewrite failed, using original:", err);
      }

      console.log("Starting Smart Intent Inpainting...");
      console.log("Instruction:", finalInstruction);

      // 2. Get original image
      const imgElement = document.getElementById('appearance-main-image') as HTMLImageElement;
      if (!imgElement) throw new Error("Image not found");

      // 3. Create composite image with red mask to show intent
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgElement.naturalWidth;
      tempCanvas.height = imgElement.naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error("Canvas context error");

      tempCtx.drawImage(imgElement, 0, 0);
      const originalBase64 = tempCanvas.toDataURL('image/jpeg').split(',')[1];

      const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
      const containerRatio = canvas.width / canvas.height;
      let renderWidth = canvas.width;
      let renderHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > containerRatio) {
        renderHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - renderHeight) / 2;
      } else {
        renderWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - renderWidth) / 2;
      }

      const maskCanvasForIntent = document.createElement('canvas');
      maskCanvasForIntent.width = canvas.width;
      maskCanvasForIntent.height = canvas.height;
      const maskCtxForIntent = maskCanvasForIntent.getContext('2d');
      if (maskCtxForIntent) {
        maskCtxForIntent.drawImage(canvas, 0, 0);
        maskCtxForIntent.globalCompositeOperation = 'source-in';
        maskCtxForIntent.fillStyle = 'red';
        maskCtxForIntent.fillRect(0, 0, canvas.width, canvas.height);
      }

      tempCtx.drawImage(
        maskCanvasForIntent,
        0, 0, canvas.width, canvas.height,
        -offsetX * (imgElement.naturalWidth / renderWidth), 
        -offsetY * (imgElement.naturalHeight / renderHeight), 
        canvas.width * (imgElement.naturalWidth / renderWidth), 
        canvas.height * (imgElement.naturalHeight / renderHeight)
      );

      const compositeBase64 = tempCanvas.toDataURL('image/jpeg').split(',')[1];

      // 4. Ask Gemini 3.1 Pro to find the bounding box
      const intentResponse = await generateContentWithRetry({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: compositeBase64,
                  mimeType: 'image/jpeg'
                }
              },
              {
                text: `The user wants to edit this product image. Their instruction is: "${instruction}". They have drawn a red scribble to indicate the area of change (e.g., drawing a line to show how tall a pocket should be).
                
                Context: The product has the following parts identified: ${JSON.stringify(partsData)}.
                
                Identify the bounding box that covers BOTH the original component being modified (refer to partsData if applicable) AND the new area indicated by the red scribble. 
                Return ONLY a valid JSON array of 4 numbers: [ymin, xmin, ymax, xmax]. The numbers must be normalized coordinates between 0.0 and 1.0. Example: [0.1, 0.2, 0.5, 0.6]. Do not output any markdown, just the JSON array.`
              }
            ]
          }
        ],
        config: {
          temperature: 0.1,
        }
      });

      const text = intentResponse.text?.trim() || '';
      
      const match = text.match(/\[\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\]/);
      if (!match) {
        throw new Error('AI未能识别出修改区域，请尝试把线画得更清晰，或修改指令。');
      }
      
      let box: number[];
      try {
        box = JSON.parse(match[0]);
      } catch (e) {
        throw new Error('解析AI返回的区域坐标失败');
      }

      if (!Array.isArray(box) || box.length !== 4) {
        throw new Error('AI返回的区域坐标格式不正确');
      }

      const [ymin, xmin, ymax, xmax] = box;
      console.log("Smart Intent Bounding Box:", box);

      // 5. Create composite image with transparent rectangle
      const finalCompositeCanvas = document.createElement('canvas');
      finalCompositeCanvas.width = imgElement.naturalWidth;
      finalCompositeCanvas.height = imgElement.naturalHeight;
      const finalCompositeCtx = finalCompositeCanvas.getContext('2d');
      if (!finalCompositeCtx) throw new Error("Composite context error");

      finalCompositeCtx.drawImage(imgElement, 0, 0);
      finalCompositeCtx.clearRect(
        xmin * finalCompositeCanvas.width,
        ymin * finalCompositeCanvas.height,
        (xmax - xmin) * finalCompositeCanvas.width,
        (ymax - ymin) * finalCompositeCanvas.height
      );

      const finalCompositeBase64 = finalCompositeCanvas.toDataURL('image/png').split(',')[1];

      // 6. Call Inpainting API
      const parts: any[] = [
        {
          inlineData: {
            data: finalCompositeBase64,
            mimeType: 'image/png',
          },
        },
        { text: `[INPAINTING TASK]
          Instruction: "${finalInstruction}"
          
          Your task is to fill in the transparent area in the image. 
          Apply the changes requested in the instruction (e.g., change its color, material, or replace it).
          
          [COLOR ACCURACY DIRECTIVE]
          - If a hex color code is provided in the instruction, you MUST strictly match that exact hex color code.
          - Ensure the base color of the modified area matches the hex code exactly.
          - DO NOT apply heavy shadows, dark lighting, or color grading that alters the perceived color. The color must look exactly like the hex code under neutral, bright studio lighting.
          
          IMPORTANT: Keep the rest of the backpack exactly the same.
          Ensure seamless edge blending, consistent lighting/shadows with the original image, and structural consistency.
          
          ${MANDATORY_ANATOMY_PROMPT}
          
          NEGATIVE PROMPTS:
          ${NEGATIVE_ANATOMY_PROMPT}meaningless diagonal lines, random diagonal cuts, chaotic structural lines, unnecessary slanted seams, people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers, unzipped, open compartments, exposing interior, changing bag shape, altering backpack silhouette, distorted geometry, reinventing structure, changing background, changing lighting${selectedColor && selectedColor.toLowerCase() !== '#ffffff' && selectedColor.toLowerCase() !== 'white' ? ', white backpack, all-white product' : ''}.
          
          ${HIGH_QUALITY_RENDERING}
          ${BAGCRAFT_MASTER_PROTOCOL}
          ${MINIMALIST_SIMPLIFICATION_CONSTRAINTS}
          CONSTRAINTS: ${EXTERIOR_ANALYSIS_CONSTRAINTS}` },
      ];

      if (instructionImage) {
        // gemini-2.5-flash-image does not support multiple images for inpainting.
        parts[1].text += `\n\n[CRITICAL REFERENCE DIRECTIVE]: The user has provided a reference image (not attached due to API limits). Please strictly follow the text instruction to replicate the requested features.`;
      }

      const inpaintResponse = await generateContentWithRetry({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });
      
      for (const part of inpaintResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          
          // Composite the generated image with the original image to ensure unmasked parts are EXACTLY the same
          const generatedImg = new Image();
          generatedImg.crossOrigin = "anonymous";
          generatedImg.src = newImageUrl;
          await new Promise((resolve, reject) => {
            generatedImg.onload = resolve;
            generatedImg.onerror = reject;
          });

          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = imgElement.naturalWidth;
          finalCanvas.height = imgElement.naturalHeight;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (finalCtx) {
            // 1. Draw original image
            finalCtx.drawImage(imgElement, 0, 0);
            
            // 2. Create a soft mask for the bounding box
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = imgElement.naturalWidth;
            maskCanvas.height = imgElement.naturalHeight;
            const maskCtx = maskCanvas.getContext('2d');
            
            if (maskCtx) {
              // Fill with transparent black
              maskCtx.fillStyle = 'rgba(0,0,0,0)';
              maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
              
              // Draw white rectangle with blur
              maskCtx.filter = 'blur(15px)';
              maskCtx.fillStyle = 'white';
              
              const px = xmin * maskCanvas.width;
              const py = ymin * maskCanvas.height;
              const pw = (xmax - xmin) * maskCanvas.width;
              const ph = (ymax - ymin) * maskCanvas.height;
              
              // Use slightly larger box for the mask to include Gemini's blended edges
              maskCtx.fillRect(px - 10, py - 10, pw + 20, ph + 20);
              
              // 3. Draw generated image onto mask canvas using source-in
              maskCtx.filter = 'none';
              maskCtx.globalCompositeOperation = 'source-in';
              maskCtx.drawImage(generatedImg, 0, 0);
              
              // 4. Draw the masked generated image over the original image
              finalCtx.drawImage(maskCanvas, 0, 0);
            }
            
            const finalImageUrl = finalCanvas.toDataURL('image/jpeg');
            
            const selectedCategoriesForGen = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
            const selectedStyleNamesForGen = selectedCategoriesForGen.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
            addHistoryItem(finalImageUrl, selectedStyleNamesForGen, getCurrentColors());
            setEffectImageUrl([finalImageUrl]);
            updateDesignData('appearance', { effectImageUrl: [finalImageUrl] });
          }
          
          // Clear canvas
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            undoHistoryRef.current = [];
            setCanUndo(false);
          }
          
          break;
        }
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = `智能意图重绘失败: ${err.message || '未知错误'}`;
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setGeneratingAction('none');
    }
  };

  const BOM_PARTS = ['前幅', '口袋', '水杯仓', '顶盖', '包身', '包底', '肩带', '背板', '内里'];

  const [selectedMaterials, setSelectedMaterials] = useState<{ part: string; materialId: string }[]>(designData.appearance?.selectedMaterials || []);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [selectedPartForMaterial, setSelectedPartForMaterial] = useState<string>(BOM_PARTS[0]);

  useEffect(() => {
    if (designData.appearance?.selectedMaterials) {
      setSelectedMaterials(designData.appearance.selectedMaterials);
    }
  }, [designData.appearance?.selectedMaterials]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(designData.appearance?.selectedAccessories || []);
  const [activeAccessoryId, setActiveAccessoryId] = useState<string | null>(selectedAccessories[0] || null);
  const [accessoryStyle, setAccessoryStyle] = useState<Record<string, string>>(designData.appearance?.accessoryStyle || {
    material: '默认',
    color: '默认',
    size: '默认',
    type: '默认',
    finish: '默认',
    width: '默认'
  });
  const [selectedColors, setSelectedColors] = useState<string[]>(designData.appearance?.selectedColors || []);
  const [selectedColor, setSelectedColor] = useState<string | null>(selectedColors[0] || null);
  const [scalingIntensity, setScalingIntensity] = useState(50);
  const [vAnchors, setVAnchors] = useState([{ pos: 20, locked: false }, { pos: 80, locked: false }]);

  useEffect(() => {
    if (activeAccessoryId) {
      const savedStyle = designData.appearance?.accessoryStyles?.[activeAccessoryId] || {};
      setAccessoryStyle(savedStyle);
    } else {
      setAccessoryStyle({});
    }
  }, [activeAccessoryId, designData.appearance?.accessoryStyles]);
  const [hAnchors, setHAnchors] = useState([{ pos: 20, locked: false }, { pos: 80, locked: false }]);
  const [guideLines, setGuideLines] = useState<{ type: 'horizontal' | 'vertical', pos: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedSubPart, setSelectedSubPart] = useState<string | null>(null);
  const [selectedPartsForColor, setSelectedPartsForColor] = useState<string[]>([]);

  const togglePart = (partId: string) => {
    setSelectedPartsForColor(prev =>
      prev.includes(partId)
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  useEffect(() => {
    if (selectedPartsForColor.length === 0) return;
    const partsText = selectedPartsForColor.join(', ');
    const prefix = "应用颜色到: ";
    setInstruction(prev => {
      if (prev.startsWith(prefix)) {
        return prev.replace(/^应用颜色到: [^.]*\.?/, `${prefix}${partsText}. `);
      } else {
        return `${prefix}${partsText}. ${prev}`;
      }
    });
  }, [selectedPartsForColor]);

  const [partsData, setPartsData] = useState<Record<string, { subParts: Record<string, { l: number, w: number, d: number, x: number, y: number, width: number, height: number, keywords: string[] }> }>>({
    '1. 主框架': {
      subParts: {
        '主体': { l: 450, w: 300, d: 150, x: 30, y: 20, width: 40, height: 60, keywords: ['大容量', '分隔', '安全', '防盗'] },
        '前幅': { l: 250, w: 200, d: 40, x: 35, y: 40, width: 30, height: 30, keywords: ['快取', '整理', '便捷', '分类'] }
      }
    },
    '2. 五金配件': {
      subParts: {
        '拉链': { l: 50, w: 10, d: 5, x: 40, y: 30, width: 2, height: 5, keywords: ['防水', '顺滑'] },
        '扣具': { l: 30, w: 30, d: 10, x: 50, y: 40, width: 5, height: 5, keywords: ['耐用', '快拆'] },
        '织带': { l: 200, w: 20, d: 5, x: 60, y: 40, width: 2, height: 20, keywords: ['MOLLE', '扩展'] }
      }
    },
    '3. 背负系统': {
      subParts: {
        '肩带': { l: 300, w: 60, d: 20, x: 75, y: 20, width: 10, height: 40, keywords: ['人体工学', '减压', '透气', '调节'] },
        '背板': { l: 400, w: 300, d: 20, x: 25, y: 20, width: 40, height: 60, keywords: ['支撑', '透气', '舒适'] },
        '胸带/腰带': { l: 100, w: 50, d: 10, x: 70, y: 50, width: 5, height: 10, keywords: ['稳固', '调节'] }
      }
    },
    '4. 内部结构': {
      subParts: {
        '相机仓': { l: 200, w: 200, d: 100, x: 30, y: 60, width: 20, height: 20, keywords: ['防震', '快取'] },
        '电脑仓': { l: 400, w: 250, d: 30, x: 30, y: 20, width: 35, height: 50, keywords: ['保护', '加厚'] },
        '侧包': { l: 200, w: 100, d: 100, x: 20, y: 40, width: 10, height: 30, keywords: ['伸缩', '轻量'] }
      }
    }
  });

  const handlePartChange = (category: string, subPart: string, dimension: 'l' | 'w' | 'd', value: number) => {
    setPartsData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        subParts: {
          ...prev[category].subParts,
          [subPart]: {
            ...prev[category].subParts[subPart],
            [dimension]: value
          }
        }
      }
    }));
  };

  const totalVolume = Object.values(partsData).reduce((acc, cat) => {
    return acc + Object.values(cat.subParts).reduce((subAcc, part) => {
      return subAcc + (part.l * part.w * part.d) / 1000000;
    }, 0);
  }, 0);

  const handleDrag = (e: React.MouseEvent, handle: 'tl' | 'tr' | 'bl' | 'br') => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = containerRef.current;
    if (!container || !selectedPart || !selectedSubPart) return;

    const rect = container.getBoundingClientRect();
    const part = partsData[selectedPart].subParts[selectedSubPart];
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = (part.x / 100) * rect.width;
    const startTop = (part.y / 100) * rect.height;
    const startWidth = (part.width / 100) * rect.width;
    const startHeight = (part.height / 100) * rect.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newX = part.x;
      let newY = part.y;
      let newWidth = part.width;
      let newHeight = part.height;

      if (handle === 'tl') {
        newX = ((startLeft + deltaX) / rect.width) * 100;
        newY = ((startTop + deltaY) / rect.height) * 100;
        newWidth = ((startWidth - deltaX) / rect.width) * 100;
        newHeight = ((startHeight - deltaY) / rect.height) * 100;
      } else if (handle === 'tr') {
        newY = ((startTop + deltaY) / rect.height) * 100;
        newWidth = ((startWidth + deltaX) / rect.width) * 100;
        newHeight = ((startHeight - deltaY) / rect.height) * 100;
      } else if (handle === 'bl') {
        newX = ((startLeft + deltaX) / rect.width) * 100;
        newWidth = ((startWidth - deltaX) / rect.width) * 100;
        newHeight = ((startHeight + deltaY) / rect.height) * 100;
      } else if (handle === 'br') {
        newWidth = ((startWidth + deltaX) / rect.width) * 100;
        newHeight = ((startHeight + deltaY) / rect.height) * 100;
      }

      setPartsData(prev => ({
        ...prev,
        [selectedPart]: {
          ...prev[selectedPart],
          subParts: {
            ...prev[selectedPart].subParts,
            [selectedSubPart]: {
              ...prev[selectedPart].subParts[selectedSubPart],
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight
            }
          }
        }
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Helper to get flat list of parts for overlay
  const flatParts = Object.entries(partsData).flatMap(([cat, { subParts }]) => 
    Object.entries(subParts).map(([name, data]) => ({ name, ...data }))
  );

  const handleMaterialSelect = (material: any) => {
    // Toggle logic for part-specific material
    const existingIndex = selectedMaterials.findIndex(m => m.part === selectedPartForMaterial && m.materialId === material.id);
    
    let newSelected;
    if (existingIndex >= 0) {
      // Remove if already selected for this part
      newSelected = selectedMaterials.filter((_, i) => i !== existingIndex);
    } else {
      // Add new part-material mapping
      newSelected = [...selectedMaterials, { part: selectedPartForMaterial, materialId: material.id }];
    }
    
    setSelectedMaterials(newSelected);
    updateDesignData('appearance', { selectedMaterials: newSelected });
    setSelectedMaterial(material);

    // Update global attributes (toggle logic for the global list)
    const newItem = { name: material.name, description: material.description, fromLibrary: true };
    const existingGlobalIndex = globalAttributes.material.findIndex((item: any) => item.name === newItem.name);
    const newGlobalMaterials = [...globalAttributes.material];
    
    if (existingGlobalIndex > -1) {
      // If it's the last one of this type being removed from parts, maybe we should keep it in global?
      // The user wants multi-selection in the dashboard too. 
      // Let's just toggle it in global if it's selected/deselected in the list.
      if (existingIndex >= 0) {
        newGlobalMaterials.splice(existingGlobalIndex, 1);
      }
    } else {
      if (existingIndex < 0) {
        newGlobalMaterials.push(newItem);
      }
    }

    const newAttrs = { ...globalAttributes, material: newGlobalMaterials };
    setGlobalAttributes(newAttrs);
    updateDesignData('appearance', { globalAttributes: newAttrs });
  };

  const handleAccessorySelect = (id: string) => {
    const isAlreadySelected = selectedAccessories.includes(id);
    const newSelected = isAlreadySelected 
      ? selectedAccessories.filter(item => item !== id)
      : [...selectedAccessories, id];
    
    setSelectedAccessories(newSelected);
    updateDesignData('appearance', { selectedAccessories: newSelected });

    // Update active accessory if needed
    if (!isAlreadySelected) {
      setActiveAccessoryId(id);
    } else if (activeAccessoryId === id) {
      setActiveAccessoryId(newSelected[0] || null);
    }

    // Update global attributes
    const accessory = accessories.find(a => a.id === id);
    if (accessory) {
      const newItem = { name: accessory.name, description: '默认', fromLibrary: true };
      const existingIndex = globalAttributes.hardware.findIndex((item: any) => item.name === newItem.name);
      const newHardware = [...globalAttributes.hardware];
      if (existingIndex > -1) {
        newHardware.splice(existingIndex, 1);
      } else {
        newHardware.push(newItem);
      }
      const newAttrs = { ...globalAttributes, hardware: newHardware };
      setGlobalAttributes(newAttrs);
      updateDesignData('appearance', { globalAttributes: newAttrs });
    }
  };

  const handleAccessoryStyleChange = (key: string, value: string) => {
    if (!activeAccessoryId) return;
    
    const newStyle = { ...accessoryStyle, [key]: value };
    setAccessoryStyle(newStyle);
    
    const newStyles = { 
      ...(designData.appearance?.accessoryStyles || {}), 
      [activeAccessoryId]: newStyle 
    };
    
    updateDesignData('appearance', { 
      accessoryStyle: newStyle,
      accessoryStyles: newStyles
    });
  };

  const [instruction, setInstruction] = useState('');
  const [instructionImage, setInstructionImage] = useState<string | null>(null);
  const instructionImageInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [showConstraints, setShowConstraints] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [constraints, setConstraints] = useState<{id: string, name: string, description: string}[]>(
    designData.appearance?.constraints || [
      { id: '1', name: '廓形演进 (Silhouette Evolution)', description: '严禁90°直角。通过大半径倒角、斜切切面或梯形/六边形截面打破平庸。重心稳固，呈现“向上收拢”或“结构化挺括”姿态。禁止无功能逻辑的极端异形。' },
      { id: '2', name: '解构与平衡 (Deconstruction & Balance)', description: '允许对称或非对称形态，但要平衡美观性，不能堆砌设计，箱包需要符合市场及落地考量。' },
      { id: '3', name: '硬件注入协议 (Hardware Protocol)', description: '严禁乱堆扣具。扣具的运用必须合理（如卷顶、翻盖、压缩带、三脚架固定带等），绝不能作为无意义的装饰。全包仅限1-2处核心硬件作为视觉焦点。辅助零件隐藏化或同色化。辅料必须位于受力点或交互位。' },
      { id: '4', name: '真实感约束 (Realism Guardrails)', description: '消除数字塑模感。接缝处需有面料堆叠厚度，受力位呈现自然褶皱(Tension wrinkles)。采用专业侧逆光，强调技术面料（如X-Pac）物理深度。' },
      { id: '5', name: '差异化创新引擎 (Anti-Similarity)', description: '严禁1:1还原。品牌风格(20%)、竞品风格(30%)、外观参考(50%且含15%轮廓微调)。相似度>80%时自动触发“轮廓扰动”。' }
    ]
  );

  const [benchmarkColors, setBenchmarkColors] = useState<{hex: string, name: string}[]>(
    designData.appearance?.benchmarkColors || 
    (designData.appearance?.benchmarkColor ? designData.appearance.benchmarkColor.split(',').map((c: string) => ({ hex: c.trim(), name: c.trim() })) : [])
  );
  const benchmarkColorString = benchmarkColors.map(c => c.hex).join(', ');

  const [customPrompt, setCustomPrompt] = useState(designData.appearance?.customPrompt || '');
  const [customPromptChinese, setCustomPromptChinese] = useState(designData.appearance?.customPromptChinese || '');
  const [evolutionTags, setEvolutionTags] = useState<string[]>(designData.appearance?.evolutionTags || []);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const getCategoryColors = (categoryId: string) => {
    const cat = STYLE_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return [];
    
    const dynamicRecs = getDynamicRecommendations(categoryId, designData.definition?.result) || cat.recommended_assets;
    if (!dynamicRecs || !dynamicRecs.colors) return [];

    const baseColors = [...dynamicRecs.colors];
    const overrides = designData.competitor?.colorOverrides?.[categoryId];
    if (overrides) {
      Object.entries(overrides).forEach(([idx, color]) => {
        baseColors[parseInt(idx)] = color as string;
      });
    }
    return baseColors;
  };

  const COLOR_MAP: Record<string, string> = {
    '黑': '#000000',
    '白': '#FFFFFF',
    '红': '#FF0000',
    '蓝': '#0000FF',
    '绿': '#00FF00',
    '黄': '#FFFF00',
    '紫': '#800080',
    '灰': '#808080',
    '橙': '#FFA500',
    '粉': '#FFC0CB',
    '棕': '#A52A2A',
    '青': '#00FFFF',
    '银': '#C0C0C0',
    '金': '#FFD700',
    '卡其': '#F0E68C',
    '军绿': '#4B5320',
    '藏青': '#000080',
    '米': '#F5F5DC',
    '深灰': '#A9A9A9',
    '浅灰': '#D3D3D3',
  };

  const extractColorsFromText = (text: string) => {
    if (!text) return [];
    const foundColors: {hex: string, name: string}[] = [];
    const sortedNames = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
    let remainingText = text;
    for (const name of sortedNames) {
      if (remainingText.includes(name)) {
        foundColors.push({ hex: COLOR_MAP[name], name: name + '色' });
        remainingText = remainingText.replace(new RegExp(name, 'g'), '');
      }
    }
    return foundColors;
  };

  // Auto-sync benchmarkColors with selected style library core colors or pantone colors
  useEffect(() => {
    const currentColorsSource = JSON.stringify(designData.competitor?.colorOverrides) + '|' + JSON.stringify(definitionResult?.specifications?.pantoneColors) + '|' + (designData.competitor?.styleCategories?.join(',') || '');
    
    if (designData.appearance?.lastSyncedColorsSource === currentColorsSource && designData.appearance?.benchmarkColors && designData.appearance.benchmarkColors.length > 0) {
      return; // Already synced this source
    }

    const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
    const coreColors = Array.from(new Set(selectedCategories.flatMap(id => getCategoryColors(id))));
    
    if (coreColors.length > 0) {
      const newColors = coreColors.map(c => ({ hex: c, name: getApproximateColorName(c) }));
      setBenchmarkColors(newColors);
      updateDesignData('appearance', { 
        benchmarkColors: newColors,
        lastSyncedColorsSource: currentColorsSource
      });
    } else {
      // Fallback to PRD colors if no style is selected
      const pantoneColors = definitionResult?.specifications?.pantoneColors;
      if (pantoneColors && pantoneColors.length > 0) {
        const newColors = pantoneColors.map((c: any) => ({ hex: c.hex, name: c.name || getApproximateColorName(c.hex) }));
        setBenchmarkColors(newColors);
        updateDesignData('appearance', { 
          benchmarkColors: newColors,
          lastSyncedColorsSource: currentColorsSource
        });
      }
    }
  }, [designData.competitor?.styleCategories, designData.competitor?.styleCategory, designData.competitor?.colorOverrides, definitionResult?.specifications?.pantoneColors, definitionResult?.specifications?.colors]);

  useEffect(() => {
    // Automatically update constraints if they are using the old ones
    const hasSilhouetteEvolution = constraints.some(c => c.name.includes('廓形演进'));
    const hasHardwareProtocol = constraints.some(c => c.description.includes('扣具的运用必须合理'));
    
    if (!hasSilhouetteEvolution || !hasHardwareProtocol) {
      const updatedConstraints = [
        { id: '1', name: '廓形演进 (Silhouette Evolution)', description: '严禁90°直角。通过大半径倒角、斜切切面或梯形/六边形截面打破平庸。重心稳固，呈现“向上收拢”或“结构化挺括”姿态。禁止无功能逻辑的极端异形。' },
        { id: '2', name: '解构与平衡 (Deconstruction & Balance)', description: '允许对称或非对称形态，但要平衡美观性，不能堆砌设计，箱包需要符合市场及落地考量。' },
        { id: '3', name: '硬件注入协议 (Hardware Protocol)', description: '严禁乱堆扣具。扣具的运用必须合理（如卷顶、翻盖、压缩带、三脚架固定带等），绝不能作为无意义的装饰。全包仅限1-2处核心硬件作为视觉焦点。辅助零件隐藏化或同色化。辅料必须位于受力点或交互位。' },
        { id: '4', name: '真实感约束 (Realism Guardrails)', description: '消除数字塑模感。接缝处需有面料堆叠厚度，受力位呈现自然褶皱(Tension wrinkles)。采用专业侧逆光，强调技术面料（如X-Pac）物理深度。' },
        { id: '5', name: '差异化创新引擎 (Anti-Similarity)', description: '严禁1:1还原。品牌风格(20%)、竞品风格(30%)、外观参考(50%且含15%轮廓微调)。相似度>80%时自动触发“轮廓扰动”。' }
      ];
      setConstraints(updatedConstraints);
      updateDesignData('appearance', { constraints: updatedConstraints });
    }
  }, []);

  const EXTERIOR_ANALYSIS_CONSTRAINTS = constraints.map(c => `- ${c.name}: ${c.description}`).join('\n');

  const [selectedViewerUrl, setSelectedViewerUrl] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<{url: string, type: 'appearance' | 'competitor'}[]>(
    [
      ...(Array.isArray(designData.appearance?.imageUrl) ? designData.appearance.imageUrl.map(url => ({url, type: 'appearance' as const})) : []),
      ...(Array.isArray(designData.appearance?.competitorImageUrl) ? designData.appearance.competitorImageUrl.map(url => ({url, type: 'competitor' as const})) : [])
    ]
  );

  useEffect(() => {
    setReferenceImages([
      ...(Array.isArray(designData.appearance?.imageUrl) ? designData.appearance.imageUrl.map(url => ({url, type: 'appearance' as const})) : []),
      ...(Array.isArray(designData.appearance?.competitorImageUrl) ? designData.appearance.competitorImageUrl.map(url => ({url, type: 'competitor' as const})) : [])
    ]);
  }, [designData.appearance?.imageUrl, designData.appearance?.competitorImageUrl]);

  const selectedMaterialNames = selectedMaterials.map(sm => {
    const mat = materials.find(m => m.id === sm.materialId);
    return `${sm.part}: ${mat?.name} (${mat?.description})`;
  }).join(', ');

  const foundationPrompt = useMemo(() => {
    if (!definitionResult) return "";
    const name = definitionResult?.specifications?.name || "";
    const materials = definitionResult?.specifications?.materials || "";
    const color = benchmarkColorString || "品牌色调";
    
    const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
    const selectedStyleNames = selectedCategories.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
    const style = selectedStyleNames.length > 0 ? selectedStyleNames.join(', ') : (definitionResult?.designConcept || []).join(', ');
    
    const functions = definitionResult?.specifications?.functions || "";
    const target = definitionResult?.userScenario?.targetMarket || "";
    const scenario = definitionResult?.userScenario?.scenario || "";
    
    const isColorBlocking = globalAttributes.color.length >= 2;
    return `品类: ${name}; 核心物料: ${materials}; 品牌色调: ${color}${isColorBlocking ? ' (拼色)' : ''}; 风格: ${style}; 功能: ${functions}; target: ${target}; 场景: ${scenario}`;
  }, [definitionResult, benchmarkColorString, globalAttributes.color, designData.competitor?.styleCategories, designData.competitor?.styleCategory]);

  const defaultPrompt = useMemo(() => {
    if (!definitionResult) return '';
    const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
    const selectedStyleNames = selectedCategories.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
    const style = selectedStyleNames.length > 0 ? selectedStyleNames.join(', ') : (definitionResult?.designConcept || []).join(', ');
    const isColorBlocking = globalAttributes.color.length >= 2;
    return `A professional product design concept rendering of a ${definitionResult?.specifications?.name || 'product'}. Style: ${style}. Materials: ${selectedMaterialNames || definitionResult?.specifications?.materials || ''}. Colors: ${benchmarkColorString}${isColorBlocking ? ' (Color Blocking Design)' : ''}. Features: ${definitionResult?.specifications?.functions || ''}.`;
  }, [definitionResult, selectedMaterialNames, benchmarkColorString, globalAttributes.color, designData.competitor?.styleCategories, designData.competitor?.styleCategory]);

  const displayPrompt = customPromptChinese || customPrompt || defaultPrompt;
  const fullPromptForAI = displayPrompt;
  const coreDisplayPrompt = displayPrompt.replace(/VIEWPOINT:.*|TEXTURE:.*|NO TEXT:.*|\$\{HIGH_QUALITY_RENDERING\}/g, '');

  const getPartBoundingBox = (partName: string) => {
    // Map common material parts to partsData subParts
    const partMapping: Record<string, string> = {
      '主面料': '主体',
      '侧边/底部': '侧包',
      '内衬': '主体', // Inner lining is usually inside the main body
      '拉链/织带': '拉链',
      '拉链': '拉链',
      '扣具': '扣具',
      '织带': '织带',
      'Logo': '前幅', // Assuming Logo is usually on the front panel
    };
    
    const mappedName = partMapping[partName] || partName;

    for (const category of Object.values(partsData)) {
      if (category.subParts[mappedName]) {
        return category.subParts[mappedName];
      }
    }
    // Fuzzy match if not found
    for (const category of Object.values(partsData)) {
      for (const [subName, data] of Object.entries(category.subParts)) {
        if (subName.includes(mappedName) || mappedName.includes(subName) || subName.includes(partName) || partName.includes(subName)) {
          return data;
        }
      }
    }
    return null;
  };

  const handleInpaintOptimization = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      const currentImageUrl = effectImageUrl[0];
      if (!currentImageUrl) {
        throw new Error("请先生成或上传一张效果图");
      }

      // 1. Identify Target Part and Bounding Box
      let targetPartName = '';
      if (activeEditMode === '面料') {
        targetPartName = selectedPartForMaterial;
      } else if (activeEditMode === '辅料') {
        targetPartName = accessories.find(a => a.id === activeAccessoryId)?.name || '';
      }

      const box = getPartBoundingBox(targetPartName);
      if (!box || activeEditMode === '辅料') {
        // If no box found, or if it's hardware (which is hard to bound accurately), fallback to handleAIEdit (global edit)
        console.warn(`No bounding box found for part: ${targetPartName} or it's an accessory. Falling back to global edit.`);
        return await handleAIEdit();
      }

      // 2. Convert image to base64 and create mask
      const img = new Image();
      if (!currentImageUrl.startsWith('data:') && !currentImageUrl.startsWith('blob:')) {
        img.crossOrigin = "anonymous";
      }
      img.src = currentImageUrl;
      await new Promise((resolve, reject) => { 
        img.onload = resolve; 
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context error");

      ctx.drawImage(img, 0, 0);
      
      // Create transparent area for inpainting
      // box coordinates are in percentages (0-100)
      const x = (box.x / 100) * canvas.width;
      const y = (box.y / 100) * canvas.height;
      const w = (box.width / 100) * canvas.width;
      const h = (box.height / 100) * canvas.height;
      
      // Add some padding to the box
      const padding = 0.1; // 10% padding
      const px = Math.max(0, x - w * padding);
      const py = Math.max(0, y - h * padding);
      const pw = Math.min(canvas.width - px, w * (1 + 2 * padding));
      const ph = Math.min(canvas.height - py, h * (1 + 2 * padding));

      const originalBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
      ctx.clearRect(px, py, pw, ph);
      const maskedBase64 = canvas.toDataURL('image/png').split(',')[1];

      // 3. Construct Prompt
      const currentColorName = globalAttributes.color.length > 0 
        ? globalAttributes.color.map((c: any) => c.name || getApproximateColorName(c.hex)).join(', ')
        : (benchmarkColorString || 'original color');

      let editInstruction = '';
      if (activeEditMode === '面料') {
        const mat = materials.find(m => m.id === selectedMaterials.find(sm => sm.part === selectedPartForMaterial)?.materialId);
        editInstruction = `[IN-PAINTING MODE: MATERIAL OPTIMIZATION]
        Target Part: ${targetPartName}.
        New Material: ${mat?.name} (${mat?.description}).
        Instruction: ${instruction || `Apply ${mat?.name} texture to the ${targetPartName}.`}
        
        [PRESERVATION DIRECTIVE]
        - ABSOLUTELY PRESERVE the original silhouette, shape, and color (${currentColorName}) of the backpack. 
        - DO NOT change any parts outside the transparent area.
        - Maintain all existing hardware, zippers, and straps exactly as they are.
        - Only modify the texture/material within the transparent area.`;
      } else if (activeEditMode === '辅料') {
        const accName = accessories.find(a => a.id === activeAccessoryId)?.name;
        const currentFields = activeAccessoryId ? accessoryStyles[activeAccessoryId] : [];
        const currentStyle = Object.fromEntries(
          Object.entries(accessoryStyle).filter(([key]) => currentFields.some(f => f.key === key))
        );
        const selectedBrand = currentStyle.brand;
        const brandPrompt = selectedBrand && selectedBrand !== '默认' ? accessoryBrandPrompts[selectedBrand] : '';
        const styleDetails = Object.entries(currentStyle)
          .filter(([key, value]) => key !== 'brand' && value !== '默认')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

        editInstruction = `[IN-PAINTING MODE: ACCESSORY OPTIMIZATION]
        Target Accessory: ${accName}.
        Style Details: ${styleDetails}.
        Instruction: ${instruction || `Optimize the ${accName} with ${styleDetails}.`}
        
        [PRESERVATION DIRECTIVE]
        - ABSOLUTELY PRESERVE the original color (${currentColorName}), fabric/material texture, and overall silhouette. 
        - The bag MUST remain fully closed.
        - DO NOT change any parts outside the transparent area.
        - Only modify the specific accessory within the transparent area.`;
      }

      const prompt = `
        ${editInstruction}
        
        [CRITICAL RECONSTRUCTION DIRECTIVE]
        You will receive TWO images:
        1. The base image with a transparent hole (where the edit should happen).
        2. The ORIGINAL image before the hole was created.
        
        You MUST look at the ORIGINAL image to see exactly what was in the transparent area. 
        Reconstruct the original shape, texture, and details perfectly, but apply the changes requested in the instruction (e.g., change its material or style).
        The shape and structure MUST remain exactly the same as in the ORIGINAL image unless explicitly asked to change it.
        
        [EXECUTION PRINCIPLES]
        - Seamless Integration: The new texture/part must blend perfectly with the surrounding areas.
        - Lighting Consistency: Match the lighting and shadows of the original image exactly.
        - Structural Integrity: Maintain the original backpack's form and silhouette.
        
        ${BAGCRAFT_MASTER_PROTOCOL}
        ${MINIMALIST_SIMPLIFICATION_CONSTRAINTS}
        ${HIGH_QUALITY_RENDERING}
        
        ${MANDATORY_ANATOMY_PROMPT}
        
        NEGATIVE PROMPTS:
        ${NEGATIVE_ANATOMY_PROMPT}meaningless diagonal lines, random diagonal cuts, chaotic structural lines, unnecessary slanted seams, changing bag shape, altering backpack silhouette, moving zippers, modifying strap positions, distorted geometry, reinventing structure, changing background, changing lighting, open zippers, unzipped, open compartments, exposing interior, people, humans, models, scenes, outdoor, indoor, lifestyle.
      `;

      const parts: any[] = [
        {
          inlineData: {
            data: maskedBase64,
            mimeType: 'image/png',
          },
        },
        {
          inlineData: {
            data: originalBase64,
            mimeType: 'image/jpeg',
          },
        },
        { text: prompt },
      ];

      if (instructionImage) {
        // gemini-2.5-flash-image does not support a third image (reference) for inpainting.
        // We will just append the text instruction.
        parts[2].text += `\n\n[CRITICAL REFERENCE DIRECTIVE]: The user has provided a reference image (not attached due to API limits). Please strictly follow the text instruction to replicate the requested features.`;
      }

      // 4. Call Inpainting API
      const response = await generateContentWithRetry({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          
          // Composite the generated image with the original image to ensure unmasked parts are EXACTLY the same
          const generatedImg = new Image();
          generatedImg.crossOrigin = "anonymous";
          generatedImg.src = newImageUrl;
          await new Promise((resolve, reject) => {
            generatedImg.onload = resolve;
            generatedImg.onerror = reject;
          });

          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = img.width;
          finalCanvas.height = img.height;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (finalCtx) {
            // 1. Draw original image
            finalCtx.drawImage(img, 0, 0);
            
            // 2. Create a soft mask for the bounding box
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = img.width;
            maskCanvas.height = img.height;
            const maskCtx = maskCanvas.getContext('2d');
            
            if (maskCtx) {
              // Fill with transparent black
              maskCtx.fillStyle = 'rgba(0,0,0,0)';
              maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
              
              // Draw white rectangle with blur
              maskCtx.filter = 'blur(15px)';
              maskCtx.fillStyle = 'white';
              // Use slightly larger box for the mask to include Gemini's blended edges
              maskCtx.fillRect(px - 10, py - 10, pw + 20, ph + 20);
              
              // 3. Draw generated image onto mask canvas using source-in
              maskCtx.filter = 'none';
              maskCtx.globalCompositeOperation = 'source-in';
              maskCtx.drawImage(generatedImg, 0, 0);
              
              // 4. Draw the masked generated image over the original image
              finalCtx.drawImage(maskCanvas, 0, 0);
            }
            
            const finalImageUrl = finalCanvas.toDataURL('image/jpeg');
            
            const selectedCategoriesForGen = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
            const selectedStyleNamesForGen = selectedCategoriesForGen.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
            addHistoryItem(finalImageUrl, selectedStyleNamesForGen, getCurrentColors());
            setEffectImageUrl([finalImageUrl]);
            updateDesignData('appearance', { effectImageUrl: [finalImageUrl] });
          }
          break;
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(`优化失败: ${err.message || '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIEdit = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      const currentImageUrl = effectImageUrl[0] || (referenceImages.filter(i => i.type === 'appearance').length > 0 ? referenceImages.filter(i => i.type === 'appearance')[0].url : null);
      if (!currentImageUrl) {
        throw new Error("请先生成或上传一张效果图");
      }

      // Convert image to base64 using canvas to support normal URLs
      const img = new Image();
      if (!currentImageUrl.startsWith('data:') && !currentImageUrl.startsWith('blob:')) {
        img.crossOrigin = "anonymous";
      }
      img.src = currentImageUrl;
      await new Promise((resolve, reject) => { 
        img.onload = resolve; 
        img.onerror = reject;
      });

      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      const originalCtx = originalCanvas.getContext('2d');
      if (originalCtx) {
        originalCtx.drawImage(img, 0, 0);
      }
      const originalBase64 = originalCanvas.toDataURL('image/jpeg').split(',')[1];
      const mimeType = 'image/jpeg';
      
      let editInstruction = '';
      let variationPrompt = '';
      if (activeEditMode === '颜色') {
        const colorName = globalAttributes.color.length > 0 
          ? globalAttributes.color.map((c: any) => {
              const namePart = (c.name && c.name !== '自定义颜色' && c.name !== '提取颜色') ? `${c.name} ` : `${getApproximateColorName(c.hex)} `;
              return `${namePart}(EXACT HEX: ${c.hex})`;
            }).join(', ')
          : (selectedColors.length > 0 ? selectedColors.map(c => `${getApproximateColorName(c)} (EXACT HEX: ${c})`).join(', ') : 'monochrome');
        
        const isColorBlocking = globalAttributes.color.length >= 2;
        const colorBlockingDirective = isColorBlocking 
          ? `\n        [COLOR BLOCKING DIRECTIVE]\n        - Create a striking color-blocked (拼色) design using the provided colors.\n        - Distribute the colors across different panels, pockets, and straps of the backpack.\n        - Ensure a balanced and aesthetically pleasing contrast between the colors.`
          : '';

        editInstruction = `[IN-PAINTING MODE: COLOR ONLY]
        Modify ONLY the color of this backpack to: ${colorName}. ${colorBlockingDirective}
        
        [CRITICAL COLOR ACCURACY DIRECTIVE]
        - The main body of the backpack MUST be EXACTLY the requested color(s): ${colorName}.
        - DO NOT use generic colors. You MUST match the specific shade, brightness, and saturation of the requested hex codes.
        - Use neutral, bright studio lighting to ensure the true color is visible without heavy shadows or color grading.
        
        [PRESERVATION DIRECTIVE]
        - ABSOLUTELY PRESERVE the original fabric/material texture and all accessories/hardware. 
        - Maintain consistent lighting and shadow logic, but ensure the base color is accurate.
        - DO NOT change the backpack silhouette or structure.`;
        variationPrompt = `Modify only the color values to exactly match ${colorName}. ${isColorBlocking ? 'Apply a color-blocked design.' : ''} Keep the overall bag geometry, seam lines, textures, and hardware identical to the reference. Do not add any color grading or filters that change the hue.`;
      } else if (activeEditMode === '面料') {
        const materialName = globalAttributes.material.length > 0
          ? globalAttributes.material.map((m: any) => `${m.name} (${m.description})`).join(', ')
          : selectedMaterials.map(sm => {
            const mat = materials.find(m => m.id === sm.materialId);
            return `${sm.part}: ${mat?.name} (${mat?.description})`;
          }).join(', ');
        editInstruction = `[IN-PAINTING MODE: MATERIAL ONLY]
        Modify ONLY the fabric/material texture of this backpack to: ${materialName}. 
        
        [PRESERVATION DIRECTIVE]
        - ABSOLUTELY PRESERVE the original silhouette, shape, and color. 
        - Do not change the color. 
        - Keep all accessories/hardware identical.
        - DO NOT change the backpack silhouette or structure.`;
        variationPrompt = `Modify only the texture/material. Keep the overall bag geometry, seam lines, color, and hardware identical to the reference.`;
      } else if (activeEditMode === '辅料') {
        const accName = globalAttributes.hardware.length > 0
          ? globalAttributes.hardware.map((h: any) => h.name).join(', ')
          : (selectedAccessories.length > 0 ? selectedAccessories.map(id => accessories.find(a => a.id === id)?.name).join(', ') : 'standard');
        
        const styleInfo = selectedAccessories.map(accId => {
          const accessory = accessories.find(a => a.id === accId);
          const currentFields = accessoryStyles[accId] || [];
          const savedStyleForAcc = designData.appearance?.accessoryStyles?.[accId] || (accId === activeAccessoryId ? accessoryStyle : {});
          const currentStyle = Object.fromEntries(
            Object.entries(savedStyleForAcc).filter(([key]) => currentFields.some(f => f.key === key))
          );
          const selectedBrand = currentStyle.brand;
          const brandPrompt = selectedBrand && selectedBrand !== '默认' ? accessoryBrandPrompts[selectedBrand] : '';
          const styleDetails = Object.entries(currentStyle)
            .filter(([key, value]) => key !== 'brand' && value !== '默认')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          
          return `- ${accessory?.name}: ${selectedBrand || 'Standard'}. ${brandPrompt ? `Prompt: ${brandPrompt}.` : ''} Style: ${styleDetails}`;
        }).join('\n');

        editInstruction = `[IN-PAINTING MODE: HARDWARE ONLY]
        Modify ONLY the specific coordinates of accessories/hardware (${accName}) of this backpack. 
        Apply these specific hardware styles:
        ${styleInfo}
        
        CRITICAL INSTRUCTION: If the ADDITIONAL INSTRUCTION below asks to change the color, material, or shape of the ${accName}, you MUST apply that change to the ${accName}.
        
        [PRESERVATION DIRECTIVE]
        - For the main body of the bag (outside the ${accName}), ABSOLUTELY PRESERVE the original color, fabric/material texture, and overall silhouette. 
        - KEEP ALL ZIPPERS CLOSED. DO NOT OPEN ANY COMPARTMENTS.
        - DO NOT change the backpack silhouette or structure.`;
        variationPrompt = `Modify the hardware/accessories (${accName}) according to instructions. Keep the overall bag geometry, seam lines, main body color, textures, and style identical to the reference. The bag MUST remain fully closed.`;
      } else if (activeEditMode === 'Logo') {
        editInstruction = `[IN-PAINTING MODE: LOGO ONLY]
        Modify ONLY the Logo anchor area of this backpack. Apply specific craft rendering (e.g. 3D embroidery effect).
        ABSOLUTELY PRESERVE the original color, fabric/material, and accessories/hardware of the backpack.`;
        variationPrompt = `Repaint logo anchor area only. Keep the overall bag geometry, seam lines, color, textures, and hardware identical to the reference.`;
      }

      const prompt = `
        ${editInstruction}
        ${instruction ? `ADDITIONAL INSTRUCTION: ${instruction}` : ''}
        
        [EXECUTION PRINCIPLES]
        - High-Fidelity Lock: MUST lock Seed and all Mask areas except the current module.
        - Targeted Repainting: Strictly follow the IN-PAINTING MODE instructions above.
        
        ${BAGCRAFT_MASTER_PROTOCOL}
        ${MINIMALIST_SIMPLIFICATION_CONSTRAINTS}
        
        [ANCHOR PROMPTS - UNCHANGEABLE]
        (consistent silhouette:1.5), (unaltered structure:1.4), (identical geometry:1.5), (same seam lines:1.4)
        
        [VARIATION PROMPTS - CHANGEABLE]
        ${variationPrompt}
        
        [TECHNICAL LOCKS]
        Seed: ${currentSeed}
        Denoising Strength: 0.35
        Inpainting Fill: original
        Inpaint Mask Only: True
        
        ${MANDATORY_ANATOMY_PROMPT}
        
        NEGATIVE PROMPTS:
        ${NEGATIVE_ANATOMY_PROMPT}meaningless diagonal lines, random diagonal cuts, chaotic structural lines, unnecessary slanted seams, changing bag shape, altering backpack silhouette, moving zippers, modifying strap positions, distorted geometry, reinventing structure, changing background, changing lighting, open zippers, unzipped, open compartments, exposing interior${selectedColor && selectedColor.toLowerCase() !== '#ffffff' && selectedColor.toLowerCase() !== 'white' ? ', white backpack, all-white product' : ''}${activeEditMode !== '颜色' ? ', changing bag body color, altering main fabric color, modifying original colors' : ''}.
        
        ${definitionResult ? `Product Name: ${definitionResult?.specifications?.name || ''}. Style: ${((designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : [])).map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean).join(', ')) || (definitionResult?.designConcept || []).join(', ')}.` : ''}
        
        IMPORTANT: Keep the backpack style, shape, structure, and materials exactly the same. ABSOLUTELY PRESERVE the existing backpack style, shape, structure, and design. DO NOT change the backpack's form or silhouette.
        VIEWPOINT: FORCE a front-left 3/4 perspective view. You MUST show the front panel and the LEFT side panel of the backpack.
        NO TEXT: ABSOLUTELY NO text, no labels, no annotations, no watermarks, no dimensions, no arrows on the image. ONLY the backpack itself.
        ${HIGH_QUALITY_RENDERING}
        CONSTRAINTS:
        ${EXTERIOR_ANALYSIS_CONSTRAINTS}`;

      const response = await generateContentWithRetry({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: originalBase64,
                mimeType: mimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const url = `data:${mimeType};base64,${base64EncodeString}`;
          const selectedCategoriesForGen = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
          const selectedStyleNamesForGen = selectedCategoriesForGen.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
          addHistoryItem(url, selectedStyleNamesForGen, getCurrentColors());
          setEffectImageUrl([url]);
          updateDesignData('appearance', { 
            effectImageUrl: [url],
            currentSeed: currentSeed 
          });
          break;
        }
      }
    } catch (err) {
      console.error("AI Edit failed:", err);
      setError(`优化失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEffectImage = async () => {
    console.log("handleGenerateEffectImage called");
    
    setIsGenerating(true);
    setError(null);
    const newSeed = Math.floor(Math.random() * 1000000);
    setCurrentSeed(newSeed);
    console.log("handleGenerateEffectImage: Starting generation with seed:", newSeed);
    
    try {
      console.log("handleGenerateEffectImage: Checking API key...");
      const hasKey = await window.aistudio.hasSelectedApiKey();
      console.log("handleGenerateEffectImage: hasKey =", hasKey);
      if (!hasKey) {
        console.log("handleGenerateEffectImage: Opening key selection...");
        await window.aistudio.openSelectKey();
        console.log("handleGenerateEffectImage: Key selection closed.");
      }
      console.log("handleGenerateEffectImage: Constructing prompt...");
      
      // 获取选中面料的名称和描述
      const materialName = globalAttributes.material.length > 0 
        ? globalAttributes.material.map((m: any) => m.name).join(', ')
        : (selectedMaterialNames || 'high-tech fabric');
      const colorName = globalAttributes.color.length > 0
        ? globalAttributes.color.map((c: any) => {
            const namePart = (c.name && c.name !== '自定义颜色' && c.name !== '提取颜色') ? `${c.name} ` : `${getApproximateColorName(c.hex)} `;
            return `${namePart}(EXACT HEX: ${c.hex})`;
          }).join(', ')
        : (selectedColors.length > 0 ? selectedColors.map(c => `${getApproximateColorName(c)} (EXACT HEX: ${c})`).join(', ') : 'monochrome');
      const hardwareName = globalAttributes.hardware.length > 0
        ? globalAttributes.hardware.map((h: any) => h.name).join(', ')
        : 'functional hardware';
      const logoStyle = globalAttributes.logo.length > 0
        ? globalAttributes.logo.map((l: any) => l.name).join(', ')
        : 'minimalist branding';

      const structuredDescription = `[PRIMARY FOCUS - 60% VISUAL WEIGHT]: ${materialName} material. The ENTIRE main body MUST be EXACTLY this color: ${colorName}. [SECONDARY FOCUS - 40% VISUAL WEIGHT]: equipped with ${hardwareName}, featuring ${logoStyle}.
      
      [CRITICAL COLOR ACCURACY DIRECTIVE]
      - The main body of the backpack MUST be EXACTLY the requested color(s): ${colorName}.
      - DO NOT use generic colors. You MUST match the specific shade, brightness, and saturation of the requested hex codes.
      - Use neutral, bright studio lighting to ensure the true color is visible without heavy shadows or color grading.`;

      // 获取选中辅料的信息
      const accessoryInfo = selectedAccessories.length > 0 ? `
        ACCESSORY MODIFICATION:
        ${selectedAccessories.map(accId => {
          const accessory = accessories.find(a => a.id === accId);
          const currentFields = accessoryStyles[accId] || [];
          const currentStyle = Object.fromEntries(
            Object.entries(accessoryStyle).filter(([key]) => currentFields.some(f => f.key === key))
          );
          const selectedBrand = currentStyle.brand;
          const brandPrompt = selectedBrand && selectedBrand !== '默认' ? accessoryBrandPrompts[selectedBrand] : '';
          const styleDetails = Object.entries(currentStyle)
            .filter(([key, value]) => key !== 'brand' && value !== '默认')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          
          return `- Type: ${accessory?.name}
          - Brand/Model: ${selectedBrand || 'Standard'}
          - Expert Prompt: ${brandPrompt}
          - Style Details: ${styleDetails}`;
        }).join('\n')}
        ${GLOBAL_RENDERING_PROTOCOL}
      ` : '';

      // Collect all images
      const allImages = referenceImages.map(img => img.url);
      const brandImages = useBrandStyleLibrary ? (designData.definition?.brandImages || []) : [];
      
      // Get competitor images from the selected categories ONLY IF no specific images were checked
      const competitorImagesRecord = designData.competitor?.competitorImages || {};
      const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
      let definitionCompetitorImages: string[] = [];
      
      // If user selected specific reference images, use ONLY those.
      // Otherwise, fallback to all images in the selected categories.
      if (designData.appearance?.competitorImageUrl && designData.appearance.competitorImageUrl.length > 0) {
        definitionCompetitorImages = [...designData.appearance.competitorImageUrl];
      } else {
        if (selectedCategories.length > 0) {
          selectedCategories.forEach(cat => {
            if (competitorImagesRecord[cat]) {
              definitionCompetitorImages = [...definitionCompetitorImages, ...competitorImagesRecord[cat]];
            }
          });
        } else {
          // Fallback to all images if no category selected or category has no images
          definitionCompetitorImages = Object.values(competitorImagesRecord).flat();
        }
      }
      
      // Also include legacy definition competitor images if they exist
      if (designData.definition?.competitorImages) {
        definitionCompetitorImages = [...definitionCompetitorImages, ...designData.definition.competitorImages];
      }
      
      // Remove duplicates between allImages and definitionCompetitorImages
      const uniqueAllImages = allImages.filter(url => !definitionCompetitorImages.includes(url));
      
      const currentEffectImage = effectImageUrl[0];

      const parts: any[] = [];
      
      const addImageToParts = async (url: string, targetArray: any[]) => {
        if (!url || url.length === 0) return;
        const img = new Image();
        if (!url.startsWith('data:') && !url.startsWith('blob:')) {
          img.crossOrigin = "anonymous";
        }
        img.src = url;
        await new Promise((resolve, reject) => { 
          img.onload = resolve; 
          img.onerror = reject;
        });

        const MAX_DIMENSION = 512;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const originalCanvas = document.createElement('canvas');
        originalCanvas.width = width;
        originalCanvas.height = height;
        const originalCtx = originalCanvas.getContext('2d');
        if (originalCtx) {
          originalCtx.fillStyle = '#FFFFFF';
          originalCtx.fillRect(0, 0, width, height);
          originalCtx.drawImage(img, 0, 0, width, height);
        }
        const base64Data = originalCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        const mimeType = 'image/jpeg';
        
        targetArray.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      };

      const imageTags = designData.appearance?.imageTags || {};
      const getTags = (url: string) => imageTags[url] || [];
      const allPossibleImages = [...brandImages, ...definitionCompetitorImages, ...uniqueAllImages];
      const silhouetteImages = allPossibleImages.filter(url => getTags(url).includes('silhouette'));
      const materialImages = allPossibleImages.filter(url => getTags(url).includes('material'));
      const structureImages = allPossibleImages.filter(url => getTags(url).includes('structure'));
      const untaggedImages = allPossibleImages.filter(url => getTags(url).length === 0);
      const hasAnyTags = Object.values(imageTags).some(tags => tags.length > 0);

      // Only add ONE image to parts for gemini-2.5-flash-image to avoid 500 limit errors.
      if (currentEffectImage) {
        // If we are iterating, the current effect image MUST be the context
        parts.push({ text: "Current Generation Target to improve upon:" });
        await addImageToParts(currentEffectImage, parts);
      } else {
        // Find the best single reference to use if generating from scratch.
        // If the user mapped specific silhouette images, forcefully use the first one as structural core!
        const bestSingleRef = silhouetteImages.length > 0 ? silhouetteImages[0] : (brandImages[0] || definitionCompetitorImages[0] || uniqueAllImages[0]);
        if (bestSingleRef) {
          parts.push({ text: `Primary Reference Image. STRICTLY preserve the ${silhouetteImages.length > 0 ? 'SILHOUETTE and BASE SHAPE' : 'visual design'} of this image:` });
          await addImageToParts(bestSingleRef, parts);
        }
      }

      // Step 1: Semantic Anchoring (if there are reference images)
      let semanticFeatures = "";
      const totalRefImages = allPossibleImages.length;
      
      if (totalRefImages > 0) {
        setLoadingText('正在提取参考图语义特征...');
        const visionParts: any[] = [];
        
        if (hasAnyTags) {
          visionParts.push({ text: `Analyze these backpack reference images. The user has specifically categorized them for FEATURE DECOUPLING.` });
          
          if (silhouetteImages.length > 0) {
            visionParts.push({ text: `\n--- SILHOUETTE EXTRACT --- \nAnalyze the shape of the following images. IGNORE their materials and minor details. Focus ONLY on their 3D silhouette, volume, and major paneling proportions:` });
            for (const url of silhouetteImages) await addImageToParts(url, visionParts);
          }
          
          if (materialImages.length > 0) {
            visionParts.push({ text: `\n--- MATERIAL EXTRACT --- \nAnalyze the textiles and materials in the following images. IGNORE the shape of the bags. Extract ONLY the fabric types, glossiness, textures, and surface treatments:` });
            for (const url of materialImages) await addImageToParts(url, visionParts);
          }
          
          if (structureImages.length > 0) {
            visionParts.push({ text: `\n--- STRUCTURE/HARDWARE EXTRACT --- \nAnalyze the structural details in the following images. Focus ONLY on their zipper placements, straps, buckles, mesh pockets, and specific hardware design:` });
            for (const url of structureImages) await addImageToParts(url, visionParts);
          }
          
          if (untaggedImages.length > 0) {
            visionParts.push({ text: `\n--- GENERAL REFERENCES --- \nExtract general design language from the following overall references:` });
            for (const url of untaggedImages) await addImageToParts(url, visionParts);
          }
          
          visionParts.push({ text: `\nSYNTHESIS TASK: Provide a highly structured and concise English summary merging all these decoupled features. Under [MASTER SILHOUETTE], describe the shape findings. Under [MASTER MATERIAL], describe the texture findings. Under [MASTER STRUCTURE], describe the hardware/layout findings.` });
        } else {
          visionParts.push({ text: "Analyze these backpack reference images. Extract the overall shape, silhouette, key materials (e.g., 420D Ripstop, matte nylon), hardware styles (e.g., magnetic buckles, laser-cut panels), and structural paneling logic. Provide a concise summary of these visual features in English, paying special attention to the shape and silhouette." });
          
          if (brandImages.length > 0) {
            for (const url of brandImages) await addImageToParts(url, visionParts);
          }
          if (definitionCompetitorImages.length > 0) {
            for (const url of definitionCompetitorImages) await addImageToParts(url, visionParts);
          }
          if (uniqueAllImages.length > 0) {
            for (const url of uniqueAllImages) await addImageToParts(url, visionParts);
          }
        }
        
        try {
          const visionResponse = await generateContentWithRetry({
            model: 'gemini-3.1-pro-preview',
            contents: { parts: visionParts }
          });
          semanticFeatures = visionResponse.candidates[0].content.parts[0].text;
          console.log("Semantic Features Extracted:", semanticFeatures);
        } catch (e) {
          console.error("Failed to extract semantic features:", e);
        }
      }

      // Get prompt
      const selectedCategoriesForGen = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
      const selectedStyleNamesForGen = selectedCategoriesForGen.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
      const styleForGen = selectedStyleNamesForGen.length > 0 ? selectedStyleNamesForGen.join(', ') : (definitionResult?.designConcept || []).join(', ');

      const selectedStylePresets = selectedCategoriesForGen.map(id => {
        const cat = STYLE_CATEGORIES.find(c => c.id === id);
        if (!cat) return null;
        
        let extraLogic = "";
        if (id === 'urban-outdoor') {
          extraLogic = `
          [URBAN OUTDOOR SPECIFIC LOGIC]
          1. Suspension: Connect front panel via hidden bridges. Create 3mm gap between panel and body. Hide zippers in gap shadow.
          2. Volume: Push fabric outward using internal 3D bracing to form ridges. Forbid flat surfaces.
          3. Negative Space: Overlap 3D panels to form openings with 2mm folded edges. Forbid surface pockets.`;
        }

        return `
          - Style Category: ${cat.name}
          - Silhouette & Features: ${cat.description}
          - Preset Colors: ${getCategoryColors(id).join(', ') || 'N/A'}
          - Preset Fabrics: ${cat.recommended_assets?.fabrics?.join(', ') || 'N/A'}
          ${extraLogic}
        `;
      }).filter(Boolean).join('\n');

      const stylePresetsContext = selectedStylePresets ? `
          [STYLE PRESETS DIRECTIVE]
          CRITICAL: You MUST incorporate the following preset colors, fabrics, and overall silhouette/shape into the design based on the selected style library:
          ${selectedStylePresets}
      ` : "";

      let basePrompt = "";
      
      // If no image exists at all
      if (allImages.length === 0 && brandImages.length === 0 && definitionCompetitorImages.length === 0) {
        if (!definitionResult) {
          throw new Error("Design definition not found. Please complete the Design Definition module first.");
        }
        const fullCorePrompt = coreDisplayPrompt;
        basePrompt = `
          ${HIGH_QUALITY_RENDERING}
          
          ${fullCorePrompt}
          ${stylePresetsContext}
          ${EXTERIOR_ANALYSIS_CONSTRAINTS}
          
          NEGATIVE PROMPTS:
          ${NEGATIVE_ANATOMY_PROMPT}
        `;
      } else {
        const designContext = definitionResult ? `
          DESIGN DEFINITION:
          - Product: ${definitionResult?.specifications?.name || ''}
          - Size/Capacity: ${definitionResult?.specifications?.size || ''}
          - Materials: ${definitionResult?.specifications?.materials || ''}
          - Key Functions: ${definitionResult?.specifications?.functions || ''}
          - Design Concept: ${styleForGen}
          - Logo Branding: ${logoStyle}
        ` : "";

        const fusionContext = fusionAnalysis && selectedCategoriesForGen.length === 2 ? `
          [CRITICAL STYLE FUSION DIRECTIVE]
          The user has selected two distinct styles to merge. You MUST use the following AI-generated fusion analysis as the core creative driver for this design.
          FUSION ANALYSIS:
          ${fusionAnalysis}
          
          Your design MUST visually embody this fusion concept, balancing the materials, colors, and structural elements suggested in the analysis. This should result in a highly innovative, divergent, and unique product that clearly reflects BOTH styles harmoniously.
        ` : "";

        const categoryMasterPromptsContext = selectedCategoriesForGen
          .map(id => designData.competitor?.categoryPrompts?.[id])
          .filter(Boolean)
          .join('\n\n---\n\n');

        const styleMasterPromptContext = categoryMasterPromptsContext ? `
          [CMF STYLE MASTER PROMPT DIRECTIVE]
          The user has extracted the following master prompts from their CMF style library. 
          Use this to precisely drive the design's specific details, materials, rendering vibe, and styling features:
          ${categoryMasterPromptsContext}
        ` : "";
        
        const blendingRatioContext = `
          [FUSION AND BLENDING WEIGHTS DIRECTIVE]
          CRITICAL: You MUST blend the [APPEARANCE INNOVATION DIRECTIVE] (custom prompt) and the [CMF STYLE MASTER PROMPT DIRECTIVE] based on the following strict ratios:
          - 外观创新进化词 (Appearance Innovation Evolution): 60% weight (Focus mainly on the structural boundaries, overall innovative form, and primary feature cuts).
          - CMF风格基调提示词 (CMF Style Master Prompt): 40% weight (Use this to strictly control the surface materials, hardware vibes, textures, color grading, and micro-details).
        `;

        const prototypeContext = designData.appearance?.selectedPrototype ? `
          [PROTOTYPE GEOMETRY DIRECTIVE]
          The user has selected a specific geometric prototype for the bag's core silhouette: ${PROTOTYPES.find(p => p.id === designData.appearance?.selectedPrototype)?.label || 'Roll-Top'}
          Core Geometry Logic: ${PROTOTYPES.find(p => p.id === designData.appearance?.selectedPrototype)?.desc || ''}
          ${definitionCompetitorImages.length > 0 ? 'NOTE: Blend this prototype geometry with the shape of the explicitly selected reference images.' : 'CRITICAL: You MUST strictly adhere to this geometric prototype. The overall shape, silhouette, and structural lines MUST reflect this specific geometry.'}
        ` : "";

        let referenceDirective = "";
        if (totalRefImages > 0) {
          if (definitionCompetitorImages.length > 0) {
            referenceDirective = `
          [SEMANTIC ANCHORING DIRECTIVE - EXPLICIT REFERENCE]
          - The user has explicitly selected reference images from the CMF style library. You MUST closely follow the overall aesthetic language, paneling logic, and shape of these references.
          - CRITICAL SHAPE COMPLIANCE: The primary volume and silhouette MUST closely follow the selected reference images. DO NOT deviate from the core shape of the reference images, BUT ensure you adhere to the anti-square constraints.
          - CRITICAL COLOR OVERRIDE: You MUST completely IGNORE the colors in the reference images. You MUST use the colors specified in the [COLOR ACCURACY DIRECTIVE] below.
          - ASSET DECONSTRUCTION LOGIC: Perform feature extraction based on the following semantic analysis:
          ${semanticFeatures}
          
          [High_Fidelity_Enforcement]:
          - Texture Detail: You MUST present the micro-textures identified in the semantic analysis (e.g., Ripstop, matte finish).
          - Panel Logic: Precisely replicate the core paneling logic and structural features identified from the reference images. Ensure the bag looks like it belongs to the same product family as the references.
          - Depth Perception: Force Ambient Occlusion. Ensure realistic shadows at hardware attachments and seams.
          - CRITICAL: Do NOT generate meaningless, random, or chaotic diagonal structural lines. All structural lines and seams MUST be logical and purposeful.`;
          } else {
            referenceDirective = `
          [SEMANTIC ANCHORING DIRECTIVE]
          - ASSET DECONSTRUCTION LOGIC: You MUST incorporate features from these reference images while adhering to the user's specific geometric rules and constraints:
          ${semanticFeatures}
          
          - CRITICAL COLOR OVERRIDE: You MUST completely IGNORE the colors in the reference images. You MUST use the colors specified in the [COLOR ACCURACY DIRECTIVE] below.
          
          [High_Fidelity_Enforcement]:
          - Texture Detail: You MUST present the micro-textures identified in the semantic analysis (e.g., Ripstop, matte finish).
          - Panel Logic: Translate the core paneling logic and structural features identified to fit the curves of the [PROTOTYPE GEOMETRY].
          - Depth Perception: Force Ambient Occlusion. Ensure realistic shadows at hardware attachments and seams.
          
          - TOPOLOGY CORRECTION: Maintain the [PROTOTYPE GEOMETRY] (${PROTOTYPES.find(p => p.id === designData.appearance?.selectedPrototype)?.label || 'Roll-Top'}) as the absolute primary volume and silhouette.
          - RESULT: Prototype Shape + Extracted Structure/Lines + Extracted Materials/Hardware.
          - CRITICAL: Do NOT generate meaningless, random, or chaotic diagonal structural lines. All structural lines and seams MUST be logical and purposeful.`;
          }
        } else {
           referenceDirective = `
          [NO REFERENCE DIRECTIVE]
          Generate a highly innovative and premium backpack design that breaks traditional conventions through refined structure and aesthetics. Ensure all structural lines are logical and purposeful, avoiding meaningless diagonal cuts.`;
        }

        basePrompt = `
          ${HIGH_QUALITY_RENDERING}
          
          [MULTI-MODULE COMPOSITE GENERATION]
          You are performing a Multi-Module Composite Generation. 
          Logical Alignment: Recalculate the mapping based on all selected changes below.
          Global Coordination: Ensure visual transitions between different sections are seamless (e.g. new color reflects naturally on the selected material texture).
          
          ${designContext}
          ${stylePresetsContext}
          ${styleMasterPromptContext}
          ${blendingRatioContext}
          ${fusionContext}
          ${prototypeContext}
          ${accessoryInfo || `
        ACCESSORY MODIFICATION:
        - Type: Randomized functional hardware and accessories.
        - Style: High-tech, futuristic, and integrated.
        ${GLOBAL_RENDERING_PROTOCOL}
      `}
          ${ANTI_SIMILARITY_ENGINE}
          ${BAGCRAFT_MASTER_PROTOCOL}
          ${MINIMALIST_SIMPLIFICATION_CONSTRAINTS}
          ${AVANT_GARDE_DESIGN_DNA}
          
          [STRUCTURED DESCRIPTION]
          ${structuredDescription}
          
          [APPEARANCE INNOVATION DIRECTIVE (HIGHEST PRIORITY)]
          ${customPrompt ? `The user has generated the following appearance innovation prompt. You MUST heavily incorporate these visual details into the final design. CRITICAL: Translate these structural concepts into REALISTIC FABRIC AND TEXTILE execution. Do NOT render them as hard plastic or metal armor:\n${filterHardcoreWords(customPrompt)}` : ''}
          
          CRITICAL FUNCTIONAL REQUIREMENT:
          If the design definition or custom prompt mentions specific functional compartments or accessories (e.g., waist belt/腰带, chest strap, shoe compartment at the bottom, side pockets), you MUST clearly represent them structurally in the design. Ensure the structure is logical and functional. For a waist belt (腰带), it MUST be clearly visible wrapping around the bottom/side of the backpack. For a bottom shoe compartment, it MUST have a distinct, structured bottom section, typically with a separate zipper access, and look structurally capable of holding shoes without collapsing.
          
          [TECHNICAL LOCKS]
          Seed: ${currentSeed}
          Denoising Strength: 0.55
          
          ${referenceDirective}
          
          ${instruction ? `ADDITIONAL INSTRUCTION: ${instruction}` : ''}

          CRITICAL INNOVATION DIRECTIVE:
          - NO MEANINGLESS LINES: ABSOLUTELY NO random, chaotic, or meaningless diagonal structural lines. Every line must follow the core geometry of the bag.
          - REFINED AESTHETICS: Focus on premium execution, whether the design is minimalist, tech-wear, or classic. Ensure it strictly respects the essence of the selected CMF references, adapting only to avoid literal square shapes.
          - UNCONVENTIONAL HARDWARE: Use high-quality, custom-looking hardware in logical locations.
          - ANTI-CLICHÉ: Avoid all standard, boring backpack design tropes. Elevate the design with sophisticated detailing.
          
          CRITICAL VIEWPOINT & COMPOSITION:
          - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.
          - PROHIBITED VIEWS: ABSOLUTELY NO pure side views, NO right-side views, NO back views, NO top-down views.
          - SINGLE OBJECT CONSTRAINT: Generate EXACTLY ONE backpack. ABSOLUTELY NO multiple backpacks, multiple views, or collages in a single image, UNLESS the user explicitly requests a back view or multi-view (e.g., six-view) rendering.
          - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF). ABSOLUTELY NO background scenes, NO indoor/outdoor environments, NO props.
          - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.
          
          CRITICAL QUALITY INSTRUCTIONS:
          - RAW, ORGANIC PHOTOGRAPHY: Emphasize the organic, tactile textures of ${selectedMaterialNames || "randomly assigned high-tech materials"}. This MUST look like a real-world, unedited photograph, NOT a digital 3D render.
          - INTRODUCE IMPERFECTIONS: Include subtle fabric fraying, minor surface dust, slightly uneven stitching, and natural fabric tension wrinkles. Avoid clinical perfection.
          - REAL-WORLD LIGHTING: Use natural, slightly uneven lighting with soft, non-perfect shadows. Avoid clinical studio perfection.
          - CAMERA STYLE: Shot on a real camera with slight film grain, natural depth of field, and realistic lens softness.
          - NO TEXT: ABSOLUTELY NO text, labels, annotations, watermarks, diagrams, infographics, arrows, or callout lines. The image MUST be a clean product photograph.
          
          STRICT STRUCTURAL CONSTRAINTS:
          - MANDATORY BACKPACK STRUCTURE: Exactly two shoulder straps attached to the back panel, one top carry handle. The bag MUST have a clear, functional, and balanced shape.
          - PROHIBITED: NO extra straps, NO dangling straps, NO front-facing straps, NO redundant or confusing strap configurations. NO deformed, melted, or physically impossible shapes.
          - STATE RESTRICTION: The backpack MUST be fully closed and zipped up. ABSOLUTELY NO open compartments, NO exposed interiors, NO unzipped sections.
          - SILHOUETTE RESTRICTION: The backpack MUST feature streamlined, rounded, and smooth curves where appropriate, maintaining a realistic and usable volume.
          - FABRIC BOTTOM CONSTRAINT (CRITICAL): The bottom of the bag MUST be made of sewn fabric (like ballistic nylon, canvas, or reinforced textile) with visible seams and stitching. ABSOLUTELY NO smooth, molded plastic, rubber, or EVA hard-shell bases. It must look like a soft bag, not a hard case.
          
          ${MANDATORY_ANATOMY_PROMPT}
          
          NEGATIVE PROMPTS:
          ${NEGATIVE_ANATOMY_PROMPT}meaningless diagonal lines, random diagonal cuts, chaotic structural lines, unnecessary slanted seams, standard backpack silhouette, generic backpack shape, common school bag, boring design, traditional backpack form, people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers, unzipped, open compartments, exposing interior, distorted geometry, changing background, changing lighting${selectedColors.some(c => c.toLowerCase() !== '#ffffff' && c.toLowerCase() !== 'white') ? ', white backpack, all-white product' : ''}.
          
          CONSTRAINTS:
          ${EXTERIOR_ANALYSIS_CONSTRAINTS}`;
      }

      const generateImageWithRetryLogic = async (isRetry = false) => {
        let finalPrompt = basePrompt;
        if (isRetry) {
          finalPrompt += `
          
          [RETRY_ENFORCEMENT]
          - SHAPE_COMPLIANCE_FIX: The previous generation drifted too far from the reference images. You MUST closely replicate the paneling, styling, and core proportions of the provided CMF reference images (while still avoiding strict hard squares).
          - ERROR_FIX: The previous generation's material was too smooth or lacked detail. You MUST increase texture contrast by 2.0x. Ensure micro-textures (like ripstop or matte grain) are clearly visible.
          - LIGHTING_FIX: Add strong Rim Lighting from the side to force the 3D silhouette and highlight material depth.
          - HARDWARE_FIX: Hardware MUST present a realistic metal or hard plastic texture. NO blurry or deformed buckles.`;
        }
        
        const finalParts = [...parts, { text: finalPrompt }];
        
        const response = await generateContentWithRetry({
          model: 'gemini-2.5-flash-image',
          contents: { parts: finalParts },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });
        
        let generatedBase64 = "";
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedBase64 = part.inlineData.data;
            break;
          }
        }
        return generatedBase64;
      };

      setLoadingText('正在生成初始方案...');
      let generatedBase64 = await generateImageWithRetryLogic(false);

      // Step 2: Self-Correction Loop
      if (totalRefImages > 0 && generatedBase64) {
        setLoadingText('正在执行视觉质量校验...');
        const judgeParts: any[] = [
          { text: "Compare the generated backpack image (Image 1) with the reference images (Image 2+). Does the generated image successfully incorporate the overall shape, silhouette, key textures (like ripstop/diamond grid), and hardware details (like laser cuts or specific buckles) from the references? Answer strictly with 'YES' or 'NO'." },
          { inlineData: { mimeType: 'image/jpeg', data: generatedBase64 } }
        ];
        
        if (brandImages.length > 0) {
          for (const url of brandImages) {
            await addImageToParts(url, judgeParts);
          }
        }
        if (definitionCompetitorImages.length > 0) {
          for (const url of definitionCompetitorImages) {
            await addImageToParts(url, judgeParts);
          }
        }
        if (uniqueAllImages.length > 0) {
          for (const url of uniqueAllImages) {
            await addImageToParts(url, judgeParts);
          }
        }
        
        try {
          const judgeResponse = await generateContentWithRetry({
            model: 'gemini-3.1-pro-preview',
            contents: { parts: judgeParts }
          });
          
          const judgeResult = judgeResponse.candidates[0].content.parts[0].text.trim().toUpperCase();
          console.log("Self-Correction Judge Result:", judgeResult);
          
          if (judgeResult.includes('NO')) {
            setLoadingText('校验未通过，触发权重重绘...');
            generatedBase64 = await generateImageWithRetryLogic(true);
          }
        } catch (e) {
          console.error("Self-Correction failed:", e);
        }
      }

      if (generatedBase64) {
        const newImageUrl = `data:image/jpeg;base64,${generatedBase64}`;
        addHistoryItem(newImageUrl, selectedStyleNamesForGen, getCurrentColors());
        updateDesignData('appearance', { 
          effectImageUrl: [newImageUrl],
          currentSeed: newSeed 
        });
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      setError(`效果图生成失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDivergeStyles = async () => {
    if (!effectImageUrl[0]) {
      setError("请先生成或选择一张效果图作为发散基础");
      return;
    }
    
    setIsDiverging(true);
    setDivergeProgress(0);
    setError(null);
    
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      
      const currentEffectImage = effectImageUrl[0];
      const numVariations = 5;
      const newImages: string[] = [];
      
      const selectedCategoriesForGen = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
      const selectedStyleNamesForGen = selectedCategoriesForGen.map(id => STYLE_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean);
      const styleForGen = selectedStyleNamesForGen.length > 0 ? selectedStyleNamesForGen.join(', ') : (definitionResult?.designConcept || []).join(', ');

      const selectedStylePresets = selectedCategoriesForGen.map(id => {
        const cat = STYLE_CATEGORIES.find(c => c.id === id);
        if (!cat) return null;
        
        let extraLogic = "";
        if (id === 'urban-outdoor') {
          extraLogic = `
          [URBAN OUTDOOR SPECIFIC LOGIC]
          1. Suspension: Connect front panel via hidden bridges. Create 3mm gap between panel and body. Hide zippers in gap shadow.
          2. Volume: Push fabric outward using internal 3D bracing to form ridges. Forbid flat surfaces.
          3. Negative Space: Overlap 3D panels to form openings with 2mm folded edges. Forbid surface pockets.`;
        }

        return `
          - Style Category: ${cat.name}
          - Silhouette & Features: ${cat.description}
          - Preset Colors: ${getCategoryColors(id).join(', ') || 'N/A'}
          - Preset Fabrics: ${cat.recommended_assets?.fabrics?.join(', ') || 'N/A'}
          ${extraLogic}
        `;
      }).filter(Boolean).join('\n');

      const stylePresetsContext = selectedStylePresets ? `
          [STYLE PRESETS DIRECTIVE]
          CRITICAL: You MUST incorporate the following preset colors, fabrics, and overall silhouette/shape into the design based on the selected style library:
          ${selectedStylePresets}
      ` : "";

      const designContext = definitionResult ? `
        DESIGN DEFINITION:
        - Product: ${definitionResult?.specifications?.name || ''}
        - Size/Capacity: ${definitionResult?.specifications?.size || ''}
        - Materials: ${definitionResult?.specifications?.materials || ''}
        - Key Functions: ${definitionResult?.specifications?.functions || ''}
        - Design Concept: ${styleForGen}
      ` : "";

      const img = new Image();
      if (!currentEffectImage.startsWith('data:') && !currentEffectImage.startsWith('blob:')) {
        img.crossOrigin = "anonymous";
      }
      img.src = currentEffectImage;
      await new Promise((resolve, reject) => { 
        img.onload = resolve; 
        img.onerror = reject;
      });

      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      const originalCtx = originalCanvas.getContext('2d');
      if (originalCtx) {
        originalCtx.drawImage(img, 0, 0);
      }
      const base64Data = originalCanvas.toDataURL('image/jpeg').split(',')[1];
      const mimeType = 'image/jpeg';

      const prototypeContext = designData.appearance?.selectedPrototype ? `
        [PROTOTYPE GEOMETRY DIRECTIVE]
        The user has selected a specific geometric prototype for the bag's core silhouette: ${PROTOTYPES.find(p => p.id === designData.appearance?.selectedPrototype)?.label || 'Roll-Top'}
        Core Geometry Logic: ${PROTOTYPES.find(p => p.id === designData.appearance?.selectedPrototype)?.desc || ''}
        CRITICAL: You MUST strictly adhere to this geometric prototype. The overall shape, silhouette, and structural lines MUST reflect this specific geometry.
      ` : "";

      let currentHistory = [...(designData.appearance?.imageHistory || [])];

      for (let i = 0; i < numVariations; i++) {
        setDivergeProgress(Math.round((i / numVariations) * 100));
        
        const seed = Math.floor(Math.random() * 1000000);
        
        const prompt = `
          ${HIGH_QUALITY_RENDERING}
          
          [STYLE DIVERGENCE MODE - VARIATION ${i + 1}]
          You are an expert industrial designer. The user wants to explore design variations based on the provided base image.
          
          [核心逻辑配置 (Backend Logic)]
          - Realism_Weight: 2.0 (强制极度真实的物理质感)
          - Structural_Mutation_Weight: 0.8 (进行合理的裁片调整，而非夸张变形)
          - Photography_Style: Commercial Studio (商业影棚柔光拍摄)
          
          [真实感结构演变 (Realistic Structural Evolution)]
          1. 缝制工艺 (Sewing & Construction): 必须表现出真实的工业缝纫工艺。使用“接缝(Seams)”、“包边(Binding)”、“打枣(Bartacks)”和“拼接(Panels)”等真实箱包制作工艺。严禁出现3D打印一体成型或科幻机甲般的硬壳结构。
          2. 材质表现 (Material Realism): 强化真实面料的物理特性。尼龙、帆布或皮革必须有自然的垂坠感(Drape)、微小的褶皱(Wrinkles)和缝线处的真实张力(Tension)。拒绝光滑、僵硬的塑料感。
          3. 辅料合理性 (Hardware Logic): 拉链、插扣、织带必须是现实中可采购的标准配件，并放置在符合人体工学和受力逻辑的位置。
          4. 适度创新 (Moderate Innovation): 在保持真实感的前提下，探索不同的口袋布局、裁片分割线或织带排列方式。所有的设计变体必须看起来像是一个可以投入量产的真实商品。
          5. 禁令 (Strict Prohibitions): 严禁生成任何文本、Logo 或品牌符号。严禁生成漂浮的部件、反物理的结构或过度复杂的“赛博朋克/机能风”硬核装甲。
          
          ${designContext}
          ${stylePresetsContext}
          ${prototypeContext}
          
          CRITICAL INSTRUCTION:
          - Use the provided image as a structural and thematic foundation.
          - Generate a NEW, DIVERGENT design variation that shares the same core DNA but explores different shapes, paneling, pocket placements, or strap configurations.
          - Maintain the same overall product category and general vibe, but push the boundaries of the design.
          - DO NOT just change the color. Change the physical design details.
          - Make this variation distinct from others.
          - CRITICAL: Do NOT generate meaningless, random, or chaotic diagonal structural lines. All structural lines and seams MUST be logical and purposeful.
          
          [APPEARANCE INNOVATION DIRECTIVE (HIGHEST PRIORITY)]
          ${customPrompt ? `The user has generated the following appearance innovation prompt. You MUST heavily incorporate these visual details into the final design. CRITICAL: Translate these structural concepts into REALISTIC FABRIC AND TEXTILE execution. Do NOT render them as hard plastic or metal armor:\n${filterHardcoreWords(customPrompt)}` : ''}
          
          CRITICAL FUNCTIONAL REQUIREMENT:
          If the design definition or custom prompt mentions specific functional compartments or accessories (e.g., waist belt/腰带, chest strap, shoe compartment at the bottom, side pockets), you MUST clearly represent them structurally in the design. Ensure the structure is logical and functional. For a waist belt (腰带), it MUST be clearly visible wrapping around the bottom/side of the backpack. For a bottom shoe compartment, it MUST have a distinct, structured bottom section, typically with a separate zipper access, and look structurally capable of holding shoes without collapsing.
          
          CRITICAL VIEWPOINT & COMPOSITION:
          - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE.
          - SINGLE OBJECT CONSTRAINT: Generate EXACTLY ONE backpack.
          - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).
          - NO PEOPLE, NO PROPS.
          - STATE RESTRICTION: The backpack MUST be fully closed and zipped up. ABSOLUTELY NO open compartments, NO exposed interiors, NO unzipped sections.
          - SILHOUETTE RESTRICTION: The backpack MUST feature streamlined, rounded, and smooth curves where appropriate, maintaining a realistic and usable volume.
          - MANDATORY BACKPACK STRUCTURE: Exactly two shoulder straps attached to the back panel, one top carry handle. The bag MUST have a clear, functional, and balanced shape. NO deformed, melted, or physically impossible shapes.
          - FABRIC BOTTOM CONSTRAINT (CRITICAL): The bottom of the bag MUST be made of sewn fabric (like ballistic nylon, canvas, or reinforced textile) with visible seams and stitching. ABSOLUTELY NO smooth, molded plastic, rubber, or EVA hard-shell bases. It must look like a soft bag, not a hard case.
          
          ${MANDATORY_ANATOMY_PROMPT}
          
          NEGATIVE PROMPTS:
          ${NEGATIVE_ANATOMY_PROMPT}meaningless diagonal lines, random diagonal cuts, chaotic structural lines, unnecessary slanted seams, standard backpack silhouette, generic backpack shape, common school bag, boring design, traditional backpack form, people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers, unzipped, open compartments, exposing interior, distorted geometry, changing background, changing lighting, text, logo, brand symbol.
          
          [TECHNICAL LOCKS]
          Seed: ${seed}
        `;

        const parts = [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ];

        try {
          const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          });

          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              newImages.push(newImageUrl);
              
              addHistoryItem(newImageUrl, selectedStyleNamesForGen, getCurrentColors());
              setEffectImageUrl([newImageUrl]);
              break;
            }
          }
        } catch (err) {
          console.error(`Failed to generate variation ${i + 1}:`, err);
        }
      }
      
      setDivergeProgress(100);
      
      if (newImages.length === 0) {
        throw new Error("未能成功生成任何款式");
      }
      
    } catch (err) {
      console.error("Divergence failed:", err);
      setError(`发散款式失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDiverging(false);
      setTimeout(() => setDivergeProgress(0), 1000);
    }
  };

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const canvasRefCallback = useCallback((el: HTMLCanvasElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    if (el) {
      const { clientWidth, clientHeight } = el;
      if (clientWidth > 0 && clientHeight > 0 && (el.width !== clientWidth || el.height !== clientHeight)) {
        el.width = clientWidth;
        el.height = clientHeight;
      }

      resizeObserverRef.current = new ResizeObserver(entries => {
        for (let entry of entries) {
          const rect = entry.target.getBoundingClientRect();
          const newWidth = Math.round(rect.width);
          const newHeight = Math.round(rect.height);
          if (newWidth > 0 && newHeight > 0) {
            if (el.width !== newWidth || el.height !== newHeight) {
              const ctx = el.getContext('2d');
              let imageData;
              if (el.width > 0 && el.height > 0) {
                imageData = ctx?.getImageData(0, 0, el.width, el.height);
              }
              el.width = newWidth;
              el.height = newHeight;
              if (imageData && ctx) {
                ctx.putImageData(imageData, 0, 0);
              }
            }
          }
        }
      });
      // Observe the canvas element itself
      resizeObserverRef.current.observe(el);
    }
    canvasRef.current = el;
  }, []);

  const handleBrushUp = () => {
    // No specific action needed for now, just to satisfy the event handler
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeTool === 'brush') {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setShowCursor(true);
    } else {
      setShowCursor(false);
    }
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gradient-blue-silver">3. 外观设计中心</h2>
        <p className="text-base text-slate-400 max-w-3xl leading-relaxed">探索箱包的轮廓、比例、色彩组合与材质肌理。</p>
      </header>

      {/* Design Benchmark Card */}
      <div className="bg-gradient-to-r from-slate-900/40 to-slate-900/40 border border-slate-500/30 rounded-2xl p-6 shadow-lg shadow-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Target size={120} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-indigo-300" />
            <h3 className="font-bold text-lg bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">设计基准</h3>
          </div>
          
          {definitionResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">产品名称</p>
                  <p className="text-sm text-white">{definitionResult?.specifications?.name || '-'}</p>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">目标用户</p>
                  <p className="text-sm text-white">{definitionResult?.userScenario?.targetMarket || '-'}</p>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">使用场景</p>
                  <p className="text-sm text-white">{definitionResult?.userScenario?.scenario || '-'}</p>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">材质</p>
                  <p className="text-sm text-white">{definitionResult?.specifications?.materials || '-'}</p>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">色彩基准 (Color Benchmark)</p>
                    <button
                      onClick={() => {
                        setLibraryModalContext('benchmark');
                        setLibraryInitialTab('color');
                        setIsLibraryModalOpen(true);
                      }}
                      className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Palette size={10} /> 更改颜色
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {benchmarkColors.map((color, idx) => (
                      <div key={idx} className="group relative flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-white/5 hover:border-indigo-500/50 transition-colors">
                        <div 
                          className="relative shrink-0 w-8 h-8 rounded-md border border-white/20 shadow-sm overflow-hidden"
                          style={{ backgroundColor: color.hex }}
                        >
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) => {
                              const newColors = [...benchmarkColors];
                              newColors[idx].hex = e.target.value;
                              newColors[idx].name = getApproximateColorName(e.target.value);
                              setBenchmarkColors(newColors);
                              updateDesignData('appearance', { benchmarkColors: newColors });
                            }}
                            className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col flex-1 justify-center min-w-0">
                          <span className="text-sm font-mono text-white truncate">{color.hex.toUpperCase()}</span>
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) => {
                              const newColors = [...benchmarkColors];
                              newColors[idx].name = e.target.value;
                              setBenchmarkColors(newColors);
                              updateDesignData('appearance', { benchmarkColors: newColors });
                            }}
                            className="w-full text-[10px] bg-transparent border-b border-transparent hover:border-slate-500 focus:border-indigo-500 outline-none text-slate-400 truncate"
                            placeholder="Color name"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newColors = benchmarkColors.filter((_, i) => i !== idx);
                            setBenchmarkColors(newColors);
                            updateDesignData('appearance', { benchmarkColors: newColors });
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {benchmarkColors.length === 0 && (
                      <p className="text-xs text-slate-500 italic col-span-2">未设置色彩基准</p>
                    )}
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">功能</p>
                  <p className="text-sm text-white">{definitionResult?.specifications?.functions || '-'}</p>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-white/5 lg:col-span-3">
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">设计风格</p>
                  <div className="flex flex-wrap gap-2">
                    {(definitionResult?.designConcept || []).map((concept, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded-md text-xs text-slate-200">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                {/* Global Status Bar */}
                <div className="mb-2">
                  <StatusBar error={globalError} onClear={clearGlobalError} />
                </div>

                {/* Error Overlays */}
                {globalError?.type === '429' && (
                  <div className="mb-2">
                    <CountDownTimer seconds={busyCountdown} />
                  </div>
                )}
                {globalError?.type === 'CONNECTION_CLOSED' && (
                  <div className="mb-2">
                    <ReconnectGuide />
                  </div>
                )}

                {/* Container A: The Foundation */}
                <div className="glass-tile-premium rounded-xl p-4 border border-white/5 opacity-60">
                  <div 
                    className="flex items-center justify-between cursor-pointer group/header"
                    onClick={() => setIsFoundationCollapsed(!isFoundationCollapsed)}
                  >
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-slate-400" />
                      <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">设计定义基础词 (The Foundation)</span>
                    </div>
                    <ChevronDown 
                      size={14} 
                      className={`text-slate-400/50 group-hover/header:text-slate-400 transition-transform duration-300 ${isFoundationCollapsed ? '-rotate-90' : ''}`} 
                    />
                  </div>
                  {!isFoundationCollapsed && (
                    <div className="text-xs text-slate-200/60 font-mono italic leading-relaxed mt-2 animate-in slide-in-from-top-1 duration-200">
                      {foundationPrompt || "等待设计定义基准..."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-200/50 italic">等待文档分析以加载设计基准信息...</p>
          )}
        </div>
      </div>

      {/* Prototype Recommendation Section */}
      {definitionResult && (
        <div className="bg-gradient-to-r from-slate-900/40 to-slate-900/40 border border-slate-500/30 rounded-2xl p-6 shadow-lg shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Box size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-300" />
                <h3 className="font-bold text-lg bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">BagCraft AI 建议骨架</h3>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPrototypeMatrixOpen(prev => !prev);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer relative z-50"
              >
                更换原型 <ChevronDown size={14} className={`transition-transform ${isPrototypeMatrixOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* AI Recommended (Default) */}
            {!isPrototypeMatrixOpen ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const selectedId = designData.appearance?.selectedPrototype || 'roll-top';
                  const selectedProto = PROTOTYPES.find(p => p.id === selectedId) || PROTOTYPES[0];
                  const otherProto = PROTOTYPES.find(p => p.id !== selectedId) || PROTOTYPES[1];
                  const displayProtos = [selectedProto, otherProto];

                  return displayProtos.map((proto, idx) => {
                    const isSelected = proto.id === selectedId;
                    const Icon = proto.icon;
                    return (
                      <div 
                        key={proto.id}
                        onClick={() => updateDesignData('appearance', { selectedPrototype: proto.id })}
                        className={`glass-panel rounded-xl p-4 border cursor-pointer transition-all duration-300 flex items-start gap-4 ${
                          isSelected 
                            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                            : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`p-3 rounded-xl ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-400'}`}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                              {isSelected ? '当前选择' : '备选推荐'}：{proto.label}
                            </h4>
                            {isSelected && <CheckCircle2 size={16} className="text-indigo-400" />}
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{proto.desc}</p>
                          <div className="text-[10px] text-indigo-400/80 bg-indigo-500/10 px-2 py-1 rounded inline-block">
                            理由：{proto.reason || '匹配您的设计需求'}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              /* Manual Selection Matrix */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {PROTOTYPES.map((proto) => {
                  const isSelected = designData.appearance?.selectedPrototype === proto.id || (!designData.appearance?.selectedPrototype && proto.id === 'roll-top');
                  const Icon = proto.icon;
                  return (
                    <div 
                      key={proto.id}
                      onClick={() => {
                        updateDesignData('appearance', { selectedPrototype: proto.id });
                        setIsPrototypeMatrixOpen(false);
                      }}
                      className={`glass-panel rounded-xl p-4 border cursor-pointer transition-all duration-300 flex flex-col items-center text-center gap-3 group ${
                        isSelected 
                          ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                          : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className={`p-4 rounded-full transition-transform duration-300 group-hover:scale-110 ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white'}`}>
                        <Icon size={32} strokeWidth={1.5} />
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                        {proto.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reference Image Upload Section */}
      <section className="space-y-4 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-300" />
            <h3 className="text-lg font-semibold text-white" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.6)' }}>外观设计筛选器</h3>
          </div>
          <div className="flex items-center gap-3 glass-tile-premium rounded-full px-4 py-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-300">参考品牌风格库</span>
              <span className="text-[9px] text-gray-500">融入设计定义中的品牌风格图片作为辅助参考</span>
            </div>
            <button 
              onClick={() => setUseBrandStyleLibrary(!useBrandStyleLibrary)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useBrandStyleLibrary ? 'bg-indigo-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useBrandStyleLibrary ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 relative">
          {/* Subtle background accent */}
          <div className="absolute -inset-2 bg-gradient-to-br from-slate-500/5 to-slate-500/5 rounded-3xl blur-xl -z-10" />
          
          <div className="glass-panel rounded-3xl p-6 space-y-6 transition-all duration-300">
          <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
            <Box className="text-[#CEBFFF]" size={16} />
            <span className="text-[#CEBFFF]" style={{ textShadow: '0 0 8px rgba(206, 191, 255, 0.4)' }}>外观设计参考 (主风格)</span>
          </h3>
          <div className="glass-tile-premium rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">选择风格标签 (最多2个)</p>
              <span className="text-[9px] text-gray-600 font-mono">{selectedCategories.length} / 2</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">选择主打风格（最多可选2种进行融合分析），下方生图将参考您在CMF风格库中上传的对应风格图片。</p>
            
            <div className="flex flex-wrap gap-2">
              {STYLE_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-2 border ${
                      isSelected 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500 bg-black/20'
                    }`}>
                      <Check size={10} className={isSelected ? "text-white opacity-100" : "opacity-0"} />
                    </div>
                    {category.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-6 transition-all duration-300">
          <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
            <FileText className="text-[#CEBFFF]" size={16} />
            <span className="text-[#CEBFFF]" style={{ textShadow: '0 0 8px rgba(206, 191, 255, 0.4)' }}>设计需求定义</span>
          </h3>
          <div className="glass-tile-premium rounded-2xl p-5 space-y-4 h-[calc(100%-3rem)]">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">手动输入需求</p>
            <DebouncedTextarea 
              className="w-full h-32 glass-input-premium rounded-xl p-4 text-sm font-mono"
              placeholder="请输入精准的设计关键词或需求描述..."
              value={designRequirements || ''}
              onChange={(val) => {
                setDesignRequirements(val);
              }}
              onBlur={(e) => {
                updateDesignData('appearance', { designRequirements: e.target.value });
              }}
            />
          </div>
        </div>
        </div>

        {designData.appearance?.competitorImageUrl && designData.appearance.competitorImageUrl.length > 0 && (
          <div className="glass-panel rounded-3xl p-6 space-y-6 transition-all duration-300 relative z-10 w-full mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
              <ImageIcon className="text-[#CEBFFF]" size={16} />
              <span className="text-[#CEBFFF]" style={{ textShadow: '0 0 8px rgba(206, 191, 255, 0.4)' }}>解耦控制台 (已选参考图)</span>
            </h3>
            <div className="glass-tile-premium rounded-2xl p-5 space-y-4 flex flex-col w-full">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">为参考图分配权重 ({designData.appearance.competitorImageUrl.length})</p>
              <div className="flex flex-wrap gap-4 items-start justify-start w-full">
                {designData.appearance.competitorImageUrl.map((url: string, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 w-32 pb-2">
                    <div 
                      className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10 group cursor-pointer shadow-md hover:border-indigo-500/50 transition-all"
                      onDoubleClick={() => setSelectedViewerUrl(url)}
                    >
                      <img src={url} alt="Reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">双击放大</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newUrls = designData.appearance!.competitorImageUrl!.filter((u: string) => u !== url);
                          updateDesignData('appearance', { competitorImageUrl: newUrls });
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/90 text-white shadow-sm z-10"
                        title="移除参考图"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center w-full px-1">
                      {[ {id: 'silhouette', label: '廓形'}, {id: 'material', label: '面料'}, {id: 'structure', label: '结构'} ].map(tag => {
                        const imageTags = designData.appearance?.imageTags || {};
                        const currentTags = imageTags[url] || [];
                        const isSelected = currentTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              const newTags = isSelected 
                                ? currentTags.filter((t: string) => t !== tag.id) 
                                : [...currentTags, tag.id];
                              updateDesignData('appearance', { 
                                imageTags: { ...imageTags, [url]: newTags } 
                              });
                            }}
                            className={`text-[10px] px-2 py-1 rounded transition-colors border ${
                              isSelected 
                                ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.3)]' 
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Unified Attribute and Edit Console */}
      <section className="space-y-4 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-indigo-300" />
            <h3 className="text-lg font-semibold text-white" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.6)' }}>属性与编辑控制台 (Attribute & Edit Console)</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onMouseEnter={(e) => createDiamondParticles(e)}
              onClick={() => {
                const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
                const recommendedFabrics = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.fabrics || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.fabrics || []);
                const recommendedColors = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.colors || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.colors || []);
                setLibraryFilters({ fabrics: recommendedFabrics, colors: recommendedColors });
                setLibraryModalContext('global');
                setIsLibraryModalOpen(true);
              }}
              className="celestian-button px-4 py-2 text-sm"
            >
              设计资产中心 (Asset Hub)
            </button>
          </div>
        </div>
        
        {/* Parameter Display Screen (Glowing Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Material Tile */}
          <div 
            className={`glass-panel border ${activeEditMode === '面料' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/20'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all ${flashingTile === 'material' || flashingTile === 'all' ? 'flashing-tile' : ''}`}
            onClick={(e) => {
              createPanelClickParticles(e);
              setActiveEditMode('面料');
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Layers size={16} className="text-indigo-300" /> 面料 (Material)
              </h4>
            </div>
            <div className="glass-tile-premium rounded-xl p-3 min-h-[80px] flex flex-col justify-center gap-2 flex-1">
              {globalAttributes.material.length > 0 ? (
                globalAttributes.material.map((mat, idx) => (
                  <div key={idx} className="border-b border-white/5 last:border-0 pb-1 last:pb-0">
                    <p className="text-sm font-bold text-slate-300">{mat.name}</p>
                    <p className="text-[10px] text-gray-400">{mat.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center">未选择面料</p>
              )}
            </div>
          </div>

          {/* Color Tile */}
          <div 
            className={`glass-panel border ${activeEditMode === '颜色' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/20'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all ${flashingTile === 'color' || flashingTile === 'all' ? 'flashing-tile' : ''}`}
            onClick={(e) => {
              createPanelClickParticles(e);
              setActiveEditMode('颜色');
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Palette size={16} className="text-fuchsia-300" /> 色彩 (Color)
              </h4>
            </div>
            <div className="glass-tile-premium rounded-xl p-3 min-h-[80px] flex flex-wrap justify-center items-center gap-2 flex-1">
              {globalAttributes.color.length > 0 ? (
                globalAttributes.color.map((col, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: col.hex || col }} />
                    <p className="text-[8px] font-mono text-white truncate max-w-[50px]">{col.name || (typeof col === 'string' ? col : 'Color')}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center">未选择色彩</p>
              )}
            </div>
          </div>

          {/* Hardware Tile */}
          <div 
            className={`glass-panel border ${activeEditMode === '辅料' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/20'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all relative ${flashingTile === 'hardware' || flashingTile === 'all' ? 'flashing-tile' : ''}`}
            onClick={(e) => {
              createPanelClickParticles(e);
              setActiveEditMode('辅料');
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Settings2 size={16} className="text-amber-100/70" /> 辅料 (Hardware)
              </h4>
            </div>
            <div className="glass-tile-premium rounded-xl p-3 min-h-[80px] flex flex-col justify-center gap-1 relative flex-1">
              {globalAttributes.hardware.length > 0 ? (
                globalAttributes.hardware.map((hw, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/5 last:border-0 pb-1 last:pb-0">
                    <p className="text-xs font-bold text-slate-300">{hw.name || accessories.find(a => a.id === hw)?.name || hw}</p>
                    {globalAttributes.material.some(m => m.name.includes('X-Pac')) && (hw.name?.includes('YKK AquaGuard') || accessories.find(a => a.id === hw)?.name.includes('YKK AquaGuard')) && (
                      <span className="px-1 py-0.5 bg-slate-500/20 text-slate-400 text-[8px] rounded border border-slate-500/30">已适配</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center">未选择辅料</p>
              )}
            </div>
          </div>

          {/* Logo Tile */}
          <div 
            className={`glass-panel border ${activeEditMode === 'Logo' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/20'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all ${flashingTile === 'logo' || flashingTile === 'all' ? 'flashing-tile' : ''}`}
            onClick={(e) => {
              createPanelClickParticles(e);
              setActiveEditMode('Logo');
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <FileText size={16} className="text-teal-100/70" /> Logo
              </h4>
            </div>
            <div className="glass-tile-premium rounded-xl p-3 min-h-[80px] flex flex-col justify-center items-center gap-1 flex-1">
              {globalAttributes.logo.length > 0 ? (
                globalAttributes.logo.map((logo, idx) => (
                  <p key={idx} className="text-xs font-bold text-slate-300">{logo.name || logo}</p>
                ))
              ) : designData.appearance?.logoBranding?.imageUrl ? (
                <img src={designData.appearance.logoBranding.imageUrl} alt="Logo" className="h-10 object-contain mix-blend-screen" />
              ) : (
                <p className="text-xs text-gray-500 italic text-center">未配置 Logo</p>
              )}
            </div>
          </div>

          {/* Brush Tile */}
          <div 
            className={`glass-panel border ${activeEditMode === '画笔' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/20'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all`}
            onClick={(e) => {
              createPanelClickParticles(e);
              setActiveEditMode('画笔');
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Brush size={16} className="text-sky-200/70" /> 画笔 (Brush)
              </h4>
            </div>
            <div className="glass-tile-premium rounded-xl p-3 min-h-[80px] flex flex-col justify-center items-center gap-2 flex-1">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-300">{brushType === 'freehand' ? '自由涂抹' : '多边形框选'}</span>
                <span className="text-[10px] text-gray-500 font-mono">{brushSize}px</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate w-full text-center">
                {instruction || '等待指令...'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area: Canvas + Control Panel */}
        <div className="flex gap-6">
          {/* Left Panel: Generation Prompts */}
          <div className="w-80 shrink-0 glass-panel-premium rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar max-h-[800px]">
            <h3 className="font-bold text-white flex items-center gap-2 tracking-wide uppercase">
              <Sparkles size={18} className="text-yellow-400" />
              生图提示词
            </h3>

            {/* Container B: The Evolution */}
            <div className="glass-tile-premium rounded-xl p-4 relative group">
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="flex items-center gap-2 cursor-pointer group/header"
                  onClick={() => setIsEvolutionCollapsed(!isEvolutionCollapsed)}
                >
                  <Wand2 size={14} className="text-slate-400" />
                  <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">外观创新进化词</span>
                  <ChevronDown 
                    size={14} 
                    className={`text-slate-400/50 group-hover/header:text-slate-400 transition-transform duration-300 flex-shrink-0 ${isEvolutionCollapsed ? '-rotate-90' : ''}`} 
                  />
                </div>
              </div>
              
              <div className="flex gap-2 items-center mb-3">
                  <button
                    onClick={handleOptimizePrompt}
                    disabled={isOptimizingPrompt}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 px-2 py-1.5 rounded-md transition-colors border border-slate-500/30"
                  >
                    {isOptimizingPrompt ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    {customPromptChinese ? '重新创新' : '一键创新'}
                  </button>
                  {customPromptChinese && (
                    <button 
                      onClick={() => {
                        setCustomPrompt('');
                        setCustomPromptChinese('');
                        updateDesignData('appearance', { customPrompt: '', customPromptChinese: '' });
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-300 underline px-2"
                    >
                      重置
                    </button>
                  )}
              </div>
              
              {!isEvolutionCollapsed ? (
                <div className="animate-in slide-in-from-top-1 duration-200">
                  <DebouncedTextarea 
                    value={customPromptChinese}
                    onChange={(val) => {
                      setCustomPromptChinese(val);
                    }}
                    onBlur={(e) => {
                      updateDesignData('appearance', { customPromptChinese: e.target.value });
                    }}
                    className="w-full text-[10px] text-gray-300 bg-transparent border border-white/5 rounded-lg p-2 focus:border-slate-500/50 outline-none resize-y min-h-[120px] leading-relaxed custom-scrollbar"
                    placeholder="基于通用外观协议 V10.0 生成创新描述，侧重几何切面、结构平衡、光影氛围..."
                  />
                </div>
              ) : (
                evolutionTags && evolutionTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in duration-200">
                    {evolutionTags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-500/10 text-slate-300 text-[10px] rounded-md border border-slate-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Individual Master Prompts */}
            {(() => {
              const hasCategoryPrompts = selectedCategories.some(id => designData.competitor?.categoryPrompts?.[id]);
              const showFusion = isAnalyzingFusion || fusionAnalysis;
              
              if (!hasCategoryPrompts && !showFusion) return null;

              return (
                <div className="space-y-4">
                  {selectedCategories.map(id => {
                    const prompt = designData.competitor?.categoryPrompts?.[id];
                    if (!prompt) return null;
                    const catName = STYLE_CATEGORIES.find(c => c.id === id)?.name || id;
                    return (
                      <div key={id} className="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-blue-400" />
                          <span className="text-xs font-bold text-blue-300">
                            {catName} - CMF风格基调提示词
                          </span>
                        </div>
                        <div className="mt-2">
                          <DebouncedTextarea 
                            value={prompt}
                            onChange={(val) => {
                              const newPrompts = { ...designData.competitor?.categoryPrompts, [id]: val };
                              updateDesignData('competitor', { categoryPrompts: newPrompts });
                            }}
                            className="w-full text-[10px] text-gray-300 bg-transparent border border-white/5 rounded-lg p-2 focus:border-blue-500/50 outline-none resize-y min-h-[120px] leading-relaxed custom-scrollbar"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Fusion Analysis */}
                  {selectedCategories.length === 2 && showFusion && (
                     <div className="p-4 rounded-xl bg-indigo-900/10 border border-indigo-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-indigo-400" />
                          <span className="text-xs font-bold text-indigo-300">AI 风格融合分析</span>
                        </div>
                        {isAnalyzingFusion ? (
                          <Loader2 size={12} className="animate-spin text-indigo-400" />
                        ) : null}
                      </div>

                      {isAnalyzingFusion ? (
                        <div className="space-y-2 animate-pulse mt-3">
                          <div className="h-2 bg-white/10 rounded w-3/4"></div>
                          <div className="h-2 bg-white/10 rounded w-full"></div>
                          <div className="h-2 bg-white/10 rounded w-5/6"></div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar pr-2">
                          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:mb-2 prose-strong:text-indigo-300 prose-ul:my-1 prose-li:my-0">
                            <Markdown>
                              {fusionAnalysis || ''}
                            </Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Large Display Area (Canvas) */}
          <div 
            ref={containerRef} 
            className="flex-1 min-h-[600px] glass-panel-premium rounded-2xl flex flex-col overflow-hidden relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {error && <p className="absolute top-4 left-4 text-red-400 text-sm z-50 bg-black/80 p-2 rounded">{error}</p>}
            {busyCountdown > 0 && <p className="absolute top-4 left-4 text-red-400 text-sm z-50 bg-black/80 p-2 rounded">AI 繁忙，请等待 {busyCountdown} 秒后重试。</p>}

            {activeTool === 'brush' && showCursor && brushType === 'freehand' && (
              <div 
                className="fixed pointer-events-none rounded-full border border-white/50 bg-slate-500/20"
                style={{
                  left: cursorPos.x - brushSize / 2,
                  top: cursorPos.y - brushSize / 2,
                  width: brushSize,
                  height: brushSize,
                  zIndex: 1000
                }}
              />
            )}

            {/* Save/Delete Toolbar - Moved to container level for better visibility */}
            <div className="absolute top-3 right-3 z-[100]">
              <div className="flex gap-1.5 glass-panel-premium p-1.5 rounded-lg border border-white/10 shadow-2xl">
                <button 
                  onClick={() => {
                    const currentImageUrl = effectImageUrl.length > 0 ? effectImageUrl[0] : '';
                    if (!currentImageUrl) return;
                    const link = document.createElement('a');
                    link.href = currentImageUrl;
                    link.download = 'design-rendering.png';
                    link.click();
                  }}
                  disabled={effectImageUrl.length === 0}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium ${effectImageUrl.length === 0 ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-gray-300 hover:text-white glass-button'}`}
                  title="保存效果图"
                >
                  <Download size={14} />
                  <span>保存</span>
                </button>
                <button 
                  onClick={() => {
                    setEffectImageUrl([]);
                    updateDesignData('appearance', { effectImageUrl: [] });
                  }}
                  disabled={effectImageUrl.length === 0}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium ${effectImageUrl.length === 0 ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-gray-300 hover:text-red-400 hover:bg-red-900/20'}`}
                  title="关闭效果图"
                >
                  <X size={14} />
                  <span>关闭</span>
                </button>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-8">
              {effectImageUrl.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img id="appearance-main-image" src={effectImageUrl[0]} alt="Effect Rendering" className="max-w-full max-h-full object-contain" />
                  
                  {activeEditMode === 'Logo' && (
                    <LogoBoundingBox 
                      position={designData.appearance?.logoBranding?.position || '默认'} 
                      scale={designData.appearance?.logoBranding?.scale || '10% (Standard)'} 
                      onTransformChange={setLogoTransform}
                      onManualMove={() => {
                        updateDesignData('appearance', {
                          logoBranding: {
                            ...designData.appearance?.logoBranding,
                            position: '自定义-紫色选框手动选取'
                          }
                        });
                      }}
                    />
                  )}

                  <canvas
                    ref={canvasRefCallback}
                    className={`absolute top-0 left-0 w-full h-full z-10 ${activeTool === 'brush' ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                      if (activeTool !== 'brush') return;
                      e.preventDefault();
                      const touch = e.touches[0];
                      const mouseEvent = new MouseEvent('mousedown', {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                      });
                      startDrawing(mouseEvent as unknown as React.MouseEvent);
                    }}
                    onTouchMove={(e) => {
                      if (activeTool !== 'brush') return;
                      e.preventDefault();
                      const touch = e.touches[0];
                      const mouseEvent = new MouseEvent('mousemove', {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                      });
                      draw(mouseEvent as unknown as React.MouseEvent);
                    }}
                    onTouchEnd={(e) => {
                      if (activeTool !== 'brush') return;
                      e.preventDefault();
                      stopDrawing();
                    }}
                    onTouchCancel={(e) => {
                      if (activeTool !== 'brush') return;
                      e.preventDefault();
                      stopDrawing();
                    }}
                  />
                  
                  {/* Polygon Overlay */}
                  {brushType === 'polygon' && polygonPoints && (
                    <svg 
                      className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" 
                      viewBox={`0 0 ${canvasRef.current?.width || 100} ${canvasRef.current?.height || 100}`}
                      preserveAspectRatio="none"
                    >
                      <polygon 
                        points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')} 
                        fill="rgba(100, 116, 139, 0.3)" 
                        stroke="#A855F7" 
                        strokeWidth={4 * (canvasRef.current?.width ? canvasRef.current.width / canvasRef.current.getBoundingClientRect().width : 1)}
                        strokeDasharray="8 8"
                        className="pointer-events-auto cursor-crosshair"
                        onClick={handlePolygonEdgeClick}
                      />
                      {polygonPoints.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={10 * (canvasRef.current?.width ? canvasRef.current.width / canvasRef.current.getBoundingClientRect().width : 1)}
                          fill="white"
                          stroke="#A855F7"
                          strokeWidth={4 * (canvasRef.current?.width ? canvasRef.current.width / canvasRef.current.getBoundingClientRect().width : 1)}
                          className="pointer-events-auto cursor-move"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingPointIndex(i);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setDraggingPointIndex(i);
                          }}
                        />
                      ))}
                    </svg>
                  )}

                  {/* Part Clickable Overlays */}
                  {Object.entries(partsData).map(([category, { subParts }]) => 
                    Object.entries(subParts).map(([subPartName, part]) => (
                      <div
                        key={`${category}-${subPartName}`}
                        className={`absolute cursor-pointer ${activeTool === 'brush' ? 'pointer-events-none' : ''}`}
                        style={{
                          left: `${part.x}%`,
                          top: `${part.y}%`,
                          width: `${part.width}%`,
                          height: `${part.height}%`,
                        }}
                        onClick={() => { setSelectedPart(category); setSelectedSubPart(subPartName); }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon size={48} className="mb-4 opacity-50" />
                  <p>点击下方按钮生成效果图</p>
                </div>
              )}
            </div>

            {/* History Panel & Generate Button */}
            <div className="w-full border-t border-white/10 glass-panel-premium">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 text-gray-300 text-sm font-bold transition-colors"
              >
                <span>{showHistory ? '收起历史记录' : `历史记录 (${imageHistory.length})`}</span>
                {showHistory ? <ChevronDown size={18} className="rotate-180" /> : <ChevronDown size={18} />}
              </button>
              
              {showHistory && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 border-t border-white/5 max-h-96 overflow-y-auto">
                  {imageHistory.map((item, index) => {
                    const url = typeof item === 'string' ? item : item.url;
                    const styles = typeof item === 'string' ? [] : item.styles || [];
                    const colors = typeof item === 'string' ? [] : item.colors || [];
                    return (
                      <div key={index} className="relative group cursor-pointer bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col" onClick={() => {
                        setEffectImageUrl([url]);
                        updateDesignData('appearance', { effectImageUrl: [url] });
                      }} onDoubleClick={() => setViewerIndex(index)}>
                        <div className="relative w-full aspect-square">
                          <img src={url} alt={`History ${index}`} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `effect_${Date.now()}.png`;
                                link.click();
                              }}
                              className="p-1.5 bg-black/80 text-white rounded-md hover:bg-black backdrop-blur-sm"
                              title="保存图片"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeHistoryItem(index);
                              }}
                              className="p-1.5 bg-red-900/80 text-white rounded-md hover:bg-red-900 backdrop-blur-sm"
                              title="删除图片"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 flex flex-col gap-1.5 bg-black/40 backdrop-blur-sm flex-1">
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">主风格融合</p>
                          <div className="flex flex-wrap gap-1.5">
                            {styles.length > 0 ? styles.map((s: string) => (
                              <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/5">{s}</span>
                            )) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/5">未记录风格</span>
                            )}
                          </div>
                          {colors.length > 0 && (
                            <>
                              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">记录色号</p>
                              <div className="flex flex-wrap gap-1.5">
                                {colors.map((c: string) => (
                                  <div key={c} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/5">
                                    <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                                    {c.toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="flex justify-center gap-4 p-4 border-t border-white/5">
                <label
                  className={`px-8 py-3 text-sm rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isGenerating || isDiverging
                      ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                  title="上传本地图片作为效果图"
                >
                  <Upload size={18} />
                  上传图片
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isGenerating || isDiverging}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const url = event.target?.result as string;
                          setEffectImageUrl([url]);
                          addHistoryItem(url, [], []);
                          updateDesignData('appearance', { effectImageUrl: [url] });
                        };
                        reader.readAsDataURL(file);
                      }
                      // Reset the input value so the same file can be uploaded again if needed
                      e.target.value = '';
                    }}
                  />
                </label>

                <button
                  onClick={() => setIsImageToImageModalOpen(true)}
                  disabled={isGenerating || isDiverging}
                  className={`px-8 py-3 text-sm rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isGenerating || isDiverging
                      ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-[1.02]'
                  }`}
                  title="图片润色：支持以图生图、线稿生效果图、效果图生实物图"
                >
                  <Wand2 size={18} />
                  图片润色
                </button>

                <button
                  onMouseEnter={(e) => createDiamondParticles(e)}
                  onClick={() => {
                    console.log("Generate button clicked. isGenerating:", isGenerating, "definitionResult exists:", !!definitionResult);
                    handleGenerateEffectImage();
                  }}
                  disabled={isGenerating || isDiverging || !definitionResult}
                  className={`celestian-button px-8 py-3 text-sm ${
                    isGenerating || isDiverging || !definitionResult
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {loadingText || '正在生成效果图...'}
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      生成效果图
                    </>
                  )}
                </button>

                <button
                  onClick={handleDivergeStyles}
                  disabled={isGenerating || isDiverging || effectImageUrl.length === 0}
                  className={`px-8 py-3 text-sm rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isGenerating || isDiverging || effectImageUrl.length === 0
                      ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:scale-[1.02]'
                  }`}
                  title="基于当前效果图，发散5款新设计"
                >
                  {isDiverging ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      发散中 {divergeProgress}%
                    </>
                  ) : (
                    <>
                      <Network size={18} />
                      发散款式
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Control Panel (Right Side) */}
          {activeEditMode && (
            <div className="w-80 glass-panel-premium rounded-2xl p-4 flex flex-col transition-all duration-300">
              {activeEditMode === '面料' ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-2 font-mono">
                    <Layers size={18} />
                    面料选择
                  </h4>
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Removed optimization button */}
                      <button 
                        onClick={() => setActiveEditMode(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                  </div>
                </div>
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <button 
                        onClick={() => setIsMaterialPartCollapsed(!isMaterialPartCollapsed)}
                        className="w-full flex items-center justify-between text-gray-400 hover:text-white transition-colors group"
                      >
                        <p className="text-sm uppercase font-bold tracking-wider text-left">应用部位 (Target Part)</p>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isMaterialPartCollapsed ? 'rotate-180' : ''}`} />
                      </button>
                      {!isMaterialPartCollapsed && (
                        <div className="grid grid-cols-3 gap-1 animate-in fade-in slide-in-from-top-1">
                          {BOM_PARTS.map(part => (
                            <button
                              key={part}
                              onClick={() => setSelectedPartForMaterial(part)}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                selectedPartForMaterial === part
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'glass-tile-premium border-white/10 text-gray-400 hover:border-indigo-500/50'
                              }`}
                            >
                              {part}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <MaterialSelection 
                      onSelect={handleMaterialSelect} 
                      selectedIds={selectedMaterials.filter(sm => sm.part === selectedPartForMaterial).map(sm => sm.materialId)} 
                      selectedPart={selectedPartForMaterial}
                    />
                
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider text-left">已选面料 (Selected Materials)</p>
                    <button 
                      onClick={() => {
                        setLibraryInitialTab('material');
                        const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
                        const recommendedFabrics = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.fabrics || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.fabrics || []);
                        const recommendedColors = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.colors || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.colors || []);
                        setLibraryFilters({ fabrics: recommendedFabrics, colors: recommendedColors });
                        setLibraryModalContext('global');
                        setIsLibraryModalOpen(true);
                      }}
                      className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Library size={14} />
                      从面料库选择
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {globalAttributes.material.map((m: any, idx: number) => (
                      <div 
                        key={idx}
                        className="group relative px-3 py-1.5 bg-slate-500/10 border border-slate-500/30 rounded-lg text-xs text-slate-300 flex items-center gap-2"
                      >
                        <span>{m.name}</span>
                        <X 
                          size={12} 
                          className="cursor-pointer hover:text-white" 
                          onClick={() => {
                            const newGlobalMaterials = globalAttributes.material.filter((_, i) => i !== idx);
                            const newAttrs = { ...globalAttributes, material: newGlobalMaterials };
                            setGlobalAttributes(newAttrs);
                            updateDesignData('appearance', { globalAttributes: newAttrs });
                            
                            // Also update selectedMaterials if it's a library material
                            const newSelectedMaterials = selectedMaterials.filter(sm => {
                              const mat = materials.find(mat => mat.id === sm.materialId);
                              return mat?.name !== m.name;
                            });
                            setSelectedMaterials(newSelectedMaterials);
                            updateDesignData('appearance', { selectedMaterials: newSelectedMaterials });
                          }}
                        />
                      </div>
                    ))}
                    {globalAttributes.material.length === 0 && (
                      <p className="text-xs text-gray-500 italic">未选择面料</p>
                    )}
                  </div>
                </div>

                {selectedMaterial && (
                  <div className="glass-tile-premium rounded-xl p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 text-center mt-4 relative">
                    {(selectedMaterial.id === 'DP_210DRIPSTOP' || (selectedMaterial.tags && selectedMaterial.tags.includes('轻量'))) && selectedPartForMaterial && !selectedPartForMaterial.includes('内里') && (
                      <div className="absolute bottom-3 right-3 group/warning z-50">
                        <div className="bg-slate-300 rounded-full p-1 shadow-[0_0_8px_rgba(203,213,225,0.6)]">
                          <AlertCircle size={14} className="text-slate-800" />
                        </div>
                        <div className="absolute bottom-full right-0 mb-2 z-50">
                          <div className="w-48 p-2 glass-panel-premium border border-slate-600 rounded-lg text-[10px] text-slate-200 opacity-0 group-hover/warning:opacity-100 pointer-events-none transition-opacity shadow-xl text-left">
                            检测到轻量材质，建议仅用于非承重/低磨损区
                          </div>
                        </div>
                      </div>
                    )}
                    <h5 className="text-sm font-bold text-slate-300">{selectedMaterial.name}</h5>
                    <p className="text-[10px] text-slate-400/80 font-mono truncate" title={selectedMaterial.fullPath}>{selectedMaterial.fullPath}</p>
                    <p className="text-xs text-gray-400">{selectedMaterial.description}</p>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="glass-panel rounded-lg p-2 text-center">
                        <p className="text-[9px] text-gray-500 uppercase">强度</p>
                        <p className="text-xs text-white font-mono">{selectedMaterial.strength}</p>
                      </div>
                      <div className="glass-panel rounded-lg p-2 text-center">
                        <p className="text-[9px] text-gray-500 uppercase">重量</p>
                        <p className="text-xs text-white font-mono">{selectedMaterial.weight}</p>
                      </div>
                      <div className="glass-panel rounded-lg p-2 text-center">
                        <p className="text-[9px] text-gray-500 uppercase">耐候性</p>
                        <p className="text-xs text-white font-mono">{selectedMaterial.weatherResistance}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const newMaterialItem = {
                          name: selectedMaterial.name,
                          description: selectedMaterial.description,
                          fromLibrary: true
                        };
                        
                        const existingIndex = globalAttributes.material.findIndex((item: any) => item.name === newMaterialItem.name);
                        let newMaterialList = [...globalAttributes.material];
                        if (existingIndex === -1) {
                          newMaterialList.push(newMaterialItem);
                        } else {
                          newMaterialList[existingIndex] = { ...newMaterialList[existingIndex], fromLibrary: true };
                        }
                        
                        const newAttrs = { ...globalAttributes, material: newMaterialList };
                        
                        // Add to library
                        const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                        if (!currentLibrary.material.some((m: any) => m.name === selectedMaterial.name)) {
                          const newLibItem = {
                            id: `lib-mat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name: selectedMaterial.name,
                            description: selectedMaterial.description,
                            category: selectedMaterial.category || 'abrasion',
                            tags: selectedMaterial.tags || []
                          };
                          updateDesignData('library', { ...currentLibrary, material: [...currentLibrary.material, newLibItem] });
                        }

                        setGlobalAttributes(newAttrs);
                        updateDesignData('appearance', { globalAttributes: newAttrs });
                        setFlashingTile('material');
                        setTimeout(() => setFlashingTile(null), 1500);
                        setNotification({ message: '面料已归档至资产库', type: 'success' });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                      <Library size={14} />
                      保存至库
                    </button>
                  </div>
                )}

                {/* Instruction Input */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">面料优化指令</p>
                  <DebouncedTextarea
                    placeholder="例如：将主面料替换为Cordura 1050D，保持轮廓不变..."
                    className="w-full h-24 glass-input-premium rounded-xl p-3 text-sm placeholder-gray-600"
                    value={instruction}
                    onChange={(val) => setInstruction(val)}
                  />
                  <button 
                    onClick={handleInpaintOptimization}
                    disabled={isGenerating}
                    onMouseEnter={(e) => !isGenerating && createDiamondParticles(e)}
                    className="w-full py-3 celestian-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} />
                    {isGenerating ? '正在执行...' : '执行优化'}
                  </button>
                </div>
              </div>
            </div>
            ) : activeEditMode === '辅料' ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h4 className="font-bold text-amber-100/70 flex items-center gap-2 font-mono">
                    <Settings2 size={18} />
                    辅料设置
                  </h4>
                  <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => setActiveEditMode(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                  </div>
                </div>
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">选择辅料类型</p>
                      <div className="grid grid-cols-3 gap-2">
                        {accessories.map(acc => (
                          <button
                            key={acc.id}
                            onClick={() => handleAccessorySelect(acc.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                              selectedAccessories.includes(acc.id) 
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                : 'glass-tile-premium border-white/10 text-gray-400 hover:border-indigo-500/50 hover:text-white'
                            }`}
                          >
                            <acc.icon size={20} />
                            <span className="text-xs font-bold">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider text-left">已选辅料 (Selected Hardware)</p>
                        <button 
                          onClick={() => {
                            setLibraryInitialTab('hardware');
                            const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
                            const recommendedFabrics = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.fabrics || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.fabrics || []);
                            const recommendedColors = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.colors || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.colors || []);
                            setLibraryFilters({ fabrics: recommendedFabrics, colors: recommendedColors });
                            setLibraryModalContext('global');
                            setIsLibraryModalOpen(true);
                          }}
                          className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Library size={14} />
                          从辅料库选择
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {globalAttributes.hardware.map((h: any, idx: number) => {
                          const hardwareItem = accessories.find(a => a.name === h.name);
                          const isActive = hardwareItem && activeAccessoryId === hardwareItem.id;
                          
                          return (
                            <div 
                              key={idx}
                              onClick={() => hardwareItem && setActiveAccessoryId(hardwareItem.id)}
                              className={`group relative px-3 py-1.5 border rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                isActive 
                                  ? 'bg-slate-500/20 border-slate-500 text-slate-300 ring-1 ring-slate-500/30' 
                                  : 'bg-slate-500/5 border-slate-500/30 text-slate-300/70 hover:border-slate-500/60'
                              }`}
                            >
                              <span>{h.name}</span>
                              <X 
                                size={12} 
                                className="cursor-pointer hover:text-white" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newGlobalHardware = globalAttributes.hardware.filter((_, i) => i !== idx);
                                  const newAttrs = { ...globalAttributes, hardware: newGlobalHardware };
                                  setGlobalAttributes(newAttrs);
                                  updateDesignData('appearance', { globalAttributes: newAttrs });
                                  
                                  if (hardwareItem) {
                                    const newSelectedAccessories = selectedAccessories.filter(id => id !== hardwareItem.id);
                                    setSelectedAccessories(newSelectedAccessories);
                                    updateDesignData('appearance', { selectedAccessories: newSelectedAccessories });
                                    if (activeAccessoryId === hardwareItem.id) {
                                      setActiveAccessoryId(newSelectedAccessories[0] || null);
                                    }
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                        {globalAttributes.hardware.length === 0 && (
                          <p className="text-xs text-gray-500 italic">未选择辅料</p>
                        )}
                      </div>
                    </div>

                    {activeAccessoryId && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 flex-1 flex flex-col">
                        <div className="grid grid-cols-2 gap-4">
                          {accessoryStyles[activeAccessoryId].map(field => (
                            <div key={field.key} className="space-y-2">
                              <p className="text-xs text-gray-400 font-bold text-left">{field.label}</p>
                              <select 
                                className="w-full glass-input-premium rounded-xl p-3 text-sm"
                                value={accessoryStyle[field.key] || '默认'}
                                onChange={(e) => handleAccessoryStyleChange(field.key, e.target.value)}
                              >
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                          <div className="flex items-center gap-4 p-3 glass-tile-premium rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                              <Settings2 size={20} className="text-amber-100/70" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">当前编辑辅料</p>
                              <p className="text-sm font-medium text-white">{activeAccessoryId ? accessories.find(a => a.id === activeAccessoryId)?.name : '未选择 (None)'}</p>
                            </div>
                          </div>
                          
                          {activeAccessoryId && (
                            <button
                              onClick={() => {
                                const hardwareItem = accessories.find(a => a.id === activeAccessoryId);
                                const newHardwareItem = {
                                  name: hardwareItem?.name || '自定义辅料',
                                  material: accessoryStyle['材质'] || '未知',
                                  finish: accessoryStyle['表面处理'] || '未知',
                                  fromLibrary: true
                                };
                                
                                const existingIndex = globalAttributes.hardware.findIndex((item: any) => 
                                  (typeof item === 'string' ? item : item.name) === newHardwareItem.name
                                );
                                let newHardwareList = [...globalAttributes.hardware];
                                if (existingIndex === -1) {
                                  newHardwareList.push(newHardwareItem);
                                } else {
                                  newHardwareList[existingIndex] = { 
                                    ...(typeof newHardwareList[existingIndex] === 'object' ? newHardwareList[existingIndex] : { name: newHardwareList[existingIndex] }),
                                    fromLibrary: true 
                                  };
                                }
                                
                                const newAttrs = { ...globalAttributes, hardware: newHardwareList };
                                
                                // Add to library
                                const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                                if (!currentLibrary.hardware.some((h: any) => h.name === newHardwareItem.name)) {
                                  const newLibItem = {
                                    id: `lib-hw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    name: newHardwareItem.name,
                                    category: 'buckle'
                                  };
                                  updateDesignData('library', { ...currentLibrary, hardware: [...currentLibrary.hardware, newLibItem] });
                                }

                                setGlobalAttributes(newAttrs);
                                updateDesignData('appearance', { globalAttributes: newAttrs });
                                setFlashingTile('hardware');
                                setTimeout(() => setFlashingTile(null), 1500);
                                setNotification({ message: '辅料已归档至资产库', type: 'success' });
                                setTimeout(() => setNotification(null), 3000);
                              }}
                              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 mt-2"
                            >
                              <Library size={14} />
                              保存至库
                            </button>
                          )}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">辅料优化指令</p>
                          <DebouncedTextarea
                            placeholder="例如：强化磁吸扣的金属质感，增加拉链的防水压胶细节..."
                            className="w-full h-24 glass-input-premium rounded-xl p-3 text-sm placeholder-gray-600"
                            value={instruction}
                            onChange={(val) => setInstruction(val)}
                          />
                          <button 
                            onClick={handleInpaintOptimization}
                            disabled={isGenerating}
                            onMouseEnter={(e) => !isGenerating && createDiamondParticles(e)}
                            className="w-full py-3 celestian-button disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles size={16} />
                            {isGenerating ? '正在优化...' : '执行辅料优化'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            ) : activeEditMode === '颜色' ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h4 className="font-bold text-fuchsia-300 flex items-center gap-2 font-mono">
                    <Palette size={18} />
                    颜色选择
                  </h4>
                  <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => setActiveEditMode(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                  </div>
                </div>
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <button 
                        onClick={() => setIsColorPartCollapsed(!isColorPartCollapsed)}
                        className="w-full flex items-center justify-between text-gray-400 hover:text-white transition-colors group"
                      >
                        <p className="text-sm uppercase font-bold tracking-wider text-left">应用部位 (Target Part)</p>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isColorPartCollapsed ? 'rotate-180' : ''}`} />
                      </button>
                      {!isColorPartCollapsed && (
                        <div className="grid grid-cols-3 gap-1 animate-in fade-in slide-in-from-top-1">
                          {BOM_PARTS.map(part => (
                            <button
                              key={part}
                              onClick={() => togglePart(part)}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                selectedPartsForColor.includes(part)
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'glass-tile-premium border-white/10 text-gray-400 hover:border-indigo-500/50'
                              }`}
                            >
                              {part}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400 font-medium">选择颜色</span>
                      {typeof (window as any).EyeDropper !== 'undefined' && (
                        <button
                          onClick={async () => {
                            try {
                              const eyeDropper = new (window as any).EyeDropper();
                              const result = await eyeDropper.open();
                              setSelectedColor(result.sRGBHex);
                            } catch (e) {
                              console.error('Eyedropper error:', e);
                            }
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-300 transition-colors text-xs border border-indigo-500/30"
                          title="从屏幕上吸取颜色"
                        >
                          <Pipette size={14} />
                          吸取颜色
                        </button>
                      )}
                    </div>

                    <AdvancedColorPicker color={selectedColor || '#000000'} onChange={(color) => {
                      setSelectedColor(color);
                    }} />
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (selectedColor && !selectedColors.includes(selectedColor)) {
                            const newSelected = [...selectedColors, selectedColor];
                            setSelectedColors(newSelected);
                            updateDesignData('appearance', { selectedColors: newSelected });
                            
                            const newItem = { name: '自定义颜色', hex: selectedColor, fromLibrary: true };
                            const newGlobalColors = [...globalAttributes.color, newItem];
                            const newAttrs = { ...globalAttributes, color: newGlobalColors };
                            setGlobalAttributes(newAttrs);
                            updateDesignData('appearance', { globalAttributes: newAttrs });
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        添加至已选颜色
                      </button>
                    </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider text-left">已选颜色 (Selected Colors)</p>
                      <button 
                        onClick={() => {
                          setLibraryInitialTab('color');
                          const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
                          const recommendedFabrics = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.fabrics || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.fabrics || []);
                          const recommendedColors = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.colors || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.colors || []);
                          setLibraryFilters({ fabrics: recommendedFabrics, colors: recommendedColors });
                          setLibraryModalContext('global');
                          setIsLibraryModalOpen(true);
                        }}
                        className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Library size={14} />
                        从色彩库选择
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedColors.map((color, idx) => {
                        const isActive = globalAttributes.color.some((c: any) => c.hex === color);
                        return (
                          <div 
                            key={idx}
                            className={`group relative w-10 h-10 rounded-lg border ${isActive ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-white/20'} shadow-inner cursor-pointer transition-all`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setSelectedColor(color);
                              if (isActive) {
                                const newGlobalColors = globalAttributes.color.filter((c: any) => c.hex !== color);
                                const newAttrs = { ...globalAttributes, color: newGlobalColors };
                                setGlobalAttributes(newAttrs);
                                updateDesignData('appearance', { globalAttributes: newAttrs });
                              } else if (globalAttributes.color.length < 3) {
                                const newItem = { name: '自定义颜色', hex: color, fromLibrary: true };
                                const newGlobalColors = [...globalAttributes.color, newItem];
                                const newAttrs = { ...globalAttributes, color: newGlobalColors };
                                setGlobalAttributes(newAttrs);
                                updateDesignData('appearance', { globalAttributes: newAttrs });
                              } else {
                                setNotification({ message: '最多只能选择3个颜色到当前选中', type: 'info' });
                                setTimeout(() => setNotification(null), 3000);
                              }
                            }}
                          >
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <X size={12} className="text-white" onClick={(e) => {
                                e.stopPropagation();
                                const newSelected = selectedColors.filter(c => c !== color);
                                setSelectedColors(newSelected);
                                updateDesignData('appearance', { selectedColors: newSelected });
                                
                                if (isActive) {
                                  const newGlobalColors = globalAttributes.color.filter((item: any) => item.hex !== color);
                                  const newAttrs = { ...globalAttributes, color: newGlobalColors };
                                  setGlobalAttributes(newAttrs);
                                  updateDesignData('appearance', { globalAttributes: newAttrs });
                                }
                              }} />
                            </div>
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-black" />
                            )}
                          </div>
                        );
                      })}
                      {selectedColors.length === 0 && (
                        <p className="text-xs text-gray-500 italic">未选择颜色</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2 p-3 glass-tile-premium rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider text-left">当前选中 (最多3个)</p>
                    <div className="flex items-center gap-3">
                      {globalAttributes.color.length > 0 ? globalAttributes.color.map((c: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg border border-white/20 shadow-inner" style={{ backgroundColor: c.hex }} />
                          <span className="text-xs font-mono text-white">{c.hex.toUpperCase()}</span>
                        </div>
                      )) : (
                        <p className="text-sm font-mono text-gray-500">无</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedColor && (
                    <button
                      onClick={() => {
                        const newColorItem = {
                          name: '自定义颜色',
                          hex: selectedColor,
                          fromLibrary: true
                        };
                        
                        const existingIndex = globalAttributes.color.findIndex((item: any) => item.hex === selectedColor);
                        let newColorList = [...globalAttributes.color];
                        if (existingIndex === -1) {
                          newColorList.push(newColorItem);
                        } else {
                          newColorList[existingIndex] = { ...newColorList[existingIndex], fromLibrary: true };
                        }
                        
                        const newAttrs = { ...globalAttributes, color: newColorList };
                        
                        // Add to library
                        const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                        if (!currentLibrary.color.some((c: any) => c.hex === selectedColor)) {
                          const newLibItem = {
                            id: `lib-col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name: '自定义颜色',
                            hex: selectedColor || '#000000',
                            category: 'brand'
                          };
                          updateDesignData('library', { ...currentLibrary, color: [...currentLibrary.color, newLibItem] });
                        }

                        setGlobalAttributes(newAttrs);
                        updateDesignData('appearance', { globalAttributes: newAttrs });
                        setFlashingTile('color');
                        setTimeout(() => setFlashingTile(null), 1500);
                        setNotification({ message: '颜色已归档至资产库', type: 'success' });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <Library size={14} />
                      保存至库
                    </button>
                  )}
                </div>
                {/* Instruction Input */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">修改指令</p>
                    <button
                      onClick={() => instructionImageInputRef.current?.click()}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ImageIcon size={12} />
                      {instructionImage ? '更换参考图' : '添加参考图'}
                    </button>
                    <input
                      type="file"
                      ref={instructionImageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setInstructionImage(e.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  
                  {instructionImage && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 group">
                      <img src={instructionImage} alt="Instruction Reference" className="w-full h-full object-contain bg-black/50" />
                      <button
                        onClick={() => setInstructionImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  
                  <DebouncedTextarea
                    placeholder="例如：将水杯仓高度调节到目前框选的位置..."
                    className="w-full h-24 glass-input-premium rounded-xl p-3 text-sm placeholder-gray-600"
                    value={instruction}
                    onChange={(val) => setInstruction(val)}
                  />
                  <button 
                    onClick={handleAIEdit}
                    disabled={isGenerating}
                    onMouseEnter={(e) => !isGenerating && createDiamondParticles(e)}
                    className="w-full py-3 celestian-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} />
                    {isGenerating ? '正在执行...' : '执行优化'}
                  </button>
                </div>
              </div>
            </div>
            ) : activeEditMode === 'Logo' ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h4 className="font-bold text-teal-100/70 flex items-center gap-2 font-mono">
                    <FileText size={18} />
                    Logo 设置
                  </h4>
                  <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => setActiveEditMode(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                  </div>
                </div>
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-slate-500/50 transition-colors glass-tile-premium">
                      {designData.appearance?.logoBranding?.imageUrl ? (
                        <div className="relative h-full w-full p-2">
                          <div className="w-full h-full relative rounded overflow-hidden" style={{
                            ...(designData.appearance?.logoBranding?.material?.includes('刺绣') || designData.appearance?.logoBranding?.material?.includes('织唛') ? {
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                              filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.5))'
                            } : designData.appearance?.logoBranding?.material?.includes('金属') ? {
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 100%)',
                              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5)) drop-shadow(0px 0px 2px rgba(255,255,255,0.8))'
                            } : designData.appearance?.logoBranding?.material?.includes('硅胶') || designData.appearance?.logoBranding?.material?.includes('橡胶') || designData.appearance?.logoBranding?.material?.includes('滴胶') ? {
                              filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.4)) drop-shadow(0px -1px 1px rgba(255,255,255,0.3))'
                            } : designData.appearance?.logoBranding?.material?.includes('压印') ? {
                              filter: 'drop-shadow(0px -1px 1px rgba(0,0,0,0.5)) drop-shadow(0px 1px 1px rgba(255,255,255,0.2))'
                            } : {})
                          }}>
                            <img src={designData.appearance.logoBranding.imageUrl} alt="Logo" className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-screen" />
                          </div>
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white">点击更换 LOGO</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-slate-500/10 text-slate-500 rounded-lg mb-2">
                            <span className="font-bold">LOGO</span>
                          </div>
                          <p className="text-xs text-slate-500">点击上传品牌 LOGO</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const url = ev.target?.result as string;
                            updateDesignData('appearance', { logoBranding: { ...designData.appearance?.logoBranding, imageUrl: url } });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>

                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => {
                          setLibraryInitialTab('logo');
                          const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
                          const recommendedFabrics = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.fabrics || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.fabrics || []);
                          const recommendedColors = selectedCategories.flatMap(id => getDynamicRecommendations(id, definitionResult)?.colors || STYLE_CATEGORIES.find(c => c.id === id)?.recommended_assets?.colors || []);
                          setLibraryFilters({ fabrics: recommendedFabrics, colors: recommendedColors });
                          setLibraryModalContext('global');
                          setIsLibraryModalOpen(true);
                        }}
                        className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Library size={14} />
                        从标识库选择
                      </button>
                    </div>

                    {designData.appearance?.logoBranding?.imageUrl && (
                      <button
                        onClick={() => {
                          const newLogoItem = {
                            name: '自定义 Logo',
                            type: designData.appearance?.logoBranding?.material || '默认工艺',
                            fromLibrary: true
                          };
                          
                          const existingIndex = globalAttributes.logo.findIndex((item: any) => item.name === newLogoItem.name);
                          let newLogoList = [...globalAttributes.logo];
                          if (existingIndex === -1) {
                            newLogoList.push(newLogoItem);
                          }
                          
                          const newAttrs = { ...globalAttributes, logo: newLogoList };
                          
                          // Add to library
                          const currentLibrary = designData.library || { material: [], color: [], hardware: [], logo: [] };
                          if (!currentLibrary.logo.some((l: any) => l.name === newLogoItem.name)) {
                            const newLibItem = {
                              id: `lib-logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              name: newLogoItem.name,
                              type: newLogoItem.type,
                              category: 'silicone'
                            };
                            updateDesignData('library', { ...currentLibrary, logo: [...currentLibrary.logo, newLibItem] });
                          }

                          setGlobalAttributes(newAttrs);
                          updateDesignData('appearance', { globalAttributes: newAttrs });
                          setFlashingTile('logo');
                          setTimeout(() => setFlashingTile(null), 1500);
                          setNotification({ message: 'Logo 已归档至资产库', type: 'success' });
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        <Library size={14} />
                        保存至库
                      </button>
                    )}

                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-bold">应用位置</p>
                          <select 
                            className="w-full glass-input-premium rounded-xl p-3 text-sm"
                            value={designData.appearance?.logoBranding?.position || '默认'}
                            onChange={(e) => updateDesignData('appearance', { logoBranding: { ...designData.appearance?.logoBranding, position: e.target.value } })}
                          >
                            {logoPlacements.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-bold">材质工艺</p>
                          <select 
                            className="w-full glass-input-premium rounded-xl p-3 text-sm"
                            value={designData.appearance?.logoBranding?.material || '默认'}
                            onChange={(e) => updateDesignData('appearance', { logoBranding: { ...designData.appearance?.logoBranding, material: e.target.value } })}
                          >
                            {logoCrafts.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <p className="text-xs text-gray-400 font-bold">LOGO 配色</p>
                          <select 
                            className="w-full glass-input-premium rounded-xl p-3 text-sm"
                            value={designData.appearance?.logoBranding?.color || '默认'}
                            onChange={(e) => updateDesignData('appearance', { logoBranding: { ...designData.appearance?.logoBranding, color: e.target.value } })}
                          >
                            {['默认', '保持原色', '单色黑', '单色白', '金属银', '金属金', '红色', '蓝色', '绿色', '黄色', '同色系隐形'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-400 font-bold">尺寸比例</p>
                          <span className="text-xs text-slate-400 font-mono">{designData.appearance?.logoBranding?.scale || '10% (Standard)'}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="2" 
                          step="1"
                          className="w-full accent-slate-500"
                          value={logoSizes.findIndex(s => s.label === (designData.appearance?.logoBranding?.scale || '10% (Standard)')) !== -1 ? logoSizes.findIndex(s => s.label === (designData.appearance?.logoBranding?.scale || '10% (Standard)')) : 1}
                          onChange={(e) => updateDesignData('appearance', { logoBranding: { ...designData.appearance?.logoBranding, scale: logoSizes[parseInt(e.target.value)].label } })}
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                          <span>5%</span>
                          <span>10%</span>
                          <span>15%</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleExecuteOptimization}
                      disabled={isOptimizingLogo}
                      onMouseEnter={(e) => !isOptimizingLogo && createDiamondParticles(e)}
                      className="w-full py-3 celestian-button disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                      <Sparkles size={16} />
                      {isOptimizingLogo ? '正在执行...' : '执行优化'}
                    </button>
                  </div>
              </div>
            ) : activeEditMode === '画笔' ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h4 className="font-bold text-sky-200/70 flex items-center gap-2 font-mono">
                    <Brush size={18} />
                    画笔工具
                  </h4>
                  <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => setActiveEditMode(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                  </div>
                </div>
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">涂抹模式</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBrushType('freehand')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${brushType === 'freehand' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20' : 'glass-button text-gray-400 hover:text-white'}`}
                        >
                          自由涂抹
                        </button>
                        <button
                          onClick={() => setBrushType('polygon')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${brushType === 'polygon' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20' : 'glass-button text-gray-400 hover:text-white'}`}
                        >
                          多边形框选
                        </button>
                      </div>
                    </div>

                    {brushType === 'freehand' && (
                      <div className="space-y-2">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">画笔大小</p>
                          <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
                      </div>
                    )}

                    {brushType === 'polygon' && polygonPoints && (
                      <div className="space-y-2 glass-tile-premium p-3 rounded-xl">
                        <p className="text-xs text-slate-300 mb-2">已生成多边形选区，可拖动锚点调整，或点击边缘添加新锚点。</p>
                        <div className="flex gap-2">
                          <button
                            onClick={confirmPolygon}
                            className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-500/20"
                          >
                            确认框选
                          </button>
                          <button
                            onClick={cancelPolygon}
                            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">修改指令</p>
                        <button
                          onClick={() => instructionImageInputRef.current?.click()}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ImageIcon size={12} />
                          {instructionImage ? '更换参考图' : '添加参考图'}
                        </button>
                      </div>

                      {instructionImage && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 group">
                          <img src={instructionImage} alt="Instruction Reference" className="w-full h-full object-contain bg-black/50" />
                          <button
                            onClick={() => setInstructionImage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      <DebouncedTextarea
                        placeholder="例如：将此区域改为红色..."
                        className="w-full h-24 glass-input-premium rounded-xl p-3 text-sm placeholder-gray-600"
                        value={instruction}
                        onChange={(val) => setInstruction(val)}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleUndo}
                          disabled={!canUndo || isGenerating}
                          className={`flex-1 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${canUndo && !isGenerating ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                          <Undo size={16} />
                          撤回
                        </button>
                        <button 
                          onClick={() => {
                            const canvas = canvasRef.current;
                            const ctx = canvas?.getContext('2d');
                            if (ctx && canvas) {
                              saveUndoState();
                              ctx.clearRect(0, 0, canvas.width, canvas.height);
                            }
                          }}
                          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors"
                        >
                          清除涂抹
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          if (isGenerating) return;
                          if (!instruction.trim()) {
                            setError('请先在“修改指令”框中输入你的修改意图');
                            return;
                          }
                          if (brushType === 'polygon' && polygonPoints) {
                            confirmPolygon();
                          }
                          // Use setTimeout to allow the canvas to update before reading it
                          setTimeout(() => {
                            handleInpainting();
                          }, 50);
                        }}
                        disabled={isGenerating}
                        onMouseEnter={(e) => !isGenerating && createDiamondParticles(e)}
                        className={`w-full py-3 celestian-button ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Sparkles size={16} />
                        {isGenerating && generatingAction === 'inpaint' ? '正在执行...' : '执行局部重绘'}
                      </button>
                      <button 
                        onClick={() => {
                          if (isGenerating) return;
                          if (!instruction.trim()) {
                            setError('请先在“修改指令”框中输入你的修改意图（例如：将水杯仓加高）');
                            return;
                          }
                          if (brushType === 'polygon' && polygonPoints) {
                            confirmPolygon();
                          }
                          setTimeout(() => {
                            handleSmartIntentInpainting();
                          }, 50);
                        }}
                        disabled={isGenerating}
                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isGenerating ? 'glass-panel-premium text-slate-500/50 cursor-not-allowed' : 'bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300'}`}
                        title="画一条线表示修改意图（如加高），AI将自动识别并重绘整个部件"
                      >
                        <Wand2 size={16} />
                        {isGenerating && generatingAction === 'smartInpaint' ? '正在执行...' : '智能意图重绘 (画线示意)'}
                      </button>
                    </div>
                  </div>
              </div>
            ) : null}
            </div>
          )}
        </div>
      </section>
      
      {(viewerIndex !== null || selectedViewerUrl !== null) && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
            <button 
              onClick={() => {
                const item = viewerIndex !== null ? imageHistory[viewerIndex] : selectedViewerUrl;
                const url = typeof item === 'string' ? item : item?.url;
                if (!url) return;
                const link = document.createElement('a');
                link.href = url;
                link.download = `design-rendering-${Date.now()}.png`;
                link.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-md font-medium"
              title="保存图片"
            >
              <Download size={20} />
              <span>保存</span>
            </button>
            <button 
              onClick={() => { setViewerIndex(null); setSelectedViewerUrl(null); }} 
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-md font-medium"
              title="关闭"
            >
              <X size={20} />
              <span>关闭</span>
            </button>
          </div>
          
          {viewerIndex !== null ? (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setViewerIndex(prev => prev !== null ? Math.max(0, prev - 1) : null); }}
                className="absolute left-4 text-white/50 hover:text-white transition-colors disabled:opacity-10"
                disabled={viewerIndex === 0}
              >
                <ChevronLeft size={48} />
              </button>
              <img src={typeof imageHistory[viewerIndex] === 'string' ? imageHistory[viewerIndex] : imageHistory[viewerIndex]?.url} alt="Viewer" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" referrerPolicy="no-referrer" />
              <button 
                onClick={(e) => { e.stopPropagation(); setViewerIndex(prev => prev !== null ? Math.min(imageHistory.length - 1, prev + 1) : null); }}
                className="absolute right-4 text-white/50 hover:text-white transition-colors disabled:opacity-10"
                disabled={viewerIndex === imageHistory.length - 1}
              >
                <ChevronRight size={48} />
              </button>
            </>
          ) : selectedViewerUrl && (
            <img src={selectedViewerUrl} alt="Viewer" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" referrerPolicy="no-referrer" />
          )}
        </div>
      )}

      <AssetLibraryModal 
        isOpen={isLibraryModalOpen} 
        onClose={() => setIsLibraryModalOpen(false)} 
        initialTab={libraryInitialTab} 
        filters={libraryFilters}
        highlightColor={libraryHighlightColor}
        ambientLight={libraryAmbientLight}
        onSelect={(type, value) => {
          if (libraryModalContext === 'benchmark') {
            if (type === 'color') {
              const newColor = { hex: value.hex, name: value.name };
              const existingIndex = benchmarkColors.findIndex(c => c.hex === newColor.hex);
              let newColors = [...benchmarkColors];
              if (existingIndex > -1) {
                newColors = newColors.filter((_, i) => i !== existingIndex);
              } else {
                newColors.push(newColor);
              }
              setBenchmarkColors(newColors);
              updateDesignData('appearance', { benchmarkColors: newColors });
            }
            return;
          }

          setFlashingTile(type);
          setTimeout(() => setFlashingTile(null), 1500); // Reset after 1.5s
          const newAttrs = { ...globalAttributes };
          let newItem: any = {};
          
          if (type === 'material') {
            newItem = { name: value.name, description: value.tags?.join(', ') || '', fromLibrary: true };
          } else if (type === 'color') {
            newItem = { name: value.name, hex: value.hex, fromLibrary: true };
          } else if (type === 'hardware') {
            newItem = { name: value.name, description: `${value.material} ${value.finish}`, fromLibrary: true };
          } else if (type === 'logo') {
            newItem = { name: value.name, description: value.type, fromLibrary: true };
          }

          // Toggle logic for multi-selection
          const existingIndex = newAttrs[type].findIndex((item: any) => item.name === newItem.name);
          if (existingIndex > -1) {
            newAttrs[type] = newAttrs[type].filter((_: any, i: number) => i !== existingIndex);
          } else {
            newAttrs[type] = [...newAttrs[type], newItem];
          }
          
          setGlobalAttributes(newAttrs);
          updateDesignData('appearance', { globalAttributes: newAttrs });

          // Sync with specific edit mode states
          if (type === 'color') {
            setSelectedColor(value.hex);
            const newSelected = selectedColors.includes(value.hex) 
              ? selectedColors.filter(c => c !== value.hex)
              : [...selectedColors, value.hex];
            setSelectedColors(newSelected);
            updateDesignData('appearance', { selectedColors: newSelected });
          }
        }}
      />
      {/* Image Retouch Modal */}
      {isImageToImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wand2 size={20} className="text-blue-400" />
                图片润色
              </h3>
              <button 
                onClick={() => setIsImageToImageModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              {/* Left Column: Controls */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setRetouchMode('i2i')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      retouchMode === 'i2i' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    以图生图
                  </button>
                  <button
                    onClick={() => setRetouchMode('e2r')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      retouchMode === 'e2r' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    线稿/效果图生实物图
                  </button>
                </div>

                {retouchMode === 'i2i' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">1. 上传参考图</label>
                      <div 
                        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors relative min-h-[200px] ${
                          isDraggingI2i ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingI2i(true); }}
                        onDragLeave={() => setIsDraggingI2i(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingI2i(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setI2iReferenceImage(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      >
                        {i2iReferenceImage ? (
                          <>
                            <img src={i2iReferenceImage} alt="Reference" className="max-h-48 object-contain rounded-lg" referrerPolicy="no-referrer" />
                            <button 
                              onClick={() => setI2iReferenceImage(null)}
                              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-red-500/50 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                            <Upload size={24} className={`transition-colors ${isDraggingI2i ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className={`text-sm transition-colors ${isDraggingI2i ? 'text-blue-400' : 'text-slate-400'}`}>
                              {isDraggingI2i ? '松开鼠标上传' : '点击或拖拽上传参考图片'}
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setI2iReferenceImage(event.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-medium text-slate-300 flex justify-between">
                        <span>2. 相似度控制</span>
                        <span className="text-blue-400">{i2iSimilarity}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={i2iSimilarity}
                        onChange={(e) => setI2iSimilarity(parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>自由发散</span>
                        <span>高度相似</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">当前效果图</label>
                    <div 
                      className={`border-2 border-dashed rounded-xl flex items-center justify-center h-48 relative overflow-hidden transition-colors ${
                        isDraggingE2r ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/50 hover:bg-white/5'
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingE2r(true); }}
                      onDragLeave={() => setIsDraggingE2r(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingE2r(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const url = event.target?.result as string;
                            setEffectImageUrl([url]);
                            addHistoryItem(url, [], []);
                            updateDesignData('appearance', { effectImageUrl: [url] });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    >
                      {effectImageUrl[0] ? (
                        <>
                          <img src={effectImageUrl[0]} alt="Current Effect" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                            <div className="flex flex-col items-center gap-2 text-white">
                              <Upload size={24} />
                              <span className="text-sm font-medium">点击或拖拽替换图片</span>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const url = event.target?.result as string;
                                    setEffectImageUrl([url]);
                                    addHistoryItem(url, [], []);
                                    updateDesignData('appearance', { effectImageUrl: [url] });
                                  };
                                  reader.readAsDataURL(file);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </>
                      ) : (
                        <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                          <ImageIcon size={32} className={`transition-colors ${isDraggingE2r ? 'text-emerald-400' : 'text-slate-500 opacity-50'}`} />
                          <span className={`text-sm transition-colors ${isDraggingE2r ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isDraggingE2r ? '松开鼠标上传' : '无效果图，点击或拖拽上传'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const url = event.target?.result as string;
                                  setEffectImageUrl([url]);
                                  addHistoryItem(url, [], []);
                                  updateDesignData('appearance', { effectImageUrl: [url] });
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-sm font-medium text-slate-300 flex justify-between">
                    <span>{retouchMode === 'i2i' ? '3. ' : ''}自定义修改需求 (可选)</span>
                  </label>
                  <DebouncedTextarea
                    value={i2iCustomPrompt}
                    onChange={(val) => setI2iCustomPrompt(val)}
                    placeholder={retouchMode === 'i2i' ? "例如：将材质改为皮革，添加更多口袋，改变颜色为深蓝色..." : "例如：增强布料的纹理感，让拉链看起来更有金属光泽，增加一些自然的使用褶皱..."}
                    className={`w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 resize-none h-24 ${
                      retouchMode === 'i2i' ? 'focus:border-blue-500/50 focus:ring-blue-500/50' : 'focus:border-emerald-500/50 focus:ring-emerald-500/50'
                    }`}
                  />
                </div>

                <button
                  onClick={handleRetouchGenerate}
                  disabled={isI2iGenerating || (retouchMode === 'i2i' ? !i2iReferenceImage : !effectImageUrl[0])}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isI2iGenerating || (retouchMode === 'i2i' ? !i2iReferenceImage : !effectImageUrl[0])
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : retouchMode === 'i2i' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  {isI2iGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      正在生成...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
                      {retouchMode === 'i2i' ? '生成同款背包' : '生成实物图'}
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Result */}
              <div className="flex-1 flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-300">生成结果</label>
                <div className="flex-1 border border-white/10 rounded-xl bg-black/50 flex items-center justify-center min-h-[300px] relative overflow-hidden">
                  {i2iResultImage ? (
                    <img src={i2iResultImage} alt="Result" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-2">
                      {retouchMode === 'i2i' ? <ImageIcon size={32} className="opacity-50" /> : <Camera size={32} className="opacity-50" />}
                      <span className="text-sm">等待生成...</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={applyI2iResult}
                  disabled={!i2iResultImage}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    !i2iResultImage
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Check size={18} />
                  应用到效果图
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${
            notification.type === 'success' ? 'bg-slate-500/20 border-slate-500/50 text-slate-400' :
            notification.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
            'bg-slate-500/20 border-slate-500/50 text-slate-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> :
             notification.type === 'error' ? <AlertCircle size={18} /> :
             <Info size={18} />}
            <span className="text-sm font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 transition-opacity">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
