const fs = require('fs');
let c = fs.readFileSync('/app/applet/src/modules/AppearanceAnalysis.tsx', 'utf8');

const oldPrompt = "      const prompt = `\n" +
"        [IMAGE EDITING TASK]\n" +
"        You are an expert industrial designer. Edit the provided backpack image according to the following instructions.\n" +
"        \n" +
"        ${i2iSimilarity < 80 ? 'CRITICAL: You MUST make noticeable changes to the design. Do not return the exact same image.' : ''}\n" +
"        \n" +
"        Similarity Level: ${i2iSimilarity}%\n" +
"        \n" +
"        ${i2iSimilarity > 80 ? 'Make only very minor refinements. Keep the design almost identical to the reference image.' : ''}\n" +
"        ${i2iSimilarity > 40 && i2iSimilarity <= 80 ? 'Keep the core vibe and main structure, but introduce noticeable design variations, new paneling, or different hardware.' : ''}\n" +
"        ${i2iSimilarity <= 40 ? 'Use the reference image only as a loose inspiration. Create a significantly different and innovative backpack design.' : ''}\n" +
"        \n" +
"        ${i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\\n${i2iCustomPrompt}\\n(Please prioritize these requirements in your generation while respecting the similarity level.)` : ''}\n" +
"        \n" +
"        CRITICAL VIEWPOINT & COMPOSITION:\n" +
"        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.\n" +
"        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).\n" +
"        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.\n" +
"        \n" +
"        ${MANDATORY_ANATOMY_PROMPT}\n" +
"        \n" +
"        NEGATIVE PROMPTS:\n" +
"        ${NEGATIVE_ANATOMY_PROMPT}people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.\n" +
"        \n" +
"        ${HIGH_QUALITY_RENDERING}\n" +
"      `;";

const newPrompt = "      const prompt = i2iMode === 'sketch' ? `\n" +
"        [SKETCH TO REALISTIC IMAGE TASK]\n" +
"        You are an expert industrial designer. Convert the provided sketch/line drawing into a highly realistic, photorealistic physical product rendering of a backpack.\n" +
"        \n" +
"        CRITICAL: The output MUST NOT look like a sketch, drawing, or 3D model. It MUST look like a real photograph of a physical backpack.\n" +
"        Use the sketch as a structural guide, but apply realistic materials, textures, lighting, and shadows.\n" +
"        \n" +
"        ${i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\\n${i2iCustomPrompt}\\n(Please incorporate these requirements into the realistic rendering.)` : ''}\n" +
"        \n" +
"        CRITICAL VIEWPOINT & COMPOSITION:\n" +
"        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.\n" +
"        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).\n" +
"        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.\n" +
"        \n" +
"        ${MANDATORY_ANATOMY_PROMPT}\n" +
"        \n" +
"        NEGATIVE PROMPTS:\n" +
"        ${NEGATIVE_ANATOMY_PROMPT}sketch, drawing, line art, illustration, cartoon, 3D render, people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.\n" +
"        \n" +
"        ${HIGH_QUALITY_RENDERING}\n" +
"      ` : `\n" +
"        [IMAGE EDITING TASK]\n" +
"        You are an expert industrial designer. Edit the provided backpack image according to the following instructions.\n" +
"        \n" +
"        ${i2iSimilarity < 80 ? 'CRITICAL: You MUST make noticeable changes to the design. Do not return the exact same image.' : ''}\n" +
"        \n" +
"        Similarity Level: ${i2iSimilarity}%\n" +
"        \n" +
"        ${i2iSimilarity > 80 ? 'Make only very minor refinements. Keep the design almost identical to the reference image.' : ''}\n" +
"        ${i2iSimilarity > 40 && i2iSimilarity <= 80 ? 'Keep the core vibe and main structure, but introduce noticeable design variations, new paneling, or different hardware.' : ''}\n" +
"        ${i2iSimilarity <= 40 ? 'Use the reference image only as a loose inspiration. Create a significantly different and innovative backpack design.' : ''}\n" +
"        \n" +
"        ${i2iCustomPrompt ? `USER CUSTOM REQUIREMENTS:\\n${i2iCustomPrompt}\\n(Please prioritize these requirements in your generation while respecting the similarity level.)` : ''}\n" +
"        \n" +
"        CRITICAL VIEWPOINT & COMPOSITION:\n" +
"        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.\n" +
"        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).\n" +
"        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.\n" +
"        \n" +
"        ${MANDATORY_ANATOMY_PROMPT}\n" +
"        \n" +
"        NEGATIVE PROMPTS:\n" +
"        ${NEGATIVE_ANATOMY_PROMPT}people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.\n" +
"        \n" +
"        ${HIGH_QUALITY_RENDERING}\n" +
"      `;";

if (c.includes(oldPrompt)) {
  c = c.replace(oldPrompt, newPrompt);
  fs.writeFileSync('/app/applet/src/modules/AppearanceAnalysis.tsx', c);
  console.log('Replaced successfully');
} else {
  console.log('oldPrompt not found');
}
