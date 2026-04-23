const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/AppearanceAnalysis.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove material badge
content = content.replace(
  /              \{globalAttributes\.material\.length > 0 && \(\n                <div className="flex items-center gap-1 text-\[10px\] px-2 py-0\.5 rounded bg-black\/40 text-gray-400 border border-white\/5">\n                  \{globalAttributes\.material\.every\(m => m\.fromLibrary\) \? \(\n                    <><Library size=\{10\} className="text-slate-400" \/> 已归档<\/>\n                  \) : \(\n                    <><Box size=\{10\} \/> 部分未归档<\/>\n                  \)\}\n                <\/div>\n              \)\}\n/g,
  ''
);

// Remove color badge
content = content.replace(
  /              \{globalAttributes\.color\.length > 0 && \(\n                <div className="flex items-center gap-1 text-\[10px\] px-2 py-0\.5 rounded bg-black\/40 text-gray-400 border border-white\/5">\n                  \{globalAttributes\.color\.every\(c => c\.fromLibrary\) \? \(\n                    <><Library size=\{10\} className="text-slate-400" \/> 已归档<\/>\n                  \) : \(\n                    <><Box size=\{10\} \/> 部分未归档<\/>\n                  \)\}\n                <\/div>\n              \)\}\n/g,
  ''
);

// Remove hardware badge
content = content.replace(
  /              \{globalAttributes\.hardware\.length > 0 && \(\n                <div className="flex items-center gap-1 text-\[10px\] px-2 py-0\.5 rounded bg-black\/40 text-gray-400 border border-white\/5">\n                  \{globalAttributes\.hardware\.every\(h => h\.fromLibrary\) \? \(\n                    <><Library size=\{10\} className="text-slate-400" \/> 已归档<\/>\n                  \) : \(\n                    <><Box size=\{10\} \/> 部分未归档<\/>\n                  \)\}\n                <\/div>\n              \)\}\n/g,
  ''
);

// Remove logo badge
content = content.replace(
  /              \{globalAttributes\.logo\.length > 0 && \(\n                <div className="flex items-center gap-1 text-\[10px\] px-2 py-0\.5 rounded bg-black\/40 text-gray-400 border border-white\/5">\n                  \{globalAttributes\.logo\.every\(l => l\.fromLibrary\) \? \(\n                    <><Library size=\{10\} className="text-slate-400" \/> 已归档<\/>\n                  \) : \(\n                    <><Box size=\{10\} \/> 部分未归档<\/>\n                  \)\}\n                <\/div>\n              \)\}\n/g,
  ''
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated AppearanceAnalysis.tsx');
