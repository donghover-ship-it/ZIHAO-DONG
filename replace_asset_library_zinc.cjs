const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/AssetLibraryModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-zinc-950/g, 'bg-black/80');
content = content.replace(/bg-zinc-900\/40/g, 'bg-black/40');
content = content.replace(/bg-zinc-900\/50/g, 'bg-black/50');
content = content.replace(/bg-zinc-900\/30/g, 'bg-black/30');
content = content.replace(/bg-zinc-900\/20/g, 'bg-black/20');
content = content.replace(/bg-zinc-900/g, 'bg-black/60');
content = content.replace(/bg-zinc-800/g, 'bg-white/5');
content = content.replace(/hover:bg-zinc-700/g, 'hover:bg-white/10');
content = content.replace(/border-zinc-800/g, 'border-white/10');
content = content.replace(/from-zinc-700/g, 'from-white/10');
content = content.replace(/to-zinc-900/g, 'to-black/60');

content = content.replace(/text-zinc-200/g, 'text-gray-200');
content = content.replace(/text-zinc-300/g, 'text-gray-300');
content = content.replace(/text-zinc-400/g, 'text-gray-400');
content = content.replace(/text-zinc-500/g, 'text-gray-500');
content = content.replace(/text-zinc-600/g, 'text-gray-600');
content = content.replace(/hover:text-zinc-300/g, 'hover:text-gray-300');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated AssetLibraryModal.tsx');
