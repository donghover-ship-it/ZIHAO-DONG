export const getTextureClass = (materialId: string): string => {
  switch (materialId) {
    case 'DP_XPAC_VX21':
    case 'DP_XPAC_X50':
    case 'DP_VX42':
    case 'DP_VX07':
    case 'DP_XPAC_RX30':
    case 'DP_XPAC_X51':
    case 'DP_XPAC_V15':
    case 'DP_VX21_TERRAIN':
      return 'texture-xpac';
    case 'DP_ECOPAK_EPX200':
      return 'texture-cross-ply';
    case 'DP_CORDURA1000D':
    case 'DP_CORDURA500D':
    case 'DP_CORDURA840D':
    case 'DP_CORDURA330D_LP':
      return 'texture-cordura';
    case 'DP_BALLISTIC1680D':
    case 'DP_BALLISTIC1050D':
    case 'DP_BALLISTIC1260D':
      return 'texture-ballistic';
    case 'DP_DCF':
    case 'DP_DYNEEMA_HYBRID':
      return 'texture-dcf';
    case 'DP_ULTRA400':
    case 'DP_ULTRA200':
      return 'texture-ultra';
    case 'DP_RVX25':
      return 'texture-rvx';
    case 'DP_WAXEDCANVAS':
      return 'texture-canvas';
    case 'DP_210DRIPSTOP':
      return 'texture-ripstop';
    case 'DP_3D_SPACER_MESH':
      return 'texture-spacer-mesh';
    case 'DP_HYPALON':
      return 'texture-hypalon';
    case 'DP_RFID_BLOCK':
      return 'texture-rfid';
    case 'DP_TPU_COATED_420D':
      return 'texture-tpu';
    case 'DP_LASER_LAMINATE':
      return 'texture-laser';
    case 'DP_NANO_REPAIR':
      return 'texture-nano';
    case 'DP_KEVLAR_REINFORCED':
      return 'texture-kevlar';
    case 'DP_30D_SILNYLON':
      return 'texture-silnylon';
    case 'DP_SPECTRA_GRID':
      return 'texture-spectra';
    case 'DP_ROBIC_NYLON':
      return 'texture-canvas'; // Robic Nylon is smooth matte, canvas texture is close enough or we can use a plain color
    default:
      return '';
  }
};
