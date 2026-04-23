const fs = require('fs');
let c = fs.readFileSync('./src/modules/AppearanceAnalysis.tsx', 'utf8');

const DOLLAR = String.fromCharCode(36);

const oldPrompt = "      const prompt = `\n" +
"        [IMAGE EDITING TASK]\n" +
"        You are an expert industrial designer. Edit the provided backpack image according to the following instructions.\n" +
"        \n" +
"        " + DOLLAR + "{i2iSimilarity < 80 ? 'CRITICAL: You MUST make noticeable changes to the design. Do not return the exact same image.' : ''}\n" +
"        \n" +
"        Similarity Level: " + DOLLAR + "{i2iSimilarity}%\n" +
"        \n" +
"        " + DOLLAR + "{i2iSimilarity > 80 ? 'Make only very minor refinements. Keep the design almost identical to the reference image.' : ''}\n" +
"        " + DOLLAR + "{i2iSimilarity > 40 && i2iSimilarity <= 80 ? 'Keep the core vibe and main structure, but introduce noticeable design variations, new paneling, or different hardware.' : ''}\n" +
"        " + DOLLAR + "{i2iSimilarity <= 40 ? 'Use the reference image only as a loose inspiration. Create a significantly different and innovative backpack design.' : ''}\n" +
"        \n" +
"        " + DOLLAR + "{i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\\n" + DOLLAR + "{i2iCustomPrompt}\\n(Please prioritize these requirements in your generation while respecting the similarity level.)` : ''}\n" +
"        \n" +
"        CRITICAL VIEWPOINT & COMPOSITION:\n" +
"        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.\n" +
"        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).\n" +
"        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.\n" +
"        \n" +
"        " + DOLLAR + "{MANDATORY_ANATOMY_PROMPT}\n" +
"        \n" +
"        NEGATIVE PROMPTS:\n" +
"        " + DOLLAR + "{NEGATIVE_ANATOMY_PROMPT}people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.\n" +
"        \n" +
"        " + DOLLAR + "{HIGH_QUALITY_RENDERING}\n" +
"      `;";

const newPrompt = "      const prompt = i2iMode === 'sketch' ? `\n" +
"        [SKETCH TO REALISTIC IMAGE TASK]\n" +
"        You are an expert industrial designer. Convert the provided sketch/line drawing into a highly realistic, photorealistic physical product rendering of a backpack.\n" +
"        \n" +
"        CRITICAL: The output MUST NOT look like a sketch, drawing, or 3D model. It MUST look like a real photograph of a physical backpack.\n" +
"        Use the sketch as a structural guide, but apply realistic materials, textures, lighting, and shadows.\n" +
"        \n" +
"        " + DOLLAR + "{i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\\n" + DOLLAR + "{i2iCustomPrompt}\\n(Please incorporate these requirements into the realistic rendering.)` : ''}\n" +
"        \n" +
"        CRITICAL VIEWPOINT & COMPOSITION:\n" +
"        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.\n" +
"        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).\n" +
"        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.\n" +
"        \n" +
"        " + DOLLAR + "{MANDATORY_ANATOMY_PROMPT}\n" +
"        \n" +
"        NEGATIVE PROMPTS:\n" +
"        " + DOLLAR + "{NEGATIVE_ANATOMY_PROMPT}sketch, drawing, line art, illustration, cartoon, 3D render, people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.\n" +
"        \n" +
"        " + DOLLAR + "{HIGH_QUALITY_RENDERING}\n" +
"      ` : `\n" +
"        [IMAGE EDITING TASK]\n" +
"        You are an expert industrial designer. Edit the provided backpack image according to the following instructions.\n" +
"        \n" +
"        " + DOLLAR + "{i2iSimilarity < 80 ? 'CRITICAL: You MUST make noticeable changes to the design. Do not return the exact same image.' : ''}\n" +
"        \n" +
"        Similarity Level: " + DOLLAR + "{i2iSimilarity}%\n" +
"        \n" +
"        " + DOLLAR + "{i2iSimilarity > 80 ? 'Make only very minor refinements. Keep the design almost identical to the reference image.' : ''}\n" +
"        " + DOLLAR + "{i2iSimilarity > 40 && i2iSimilarity <= 80 ? 'Keep the core vibe and main structure, but introduce noticeable design variations, new paneling, or different hardware.' : ''}\n" +
"        " + DOLLAR + "{i2iSimilarity <= 40 ? 'Use the reference image only as a loose inspiration. Create a significantly different and innovative backpack design.' : ''}\n" +
"        \n" +
"        " + DOLLAR + "{i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\\n" + DOLLAR + "{i2iCustomPrompt}\\n(Please prioritize these requirements in your generation while respecting the similarity level.)` : ''}\n" +
"        \n" +
"        CRITICAL VIEWPOINT & COMPOSITION:\n" +
"        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.\n" +
"        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).\n" +
"        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.\n" +
"        \n" +
"        " + DOLLAR + "{MANDATORY_ANATOMY_PROMPT}\n" +
"        \n" +
"        NEGATIVE PROMPTS:\n" +
"        " + DOLLAR + "{NEGATIVE_ANATOMY_PROMPT}people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.\n" +
"        \n" +
"        " + DOLLAR + "{HIGH_QUALITY_RENDERING}\n" +
"      `;";

