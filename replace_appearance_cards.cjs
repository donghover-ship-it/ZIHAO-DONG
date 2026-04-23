const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/AppearanceAnalysis.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace main cards
content = content.replace(
  /className="bg-zinc-900\/60 border border-zinc-800\/80 rounded-2xl p-6 space-y-5 backdrop-blur-sm shadow-sm"/g,
  'className="glass-panel rounded-3xl p-6 space-y-6 transition-all duration-300"'
);

// Replace inner sections
content = content.replace(
  /className="bg-zinc-950\/60 border border-zinc-800\/80 rounded-xl p-4 space-y-3"/g,
  'className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4"'
);
content = content.replace(
  /className="bg-zinc-950\/60 border border-zinc-800\/80 rounded-xl p-4 space-y-3 h-\[calc\(100%-3rem\)\]"/g,
  'className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4 h-[calc(100%-3rem)]"'
);

// Replace edit mode tiles
content = content.replace(
  /className=\{`bg-zinc-900\/60 border \$\{activeEditMode === '面料' \? 'border-slate-500 shadow-lg shadow-slate-500\/20' : 'border-zinc-800\/80'\} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all \$\{flashingTile === 'material' \|\| flashingTile === 'all' \? 'flashing-tile' : ''\}`\}/g,
  'className={`glass-panel border ${activeEditMode === \'面料\' ? \'border-slate-500 shadow-lg shadow-slate-500/20\' : \'border-white/10 hover:border-white/20\'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all ${flashingTile === \'material\' || flashingTile === \'all\' ? \'flashing-tile\' : \'\'}`}'
);

content = content.replace(
  /className=\{`bg-zinc-900\/60 border \$\{activeEditMode === '颜色' \? 'border-slate-500 shadow-lg shadow-slate-500\/20' : 'border-zinc-800\/80'\} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all \$\{flashingTile === 'color' \|\| flashingTile === 'all' \? 'flashing-tile' : ''\}`\}/g,
  'className={`glass-panel border ${activeEditMode === \'颜色\' ? \'border-slate-500 shadow-lg shadow-slate-500/20\' : \'border-white/10 hover:border-white/20\'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all ${flashingTile === \'color\' || flashingTile === \'all\' ? \'flashing-tile\' : \'\'}`}'
);

content = content.replace(
  /className=\{`bg-zinc-900\/60 border \$\{activeEditMode === '辅料' \? 'border-slate-500 shadow-lg shadow-slate-500\/20' : 'border-zinc-800\/80'\} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all relative \$\{flashingTile === 'hardware' \|\| flashingTile === 'all' \? 'flashing-tile' : ''\}`\}/g,
  'className={`glass-panel border ${activeEditMode === \'辅料\' ? \'border-slate-500 shadow-lg shadow-slate-500/20\' : \'border-white/10 hover:border-white/20\'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all relative ${flashingTile === \'hardware\' || flashingTile === \'all\' ? \'flashing-tile\' : \'\'}`}'
);

content = content.replace(
  /className=\{`bg-zinc-900\/60 border \$\{activeEditMode === 'Logo' \? 'border-slate-500 shadow-lg shadow-slate-500\/20' : 'border-zinc-800\/80'\} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all \$\{flashingTile === 'logo' \|\| flashingTile === 'all' \? 'flashing-tile' : ''\}`\}/g,
  'className={`glass-panel border ${activeEditMode === \'Logo\' ? \'border-slate-500 shadow-lg shadow-slate-500/20\' : \'border-white/10 hover:border-white/20\'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all ${flashingTile === \'logo\' || flashingTile === \'all\' ? \'flashing-tile\' : \'\'}`}'
);

content = content.replace(
  /className=\{`bg-zinc-900\/60 border \$\{activeEditMode === '画笔' \? 'border-slate-500 shadow-lg shadow-slate-500\/20' : 'border-zinc-800\/80'\} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all`\}/g,
  'className={`glass-panel border ${activeEditMode === \'画笔\' ? \'border-slate-500 shadow-lg shadow-slate-500/20\' : \'border-white/10 hover:border-white/20\'} rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all`}'
);

// Replace textarea
content = content.replace(
  /className="w-full h-32 bg-zinc-900\/50 border border-zinc-700\/50 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-slate-500\/50 focus:ring-1 focus:ring-slate-500\/50 transition-all font-mono"/g,
  'className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-slate-500/50 focus:ring-1 focus:ring-slate-500/50 transition-all font-mono"'
);

// Replace text-zinc colors
content = content.replace(/text-zinc-300/g, 'text-gray-200');
content = content.replace(/text-zinc-400/g, 'text-gray-400');
content = content.replace(/text-zinc-500/g, 'text-gray-500');
content = content.replace(/text-zinc-600/g, 'text-gray-600');
content = content.replace(/text-zinc-200/g, 'text-gray-200');
content = content.replace(/border-zinc-700\/50/g, 'border-white/10');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated AppearanceAnalysis.tsx');
