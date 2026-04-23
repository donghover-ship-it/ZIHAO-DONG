const fs = require('fs');

const data = [
  // Urban Techwear
  ["Phantom Black", "#050505", "极致深黑", "Urban Tech", "主料 (X-Pac/Cordura)"],
  ["Deep Obsidian", "#121213", "黑曜石", "Urban Tech", "涂层拉链、Hypalon 辅料"],
  ["Shadow Carbon", "#1C1C1E", "碳纤维色", "Urban Tech", "亚光防水面料"],
  ["Matte Asphalt", "#2C2C2C", "哑光沥青", "Urban Tech", "织带、塑料扣具"],
  ["Void Grey", "#242526", "虚空灰", "Urban Tech", "背板、网布"],
  ["Dark Manganese", "#303030", "暗锰", "Urban Tech", "金属拉链齿、品牌 Logo"],
  ["Iron Ore", "#383838", "铁矿石", "Urban Tech", "侧板拼接、内里"],
  ["Titanium Dark", "#48494B", "暗钛", "Urban Tech", "反光饰条"],
  ["Stealth Blue", "#1B1E23", "隐身暗蓝", "Urban Tech", "五金件"],
  ["Cyber Purple", "#2E1A47", "赛博暗紫", "Urban Tech", "装饰线、铝制搭扣"],
  ["Circuit Grey", "#5E6064", "电路灰", "Urban Tech", "提手缝线、拉链头绳"],
  ["Silver Matrix", "#A9A9A9", "矩阵银", "Urban Tech", "急救包标识、内里拉链"],
  ["Cobalt Dark", "#1E2732", "暗钴蓝", "Urban Tech", "警示标签、功能织带"],
  ["Night Glitch", "#161A1D", "深夜故障", "Urban Tech", "笔记本仓内衬"],
  ["Anodized Grey", "#6C6D70", "阳极氧化灰", "Urban Tech", "印刷 LOGO、反光条"],
  ["Lunar Surface", "#3B3B3B", "月面灰", "Urban Tech", "过渡配色"],
  ["Onyx Matte", "#0F0F0F", "哑光玛瑙", "Urban Tech", "辅料配件"],
  ["Dark Chrome", "#4F4F4F", "暗铬", "Urban Tech", "扣具"],
  ["Borealis Black", "#0D1117", "极光黑", "Urban Tech", "织带"],
  ["Liquid Metal", "#BEBEBE", "液态金属", "Urban Tech", "装饰细节"],

  // Urban Outdoor
  ["Navy Commuter", "#1B263B", "通勤深蓝", "Urban Outdoor", "主色调"],
  ["Slate Blue", "#415A77", "石板蓝", "Urban Outdoor", "主色调"],
  ["Stormy Sea", "#2D3E50", "暴雨海", "Urban Outdoor", "主色调"],
  ["Pavement Grey", "#778899", "铺路石灰", "Urban Outdoor", "主色调"],
  ["Gravel", "#4F4F4F", "碎石色", "Urban Outdoor", "主色调"],
  ["Forest Shadow", "#2F3E33", "森影", "Urban Outdoor", "辅色搭配"],
  ["Pine Needle", "#3D5245", "松针绿", "Urban Outdoor", "辅色搭配"],
  ["Muddy Water", "#706357", "泥水色", "Urban Outdoor", "辅色搭配"],
  ["Concrete Jungle", "#95A5A6", "混凝土", "Urban Outdoor", "辅色搭配"],
  ["Warm Asphalt", "#525252", "暖沥青", "Urban Outdoor", "辅色搭配"],
  ["Wet Pavement", "#3E4444", "湿路面", "Urban Outdoor", "点缀色"],
  ["Harbor Blue", "#354B5E", "港口蓝", "Urban Outdoor", "点缀色"],
  ["Iron Gate", "#4E5052", "铁门灰", "Urban Outdoor", "点缀色"],
  ["Castlerock", "#595E62", "城堡岩", "Urban Outdoor", "点缀色"],
  ["Rainy Day", "#C5C9C7", "雨天灰", "Urban Outdoor", "点缀色"],
  ["Deep Teal", "#004D4D", "深青色", "Urban Outdoor", "内衬、拉链"],
  ["Dusk Blue", "#405262", "暮蓝", "Urban Outdoor", "内衬、拉链"],
  ["Walnut Shell", "#6E5F52", "核桃壳", "Urban Outdoor", "内衬、拉链"],
  ["Urban Moss", "#4B5320", "都市苔藓", "Urban Outdoor", "内衬、拉链"],
  ["Shadow Grey", "#333333", "影灰", "Urban Outdoor", "内衬、拉链"],

  // Urban Minimalist
  ["Alabaster", "#F2F2F2", "雪花石膏", "Minimalist", "大面积主色"],
  ["Cloud Dancer", "#F0EEE9", "云舞者", "Minimalist", "大面积主色"],
  ["Vapor White", "#E5E4E2", "水汽白", "Minimalist", "大面积主色"],
  ["Oyster Shell", "#DCD9D4", "牡蛎壳", "Minimalist", "大面积主色"],
  ["Silver Birch", "#C9C1B9", "白桦色", "Minimalist", "大面积主色"],
  ["Pebble", "#B7B1A9", "鹅卵石", "Minimalist", "内饰、细节"],
  ["Mist", "#D3D3D3", "薄雾", "Minimalist", "内饰、细节"],
  ["Dovetail", "#7E7D7A", "鸽羽色", "Minimalist", "内饰、细节"],
  ["Smoked Pearl", "#A7A6A2", "烟珠色", "Minimalist", "内饰、细节"],
  ["Titanium White", "#FAFAFA", "钛白", "Minimalist", "内饰、细节"],
  ["Nude Texture", "#E3D7D3", "裸感肌理", "Minimalist", "对比色、五金"],
  ["Champagne Grey", "#B8B2A7", "香槟灰", "Minimalist", "对比色、五金"],
  ["Glacier", "#E1E8ED", "冰川白", "Minimalist", "对比色、五金"],
  ["Cool Grey 1C", "#D9D9D6", "冷灰1号", "Minimalist", "对比色、五金"],
  ["Slate Tint", "#8B939C", "浅石板色", "Minimalist", "对比色、五金"],
  ["Soft Charcoal", "#545454", "软炭灰", "Minimalist", "织带、扣具"],
  ["Pure Zinc", "#BABABA", "纯锌", "Minimalist", "织带、扣具"],
  ["Frost", "#EDF2F4", "霜色", "Minimalist", "织带、扣具"],
  ["Pale Bone", "#D2CECA", "浅骨色", "Minimalist", "织带、扣具"],
  ["Silk Matte", "#F5F5F5", "哑光丝绸", "Minimalist", "织带、扣具"],

  // Daily Casual
  ["Caramel", "#AF6E4D", "焦糖色", "Daily Casual", "帆布主料"],
  ["Mustard Seed", "#E1AD01", "芥末籽", "Daily Casual", "帆布主料"],
  ["Washed Denim", "#5D76A9", "水洗丹宁", "Daily Casual", "帆布主料"],
  ["Brick Red", "#A52A2A", "砖红", "Daily Casual", "帆布主料"],
  ["Olive Oil", "#808000", "橄榄油", "Daily Casual", "帆布主料"],
  ["Canvas Khaki", "#C3B091", "帆布卡其", "Daily Casual", "水洗面料"],
  ["Sand Dune", "#D2B48C", "沙丘", "Daily Casual", "水洗面料"],
  ["Sage Leaf", "#8F9779", "鼠尾草", "Daily Casual", "水洗面料"],
  ["Terra Cotta", "#E2725B", "陶土", "Daily Casual", "水洗面料"],
  ["Amber", "#FFBF00", "琥珀", "Daily Casual", "水洗面料"],
  ["Tidepool", "#3D5A5A", "潮汐池", "Daily Casual", "内衬、拉链头"],
  ["Harvest Gold", "#DAA520", "收获金", "Daily Casual", "内衬、拉链头"],
  ["Indigo", "#2E4053", "靛蓝", "Daily Casual", "内衬、拉链头"],
  ["Copper", "#B87333", "红铜", "Daily Casual", "内衬、拉链头"],
  ["Oatmeal", "#E3D9C6", "燕麦", "Daily Casual", "内衬、拉链头"],
  ["Chestnut", "#954535", "栗色", "Daily Casual", "缝线、点缀"],
  ["Denim Dark", "#152238", "深色丹宁", "Daily Casual", "缝线、点缀"],
  ["Wheat Field", "#F5DEB3", "麦田", "Daily Casual", "缝线、点缀"],
  ["Peach Fuzz", "#FFBE98", "柔和桃", "Daily Casual", "缝线、点缀"],
  ["Sky Blue", "#87CEEB", "天蓝", "Daily Casual", "缝线、点缀"],

  // Yama Style
  ["Autumn Leaf", "#D68910", "秋叶", "Yama Style", "主料 (尼龙/帆布)"],
  ["Deep Forest", "#145A32", "深林", "Yama Style", "主料 (尼龙/帆布)"],
  ["Earth Brown", "#483C32", "土褐", "Yama Style", "主料 (尼龙/帆布)"],
  ["Ochre", "#CC7722", "赭石", "Yama Style", "主料 (尼龙/帆布)"],
  ["Moss Green", "#8A9A5B", "苔藓绿", "Yama Style", "主料 (尼龙/帆布)"],
  ["Midnight Sun", "#FFD700", "午夜阳", "Yama Style", "抽绳、织带点缀"],
  ["Plum", "#673147", "李子红", "Yama Style", "抽绳、织带点缀"],
  ["Rustic Orange", "#D35400", "铁锈橙", "Yama Style", "抽绳、织带点缀"],
  ["Lake Blue", "#2E86C1", "湖蓝", "Yama Style", "抽绳、织带点缀"],
  ["Sandstone", "#766344", "砂岩", "Yama Style", "抽绳、织带点缀"],
  ["Spruce", "#2C3E50", "云杉蓝", "Yama Style", "内衬、拼接"],
  ["Cedar", "#6D4C41", "雪松", "Yama Style", "内衬、拼接"],
  ["Fern", "#4F7942", "蕨草", "Yama Style", "内衬、拼接"],
  ["Sunset Glow", "#FD7E14", "落日余晖", "Yama Style", "内衬、拼接"],
  ["Granite Grey", "#3E3E3E", "花岗岩", "Yama Style", "内衬、拼接"],
  ["Wild Berry", "#8B008B", "野果色", "Yama Style", "拉链、扣件"],
  ["Slate Green", "#2F4F4F", "石板绿", "Yama Style", "拉链、扣件"],
  ["Tumbleweed", "#DEB887", "风滚草", "Yama Style", "拉链、扣件"],
  ["Alpine Blue", "#6495ED", "高山蓝", "Yama Style", "拉链、扣件"],
  ["Bark", "#5D4037", "树皮", "Yama Style", "拉链、扣件"],

  // Outdoor Techwear
  ["Rescue Orange", "#FF4500", "救援橙", "Outdoor Tech", "警示标识、内衬"],
  ["Safety Yellow", "#EFFF00", "荧光黄", "Outdoor Tech", "警示标识、内衬"],
  ["Electric Volt", "#CEFF00", "电力绿", "Outdoor Tech", "警示标识、内衬"],
  ["Abyss Blue", "#000C1F", "深渊蓝", "Outdoor Tech", "警示标识、内衬"],
  ["Glacier Ice", "#D0F0C0", "冰川冰", "Outdoor Tech", "警示标识、内衬"],
  ["Magma", "#8B0000", "岩浆", "Outdoor Tech", "主料 (防水/耐磨)"],
  ["Siren Red", "#FF0000", "警笛红", "Outdoor Tech", "主料 (防水/耐磨)"],
  ["Night Vision", "#00FF00", "夜视绿", "Outdoor Tech", "主料 (防水/耐磨)"],
  ["Polar White", "#FBFCF8", "极地白", "Outdoor Tech", "主料 (防水/耐磨)"],
  ["Tundra Grey", "#95A5A6", "冻原灰", "Outdoor Tech", "主料 (防水/耐磨)"],
  ["Storm Shadow", "#243447", "风暴影", "Outdoor Tech", "拼接、补强"],
  ["Ultraviolet", "#5F4B8B", "紫外线", "Outdoor Tech", "拼接、补强"],
  ["Acid Green", "#B0BF1A", "酸性绿", "Outdoor Tech", "拼接、补强"],
  ["Deep Sea Blue", "#002366", "深海蓝", "Outdoor Tech", "拼接、补强"],
  ["Volcanic Rock", "#252525", "火山岩", "Outdoor Tech", "拼接、补强"],
  ["Solar Flare", "#FF8C00", "太阳耀斑", "Outdoor Tech", "拉链、抽绳"],
  ["Oxygen Blue", "#00BFFF", "氧气蓝", "Outdoor Tech", "拉链、抽绳"],
  ["Stealth Camo", "#353839", "隐形迷彩基色", "Outdoor Tech", "拉链、抽绳"],
  ["High-Viz Pink", "#FF1493", "高视度粉", "Outdoor Tech", "拉链、抽绳"],
  ["Cold Steel", "#4682B4", "冷钢蓝", "Outdoor Tech", "拉链、抽绳"],

  // Outdoor Tactical
  ["Coyote Dark", "#654321", "深狼棕", "Tactical", "Cordura 主料、MOLLE织带"],
  ["Ranger Green", "#444C38", "游骑兵绿", "Tactical", "Cordura 主料、MOLLE织带"],
  ["Wolf Grey", "#53565A", "狼灰", "Tactical", "Cordura 主料、MOLLE织带"],
  ["Desert Sand", "#C2B280", "沙漠沙", "Tactical", "Cordura 主料、MOLLE织带"],
  ["Tan 499", "#A58B6F", "美军标卡其", "Tactical", "Cordura 主料、MOLLE织带"],
  ["Multicam Green", "#7C7C52", "迷彩绿", "Tactical", "副料、拼接"],
  ["Olive Drab", "#3D3635", "橄榄褐", "Tactical", "副料、拼接"],
  ["Flat Dark Earth", "#7E6D5A", "暗土色", "Tactical", "副料、拼接"],
  ["Special Ops Black", "#1A1A1A", "特种黑", "Tactical", "副料、拼接"],
  ["Gunmetal", "#2C3539", "枪色", "Tactical", "副料、拼接"],
  ["Field Drab", "#6C541E", "野战褐", "Tactical", "内衬、网布"],
  ["Khaki Drill", "#827839", "卡其斜纹", "Tactical", "内衬、网布"],
  ["Urban Camo Grey", "#808080", "都市迷彩灰", "Tactical", "内衬、网布"],
  ["Battleship Grey", "#848482", "舰艇灰", "Tactical", "内衬、网布"],
  ["Night Stalker", "#0B0B0B", "夜袭者", "Tactical", "内衬、网布"],
  ["Savannah", "#E1C699", "萨凡纳", "Tactical", "扣具、拉链"],
  ["Earth Khaki", "#BDB76B", "大地卡其", "Tactical", "扣具、拉链"],
  ["Foliage Green", "#8F9779", "叶绿", "Tactical", "扣具、拉链"],
  ["Commando", "#3B444B", "突击队色", "Tactical", "扣具、拉链"],
  ["Dusty Brown", "#966919", "落灰褐", "Tactical", "扣具、拉链"]
];

function getPantone(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const l = Math.round((r+g+b)/3 / 255 * 19);
  const h = Math.round(r/255 * 60) + Math.round(g/255 * 30);
  return `${l.toString().padStart(2,'0')}-${h.toString().padStart(4,'0')} TPG`;
}

const json = data.map((d, i) => {
  const id = `C${(i+1).toString().padStart(3, '0')}`;
  return `{"id":"${id}","pantone":"${getPantone(d[1])}","name":"${d[0]}","zhName":"${d[2]}","hex":"${d[1]}","cat":"${d[3]}","application":"${d[4]}"}`;
});

fs.writeFileSync('colors.json', '[\n  ' + json.join(',\n  ') + '\n]');
console.log('Done');