c = c.replace(oldPrompt, newPrompt);

const oldControls = "{/* Left Column: Controls */}\n" +
"              <div className=\"flex-1 flex flex-col gap-6\">\n" +
"                <div className=\"space-y-2\">\n" +
"                  <label className=\"text-sm font-medium text-slate-300\">1. 上传参考图</label>";

const newControls = "{/* Left Column: Controls */}\n" +
"              <div className=\"flex-1 flex flex-col gap-6\">\n" +
"                <div className=\"flex bg-black/30 p-1 rounded-lg border border-white/10\">\n" +
"                  <button\n" +
"                    onClick={() => setI2iMode('image')}\n" +
"                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors " + DOLLAR + "{i2iMode === 'image' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}\n" +
"                  >\n" +
"                    以图生图\n" +
"                  </button>\n" +
"                  <button\n" +
"                    onClick={() => setI2iMode('sketch')}\n" +
"                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors " + DOLLAR + "{i2iMode === 'sketch' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}\n" +
"                  >\n" +
"                    线稿生成实物\n" +
"                  </button>\n" +
"                </div>\n" +
"\n" +
"                <div className=\"space-y-2\">\n" +
"                  <label className=\"text-sm font-medium text-slate-300\">1. 上传{" + DOLLAR + "{i2iMode === 'sketch' ? '线稿图' : '参考图'}}</label>";

c = c.replace(oldControls, newControls);

const oldSimilarity = "<div className=\"space-y-4\">\n" +
"                  <label className=\"text-sm font-medium text-slate-300 flex justify-between\">\n" +
"                    <span>2. 调整相似度</span>";

const newSimilarity = "{i2iMode === 'image' && (\n" +
"                  <div className=\"space-y-4\">\n" +
"                    <label className=\"text-sm font-medium text-slate-300 flex justify-between\">\n" +
"                      <span>2. 调整相似度</span>";

c = c.replace(oldSimilarity, newSimilarity);

const oldSimilarityEnd = "<span>100% (高度还原)</span>\n" +
"                  </div>\n" +
"                </div>\n" +
"\n" +
"                <div className=\"space-y-4\">\n" +
"                  <label className=\"text-sm font-medium text-slate-300 flex justify-between\">\n" +
"                    <span>3. 自定义修改需求 (可选)</span>";

const newSimilarityEnd = "<span>100% (高度还原)</span>\n" +
"                    </div>\n" +
"                  </div>\n" +
"                )}\n" +
"\n" +
"                <div className=\"space-y-4\">\n" +
"                  <label className=\"text-sm font-medium text-slate-300 flex justify-between\">\n" +
"                    <span>{i2iMode === 'image' ? '3' : '2'}. 自定义修改需求 (可选)</span>";

c = c.replace(oldSimilarityEnd, newSimilarityEnd);

const oldButton = "<Wand2 size={18} />\n" +
"                      生成同款背包";

const newButton = "<Wand2 size={18} />\n" +
"                      {i2iMode === 'sketch' ? '生成实物图' : '生成同款背包'}";

c = c.replace(oldButton, newButton);

fs.writeFileSync('./src/modules/AppearanceAnalysis.tsx', c);
console.log('Done');
