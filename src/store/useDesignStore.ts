import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type ModuleId = 'competitor' | 'definition' | 'appearance' | 'structure' | 'divergence' | 'final';

interface AppearanceData {
  imageUrl?: string[];
  effectImageUrl?: string[];
  imageHistory?: any[];
  constraints?: { id: string, name: string, description: string }[];
  benchmarkColor?: string;
  benchmarkColors?: { hex: string, name: string }[];
  hasCustomColors?: boolean;
  primaryColor?: string;
  customPrompt?: string;
  customPromptChinese?: string;
  evolutionTags?: string[];
  promptTags?: string[];
  appearanceReferenceUrl?: string[];
  competitorImageUrl?: string[];
  imageTags?: Record<string, string[]>;
  designRequirements?: string;
  hiddenPortraitPrompt?: string;
  hiddenPortraitPromptChinese?: string;
  selectedMaterials?: { part: string; materialId: string; color?: string }[];
  selectedAccessories?: any[];
  accessoryStyle?: Record<string, string>;
  accessoryStyles?: Record<string, Record<string, string>>;
  selectedColors?: any[];
  selectedPrototype?: string;
  logoBranding?: {
    imageUrl?: string;
    position?: string;
    positionX?: number;
    positionY?: number;
    material?: string;
    scale?: string;
    scaleValue?: number;
    color?: string;
  };
  currentSeed?: number;
  lastSyncedColorsSource?: string;
  globalAttributes?: {
    material: any[];
    color: any[];
    hardware: any[];
    logo: any[];
  };
}

