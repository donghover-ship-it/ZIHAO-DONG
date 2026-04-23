export interface Material {
  id: string;
  name: string;
  description: string;
  category?: string;
  categories?: string[];
  tags: string[];
  uiTag?: string;
  physicalTags?: string[];
  grade: 1 | 2 | 3;
  textureUrl?: string;
  strength: string;
  weight: string;
  weatherResistance: string;
}

export const materials: Material[] = [
  { id: 'DP_XPAC_RX30', name: 'X-Pac RX30', description: '经典 X-Grid 菱形格 (薄款)', categories: ['urban_outdoor'], tags: ['环保', '轻量'], uiTag: '环保', physicalTags: ['经典 X-Grid', '菱形格', '薄款'], grade: 2, strength: '中', weight: '轻量', weatherResistance: '极佳' },
  { id: 'DP_XPAC_X51', name: 'X-Pac X51', description: '粗重 X-Grid + 磨砂底纹', categories: ['tactical'], tags: ['战术', '重型'], uiTag: '战术', physicalTags: ['粗重 X-Grid', '磨砂底纹', '耐磨'], grade: 3, strength: '极高', weight: '重', weatherResistance: '极佳' },
  { id: 'DP_ECOPAK_EPX200', name: 'Ecopak EPX200', description: '细密十字格纹 (Cross-ply)', categories: ['urban_outdoor'], tags: ['环保', '均衡'], uiTag: '环保', physicalTags: ['细密十字格纹', '再生材料'], grade: 2, strength: '高', weight: '中等', weatherResistance: '极佳' },
  { id: 'DP_ULTRA200', name: 'Ultra 200', description: '极细斜纹 + 半透明质感', categories: ['urban_tech'], tags: ['极致性能', '轻量'], uiTag: '极致性能', physicalTags: ['极细斜纹', '半透明质感', '抗撕裂'], grade: 3, strength: '极高', weight: '轻量', weatherResistance: '优秀' },
  { id: 'DP_XPAC_V15', name: 'X-Pac V15', description: '微缩 X-Grid 纹路', categories: ['minimalist'], tags: ['极简', '轻量'], uiTag: '极简', physicalTags: ['微缩 X-Grid', '平滑', '轻薄'], grade: 1, strength: '中', weight: '极轻', weatherResistance: '良好' },
  { id: 'DP_VX21_TERRAIN', name: 'VX21 Terrain', description: '地形迷彩 + 菱形格纹', categories: ['yama_style'], tags: ['迷彩', '战术'], uiTag: '迷彩', physicalTags: ['地形迷彩', '菱形格纹', '挺括'], grade: 2, strength: '高', weight: '中等', weatherResistance: '极佳' },
  { id: 'DP_XPAC_VX21', name: 'X-Pac VX21', description: '均衡型帆布层压材料', categories: ['urban_tech', 'yama_style', 'tactical', 'urban_outdoor', 'minimalist', 'daily_casual', 'outdoor_tech'], tags: ['均衡', '防水'], uiTag: '均衡', physicalTags: ['挺括', '全防水', '菱形格纹', '轻量'], grade: 2, strength: '高', weight: '轻量', weatherResistance: '极佳' },
  { id: 'DP_XPAC_X50', name: 'X-Pac X50', description: '战术级层压材料', categories: ['outdoor_tech'], tags: ['战术', '强悍'], uiTag: '战术', physicalTags: ['高耐磨', '硬挺', '哑光', '全防水'], grade: 3, strength: '极高', weight: '中等', weatherResistance: '极佳' },
  { id: 'DP_DCF', name: 'Dyneema (DCF)', description: '极致轻量复合面料', categories: ['urban_tech'], tags: ['极致轻量', '信仰'], uiTag: '极致轻量', physicalTags: ['极轻', '半透明', '褶皱感', '全防水'], grade: 3, strength: '极高', weight: '极轻', weatherResistance: '优秀' },
  { id: 'DP_ULTRA400', name: 'Ultra 400', description: '性能巅峰高性能面料', categories: ['urban_tech'], tags: ['性能巅峰', '灰感'], uiTag: '性能巅峰', physicalTags: ['极致抗撕裂', '超轻', '全防水'], grade: 3, strength: '极高', weight: '轻量', weatherResistance: '优秀' },
  { id: 'DP_VX07', name: 'VX07', description: '轻量层压材料', categories: ['yama_style'], tags: ['轻量', '防水'], uiTag: '轻量', physicalTags: ['柔软', '轻薄', '全防水', '易收纳'], grade: 1, strength: '低', weight: '极轻', weatherResistance: '良好' },
  { id: 'DP_VX42', name: 'VX42', description: '重型层压材料', categories: ['tactical', 'urban_tech', 'yama_style'], tags: ['重型', '防水'], uiTag: '重型', physicalTags: ['极度挺括', '防刮擦', '全防水'], grade: 3, strength: '高', weight: '中等', weatherResistance: '极佳' },
  { id: 'DP_RVX25', name: 'RVX25', description: '再生层压材料', categories: ['daily_casual'], tags: ['环保', '哑光'], uiTag: '环保', physicalTags: ['再生材料', '全防水', '挺括'], grade: 2, strength: '中', weight: '轻量', weatherResistance: '良好' },
  { id: 'DP_400D_RECYCLED_NYLON', name: '400D 回收尼龙', description: '环保轻量尼龙', categories: ['urban_outdoor'], tags: ['环保', '轻量'], uiTag: '环保', physicalTags: ['回收材质', '轻量', '防泼水'], grade: 2, strength: '中', weight: '轻量', weatherResistance: '良好' },

  { id: 'DP_CORDURA840D', name: 'Cordura 840D', description: '中等颗粒感斜纹织面', categories: ['urban_outdoor', 'daily_casual', 'minimalist', 'urban_tech'], tags: ['耐磨', '城市'], uiTag: '耐磨', physicalTags: ['中等颗粒感', '斜纹织面', '防泼水'], grade: 2, strength: '高', weight: '中等', weatherResistance: '一般' },
  { id: 'DP_KEVLAR_REINFORCED', name: 'Kevlar Reinforced', description: '黄/黑交错方格防割纹', categories: ['outdoor_tech'], tags: ['防割', '战术'], uiTag: '防割', physicalTags: ['黄黑交错', '方格防割纹', '极高强度'], grade: 3, strength: '极高', weight: '重', weatherResistance: '一般' },
  { id: 'DP_BALLISTIC1260D', name: '1260D Ballistic', description: '粗重双股交织弹道纹', categories: ['tactical'], tags: ['重型', '耐磨'], uiTag: '重型', physicalTags: ['粗重双股交织', '弹道纹', '抗切割'], grade: 3, strength: '极高', weight: '重', weatherResistance: '一般' },
  { id: 'DP_ROBIC_NYLON', name: 'Robic Nylon', description: '紧致、平滑、全哑光纹', categories: ['urban_tech', 'yama_style', 'tactical', 'urban_outdoor', 'minimalist', 'daily_casual', 'outdoor_tech'], tags: ['哑光', '轻量'], uiTag: '哑光', physicalTags: ['紧致', '平滑', '全哑光纹'], grade: 2, strength: '高', weight: '轻量', weatherResistance: '良好' },
  { id: 'DP_CORDURA330D_LP', name: 'Cordura 330D LP', description: '细密平滑的 Lite Plus 织纹', categories: ['minimalist'], tags: ['极简', '轻量'], uiTag: '极简', physicalTags: ['细密平滑', 'Lite Plus 织纹', '轻薄'], grade: 1, strength: '中', weight: '轻量', weatherResistance: '一般' },
  { id: 'DP_SPECTRA_GRID', name: 'Spectra Grid', description: '白色凸起方格防撕裂纹', categories: ['urban_tech'], tags: ['防撕裂', '机能'], uiTag: '防撕裂', physicalTags: ['白色凸起方格', '防撕裂纹', '高强度'], grade: 3, strength: '极高', weight: '中等', weatherResistance: '良好' },
  { id: 'DP_CORDURA1000D', name: 'Cordura 1000D', description: '军规级尼龙', categories: ['tactical'], tags: ['军规', '耐磨'], uiTag: '军规', physicalTags: ['粗犷', '极耐磨', '防泼水', '哑光'], grade: 3, strength: '高', weight: '重', weatherResistance: '一般' },
  { id: 'DP_CORDURA500D', name: 'Cordura 500D', description: '经典城市级尼龙', categories: ['urban_tech', 'yama_style', 'tactical', 'urban_outdoor', 'minimalist', 'daily_casual', 'outdoor_tech'], tags: ['城市', '全能'], uiTag: '城市', physicalTags: ['适中克重', '耐磨', '防泼水', '百搭'], grade: 2, strength: '中', weight: '中等', weatherResistance: '一般' },
  { id: 'DP_BALLISTIC1680D', name: 'Ballistic 1680D', description: '高密度弹道尼龙', categories: ['urban_tech'], tags: ['商务', '刚性'], uiTag: '商务', physicalTags: ['光泽感', '高强度', '防刮蹭', '垂坠感'], grade: 3, strength: '高', weight: '重', weatherResistance: '一般' },
  { id: 'DP_BALLISTIC1050D', name: '1050D Ballistic', description: '重型弹道尼龙', categories: ['tactical', 'urban_tech', 'yama_style'], tags: ['重型', '耐磨'], uiTag: '重型', physicalTags: ['极度厚重', '抗切割', '硬挺框架'], grade: 3, strength: '极高', weight: '重', weatherResistance: '一般' },
  { id: 'DP_WAXEDCANVAS', name: 'Waxed Canvas', description: '复古风格传统面料', categories: ['yama_style'], tags: ['复古', '岁月感'], uiTag: '复古', physicalTags: ['岁月痕迹 (Patina)', '重度防泼水', '天然触感'], grade: 2, strength: '中', weight: '重', weatherResistance: '良好' },

  { id: 'DP_DYNEEMA_HYBRID', name: 'Dyneema Hybrid', description: '随机纤维纹路 (纸质褶皱感)', categories: ['outdoor_tech'], tags: ['实验性', '轻量'], uiTag: '实验性', physicalTags: ['随机纤维纹路', '纸质褶皱感', '半透明'], grade: 3, strength: '极高', weight: '极轻', weatherResistance: '优秀' },
  { id: 'DP_30D_SILNYLON', name: '30D Silnylon', description: '微亮光泽 + 细微方格 Ripstop', categories: ['daily_casual'], tags: ['超轻', '防水'], uiTag: '超轻', physicalTags: ['微亮光泽', '细微方格 Ripstop', '硅油涂层'], grade: 1, strength: '低', weight: '极轻', weatherResistance: '优秀' },
  { id: 'DP_3D_SPACER_MESH', name: '3D Spacer Mesh', description: '六角形蜂窝透气网眼', categories: ['daily_casual'], tags: ['透气', '缓冲'], uiTag: '透气', physicalTags: ['六角形蜂窝', '透气网眼', '立体缓冲'], grade: 2, strength: '中', weight: '轻量', weatherResistance: '一般' },
  { id: 'DP_HYPALON', name: 'Hypalon', description: '哑光类皮肤、高阻尼胶感', categories: ['urban_tech', 'yama_style', 'tactical', 'urban_outdoor', 'minimalist', 'daily_casual', 'outdoor_tech'], tags: ['机能', '耐磨'], uiTag: '机能', physicalTags: ['哑光类皮肤', '高阻尼胶感', '防水耐磨'], grade: 3, strength: '高', weight: '重', weatherResistance: '极佳' },
  { id: 'DP_RFID_BLOCK', name: 'RFID Block', description: '金属丝横向拉丝感纹理', categories: ['minimalist', 'urban_tech', 'daily_casual'], tags: ['防护', '极简'], uiTag: '防护', physicalTags: ['金属丝', '横向拉丝感', '防盗刷'], grade: 2, strength: '中', weight: '轻量', weatherResistance: '一般' },
  { id: 'DP_TPU_COATED_420D', name: 'TPU Coated 420D', description: '亮面/哑光双色涂层胶感', categories: ['urban_outdoor'], tags: ['防水', '机能'], uiTag: '防水', physicalTags: ['双色涂层', '胶感', '全防水'], grade: 2, strength: '高', weight: '中等', weatherResistance: '极佳' },
  { id: 'DP_LASER_LAMINATE', name: 'Laser Laminate', description: '硬挺、平整、无毛边切面感', categories: ['tactical'], tags: ['战术', '机能'], uiTag: '战术', physicalTags: ['硬挺', '平整', '无毛边切面感', '激光切割'], grade: 3, strength: '高', weight: '中等', weatherResistance: '良好' },
  { id: 'DP_NANO_REPAIR', name: 'Nano-Repair', description: '极细密纳米级蜂巢底纹', categories: ['minimalist'], tags: ['自修复', '机能'], uiTag: '自修复', physicalTags: ['极细密', '纳米级蜂巢底纹', '微小划痕修复'], grade: 3, strength: '中', weight: '轻量', weatherResistance: '良好' },

  { id: 'DP_210DRIPSTOP', name: '210D Ripstop', description: '轻量防撕裂尼龙', categories: ['yama_style', 'urban_outdoor', 'daily_casual'], tags: ['轻量', '耐撕裂'], uiTag: '轻量', physicalTags: ['网格防撕裂', '柔软', '轻薄', '易折叠'], grade: 1, strength: '低', weight: '极轻', weatherResistance: '一般' },
];
