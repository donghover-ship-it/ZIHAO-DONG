// Helper to calculate luminance
export const getLuminance = (hex: string) => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  // Standard relative luminance formula
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

// Mock density for fabrics (0.0 to 1.0)
const fabricDensityMap: Record<string, number> = {
  'DP_XPAC_RX30': 0.4,
  'DP_ECOPAK_EPX200': 0.5,
  'DP_CORDURA840D': 0.7,
  'DP_ROBIC_NYLON': 0.3,
  'DP_XPAC_VX21': 0.6,
  'DP_CORDURA500D': 0.5,
  'DP_XPAC_X51': 0.8,
  'DP_BALLISTIC1260D': 0.9,
  'DP_TPU_COATED_420D': 0.6,
  'DP_BALLISTIC1680D': 1.0,
  'DP_RFID_BLOCK': 0.4,
  'DP_WAXEDCANVAS': 0.8,
  'DP_RVX25': 0.3,
  'DP_ULTRA200': 0.2,
  'DP_DYNEEMA_HYBRID': 0.1,
  'DP_DCF': 0.1,
  'DP_ULTRA400': 0.4,
  'DP_SPECTRA_GRID': 0.3,
  'DP_VX42': 0.7,
  'DP_CORDURA1000D': 0.9,
  'DP_HYPALON': 1.0,
  'DP_KEVLAR_REINFORCED': 0.9,
  'DP_VX21_TERRAIN': 0.6,
};

// Base pools for each style
const stylePools: Record<string, { colors: string[], fabrics: string[], ambientLight: string }> = {
  'urban-outdoor': {
    colors: ['#4A5D23', '#2F4F4F', '#8B4513', '#A9A9A9', '#000000', '#556B2F', '#708090'],
    fabrics: ['DP_XPAC_RX30', 'DP_ECOPAK_EPX200', 'DP_CORDURA840D', 'DP_ROBIC_NYLON', 'DP_CORDURA500D'],
    ambientLight: 'rgba(120, 150, 100, 0.15)' // Mild green/earthy
  },
  'urban-techwear': {
    colors: ['#050505', '#121213', '#1C1C1E', '#2C2C2C', '#242526', '#303030', '#1B1E23'],
    fabrics: ['DP_XPAC_VX21', 'DP_CORDURA500D', 'DP_XPAC_X51', 'DP_BALLISTIC1260D', 'DP_TPU_COATED_420D'],
    ambientLight: 'rgba(0, 100, 255, 0.15)' // Cool blue
  },
  'urban-minimalist': {
    colors: ['#F5F5F5', '#333333', '#808080', '#1A1A1A', '#E0E0E0', '#FFFFFF', '#000000'],
    fabrics: ['DP_TPU_COATED_420D', 'DP_BALLISTIC1680D', 'DP_RFID_BLOCK', 'DP_ROBIC_NYLON'],
    ambientLight: 'rgba(255, 255, 255, 0.08)' // Neutral
  },
  'daily-casual': {
    colors: ['#1E3A8A', '#B91C1C', '#D97706', '#047857', '#4B5563', '#FCD34D', '#93C5FD'],
    fabrics: ['DP_WAXEDCANVAS', 'DP_CORDURA500D', 'DP_RVX25', 'DP_ECOPAK_EPX200'],
    ambientLight: 'rgba(255, 200, 100, 0.15)' // Warm sunny
  },
  'yama-outdoor': {
    colors: ['#556B2F', '#8B4513', '#D2B48C', '#A0522D', '#2F4F4F', '#8FBC8F', '#CD853F'],
    fabrics: ['DP_XPAC_RX30', 'DP_WAXEDCANVAS', 'DP_ULTRA200', 'DP_DYNEEMA_HYBRID'],
    ambientLight: 'rgba(210, 180, 140, 0.2)' // Warm earthy
  },
  'outdoor-techwear': {
    colors: ['#FF4500', '#FFD700', '#000000', '#4169E1', '#32CD32', '#FF8C00', '#1E90FF'],
    fabrics: ['DP_DCF', 'DP_ULTRA400', 'DP_SPECTRA_GRID', 'DP_VX42', 'DP_XPAC_X51'],
    ambientLight: 'rgba(0, 255, 255, 0.15)' // High-vis cyan/cool
  },
  'outdoor-tactical': {
    colors: ['#4B5320', '#C2B280', '#000000', '#808080', '#8B4513', '#556B2F', '#A0522D'],
    fabrics: ['DP_CORDURA1000D', 'DP_HYPALON', 'DP_KEVLAR_REINFORCED', 'DP_VX21_TERRAIN', 'DP_BALLISTIC1680D'],
    ambientLight: 'rgba(75, 83, 32, 0.2)' // Olive drab
  }
};

// Simple seeded random number generator
const seededRandom = (seed: number) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

export const getDynamicRecommendations = (styleId: string, projectContext: any) => {
  const pool = stylePools[styleId];
  if (!pool) return null;

  let prdColors: string[] = [];
  if (projectContext?.specifications?.pantoneColors && Array.isArray(projectContext.specifications.pantoneColors)) {
    prdColors = projectContext.specifications.pantoneColors.map((c: any) => c.hex).filter(Boolean);
  }

  // 1. Core items: SelectTop(2, StyleWeights)
  const coreColors = prdColors.length > 0 
    ? Array.from(new Set([...prdColors, ...pool.colors])).slice(0, 2)
    : pool.colors.slice(0, 2);
  const coreFabrics = pool.fabrics.slice(0, 2);

  // 2. Exploration items: RandomSelect(3-5, StylePool) with Mutual Exclusion Check
  const remainingPrdColors = prdColors.slice(2);
  const explorationColors = Array.from(new Set([...remainingPrdColors, ...pool.colors.slice(2)]));
  const explorationFabrics = pool.fabrics.slice(2);

  const seedStr = projectContext ? JSON.stringify(projectContext) : styleId;
  let seed = getHash(seedStr);

  const shuffledColors = [...explorationColors].sort(() => 0.5 - seededRandom(seed++));
  const shuffledFabrics = [...explorationFabrics].sort(() => 0.5 - seededRandom(seed++));

  const selectedExplorationColors: string[] = [];
  const selectedExplorationFabrics: string[] = [];

  const checkMatch = (color: string, fabric: string) => {
    const lum = getLuminance(color);
    const den = fabricDensityMap[fabric] || 0.5;
    const matchDegree = 1 - Math.abs((1 - lum) - den);
    return matchDegree;
  };

  for (const color of shuffledColors) {
    if (selectedExplorationColors.length >= 3) break;
    selectedExplorationColors.push(color);
  }

  for (const fabric of shuffledFabrics) {
    if (selectedExplorationFabrics.length >= 3) break;
    
    const allSelectedColors = [...coreColors, ...selectedExplorationColors];
    let bestMatch = 0;
    for (const c of allSelectedColors) {
      const match = checkMatch(c, fabric);
      if (match > bestMatch) bestMatch = match;
    }
    
    // If match < 0.6, 50% chance to skip (down-weight)
    if (bestMatch < 0.6 && seededRandom(seed++) > 0.5) {
      continue;
    }
    
    selectedExplorationFabrics.push(fabric);
  }

  return {
    colors: [...coreColors, ...selectedExplorationColors],
    fabrics: [...coreFabrics, ...selectedExplorationFabrics],
    ambientLight: pool.ambientLight
  };
};
