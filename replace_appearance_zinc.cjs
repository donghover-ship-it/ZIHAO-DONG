const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/AppearanceAnalysis.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-zinc-800\/80/g, 'bg-black/40');
content = content.replace(/bg-zinc-800/g, 'bg-white/5');
content = content.replace(/hover:bg-zinc-700/g, 'hover:bg-white/10');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated AppearanceAnalysis.tsx');
