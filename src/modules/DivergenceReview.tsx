import React, { useState, useRef } from 'react';
import { useDesignStore } from '../store/useDesignStore';
import { Sparkles, Upload, Image as ImageIcon, RefreshCw, Download, Trash2, Users, ChevronDown, X, Palette, Loader2, Library } from 'lucide-react';
import { generateContentWithRetry, parseAIError } from '../utils/aiUtils';
import { StatusBar, CountDownTimer, ReconnectGuide, useErrorInterceptor } from '../components/ErrorSystem';
import { STYLE_CATEGORIES } from './CompetitorLibrary';
import { AssetLibraryModal } from '../components/AssetLibraryModal';

export const DivergenceReview: React.FC = () => {
  const { designData, updateDesignData } = useDesignStore();
  const { error: globalError, clearError: clearGlobalError, busyCountdown } = useErrorInterceptor();
  const [error, setError] = useState<string | null>(null);

  // Multi-View State
  const frontImage = designData.divergence?.frontImage || null;
  const multiViews = designData.divergence?.multiViews || {};
  
  const setFrontImage = (val: string | null) => updateDesignData('divergence', { frontImage: val });
  const setMultiViews = (val: any) => updateDesignData('divergence', { multiViews: val });

  const [isGeneratingViews, setIsGeneratingViews] = useState(false);
  const [targetView, setTargetView] = useState<'all' | 'front' | 'left' | 'right' | 'back' | 'top' | 'bottom' | 'reference'>('all');
  const [enlargedView, setEnlargedView] = useState<{id: string, label: string, img: string} | null>(null);
  const [enlargedViewPrompt, setEnlargedViewPrompt] = useState('');

  // Colorway Conversion State
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const colorways = designData.divergence?.colorways || []; 
  // colorways structured as: { hex: string, name: string, views: Record<string, string> }
  const setColorways = (vals: any[]) => updateDesignData('divergence', { colorways: vals });
  const [activeColorwayIndex, setActiveColorwayIndex] = useState<number>(-1); // -1 means original
  const [isGeneratingColorway, setIsGeneratingColorway] = useState(false);
  
  // Scenario Generation State
  const [customScenario, setCustomScenario] = useState<string>('');
  const scenarioImage = designData.divergence?.scenarioImage || null;
  const scenarioReferenceImage = designData.divergence?.scenarioReferenceImage || null;
  const scenarioReferenceLabel = designData.divergence?.scenarioReferenceLabel || '正视图';
  
  const setScenarioImage = (val: string | null) => updateDesignData('divergence', { scenarioImage: val });
  const setScenarioReferenceImage = (val: string | null) => updateDesignData('divergence', { scenarioReferenceImage: val });
  const setScenarioReferenceLabel = (val: string) => updateDesignData('divergence', { scenarioReferenceLabel: val });

  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  
  // Model Parameters State
  const [modelGender, setModelGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [modelEthnicity, setModelEthnicity] = useState<'asian' | 'caucasian' | 'african' | 'latino'>('asian');
  const [modelHeight, setModelHeight] = useState<number>(175);
  const [backpackVolume, setBackpackVolume] = useState<number>(20);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'front') setFrontImage(ev.target?.result as string);
        setMultiViews({});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'front') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'front') setFrontImage(ev.target?.result as string);
        setMultiViews({});
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMultiViews = async (specificTargetView?: string, customPromptOverride?: string) => {
    if (!frontImage) {
      setError("请先上传产品参考图");
      return;
    }
    
    const isEditing = !!customPromptOverride;
    const isEditingColorway = isEditing && activeColorwayIndex > -1;

    // Retrieve global colors from designData to enforce color consistency during spatial translation
    const globalColorsList = designData.appearance?.selectedColors || [];
    const globalColorContext = globalColorsList.length > 0 
      ? `CRITICAL COLOR DRIFT PREVENTION: The exact hex colors of this backpack are ${globalColorsList.join(', ')}. You MUST forcefully map these exact hex colors onto the generated bag. Do NOT let the color drift or become desaturated.`
      : 'CRITICAL RULE 2: ABSOLUTELY PRESERVE THE COLOR AND MATERIAL TEXTURE of the input images. Do NOT change colors randomly.';

    setIsGeneratingViews(true);
    setError(null);
    const viewToGenerate = specificTargetView || targetView;
    try {
      const basePrompt = `You are an expert industrial designer. The user has provided an image of a backpack. 
YOUR TASK: Create ONE highly accurate ORTHOGRAPHIC (2D flat) projection of this specific bag from the specified angle. 
CRITICAL RULE 1: DO NOT copy the camera angle of the reference image. You must FORCE the camera angle to match the [TARGET VIEW] instruction exactly. 
${globalColorContext}
Maintain the same proportions, materials, colors, and key structural features. Pure white background, studio lighting. DO NOT return an image containing two bags. Return ONLY ONE BAG.`;
      
      const generateView = async (viewPrompt: string) => {
        const customEditColorHint = globalColorsList.length > 0 ? `\n[System Core Colors: ${globalColorsList.join(', ')}]. If the user asks you to fix, copy, or match a color, you MUST forcefully completely overwrite the bag's color to these exact System Core Colors. Strip away any wrong hues previously generated.` : ``;
        const finalPrompt = isEditing 
          ? `Modify this specific backpack view exactly as requested by the user: [${customPromptOverride}]. IMPORTANT: Keep the exact same camera angle, background, and core shape of the input image. CRITICALLY IMPORTANT: Prevent color drift. Unless the user asks for a color change, reproduce the original hue perfectly without making it overly desaturated or muddy. ${customEditColorHint}` 
          : `${basePrompt}\n\n[TARGET VIEW]: ${viewPrompt}\n\n[NEGATIVE PROMPTS] DO NOT USE THE ORIGINAL CAMERA ANGLE! DO NOT draw a 3/4 perspective view! It MUST be flat 2D orthographic! DO NOT render multiple bags! No holes, no perforations, no dotted patterns, no trypophobia!`;
        
        let textContent = finalPrompt;
        const parts: any[] = [];
        
        const currentViewsContext = isEditingColorway ? colorways[activeColorwayIndex].views : multiViews;
        const currentRefContext = isEditingColorway ? (colorways[activeColorwayIndex].views.reference || frontImage) : frontImage;
        
        if (isEditing) {
          // If editing a specific view, we MUST provide the exact image being edited.
          // We will NOT composite images because it causes the AI model to output 2 bags in one image.
          let targetImgToEdit = null;
          if (viewToGenerate === 'reference') targetImgToEdit = currentRefContext;
          else if (viewToGenerate !== 'all') targetImgToEdit = currentViewsContext[viewToGenerate];
          
          if (targetImgToEdit) {
            textContent += "\n[Target Image to Edit]";
            parts.push({ inlineData: { data: targetImgToEdit.split(',')[1], mimeType: 'image/jpeg' } });
          } else {
            // Fallback to front image if the target isn't generated yet
            if (currentRefContext) {
              textContent += "\n[Target Image to Edit]";
              parts.push({ inlineData: { data: currentRefContext.split(',')[1], mimeType: 'image/jpeg' } });
            }
          }
        } else {
          // Add front image as the only context
          if (currentRefContext) {
            textContent += "\n[Reference Image]";
            parts.push({ inlineData: { data: currentRefContext.split(',')[1], mimeType: 'image/jpeg' } });
          }
        }

        parts.unshift({ text: textContent });

        const finalParts = parts;

        const response = await generateContentWithRetry({
          model: 'gemini-2.5-flash-image',
          contents: { parts: finalParts },
          config: {
            imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
          }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        return null;
      };

      if (isEditingColorway) {
        if (viewToGenerate === 'all') return; // Should not happen in UI
        const cwViews = { ...colorways[activeColorwayIndex].views };
        const editedImg = await generateView("This is the target view. Keep the camera angle identical but implement the user's modifications.");
        if (editedImg) {
          cwViews[viewToGenerate] = editedImg;
          const newColorways = [...colorways];
          newColorways[activeColorwayIndex] = { ...newColorways[activeColorwayIndex], views: cwViews };
          setColorways(newColorways);
        }
      } else {
        const newViews = { ...multiViews };

        if (viewToGenerate === 'all' || viewToGenerate === 'front') {
          newViews.front = await generateView("FRONT VIEW: Draw the bag facing directly forward. The main logo and front pockets are in the center. The shoulder straps are completely hidden behind the bag. Symmetrical outline.") || newViews.front;
        }
        if (viewToGenerate === 'all' || viewToGenerate === 'left') {
          newViews.left = await generateView("LEFT SIDE VIEW: The backpack points to the Left. The shoulder straps are visible on the RIGHT side of the image. The front face of the bag is on the LEFT side of the image.") || newViews.left;
        }
        if (viewToGenerate === 'all' || viewToGenerate === 'right') {
          newViews.right = await generateView("RIGHT SIDE VIEW: The backpack points to the Right. The shoulder straps are visible on the LEFT side of the image. The front face of the bag is on the RIGHT side of the image. This is a mirror opposite angle of the left side.") || newViews.right;
        }
        if (viewToGenerate === 'all' || viewToGenerate === 'back') {
          newViews.back = await generateView("BACK VIEW: Draw the rear of the bag facing the camera. The shoulder straps, suspension system, and back padding take up the entire center of the image. The front of the bag is completely hidden.") || newViews.back;
        }
        if (viewToGenerate === 'all' || viewToGenerate === 'top') {
          newViews.top = await generateView("TOP-DOWN VIEW: View from above. Show only the top zipper and top grab handle.") || newViews.top;
        }
        if (viewToGenerate === 'all' || viewToGenerate === 'bottom') {
          newViews.bottom = await generateView("BOTTOM-UP VIEW: View from below. Show only the flat bottom base and bottom straps.") || newViews.bottom;
        }
        
        if (viewToGenerate === 'reference') {
          const editedRef = await generateView("This is the main product reference view. Keep the camera angle identical but implement the user's modifications.");
          if (editedRef) {
            setFrontImage(editedRef);
          }
        }

        setMultiViews(newViews);
      }
    } catch (err: any) {
      console.error('Failed to generate multi-views:', err);
      setError(parseAIError(err, "生成多视角/修改失败"));
    } finally {
      setIsGeneratingViews(false);
    }
  };

  const generateColorwayViews = async (colorInfo: { hex: string, name: string }) => {
    // Generate new front, left, right, back, top, bottom using the original multiViews but with color override constraint
    if (!frontImage && !multiViews.front) {
      setError("请先生成或上传原始结构多视角方案");
      return;
    }
    
    setIsGeneratingColorway(true);
    setError(null);
    try {
      const viewsToGenerate = ['front', 'left', 'right', 'back', 'top', 'bottom'] as const;
      const newViews: any = {};
      
      const realColorName = colorInfo.name === '自定义颜色' || colorInfo.name === '提取颜色' ? 'this exact color' : colorInfo.name;
      const basePrompt = `You are a professional product color retoucher. 
TASK: Recolor the MAIN FABRIC of the backpack in the image to EXACTLY THIS COLOR: ${colorInfo.hex} (${realColorName}).
CRITICAL COLOR ACCURACY RULE: You MUST output the true, absolute ${colorInfo.hex} color. Ignore any existing color cast in the original image. Force a neutral studio white lighting so the ${colorInfo.hex} hue is perfectly represented without becoming muddy, desaturated, or overly tinted. 
CRITICAL RULE 2: Leave all black straps, webbing, buckles, zippers, and mesh padding EXACTLY as they are. DO NOT color them.
CRITICAL RULE 3: Keep the exact same camera angle, lighting, pure white background, shape, and structure. Do NOT alter the backpack's form or geometry. DO NOT add multiple bags. Return ONE single bag just like the original image.`;
      
      const generateColoredView = async (originalImg: string | null) => {
        if (!originalImg) return null;
        const textContent = `${basePrompt}\n\n[Original Image to Recolor]`;
        const parts: any[] = [
          { text: textContent },
          { inlineData: { data: originalImg.split(',')[1], mimeType: 'image/jpeg' } }
        ];
        
        try {
          const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
              imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
            }
          });
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          }
        } catch (e) {
          console.error("Single view coloring failed:", e);
        }
        return null;
      };

      // To speed up, we can do them in parallel
      const generationPromises = viewsToGenerate.map(async (viewId) => {
        const sourceImg = multiViews[viewId] || (viewId === 'front' ? frontImage : null);
        if (sourceImg) {
          const coloredImg = await generateColoredView(sourceImg);
          if (coloredImg) {
            newViews[viewId] = coloredImg;
          }
        }
      });
      
      // Also recolor frontImage as the 'reference' if it exists and is distinct (or just always do it if it exists)
      if (frontImage) {
        generationPromises.push(
          generateColoredView(frontImage).then(coloredImg => {
            if (coloredImg) newViews.reference = coloredImg;
          })
        );
      }
      
      await Promise.all(generationPromises);

      const newColorways = [...colorways];
      const existingIdx = newColorways.findIndex(c => c.hex === colorInfo.hex);
      if (existingIdx > -1) {
        newColorways[existingIdx] = { ...colorInfo, views: newViews };
        setActiveColorwayIndex(existingIdx);
      } else {
        newColorways.push({ ...colorInfo, views: newViews });
        setActiveColorwayIndex(newColorways.length - 1);
      }
      setColorways(newColorways);

    } catch (err: any) {
      console.error('Failed to generate colorway views:', err);
      setError(parseAIError(err, "生成齐色方案失败"));
    } finally {
      setIsGeneratingColorway(false);
    }
  };

  const handleDeleteView = (viewId: 'front' | 'left' | 'right' | 'back' | 'top' | 'bottom') => {
    setMultiViews({ ...multiViews, [viewId]: undefined });
  };

  const handleSaveView = (viewId: 'front' | 'left' | 'right' | 'back' | 'top' | 'bottom', imgData: string) => {
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `backpack_${viewId}_view.jpg`;
    link.click();
  };

  const handleImportToScenario = (imgData: string, label: string) => {
    setScenarioReferenceImage(imgData);
    setScenarioReferenceLabel(label);
    const scenarioSection = document.getElementById('scenario-section');
    if (scenarioSection) {
      scenarioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const generateScenario = async () => {
    const referenceImg = scenarioReferenceImage || multiViews.front || frontImage;
    if (!referenceImg) {
      setError("请先上传产品参考图或从多视角导入");
      return;
    }
    
    setIsGeneratingScenario(true);
    setError(null);
    try {
      // Prioritize manually filled custom scenarios, then fall back to the design definition's scenarios
      const defResult = designData.definition?.result;
      const definitionScenarios = defResult?.scenarios?.join(', ') || '自然场景';
      const scenarioDesc = customScenario || definitionScenarios;
      
      const genderMap = { male: 'Male', female: 'Female', neutral: 'Androgynous/Neutral' };
      const ethnicityMap = { asian: 'Asian', caucasian: 'Caucasian', african: 'African', latino: 'Latino' };
      
      // Also grab target users from definition as extra context
      const targetUsersContext = defResult?.targetUsers ? `\n        TARGET AUDIENCE CONTEXT: ${defResult.targetUsers.join(', ')}` : '';
      
      const determineScaleDescription = (vol: number, height: number) => {
        if (vol <= 15) return `[VISUAL SCALE: TINY/MINI]. The bag is small. Because the model is ${height}cm tall, a ${vol}L bag MUST look like a tiny daypack. It MUST ONLY sit high on the back between the shoulder blades.`;
        if (vol <= 25) return `[VISUAL SCALE: COMPACT DAYPACK]. Because the model is ${height}cm tall, this ${vol}L bag MUST be drawn unusually SMALL compared to standard AI generations. It MUST leave a LARGE empty space (at least 20cm/8 inches) between the bottom of the bag and the model's waist/belt. DO NOT let the bag reach the lower back!`;
        if (vol <= 35) return `[VISUAL SCALE: REGULAR COMMUTER]. This ${vol}L bag covers most of the ${height}cm model's back, stopping naturally above the belt.`;
        return `[VISUAL SCALE: HUGE HIKING]. This ${vol}L bag is massive, resting heavily on the hips and extending outwards.`;
      };
      
      const prompt = `
        [LIFESTYLE AI SYNTHESIZER]
        Generate a highly commercial, photorealistic lifestyle promotional photo.
        
        ENVIRONMENT / SCENARIOS: ${scenarioDesc}.${targetUsersContext}
        
        MODEL PERSONA:
        - Gender: ${genderMap[modelGender]}
        - Ethnicity: ${ethnicityMap[modelEthnicity]}
        - Height: Approximately ${modelHeight}cm.
        
        PRODUCT SPECIFICATIONS & SCALE PROPORTION:
        - Backpack Capacity: ${backpackVolume} Liters (L).
        - VISUAL SCALE DIRECTIVE: ${determineScaleDescription(backpackVolume, modelHeight)}
        
        CRITICAL INSTRUCTIONS (3D INTEGRATION & POSING):
        1. NO 2D PASTING (CRITICAL): You are FORBIDDEN from merely copy-pasting or flatly overlaying the 2D reference image into the scene. You MUST reconstruct the backpack in true 3D space.
        2. PERFECT PERSPECTIVE & LIGHTING: The angle, perspective, and 3D volume of the backpack MUST seamlessly match the model's pose.
        3. ANATOMICAL WEARING: The model MUST be physically wearing the backpack. The shoulder straps MUST naturally wrap over the model's front shoulders.
        4. SHRINK THE BAG (CRITICAL SCALE OVERRIDE): Image AI models notoriously generate backpacks 2x too large. You MUST forcibly SHRINK the backpack so it matches the ${backpackVolume}L VISUAL SCALE DIRECTIVE. For a 20-25L bag, there MUST be significant visible clothing between the bottom of the bag and the model's belt!
        5. DESIGN CONTINUITY: Keep the exact materials, colors, and core details of the reference prompt, but scale its physical volume DOWN to fit the human accurately.
        
        NEGATIVE PROMPTS: oversized backpack, giant bag, oversized luggage, hiking pack scale, bag touching waist, bad proportions, massive object, clipped clipping.
        
        High quality, photorealistic, cinematic lighting, ultra-detailed commercial photography.
      `;
      
      const response = await generateContentWithRetry({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: referenceImg.split(',')[1], mimeType: 'image/jpeg' } }
          ]
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setScenarioImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err: any) {
      console.error('Failed to generate scenario:', err);
      setError(parseAIError(err, "生成场景图失败"));
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto w-full custom-scrollbar">
      <StatusBar error={globalError} onClear={clearGlobalError} />
      {globalError?.type === '429' && <CountDownTimer seconds={busyCountdown} />}
      {globalError?.type === 'CONNECTION_CLOSED' && <ReconnectGuide />}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
          <RefreshCw size={14} />
          {error}
        </div>
      )}

      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">5. 产品展示</h2>
        <p className="text-base text-slate-400 max-w-3xl leading-relaxed">多视角解构与展示，全方位评估设计方案。</p>
      </header>

      {/* Feature 1: Multi-View Projection */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-400" />
              多视角转换系统 (Multi-View Projection)
            </h3>
            <p className="text-xs text-slate-400 mt-1">利用 ControlNet 技术，将确认的外观透视图解构为标准工业六视图。</p>
          </div>
          <button
            onClick={() => {
              setTargetView('all');
              generateMultiViews('all');
            }}
            disabled={!frontImage || isGeneratingViews}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg text-sm font-medium transition-all"
          >
            {isGeneratingViews ? <RefreshCw size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            {isGeneratingViews ? '解构中...' : '生成六视图'}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {/* Col 1: Input Images */}
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-slate-300 flex justify-between items-center">
                <span>参考图 (Reference)</span>
                {(() => {
                  const currentRefImage = activeColorwayIndex > -1 && colorways[activeColorwayIndex] && colorways[activeColorwayIndex].views.reference ? colorways[activeColorwayIndex].views.reference : frontImage;
                  return currentRefImage ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSaveView('reference' as any, currentRefImage)} className="text-slate-400 hover:text-white transition-colors" title="保存">
                        <Download size={14} />
                      </button>
                      <button onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => handleImageUpload(e as any, 'front');
                        input.click();
                      }} className="text-xs text-indigo-400 hover:text-indigo-300">
                        重新上传
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
              <div 
                className={`aspect-[3/4] rounded-2xl border-2 border-dashed ${frontImage ? 'border-indigo-500/50 bg-black/40 group relative' : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'} flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'front')}
                onClick={() => {
                  const currentRefImage = activeColorwayIndex > -1 && colorways[activeColorwayIndex] && colorways[activeColorwayIndex].views.reference ? colorways[activeColorwayIndex].views.reference : frontImage;
                  if (currentRefImage && !isGeneratingViews) {
                    setEnlargedView({ id: 'reference', label: '参考图 (Reference)', img: currentRefImage });
                    setEnlargedViewPrompt('');
                  } else if (!isGeneratingViews) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleImageUpload(e as any, 'front');
                    input.click();
                  }
                }}
              >
                {(() => {
                  const currentRefImage = activeColorwayIndex > -1 && colorways[activeColorwayIndex] && colorways[activeColorwayIndex].views.reference ? colorways[activeColorwayIndex].views.reference : frontImage;
                  
                  if (isGeneratingViews && targetView === 'reference') {
                    return (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-indigo-400 animate-pulse">修改渲染中...</span>
                      </div>
                    );
                  }

                  return currentRefImage ? (
                    <>
                      <img src={currentRefImage} alt="Reference View" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">点击放大查看</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
                      <Upload size={24} className="text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-300">上传产品参考图</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 6 Views */}
            {[
              { id: 'front', label: '正视图 (Front)', desc: '强调 Logo 位置、正面拉链线条', img: activeColorwayIndex > -1 && colorways[activeColorwayIndex] ? colorways[activeColorwayIndex].views.front : multiViews.front },
              { id: 'left', label: '左视图 (Left)', desc: '展示包体左侧厚度、水杯仓/挂带', img: activeColorwayIndex > -1 && colorways[activeColorwayIndex] ? colorways[activeColorwayIndex].views.left : multiViews.left },
              { id: 'right', label: '右视图 (Right)', desc: '展示包体右侧厚度、水杯仓/挂带', img: activeColorwayIndex > -1 && colorways[activeColorwayIndex] ? colorways[activeColorwayIndex].views.right : multiViews.right },
              { id: 'back', label: '背视图 (Back)', desc: '展示背负系统、肩带形状及胸扣细节', img: activeColorwayIndex > -1 && colorways[activeColorwayIndex] ? colorways[activeColorwayIndex].views.back : multiViews.back },
              { id: 'top', label: '顶部视图 (Top)', desc: '展示顶部提手、主拉链开口', img: activeColorwayIndex > -1 && colorways[activeColorwayIndex] ? colorways[activeColorwayIndex].views.top : multiViews.top },
              { id: 'bottom', label: '底部视图 (Bottom)', desc: '展示底部材质、绑带及深度', img: activeColorwayIndex > -1 && colorways[activeColorwayIndex] ? colorways[activeColorwayIndex].views.bottom : multiViews.bottom }
            ].map((view) => (
              <div key={view.id} className="flex flex-col gap-2">
                <div className="text-sm font-medium text-slate-300 flex justify-between items-center">
                  <span>{view.label}</span>
                  {view.img && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleImportToScenario(view.img!, view.label)} className="text-slate-400 hover:text-blue-400 transition-colors" title="一键导入到智能场景">
                        <Sparkles size={14} />
                      </button>
                      <button onClick={() => handleSaveView(view.id as any, view.img!)} className="text-slate-400 hover:text-white transition-colors" title="保存">
                        <Download size={14} />
                      </button>
                      {activeColorwayIndex === -1 && (
                        <button onClick={() => handleDeleteView(view.id as any)} className="text-slate-400 hover:text-red-400 transition-colors" title="删除">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div 
                  className="aspect-[3/4] rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden flex items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition-all"
                  onClick={() => {
                    if (view.img) {
                      setEnlargedView({ id: view.id, label: view.label, img: view.img });
                      setEnlargedViewPrompt('');
                    } else if (activeColorwayIndex === -1) {
                      document.getElementById(`view-upload-${view.id}`)?.click();
                    }
                  }}
                >
                  <input 
                    id={`view-upload-${view.id}`}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const url = event.target?.result as string;
                          updateDesignData('divergence', {
                            multiViews: { ...multiViews, [view.id]: url }
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {view.img ? (
                    <>
                      <img src={view.img} alt={view.label} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">点击放大查看</span>
                      </div>
                    </>
                  ) : isGeneratingViews && (targetView === 'all' || targetView === view.id) && activeColorwayIndex === -1 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-indigo-400 animate-pulse">生成中...</span>
                    </div>
                  ) : isGeneratingColorway ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-fuchsia-400 animate-pulse">调色中...</span>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Upload size={24} className="mx-auto text-slate-600 mb-2 group-hover:text-indigo-400 transition-colors" />
                      <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">点击上传或生成</p>
                      <p className="text-[10px] text-slate-600 mt-1">{view.desc}</p>
                    </div>
                  )}
                </div>
                {/* Target View Button */}
                {activeColorwayIndex === -1 && (
                  <button
                    onClick={() => {
                      setTargetView(view.id as any);
                      generateMultiViews(view.id);
                    }}
                    disabled={!frontImage || isGeneratingViews}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 disabled:bg-black/20 disabled:text-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 mt-1"
                  >
                    {isGeneratingViews && targetView === view.id ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    单独生成此视角
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 2: Colorway Conversion System */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Palette size={18} className="text-fuchsia-400" />
              齐色转换系统 (Colorway Conversion Array)
            </h3>
            <p className="text-xs text-slate-400 mt-1">跟随选定款式的多视角的六视图转换其他颜色配置。</p>
          </div>
          <button
            onClick={() => setIsLibraryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Library size={16} />
            从色彩库选取
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div 
            onClick={() => setActiveColorwayIndex(-1)}
            className={`cursor-pointer px-4 py-2 rounded-xl border flex items-center gap-3 transition-all ${activeColorwayIndex === -1 ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-black/40 border-white/10 hover:border-white/30'}`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-600 shadow-inner" />
            <span className="text-sm font-medium text-white">原始配色 (Original)</span>
          </div>

          {colorways.map((cw: { hex: string, name: string }, idx: number) => (
            <div 
              key={idx}
              onClick={() => setActiveColorwayIndex(idx)}
              className={`group cursor-pointer pl-4 pr-2 py-2 rounded-xl border flex items-center gap-2 transition-all ${activeColorwayIndex === idx ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-black/40 border-white/10 hover:border-white/30'}`}
            >
              <div className="w-6 h-6 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: cw.hex }} />
              <span className="text-sm font-medium text-white pr-2">{cw.name}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newColorways = colorways.filter((_: any, i: number) => i !== idx);
                  if (activeColorwayIndex === idx || activeColorwayIndex >= newColorways.length) {
                    setActiveColorwayIndex(-1);
                  } else if (activeColorwayIndex > idx) {
                    setActiveColorwayIndex(activeColorwayIndex - 1);
                  }
                  setColorways(newColorways);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-all"
                title="删除配置"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {isGeneratingColorway && (
            <div className="px-4 py-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 flex items-center gap-2">
              <Loader2 className="animate-spin text-fuchsia-400" size={16} />
              <span className="text-sm font-medium text-fuchsia-300">正在渲染新配色...</span>
            </div>
          )}
        </div>
      </div>

      <AssetLibraryModal 
        isOpen={isLibraryModalOpen} 
        onClose={() => setIsLibraryModalOpen(false)} 
        initialTab="color" 
        onSelect={(type, value) => {
          if (type === 'color') {
            generateColorwayViews({ hex: value.hex, name: value.name });
            setIsLibraryModalOpen(false);
          }
        }}
      />

      {/* Feature 3: Lifestyle AI Synthesizer */}
      <div id="scenario-section" className="glass-panel p-6 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon size={18} className="text-blue-400" />
              智能场景与模特合成 (Lifestyle AI Synthesizer)
            </h3>
            <p className="text-xs text-slate-400 mt-1">将设计稿转化为极具商业感的宣传照，通过参数化控制模特与环境。</p>
          </div>
          <button
            onClick={generateScenario}
            disabled={!(scenarioReferenceImage || multiViews.front || frontImage) || isGeneratingScenario}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg text-sm font-medium transition-all"
          >
            {isGeneratingScenario ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGeneratingScenario ? '合成中...' : '合成宣传照'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="flex flex-col gap-6">
            {/* Reference Image Info */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-400" />
                参考图 (Reference Image)
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                  {(scenarioReferenceImage || multiViews.front || frontImage) ? (
                    <img src={scenarioReferenceImage || multiViews.front || frontImage!} alt="Reference" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300 font-medium">
                    {scenarioReferenceImage ? `已导入: ${scenarioReferenceLabel}` : (multiViews.front || frontImage) ? '默认: 正视图' : '未选择参考图'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    在上方多视角系统中点击 ✨ 导入其他视角
                  </span>
                </div>
              </div>
            </div>

            {/* Model Settings */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                模特定义 (Model Setting)
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">性别 (Gender)</label>
                  <div className="flex gap-2">
                    {['male', 'female', 'neutral'].map(g => (
                      <button
                        key={g}
                        onClick={() => setModelGender(g as any)}
                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${modelGender === g ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {g === 'male' ? '男' : g === 'female' ? '女' : '中性'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">人种 (Ethnicity)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'asian', label: '亚洲' },
                      { id: 'caucasian', label: '欧美' },
                      { id: 'african', label: '非洲' },
                      { id: 'latino', label: '拉丁' }
                    ].map(e => (
                      <button
                        key={e.id}
                        onClick={() => setModelEthnicity(e.id as any)}
                        className={`py-1.5 text-xs rounded-lg border transition-colors ${modelEthnicity === e.id ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400">身高 (Height)</label>
                    <span className="text-xs text-indigo-300 font-medium">{modelHeight} cm</span>
                  </div>
                  <input 
                    type="range" 
                    min="150" max="200" step="1"
                    value={modelHeight}
                    onChange={(e) => setModelHeight(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400">背包容量 (Volume)</label>
                    <span className="text-xs text-indigo-300 font-medium">{backpackVolume} L</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" max="60" step="1"
                    value={backpackVolume}
                    onChange={(e) => setBackpackVolume(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">系统将根据身高和容量自动计算精准的上身比例</p>
                </div>
              </div>
            </div>

            {/* Scene Settings */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-400" />
                场景定义 (Environment Assets)
              </h4>
              <p className="text-[10px] text-slate-500 mb-2">默认将使用您在“设计定义”中提到的场景与人群。您也可以在此追加或覆盖自定义场景。</p>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">自定义场景</label>
                <textarea
                  value={customScenario}
                  onChange={(e) => {
                    setCustomScenario(e.target.value);
                  }}
                  placeholder="描述你想要的场景，例如：放在一个木制长椅上，旁边有落叶..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none h-20"
                />
              </div>
            </div>
          </div>

          {/* Right: Result */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="text-sm font-medium text-slate-300 flex justify-between items-center">
              <span>场景效果图 (Scenario Render)</span>
              {scenarioImage && (
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = scenarioImage;
                    link.download = 'backpack_scenario.jpg';
                    link.click();
                  }} 
                  className="text-slate-400 hover:text-white transition-colors" 
                  title="保存"
                >
                  <Download size={16} />
                </button>
              )}
            </div>
            <div className="w-full aspect-video rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden flex items-center justify-center group">
              {scenarioImage ? (
                <img src={scenarioImage} alt="Scenario Render" className="w-full h-full object-cover" />
              ) : isGeneratingScenario ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-blue-400 animate-pulse">正在渲染场景...</span>
                </div>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon size={32} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500">点击生成场景图</p>
                  <p className="text-xs text-slate-600 mt-1">将使用正视图作为参考</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Enlarged View Modal */}
      {enlargedView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-slate-900 rounded-3xl border border-white/10 w-full max-w-5xl flex flex-col max-h-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">{enlargedView.label}</h3>
              <button 
                onClick={() => setEnlargedView(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-black/40">
              <img src={enlargedView.img} alt={enlargedView.label} className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg" />
            </div>

            <div className="p-6 border-t border-white/10 bg-slate-900/50">
              <label className="text-sm font-medium text-slate-300 mb-2 block">自定义修改 (Custom Prompt)</label>
              <div className="flex gap-3">
                <input
                  value={enlargedViewPrompt}
                  onChange={(e) => setEnlargedViewPrompt(e.target.value)}
                  placeholder="例如：侧边增加一个水杯袋，肩带加宽..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isGeneratingViews) {
                      setTargetView(enlargedView.id as any);
                      generateMultiViews(enlargedView.id, enlargedViewPrompt);
                      setEnlargedView(null);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setTargetView(enlargedView.id as any);
                    generateMultiViews(enlargedView.id, enlargedViewPrompt);
                    setEnlargedView(null);
                  }}
                  disabled={isGeneratingViews}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  {isGeneratingViews ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  确认修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
