const fs = require('fs');
let c = fs.readFileSync('/app/applet/src/modules/AppearanceAnalysis.tsx', 'utf8');

const oldPrompt = `      const prompt = \`
        [IMAGE EDITING TASK]
        You are an expert industrial designer. Edit the provided backpack image according to the following instructions.
        
        \${i2iSimilarity < 80 ? 'CRITICAL: You MUST make noticeable changes to the design. Do not return the exact same image.' : ''}
        
        Similarity Level: \${i2iSimilarity}%
        
        \${i2iSimilarity > 80 ? 'Make only very minor refinements. Keep the design almost identical to the reference image.' : ''}
        \${i2iSimilarity > 40 && i2iSimilarity <= 80 ? 'Keep the core vibe and main structure, but introduce noticeable design variations, new paneling, or different hardware.' : ''}
        \${i2iSimilarity <= 40 ? 'Use the reference image only as a loose inspiration. Create a significantly different and innovative backpack design.' : ''}
        
        \${i2iCustomPrompt ? \`USER CUSTOM REQUIREMENTS:\\n\${i2iCustomPrompt}\\n(Please prioritize these requirements in your generation while respecting the similarity level.)\` : ''}
        
        CRITICAL VIEWPOINT & COMPOSITION:
        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.
        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).
        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.
        
        \${MANDATORY_ANATOMY_PROMPT}
        
        NEGATIVE PROMPTS:
        \${NEGATIVE_ANATOMY_PROMPT}people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.
        
        \${HIGH_QUALITY_RENDERING}
      \`;`;

const newPrompt = `      const prompt = i2iMode === 'sketch' ? \`
        [SKETCH TO REALISTIC IMAGE TASK]
        You are an expert industrial designer. Convert the provided sketch/line drawing into a highly realistic, photorealistic physical product rendering of a backpack.
        
        CRITICAL: The output MUST NOT look like a sketch, drawing, or 3D model. It MUST look like a real photograph of a physical backpack.
        Use the sketch as a structural guide, but apply realistic materials, textures, lighting, and shadows.
        
        \${i2iCustomPrompt ? \`USER CUSTOM REQUIREMENTS:\\n\${i2iCustomPrompt}\\n(Please incorporate these requirements into the realistic rendering.)\` : ''}
        
        CRITICAL VIEWPOINT & COMPOSITION:
        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.
        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).
        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.
        
        \${MANDATORY_ANATOMY_PROMPT}
        
        NEGATIVE PROMPTS:
        \${NEGATIVE_ANATOMY_PROMPT}sketch, drawing, line art, illustration, cartoon, 3D render, people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.
        
        \${HIGH_QUALITY_RENDERING}
      \` : \`
        [IMAGE EDITING TASK]
        You are an expert industrial designer. Edit the provided backpack image according to the following instructions.
        
        \${i2iSimilarity < 80 ? 'CRITICAL: You MUST make noticeable changes to the design. Do not return the exact same image.' : ''}
        
        Similarity Level: \${i2iSimilarity}%
        
        \${i2iSimilarity > 80 ? 'Make only very minor refinements. Keep the design almost identical to the reference image.' : ''}
        \${i2iSimilarity > 40 && i2iSimilarity <= 80 ? 'Keep the core vibe and main structure, but introduce noticeable design variations, new paneling, or different hardware.' : ''}
        \${i2iSimilarity <= 40 ? 'Use the reference image only as a loose inspiration. Create a significantly different and innovative backpack design.' : ''}
        
        \${i2iCustomPrompt ? \`USER CUSTOM REQUIREMENTS:\\n\${i2iCustomPrompt}\\n(Please prioritize these requirements in your generation while respecting the similarity level.)\` : ''}
        
        CRITICAL VIEWPOINT & COMPOSITION:
        - MANDATORY FRONT-LEFT 3/4 PERSPECTIVE: You MUST render the backpack from a front-left 3/4 angle, clearly showing BOTH the front panel and the left side panel.
        - WHITE BACKGROUND: The backpack MUST be rendered against a PURE, SOLID WHITE studio background (#FFFFFF).
        - NO PEOPLE: ABSOLUTELY NO humans, NO models, NO hands, NO feet, NO faces. ONLY the product itself.
        
        \${MANDATORY_ANATOMY_PROMPT}
        
        NEGATIVE PROMPTS:
        \${NEGATIVE_ANATOMY_PROMPT}people, humans, models, scenes, outdoor, indoor, lifestyle, hands, feet, face, background elements, furniture, room, landscape, open zippers.
        
        \${HIGH_QUALITY_RENDERING}
      \`;`;

if (c.includes(oldPrompt)) {
  c = c.replace(oldPrompt, newPrompt);
  fs.writeFileSync('/app/applet/src/modules/AppearanceAnalysis.tsx', c);
  console.log('Replaced successfully');
} else {
  console.log('oldPrompt not found');
}
