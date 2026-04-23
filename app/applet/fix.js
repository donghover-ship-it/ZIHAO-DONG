const fs = require('fs');
let c = fs.readFileSync('./src/modules/AppearanceAnalysis.tsx', 'utf8');

c = c.replace(/const \.i2iMode, setI2iMode\. = useState<'image' \| 'sketch'>\('image'\);\.\s*const \.i2iReferenceImage/g, "const [i2iMode, setI2iMode] = useState<'image' | 'sketch'>('image');\n  const [i2iReferenceImage");

fs.writeFileSync('./src/modules/AppearanceAnalysis.tsx', c);