interface DesignState {
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
  activeStyleCategory: string | null;
  setActiveStyleCategory: (id: string | null) => void;
  assetLibraryTrigger?: {
    isOpen: boolean;
    tab: 'material' | 'color' | 'hardware' | 'logo';
    filters?: {
      colors?: string[];
      fabrics?: string[];
    };
    highlightColor?: string;
    ambientLight?: string;
  };
  setAssetLibraryTrigger: (trigger: DesignState['assetLibraryTrigger']) => void;
  designData: {
    definition: {
      result?: any;
      portraitUrl?: string | null;
      portraitUrls?: string[];
      brandDocument?: { name: string; content: string; base64?: string } | null;
      brandImages?: string[];
      competitorImages?: string[];
    };
    competitor: {
      competitorImages?: Record<string, string[]>;
      styleCategory?: string; // Kept for backward compatibility
      styleCategories?: string[];
      customDescriptions?: Record<string, string>;
      fusionAnalysis?: string;
      isAnalyzingFusion?: boolean;
      selectedReferenceImages?: string[];
      colorOverrides?: Record<string, Record<number, string>>;
      categoryPrompts?: Record<string, string>; // New field for category summary prompts
    };
    appearance: AppearanceData;
    structure: any;
    divergence: any;
    final: any;
    library: {
      material: any[];
      color: any[];
      hardware: any[];
      logo: any[];
      itemNames?: Record<string, string>;
      itemOverrides?: Record<string, any>;
      categoryLabels?: {
        [key: string]: string;
      };
      directories?: {
        [key: string]: { id: string; label: string; isSystem?: boolean; parentId?: string }[];
      };
    };
  };
  structureLibrary?: {
    [category: string]: { id: string; url: string; name: string; addedAt: number }[];
  };
  updateStructureLibrary?: (category: string, items: any[]) => void;
  libraryHistory?: any[];
  updateDesignData: (module: ModuleId | 'library', data: any) => void;
  undoLibraryAction: () => void;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      activeModule: 'competitor',
      setActiveModule: (id) => set({ activeModule: id }),
      activeStyleCategory: null,
      setActiveStyleCategory: (id) => set({ activeStyleCategory: id }),
      setAssetLibraryTrigger: (trigger) => set({ assetLibraryTrigger: trigger }),
      designData: {
        competitor: {},
        definition: {},
        appearance: {},
        structure: {},
        divergence: {},
        final: {},
        library: {
          material: [],
          color: [],
          hardware: [],
          logo: [],
          directories: {
            material: [
              { id: 'sys_preset', label: '系统预设', isSystem: true },
              { id: 'urban_tech', label: '都市机能', parentId: 'sys_preset', isSystem: true },
              { id: 'yama_style', label: '山系户外', parentId: 'sys_preset', isSystem: true },
              { id: 'tactical', label: '户外战术', parentId: 'sys_preset', isSystem: true },
              { id: 'urban_outdoor', label: '都市户外', parentId: 'sys_preset', isSystem: true },
              { id: 'minimalist', label: '都市极简', parentId: 'sys_preset', isSystem: true },
              { id: 'daily_casual', label: '日常休闲', parentId: 'sys_preset', isSystem: true },
              { id: 'outdoor_tech', label: '户外机能', parentId: 'sys_preset', isSystem: true },
              { id: 'brand_update', label: '品牌更新', isSystem: true },
              { id: 'nylon', label: '尼龙', parentId: 'brand_update', isSystem: true },
              { id: 'polyester', label: '涤纶', parentId: 'brand_update', isSystem: true },
            ],
            color: [
              { id: 'sys_color', label: '系统预设', isSystem: true },
              { id: 'pantone', label: 'Pantone', isSystem: true },
              { id: 'brand_color', label: '品牌色卡', isSystem: true },
            ],
            hardware: [
              { id: 'zipper', label: '拉链', isSystem: true },
              { id: 'buckle', label: '扣具', isSystem: true },
              { id: 'webbing', label: '织带', isSystem: true },
            ],
            logo: [
              { id: 'leather', label: '真皮压印', isSystem: true },
              { id: 'silicone', label: '立体硅胶', isSystem: true },
              { id: 'embroidery', label: '刺绣', isSystem: true },
            ],
          },
        },
      },
      structureLibrary: {
        tech: [],
        internal: [],
        quick: [],
        water: [],
        back: [],
        strap: [],
        accessory: []
      },
      updateStructureLibrary: (category, items) => 
        set((state) => ({
          structureLibrary: {
            ...state.structureLibrary,
            [category]: items
          }
        })),
      updateDesignData: (module, data) => 
        set((state) => {
          if (module === 'library') {
            const currentLibrary = JSON.parse(JSON.stringify(state.designData.library));
            const newHistory = [...(state.libraryHistory || []), currentLibrary].slice(-5); // Keep last 5 actions to prevent crashes
            return {
              libraryHistory: newHistory,
              designData: {
                ...state.designData,
                library: {
                  ...state.designData.library,
                  ...data
                }
              }
            };
          }
          return {
            designData: {
              ...state.designData,
              [module]: { ...state.designData[module as ModuleId], ...data }
            }
          };
        }),
      undoLibraryAction: () =>
        set((state) => {
          const history = state.libraryHistory || [];
          if (history.length === 0) return state;
          
          const previousLibrary = history[history.length - 1];
          const newHistory = history.slice(0, -1);
          
          return {
            libraryHistory: newHistory,
            designData: {
              ...state.designData,
              library: previousLibrary
            }
          };
        }),
    }),
    {
      name: 'design-storage',
      storage: createJSONStorage(() => localforage),
      partialize: (state) => ({
        ...state,
        libraryHistory: [], // don't persist history to save space
        designData: {
          ...state.designData,
          competitor: {
            ...state.designData.competitor,
            competitorImages: undefined // manually retrieved from localforage in the component
          },
          definition: {
            ...state.designData.definition,
            brandDocument: state.designData.definition.brandDocument 
              ? { name: state.designData.definition.brandDocument.name } // Do not persist base64 here
              : null
          }
        }
      }),
      version: 3,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState as DesignState;
        
        if (version < 2) {
          const defaultDirectories = {
            material: [
              { id: 'sys_preset', label: '系统预设', isSystem: true },
              { id: 'urban_tech', label: '都市机能', parentId: 'sys_preset', isSystem: true },
              { id: 'yama_style', label: '山系户外', parentId: 'sys_preset', isSystem: true },
              { id: 'tactical', label: '户外战术', parentId: 'sys_preset', isSystem: true },
              { id: 'urban_outdoor', label: '都市户外', parentId: 'sys_preset', isSystem: true },
              { id: 'minimalist', label: '都市极简', parentId: 'sys_preset', isSystem: true },
              { id: 'daily_casual', label: '日常休闲', parentId: 'sys_preset', isSystem: true },
              { id: 'outdoor_tech', label: '户外机能', parentId: 'sys_preset', isSystem: true },
              { id: 'brand_update', label: '品牌更新', isSystem: true },
              { id: 'nylon', label: '尼龙', parentId: 'brand_update', isSystem: true },
              { id: 'polyester', label: '涤纶', parentId: 'brand_update', isSystem: true },
            ],
            color: [
              { id: 'sys_color', label: '系统预设', isSystem: true },
              { id: 'pantone', label: 'Pantone', isSystem: true },
              { id: 'brand_color', label: '品牌色卡', isSystem: true },
            ],
            hardware: [
              { id: 'zipper', label: '拉链', isSystem: true },
              { id: 'buckle', label: '扣具', isSystem: true },
              { id: 'webbing', label: '织带', isSystem: true },
            ],
            logo: [
              { id: 'leather', label: '真皮压印', isSystem: true },
              { id: 'silicone', label: '立体硅胶', isSystem: true },
              { id: 'embroidery', label: '刺绣', isSystem: true },
            ],
          };

          if (state.designData && state.designData.library) {
            const currentDirs = state.designData.library.directories || {};
            const mergedDirectories: any = {};
            
            Object.keys(defaultDirectories).forEach((key) => {
              const existingDirs = currentDirs[key] || [];
              const defaultDirsForKey = (defaultDirectories as any)[key];
              const defaultDirIds = new Set(defaultDirsForKey.map((d: any) => d.id));
              
              // Filter out custom dirs that have the same ID as a default dir
              // Also filter out the old default dirs that we don't use anymore
              const obsoleteIds = new Set(['neutrals', 'accents', 'buckles', 'zippers', '3d', 'flat', 'performance', 'abrasion', 'lining', 'functional', 'other']);
              
              const customDirs = existingDirs.filter((d: any) => 
                !d.isSystem && !defaultDirIds.has(d.id) && !obsoleteIds.has(d.id)
              );
              
              mergedDirectories[key] = [
                ...defaultDirsForKey,
                ...customDirs
              ];
            });
            
            state.designData.library.directories = mergedDirectories;
          }
        }
        
        if (version < 3) {
          if (state.designData && state.designData.library && state.designData.library.directories && state.designData.library.directories.material) {
            state.designData.library.directories.material = state.designData.library.directories.material.filter(
              (d: any) => d.id !== 'functional'
            );
          }
        }
        
        return state;
      }
    }
  )
);
