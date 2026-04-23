import { Box, Layers, Target } from 'lucide-react';

export const accessoryBrandPrompts: Record<string, string> = {
  'Fidlock 德国磁吸扣': '(Fidlock V-BUCKLE:1.4), patented magnetic mechanical closure, premium matte polymer finish, signature nylon pull-tab, industrial precision interlocking mechanism.',
  'AustriAlpin 眼镜蛇扣': '(Authentic Cobra Buckle:1.5), CNC-machined 7075 aluminum alloy, metallic tactical luster, dual-lever safety locking mechanism, sandblasted anodized finish.',
  '安美 Duraflex 专业户外扣': '(Duraflex Stealth Buckle:1.3), high-impact POM engineering plastic, streamlined ergonomic silhouette, low-profile matte black texture, heavy-duty structural integrity.',
  '华联 ITW / Woojin 战术工程扣': '(Woojin tactical hardware:1.3), GhillieTex IR-compliant polymer, rugged geometric reinforced structure, non-reflective tactical finish, aggressive industrial grip.',
  'YKK AquaGuard 防水拉链': '(YKK AquaGuard:1.4), PU-coated water-repellent zipper tape, seamless matte finish, zero-teeth visibility, professional techwear aesthetic, ergonomic sleek slider.',
  'RIRI 瑞士拉链': '(High-end Swiss RIRI zipper:1.3), precision-engineered metallic teeth, luxury technical texture.',
  '热缩管': '(Heat-shrink tubing zipper pull:1.4), minimalist industrial look, rigid tactical cord.'
};

export const accessories = [
  { id: 'zipper', name: '拉链', icon: Layers },
  { id: 'webbing', name: '织带', icon: Box },
  { id: 'buckle', name: '扣具', icon: Target },
];

export const accessoryStyles: Record<string, { label: string, key: string, options: string[] }[]> = {
  zipper: [
    { label: '品牌', key: 'brand', options: ['默认', 'YKK AquaGuard 防水拉链', 'RIRI 瑞士拉链', 'Ideal'] },
    { label: '链条类型', key: 'chainType', options: ['默认', '3号 (轻便)', '5号 (标准)', '8号 (重型/粗齿)'] },
    { label: '拉绳选择', key: 'pullCord', options: ['默认', '伞绳', '热缩管', '海帕龙拉片'] },
    { label: '材质', key: 'material', options: ['默认', '金属', '尼龙', '塑钢', '防水压胶'] },
    { label: '配色', key: 'color', options: ['默认', '同色系', '对比色', '金属银', '金属金', '彩虹色'] },
  ],
  webbing: [
    { label: '材质', key: 'material', options: ['默认', '高密尼龙', '涤纶', '棉质', '提花织带'] },
    { label: '配色', key: 'color', options: ['默认', '纯色', '间色', '标志提花', '反光条'] },
    { label: '宽度', key: 'width', options: ['默认', '10mm', '20mm', '25mm', '38mm', '50mm'] },
  ],
  buckle: [
    { label: '品牌', key: 'brand', options: ['默认', 'Fidlock 德国磁吸扣', 'AustriAlpin 眼镜蛇扣', '安美 Duraflex 专业户外扣', '华联 ITW / Woojin 战术工程扣'] },
    { label: '材质', key: 'material', options: ['默认', '工程塑料', '锌合金', '铝合金', '不锈钢'] },
    { label: '类型', key: 'type', options: ['默认', '插扣', '日字扣', 'D型环', '磁吸扣', '旋转钩'] },
    { label: '表面处理', key: 'finish', options: ['默认', '磨砂', '亮面', '拉丝', '电泳黑'] },
  ]
};
