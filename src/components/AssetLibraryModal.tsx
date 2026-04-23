import React, { useState, useRef } from 'react';
import { X, Upload, Search, Filter, Plus, Check, Box, Palette, Settings2, FileText, Image as ImageIcon, Cpu, Layers, Library, FolderInput, ChevronDown, ChevronRight, MoreVertical, Edit2, Trash2, Download, UploadCloud, Undo2 } from 'lucide-react';
import { useDesignStore } from '../store/useDesignStore';
import { materials } from '../data/materials';
import { getTextureClass } from '../utils/textureUtils';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetImportModal } from './AssetImportModal';

interface AssetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'material' | 'color' | 'hardware' | 'logo';
  onSelect?: (type: 'material' | 'color' | 'hardware' | 'logo', value: any) => void;
  filters?: {
    colors?: string[];
    fabrics?: string[];
  };
  highlightColor?: string;
  ambientLight?: string;
}

export const AssetLibraryModal: React.FC<AssetLibraryModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'material', 
  onSelect,
  filters,
  highlightColor,
  ambientLight
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedDir, setSelectedDir] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [editingDirId, setEditingDirId] = useState<string | null>(null);
  const [editingDirValue, setEditingDirValue] = useState<string>('');
  const [contextMenuDir, setContextMenuDir] = useState<{ id: string; x: number; y: number; level: number } | null>(null);
  const [deleteConfirmDir, setDeleteConfirmDir] = useState<{ id: string; count: number } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([initialTab]);
  const [collapsedDirs, setCollapsedDirs] = useState<string[]>([]);

  // Drag and drop state
  const [draggedDirId, setDraggedDirId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { designData, updateDesignData, libraryHistory, undoLibraryAction } = useDesignStore();
  const library = designData.library || { material: [], color: [], hardware: [], logo: [] };
  const directories = library.directories || {};

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedDir('all');
      setIsBatchMode(false);
      setSelectedItems([]);
      setShowMoveMenu(false);
      setExpandedCategories([initialTab]);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleExportLibrary = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "asset_library_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedLibrary = JSON.parse(event.target?.result as string);
        if (importedLibrary && importedLibrary.directories) {
          updateDesignData('library', importedLibrary);
          alert('资产库导入成功！');
        } else {
          alert('无效的资产库文件格式');
        }
      } catch (err) {
        alert('导入失败：文件解析错误');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelect = (item: any) => {
    if (isBatchMode) {
      if (!item.isCustom) return; // Only allow batch actions on personal assets
      const id = item.id || item.name;
      setSelectedItems(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
      return;
    }
    if (onSelect) {
      onSelect(activeTab, item);
      onClose();
    }
  };

  const handleItemClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (isBatchMode) {
      handleSelect(item);
      return;
    }
    setDetailItem(item);
  };

  const handleSaveDetail = (updatedItem: any) => {
    const currentLibrary = useDesignStore.getState().designData.library;
    
    if (!updatedItem.isCustom) {
      if (updatedItem.id) {
        const currentNames = currentLibrary.itemNames || {};
        const currentOverrides = currentLibrary.itemOverrides || {};
        
        // Extract fields to override (excluding id and isCustom)
        const { id, isCustom, ...overrides } = updatedItem;
        
        updateDesignData('library', {
          itemNames: {
            ...currentNames,
            [updatedItem.id]: updatedItem.name
          },
          itemOverrides: {
            ...currentOverrides,
            [updatedItem.id]: overrides
          }
        });
      }
      return;
    }
    
    const currentAssets = (currentLibrary as any)[activeTab] || [];
    
    const updatedAssets = currentAssets.map((item: any) => 
      (item.id === updatedItem.id || item.name === updatedItem.name) ? updatedItem : item
    );
    
    updateDesignData('library', {
      [activeTab]: updatedAssets
    });
  };

  const handleBatchDelete = () => {
    const currentLibrary = useDesignStore.getState().designData.library;
    const currentAssets = (currentLibrary as any)[activeTab] || [];
    const updatedLibrary = currentAssets.filter((item: any) => !selectedItems.includes(item.id || item.name));
    updateDesignData('library', {
      [activeTab]: updatedLibrary
    });
    setSelectedItems([]);
    setIsBatchMode(false);
  };

  const handleBatchMove = (targetDirId: string) => {
    const currentLibrary = useDesignStore.getState().designData.library;
    const currentAssets = (currentLibrary as any)[activeTab] || [];
    const updatedLibrary = currentAssets.map((item: any) => {
      if (selectedItems.includes(item.id || item.name)) {
        return { ...item, category: targetDirId };
      }
      return item;
    });
    
    updateDesignData('library', {
      [activeTab]: updatedLibrary
    });
    
    setSelectedItems([]);
    setIsBatchMode(false);
    setShowMoveMenu(false);
  };

  const handleAddDirectory = (tabId: string, parentId?: string) => {
    const newDirId = `dir-${Date.now()}`;
    const newDir = { id: newDirId, label: '新建文件夹', parentId };
    
    const currentLibrary = useDesignStore.getState().designData.library;
    const currentDirs = currentLibrary.directories || {};
    const tabDirs = currentDirs[tabId] || [];
    
    updateDesignData('library', {
      directories: {
        ...currentDirs,
        [tabId]: [...tabDirs, newDir]
      }
    });
    
    setEditingDirId(newDirId);
    setEditingDirValue('新建文件夹');
    setSelectedDir(newDirId);
    setActiveTab(tabId as any);
  };

  const handleRenameDirectory = (tabId: string, dirId: string, newLabel: string) => {
    if (!newLabel.trim()) {
      setEditingDirId(null);
      setEditingDirValue('');
      return;
    }
    const currentLibrary = useDesignStore.getState().designData.library;
    const currentDirs = currentLibrary.directories || {};
    const tabDirs = currentDirs[tabId] || [];
    const updatedDirs = tabDirs.map((d: any) => d.id === dirId ? { ...d, label: newLabel.trim() } : d);
    
    updateDesignData('library', {
      directories: {
        ...currentDirs,
        [tabId]: updatedDirs
      }
    });
    setEditingDirId(null);
    setEditingDirValue('');
  };

  const handleDeleteDirectory = (tabId: string, dirId: string, deleteAssets: boolean) => {
    const currentLibraryState = useDesignStore.getState().designData.library;
    const currentDirs = currentLibraryState.directories || {};
    const tabDirs = currentDirs[tabId] || [];
    
    const getDescendantIds = (parentId: string): string[] => {
      const children = tabDirs.filter((d: any) => d.parentId === parentId).map((d: any) => d.id);
      let descendants = [...children];
      for (const childId of children) {
        descendants = [...descendants, ...getDescendantIds(childId)];
      }
      return descendants;
    };
    
    const idsToDelete = [dirId, ...getDescendantIds(dirId)];
    const updatedDirs = tabDirs.filter((d: any) => !idsToDelete.includes(d.id));
    
    const currentAssets = (currentLibraryState as any)[tabId] || [];
    let updatedLibrary = [...currentAssets];
    
    if (deleteAssets) {
      updatedLibrary = currentAssets.filter((item: any) => !idsToDelete.includes(item.category));
    } else {
      updatedLibrary = currentAssets.map((item: any) => 
        idsToDelete.includes(item.category) ? { ...item, category: 'unassigned' } : item
      );
    }
    
    updateDesignData('library', {
      [tabId]: updatedLibrary,
      directories: {
        ...currentDirs,
        [tabId]: updatedDirs
      }
    });
    
    if (idsToDelete.includes(selectedDir)) setSelectedDir('all');
    setDeleteConfirmDir(null);
  };

  const handleMoveDirectory = (tabId: string, dirId: string, targetTabId: string) => {
    const currentLibraryState = useDesignStore.getState().designData.library;
    const currentDirs = currentLibraryState.directories || {};
    const sourceDirs = currentDirs[tabId] || [];
    
    const getDescendantIds = (parentId: string): string[] => {
      const children = sourceDirs.filter((d: any) => d.parentId === parentId).map((d: any) => d.id);
      let descendants = [...children];
      for (const childId of children) {
        descendants = [...descendants, ...getDescendantIds(childId)];
      }
      return descendants;
    };
    
    const idsToMove = [dirId, ...getDescendantIds(dirId)];
    const dirsToMove = sourceDirs.filter((d: any) => idsToMove.includes(d.id));
    
    const updatedDirsToMove = dirsToMove.map((d: any) => d.id === dirId ? { ...d, parentId: undefined } : d);
    const updatedSourceDirs = sourceDirs.filter((d: any) => !idsToMove.includes(d.id));
    const targetDirs = currentDirs[targetTabId] || [];
    
    const sourceAssets = (currentLibraryState as any)[tabId] || [];
    const assetsToMove = sourceAssets.filter((item: any) => idsToMove.includes(item.category));
    const remainingAssets = sourceAssets.filter((item: any) => !idsToMove.includes(item.category));
    
    const targetAssets = (currentLibraryState as any)[targetTabId] || [];
    
    updateDesignData('library', {
      [tabId]: remainingAssets,
      [targetTabId]: [...targetAssets, ...assetsToMove],
      directories: {
        ...currentDirs,
        [tabId]: updatedSourceDirs,
        [targetTabId]: [...targetDirs, ...updatedDirsToMove]
      }
    });
    
    if (idsToMove.includes(selectedDir)) {
      setActiveTab(targetTabId as any);
      setSelectedDir(dirId);
    }
    setContextMenuDir(null);
  };

  const getValidTargetDirs = (tabId: string, dirId: string) => {
    const currentLibraryState = useDesignStore.getState().designData.library;
    const currentDirs = currentLibraryState.directories?.[tabId] || [];
    
    const getDescendantIds = (parentId: string): string[] => {
      const children = currentDirs.filter((d: any) => d.parentId === parentId).map((d: any) => d.id);
      let descendants = [...children];
      for (const childId of children) {
        descendants = [...descendants, ...getDescendantIds(childId)];
      }
      return descendants;
    };
    
    const descendantIds = getDescendantIds(dirId);
    const invalidIds = [dirId, ...descendantIds];
    
    const getSubtreeDepth = (id: string): number => {
      const children = currentDirs.filter((d: any) => d.parentId === id);
      if (children.length === 0) return 0;
      return 1 + Math.max(...children.map((c: any) => getSubtreeDepth(c.id)));
    };
    
    const subtreeDepth = getSubtreeDepth(dirId);
    
    const getDirLevel = (id: string): number => {
      const dir = currentDirs.find((d: any) => d.id === id);
      if (!dir || !dir.parentId) return 0;
      return 1 + getDirLevel(dir.parentId);
    };
    
    return currentDirs.filter((d: any) => {
      if (invalidIds.includes(d.id)) return false;
      if (d.id === 'all') return false;
      if (d.isSystem) return false;
      
      const targetLevel = getDirLevel(d.id);
      if (targetLevel + 1 + subtreeDepth > 2) return false;
      
      return true;
    });
  };

  const handleMoveToSubdirectory = (tabId: string, dirId: string, targetParentId: string | null) => {
    const currentLibraryState = useDesignStore.getState().designData.library;
    const currentDirs = currentLibraryState.directories || {};
    const tabDirs = currentDirs[tabId] || [];
    
    const updatedDirs = tabDirs.map((d: any) => {
      if (d.id === dirId) {
        return { ...d, parentId: targetParentId || undefined };
      }
      return d;
    });
    
    updateDesignData('library', {
      directories: {
        ...currentDirs,
        [tabId]: updatedDirs
      }
    });
  };

  const categoryNames = library.categoryLabels || {};
  const menuItems = [
    { id: 'material', label: categoryNames.material || '面料库 (Material)', icon: Layers, subDirs: (directories.material || []).filter(d => d.id !== 'all') },
    { id: 'color', label: categoryNames.color || '色彩库 (Color)', icon: Palette, subDirs: [
      { id: 'sys_color', label: '系统预设', isSystem: true },
      { id: 'pantone', label: 'Pantone', isSystem: true },
      { id: 'brand', label: '品牌 (Brand)', isSystem: true },
      { id: 'Urban Tech', label: '都市机能 (Urban Techwear)', isSystem: true, parentId: 'pantone' },
      { id: 'Yama Style', label: '山系户外 (Yama Style)', isSystem: true, parentId: 'pantone' },
      { id: 'Tactical', label: '户外战术 (Outdoor Tactical)', isSystem: true, parentId: 'pantone' },
      { id: 'Urban Outdoor', label: '都市户外 (Urban Outdoor)', isSystem: true, parentId: 'pantone' },
      { id: 'Minimalist', label: '都市极简 (Urban Minimalist)', isSystem: true, parentId: 'pantone' },
      { id: 'Daily Casual', label: '日常休闲 (Daily Casual)', isSystem: true, parentId: 'pantone' },
      { id: 'Outdoor Tech', label: '户外机能 (Outdoor Techwear)', isSystem: true, parentId: 'pantone' },
      ...(directories.color || []).filter(d => d.id !== 'all' && d.id !== 'sys_color' && d.id !== 'pantone' && d.id !== 'unassigned')
    ] },
    { id: 'hardware', label: categoryNames.hardware || '辅料库 (Hardware)', icon: Settings2, subDirs: (directories.hardware || []).filter(d => d.id !== 'all') },
    { id: 'logo', label: categoryNames.logo || '标识库 (Logo)', icon: FileText, subDirs: (directories.logo || []).filter(d => d.id !== 'all') }
  ];

  const renderDirectory = (dir: any, tabId: string, level: number = 0) => {
    const currentMenu = menuItems.find(m => m.id === tabId);
    const currentDirs = currentMenu ? currentMenu.subDirs : (directories[tabId] || []);
    const children = currentDirs.filter(d => d.parentId === dir.id);
    const isSelected = activeTab === tabId && selectedDir === dir.id;
    const isCollapsed = collapsedDirs.includes(dir.id);
    
    let textColorClass = '';
    if (isSelected) {
      if (level === 0) {
        textColorClass = 'text-[#B794F4] font-bold drop-shadow-[0_0_8px_rgba(183,148,244,0.5)]';
      } else {
        textColorClass = 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]';
      }
    } else {
      switch (level) {
        case 0: textColorClass = 'text-[#B794F4]/90 hover:text-[#B794F4] font-bold'; break;
        case 1: textColorClass = 'text-white/90 hover:text-white'; break;
        case 2: textColorClass = 'text-slate-300 hover:text-white'; break;
        default: textColorClass = 'text-slate-400 hover:text-slate-300'; break;
      }
    }
    
    return (
      <div key={dir.id} className="space-y-1">
        <div 
          className="relative group/dir flex items-center"
          draggable={!dir.isSystem}
          onDragStart={(e) => {
            if (dir.isSystem) {
              e.preventDefault();
              return;
            }
            e.stopPropagation();
            setDraggedDirId(dir.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!draggedDirId || draggedDirId === dir.id) return;
            
            const currentDirs = directories[tabId] || [];
            const draggedIndex = currentDirs.findIndex((d: any) => d.id === draggedDirId);
            const targetIndex = currentDirs.findIndex((d: any) => d.id === dir.id);
            
            if (draggedIndex === -1 || targetIndex === -1) return;
            
            const newDirs = [...currentDirs];
            const [removed] = newDirs.splice(draggedIndex, 1);
            
            removed.parentId = dir.parentId;
            
            newDirs.splice(targetIndex, 0, removed);
            
            updateDesignData('library', {
              directories: {
                ...directories,
                [tabId]: newDirs
              }
            });
            setDraggedDirId(null);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenuDir({ id: dir.id, x: e.clientX, y: e.clientY, level });
            setActiveTab(tabId as any);
          }}
        >
          {editingDirId === dir.id ? (
            <input
              autoFocus
              className="w-full glass-input-flat border border-slate-400/50 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.3)]"
              value={editingDirValue}
              onChange={(e) => setEditingDirValue(e.target.value)}
              onBlur={(e) => handleRenameDirectory(tabId, dir.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRenameDirectory(tabId, dir.id, e.currentTarget.value);
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-between w-full group/item">
              <button
                onClick={() => {
                  setActiveTab(tabId as any);
                  setSelectedDir(dir.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (children.length > 0) {
                    setCollapsedDirs(prev => 
                      prev.includes(dir.id) 
                        ? prev.filter(id => id !== dir.id) 
                        : [...prev, dir.id]
                    );
                  } else {
                    setEditingDirId(dir.id);
                    setEditingDirValue(dir.label);
                  }
                }}
                className={`flex-1 text-left px-2 py-1.5 rounded text-sm transition-all truncate ${isSelected && level > 0 ? 'bg-white/5 border-l-2 border-[#B794F4] shadow-sm' : level > 0 ? 'hover:bg-white/5' : ''} ${textColorClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="cursor-pointer truncate">
                    {dir.label}
                  </span>
                  {children.length > 0 && (
                    <span className="text-slate-500 ml-2">
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
        {!isCollapsed && children.length > 0 && (
          <div className="ml-3 border-l border-white/20 pl-3 space-y-1 mt-1 relative">
            {children.map(child => renderDirectory(child, tabId, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    const customItems = library[activeTab] || [];
    
    // Get all descendant directory IDs for the selected directory
    const getDescendantIds = (tabId: string, parentId: string): string[] => {
      const currentDirs = directories[tabId] || [];
      const children = currentDirs.filter(d => d.parentId === parentId).map(d => d.id);
      let descendants = [...children];
      for (const childId of children) {
        descendants = [...descendants, ...getDescendantIds(tabId, childId)];
      }
      return descendants;
    };

    const validDirIds = selectedDir === 'all' ? [] : [selectedDir, ...getDescendantIds(activeTab, selectedDir)];

    // Filter logic
    let items: any[] = [];
    
    const itemNames = library.itemNames || {};
    const itemOverrides = library.itemOverrides || {};

    if (activeTab === 'material') {
      const categoryLabels: Record<string, string> = {
        'urban_tech': '都市机能',
        'yama_style': '山系户外',
        'tactical': '户外战术',
        'urban_outdoor': '都市户外',
        'minimalist': '都市极简',
        'daily_casual': '日常休闲',
        'outdoor_tech': '户外机能',
      };

      const presets = materials.map(m => ({
        id: m.id,
        name: itemNames[m.id] || m.name,
        description: m.description,
        tags: m.tags,
        uiTag: m.uiTag,
        physicalTags: m.physicalTags,
        category: m.category,
        categories: m.categories,
        image: m.textureUrl,
        ...(itemOverrides[m.id] || {})
      }));
      
      const allItems = [...presets, ...customItems.map((i: any) => ({ ...i, isCustom: true }))];
      
      const styleCategoryMap: Record<string, string> = {
        'urban-outdoor': 'urban_outdoor',
        'urban-techwear': 'urban_tech',
        'urban-minimalist': 'minimalist',
        'daily-casual': 'daily_casual',
        'yama-outdoor': 'yama_style',
        'outdoor-techwear': 'outdoor_tech',
        'outdoor-tactical': 'tactical'
      };

      const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
      const activeStyleCategories = selectedCategories.map(id => styleCategoryMap[id]).filter(Boolean);

      const sortMaterials = (materials: any[]) => {
        return [...materials].sort((a, b) => {
          // 1. Top priority: matches active style categories
          const aMatchesStyle = a.categories?.some((cat: string) => activeStyleCategories.includes(cat));
          const bMatchesStyle = b.categories?.some((cat: string) => activeStyleCategories.includes(cat));
          if (aMatchesStyle && !bMatchesStyle) return -1;
          if (!aMatchesStyle && bMatchesStyle) return 1;

          // 2. Keep original order
          return 0;
        });
      };

      if (selectedDir === 'all') {
        items = sortMaterials(allItems);
      } else {
        items = sortMaterials(allItems.filter(p => 
          (p.categories && p.categories.some((c: string) => validDirIds.includes(c))) || 
          (!p.categories && p.category && validDirIds.includes(p.category)) || 
          ((!p.category && (!p.categories || p.categories.length === 0)) && selectedDir === 'unassigned')
        ));
      }
    } else if (activeTab === 'color') {
      const presets = [
        // Urban Techwear (20)
        {"id":"C001","pantone":"00-0002 TPG","name":"Phantom Black","zhName":"极致深黑","hex":"#050505","cat":"Urban Tech","application":"主料 (X-Pac/Cordura)"},
        {"id":"C002","pantone":"01-0006 TPG","name":"Deep Obsidian","zhName":"黑曜石","hex":"#121213","cat":"Urban Tech","application":"涂层拉链、Hypalon 辅料"},
        {"id":"C003","pantone":"02-0010 TPG","name":"Shadow Carbon","zhName":"碳纤维色","hex":"#1C1C1E","cat":"Urban Tech","application":"亚光防水面料"},
        {"id":"C004","pantone":"03-0015 TPG","name":"Matte Asphalt","zhName":"哑光沥青","hex":"#2C2C2C","cat":"Urban Tech","application":"织带、塑料扣具"},
        {"id":"C005","pantone":"03-0012 TPG","name":"Void Grey","zhName":"虚空灰","hex":"#242526","cat":"Urban Tech","application":"背板、网布"},
        {"id":"C006","pantone":"04-0017 TPG","name":"Dark Manganese","zhName":"暗锰","hex":"#303030","cat":"Urban Tech","application":"金属拉链齿、品牌 Logo"},
        {"id":"C007","pantone":"04-0020 TPG","name":"Iron Ore","zhName":"铁矿石","hex":"#383838","cat":"Urban Tech","application":"侧板拼接、内里"},
        {"id":"C008","pantone":"05-0026 TPG","name":"Titanium Dark","zhName":"暗钛","hex":"#48494B","cat":"Urban Tech","application":"反光饰条"},
        {"id":"C009","pantone":"02-0010 TPG","name":"Stealth Blue","zhName":"隐身暗蓝","hex":"#1B1E23","cat":"Urban Tech","application":"五金件"},
        {"id":"C010","pantone":"04-0014 TPG","name":"Cyber Purple","zhName":"赛博暗紫","hex":"#2E1A47","cat":"Urban Tech","application":"装饰线、铝制搭扣"},
        {"id":"C011","pantone":"07-0033 TPG","name":"Circuit Grey","zhName":"电路灰","hex":"#5E6064","cat":"Urban Tech","application":"提手缝线、拉链头绳"},
        {"id":"C012","pantone":"13-0060 TPG","name":"Silver Matrix","zhName":"矩阵银","hex":"#A9A9A9","cat":"Urban Tech","application":"急救包标识、内里拉链"},
        {"id":"C013","pantone":"03-0012 TPG","name":"Cobalt Dark","zhName":"暗钴蓝","hex":"#1E2732","cat":"Urban Tech","application":"警示标签、功能织带"},
        {"id":"C014","pantone":"02-0008 TPG","name":"Night Glitch","zhName":"深夜故障","hex":"#161A1D","cat":"Urban Tech","application":"笔记本仓内衬"},
        {"id":"C015","pantone":"08-0038 TPG","name":"Anodized Grey","zhName":"阳极氧化灰","hex":"#6C6D70","cat":"Urban Tech","application":"印刷 LOGO、反光条"},
        {"id":"C016","pantone":"04-0021 TPG","name":"Lunar Surface","zhName":"月面灰","hex":"#3B3B3B","cat":"Urban Tech","application":"过渡配色"},
        {"id":"C017","pantone":"01-0006 TPG","name":"Onyx Matte","zhName":"哑光玛瑙","hex":"#0F0F0F","cat":"Urban Tech","application":"辅料配件"},
        {"id":"C018","pantone":"06-0028 TPG","name":"Dark Chrome","zhName":"暗铬","hex":"#4F4F4F","cat":"Urban Tech","application":"扣具"},
        {"id":"C019","pantone":"01-0005 TPG","name":"Borealis Black","zhName":"极光黑","hex":"#0D1117","cat":"Urban Tech","application":"织带"},
        {"id":"C020","pantone":"14-0067 TPG","name":"Liquid Metal","zhName":"液态金属","hex":"#BEBEBE","cat":"Urban Tech","application":"装饰细节"},
        {"id":"C021","pantone":"03-0010 TPG","name":"Navy Commuter","zhName":"通勤深蓝","hex":"#1B263B","cat":"Urban Outdoor","application":"主色调"},
        {"id":"C022","pantone":"07-0026 TPG","name":"Slate Blue","zhName":"石板蓝","hex":"#415A77","cat":"Urban Outdoor","application":"主色调"},
        {"id":"C023","pantone":"05-0018 TPG","name":"Stormy Sea","zhName":"暴雨海","hex":"#2D3E50","cat":"Urban Outdoor","application":"主色调"},
        {"id":"C024","pantone":"10-0044 TPG","name":"Pavement Grey","zhName":"铺路石灰","hex":"#778899","cat":"Urban Outdoor","application":"主色调"},
        {"id":"C025","pantone":"06-0028 TPG","name":"Gravel","zhName":"碎石色","hex":"#4F4F4F","cat":"Urban Outdoor","application":"主色调"},
        {"id":"C026","pantone":"04-0018 TPG","name":"Forest Shadow","zhName":"森影","hex":"#2F3E33","cat":"Urban Outdoor","application":"辅色搭配"},
        {"id":"C027","pantone":"05-0024 TPG","name":"Pine Needle","zhName":"松针绿","hex":"#3D5245","cat":"Urban Outdoor","application":"辅色搭配"},
        {"id":"C028","pantone":"07-0038 TPG","name":"Muddy Water","zhName":"泥水色","hex":"#706357","cat":"Urban Outdoor","application":"辅色搭配"},
        {"id":"C029","pantone":"12-0054 TPG","name":"Concrete Jungle","zhName":"混凝土","hex":"#95A5A6","cat":"Urban Outdoor","application":"辅色搭配"},
        {"id":"C030","pantone":"06-0029 TPG","name":"Warm Asphalt","zhName":"暖沥青","hex":"#525252","cat":"Urban Outdoor","application":"辅色搭配"},
        {"id":"C031","pantone":"05-0023 TPG","name":"Wet Pavement","zhName":"湿路面","hex":"#3E4444","cat":"Urban Outdoor","application":"点缀色"},
        {"id":"C032","pantone":"06-0021 TPG","name":"Harbor Blue","zhName":"港口蓝","hex":"#354B5E","cat":"Urban Outdoor","application":"点缀色"},
        {"id":"C033","pantone":"06-0027 TPG","name":"Iron Gate","zhName":"铁门灰","hex":"#4E5052","cat":"Urban Outdoor","application":"点缀色"},
        {"id":"C034","pantone":"07-0032 TPG","name":"Castlerock","zhName":"城堡岩","hex":"#595E62","cat":"Urban Outdoor","application":"点缀色"},
        {"id":"C035","pantone":"15-0070 TPG","name":"Rainy Day","zhName":"雨天灰","hex":"#C5C9C7","cat":"Urban Outdoor","application":"点缀色"},
        {"id":"C036","pantone":"04-0009 TPG","name":"Deep Teal","zhName":"深青色","hex":"#004D4D","cat":"Urban Outdoor","application":"内衬、拉链"},
        {"id":"C037","pantone":"06-0025 TPG","name":"Dusk Blue","zhName":"暮蓝","hex":"#405262","cat":"Urban Outdoor","application":"内衬、拉链"},
        {"id":"C038","pantone":"07-0037 TPG","name":"Walnut Shell","zhName":"核桃壳","hex":"#6E5F52","cat":"Urban Outdoor","application":"内衬、拉链"},
        {"id":"C039","pantone":"05-0028 TPG","name":"Urban Moss","zhName":"都市苔藓","hex":"#4B5320","cat":"Urban Outdoor","application":"内衬、拉链"},
        {"id":"C040","pantone":"04-0018 TPG","name":"Shadow Grey","zhName":"影灰","hex":"#333333","cat":"Urban Outdoor","application":"内衬、拉链"},
        {"id":"C041","pantone":"18-0085 TPG","name":"Alabaster","zhName":"雪花石膏","hex":"#F2F2F2","cat":"Minimalist","application":"大面积主色"},
        {"id":"C042","pantone":"18-0084 TPG","name":"Cloud Dancer","zhName":"云舞者","hex":"#F0EEE9","cat":"Minimalist","application":"大面积主色"},
        {"id":"C043","pantone":"17-0081 TPG","name":"Vapor White","zhName":"水汽白","hex":"#E5E4E2","cat":"Minimalist","application":"大面积主色"},
        {"id":"C044","pantone":"16-0078 TPG","name":"Oyster Shell","zhName":"牡蛎壳","hex":"#DCD9D4","cat":"Minimalist","application":"大面积主色"},
        {"id":"C045","pantone":"14-0070 TPG","name":"Silver Birch","zhName":"白桦色","hex":"#C9C1B9","cat":"Minimalist","application":"大面积主色"},
        {"id":"C046","pantone":"13-0064 TPG","name":"Pebble","zhName":"鹅卵石","hex":"#B7B1A9","cat":"Minimalist","application":"内饰、细节"},
        {"id":"C047","pantone":"16-0075 TPG","name":"Mist","zhName":"薄雾","hex":"#D3D3D3","cat":"Minimalist","application":"内饰、细节"},
        {"id":"C048","pantone":"09-0045 TPG","name":"Dovetail","zhName":"鸽羽色","hex":"#7E7D7A","cat":"Minimalist","application":"内饰、细节"},
        {"id":"C049","pantone":"12-0059 TPG","name":"Smoked Pearl","zhName":"烟珠色","hex":"#A7A6A2","cat":"Minimalist","application":"内饰、细节"},
        {"id":"C050","pantone":"19-0088 TPG","name":"Titanium White","zhName":"钛白","hex":"#FAFAFA","cat":"Minimalist","application":"内饰、细节"},
        {"id":"C051","pantone":"16-0078 TPG","name":"Nude Texture","zhName":"裸感肌理","hex":"#E3D7D3","cat":"Minimalist","application":"对比色、五金"},
        {"id":"C052","pantone":"13-0064 TPG","name":"Champagne Grey","zhName":"香槟灰","hex":"#B8B2A7","cat":"Minimalist","application":"对比色、五金"},
        {"id":"C053","pantone":"17-0080 TPG","name":"Glacier","zhName":"冰川白","hex":"#E1E8ED","cat":"Minimalist","application":"对比色、五金"},
        {"id":"C054","pantone":"16-0077 TPG","name":"Cool Grey 1C","zhName":"冷灰1号","hex":"#D9D9D6","cat":"Minimalist","application":"对比色、五金"},
        {"id":"C055","pantone":"11-0050 TPG","name":"Slate Tint","zhName":"浅石板色","hex":"#8B939C","cat":"Minimalist","application":"对比色、五金"},
        {"id":"C056","pantone":"06-0030 TPG","name":"Soft Charcoal","zhName":"软炭灰","hex":"#545454","cat":"Minimalist","application":"织带、扣具"},
        {"id":"C057","pantone":"14-0066 TPG","name":"Pure Zinc","zhName":"纯锌","hex":"#BABABA","cat":"Minimalist","application":"织带、扣具"},
        {"id":"C058","pantone":"18-0084 TPG","name":"Frost","zhName":"霜色","hex":"#EDF2F4","cat":"Minimalist","application":"织带、扣具"},
        {"id":"C059","pantone":"15-0073 TPG","name":"Pale Bone","zhName":"浅骨色","hex":"#D2CECA","cat":"Minimalist","application":"织带、扣具"},
        {"id":"C060","pantone":"18-0087 TPG","name":"Silk Matte","zhName":"哑光丝绸","hex":"#F5F5F5","cat":"Minimalist","application":"织带、扣具"},
        {"id":"C061","pantone":"09-0054 TPG","name":"Caramel","zhName":"焦糖色","hex":"#AF6E4D","cat":"Daily Casual","application":"帆布主料"},
        {"id":"C062","pantone":"10-0073 TPG","name":"Mustard Seed","zhName":"芥末籽","hex":"#E1AD01","cat":"Daily Casual","application":"帆布主料"},
        {"id":"C063","pantone":"09-0036 TPG","name":"Washed Denim","zhName":"水洗丹宁","hex":"#5D76A9","cat":"Daily Casual","application":"帆布主料"},
        {"id":"C064","pantone":"06-0044 TPG","name":"Brick Red","zhName":"砖红","hex":"#A52A2A","cat":"Daily Casual","application":"帆布主料"},
        {"id":"C065","pantone":"06-0045 TPG","name":"Olive Oil","zhName":"橄榄油","hex":"#808000","cat":"Daily Casual","application":"帆布主料"},
        {"id":"C066","pantone":"13-0067 TPG","name":"Canvas Khaki","zhName":"帆布卡其","hex":"#C3B091","cat":"Daily Casual","application":"水洗面料"},
        {"id":"C067","pantone":"13-0070 TPG","name":"Sand Dune","zhName":"沙丘","hex":"#D2B48C","cat":"Daily Casual","application":"水洗面料"},
        {"id":"C068","pantone":"10-0052 TPG","name":"Sage Leaf","zhName":"鼠尾草","hex":"#8F9779","cat":"Daily Casual","application":"水洗面料"},
        {"id":"C069","pantone":"11-0066 TPG","name":"Terra Cotta","zhName":"陶土","hex":"#E2725B","cat":"Daily Casual","application":"水洗面料"},
        {"id":"C070","pantone":"11-0082 TPG","name":"Amber","zhName":"琥珀","hex":"#FFBF00","cat":"Daily Casual","application":"水洗面料"},
        {"id":"C071","pantone":"06-0025 TPG","name":"Tidepool","zhName":"潮汐池","hex":"#3D5A5A","cat":"Daily Casual","application":"内衬、拉链头"},
        {"id":"C072","pantone":"10-0070 TPG","name":"Harvest Gold","zhName":"收获金","hex":"#DAA520","cat":"Daily Casual","application":"内衬、拉链头"},
        {"id":"C073","pantone":"05-0019 TPG","name":"Indigo","zhName":"靛蓝","hex":"#2E4053","cat":"Daily Casual","application":"内衬、拉链头"},
        {"id":"C074","pantone":"09-0057 TPG","name":"Copper","zhName":"红铜","hex":"#B87333","cat":"Daily Casual","application":"内衬、拉链头"},
        {"id":"C075","pantone":"16-0079 TPG","name":"Oatmeal","zhName":"燕麦","hex":"#E3D9C6","cat":"Daily Casual","application":"内衬、拉链头"},
        {"id":"C076","pantone":"07-0043 TPG","name":"Chestnut","zhName":"栗色","hex":"#954535","cat":"Daily Casual","application":"缝线、点缀"},
        {"id":"C077","pantone":"03-0009 TPG","name":"Denim Dark","zhName":"深色丹宁","hex":"#152238","cat":"Daily Casual","application":"缝线、点缀"},
        {"id":"C078","pantone":"16-0084 TPG","name":"Wheat Field","zhName":"麦田","hex":"#F5DEB3","cat":"Daily Casual","application":"缝线、点缀"},
        {"id":"C079","pantone":"15-0082 TPG","name":"Peach Fuzz","zhName":"柔和桃","hex":"#FFBE98","cat":"Daily Casual","application":"缝线、点缀"},
        {"id":"C080","pantone":"14-0056 TPG","name":"Sky Blue","zhName":"天蓝","hex":"#87CEEB","cat":"Daily Casual","application":"缝线、点缀"},
        {"id":"C081","pantone":"09-0066 TPG","name":"Autumn Leaf","zhName":"秋叶","hex":"#D68910","cat":"Yama Style","application":"主料 (尼龙/帆布)"},
        {"id":"C082","pantone":"04-0016 TPG","name":"Deep Forest","zhName":"深林","hex":"#145A32","cat":"Yama Style","application":"主料 (尼龙/帆布)"},
        {"id":"C083","pantone":"05-0024 TPG","name":"Earth Brown","zhName":"土褐","hex":"#483C32","cat":"Yama Style","application":"主料 (尼龙/帆布)"},
        {"id":"C084","pantone":"09-0062 TPG","name":"Ochre","zhName":"赭石","hex":"#CC7722","cat":"Yama Style","application":"主料 (尼龙/帆布)"},
        {"id":"C085","pantone":"10-0050 TPG","name":"Moss Green","zhName":"苔藓绿","hex":"#8A9A5B","cat":"Yama Style","application":"主料 (尼龙/帆布)"},
        {"id":"C086","pantone":"12-0085 TPG","name":"Midnight Sun","zhName":"午夜阳","hex":"#FFD700","cat":"Yama Style","application":"抽绳、织带点缀"},
        {"id":"C087","pantone":"06-0030 TPG","name":"Plum","zhName":"李子红","hex":"#673147","cat":"Yama Style","application":"抽绳、织带点缀"},
        {"id":"C088","pantone":"07-0060 TPG","name":"Rustic Orange","zhName":"铁锈橙","hex":"#D35400","cat":"Yama Style","application":"抽绳、织带点缀"},
        {"id":"C089","pantone":"09-0027 TPG","name":"Lake Blue","zhName":"湖蓝","hex":"#2E86C1","cat":"Yama Style","application":"抽绳、织带点缀"},
        {"id":"C090","pantone":"07-0040 TPG","name":"Sandstone","zhName":"砂岩","hex":"#766344","cat":"Yama Style","application":"抽绳、织带点缀"},
        {"id":"C091","pantone":"05-0017 TPG","name":"Spruce","zhName":"云杉蓝","hex":"#2C3E50","cat":"Yama Style","application":"内衬、拼接"},
        {"id":"C092","pantone":"06-0035 TPG","name":"Cedar","zhName":"雪松","hex":"#6D4C41","cat":"Yama Style","application":"内衬、拼接"},
        {"id":"C093","pantone":"07-0033 TPG","name":"Fern","zhName":"蕨草","hex":"#4F7942","cat":"Yama Style","application":"内衬、拼接"},
        {"id":"C094","pantone":"10-0075 TPG","name":"Sunset Glow","zhName":"落日余晖","hex":"#FD7E14","cat":"Yama Style","application":"内衬、拼接"},
        {"id":"C095","pantone":"05-0022 TPG","name":"Granite Grey","zhName":"花岗岩","hex":"#3E3E3E","cat":"Yama Style","application":"内衬、拼接"},
        {"id":"C096","pantone":"07-0033 TPG","name":"Wild Berry","zhName":"野果色","hex":"#8B008B","cat":"Yama Style","application":"拉链、扣件"},
        {"id":"C097","pantone":"05-0020 TPG","name":"Slate Green","zhName":"石板绿","hex":"#2F4F4F","cat":"Yama Style","application":"拉链、扣件"},
        {"id":"C098","pantone":"13-0074 TPG","name":"Tumbleweed","zhName":"风滚草","hex":"#DEB887","cat":"Yama Style","application":"拉链、扣件"},
        {"id":"C099","pantone":"12-0042 TPG","name":"Alpine Blue","zhName":"高山蓝","hex":"#6495ED","cat":"Yama Style","application":"拉链、扣件"},
        {"id":"C100","pantone":"05-0030 TPG","name":"Bark","zhName":"树皮","hex":"#5D4037","cat":"Yama Style","application":"拉链、扣件"},
        {"id":"C101","pantone":"08-0068 TPG","name":"Rescue Orange","zhName":"救援橙","hex":"#FF4500","cat":"Outdoor Tech","application":"警示标识、内衬"},
        {"id":"C102","pantone":"12-0086 TPG","name":"Safety Yellow","zhName":"荧光黄","hex":"#EFFF00","cat":"Outdoor Tech","application":"警示标识、内衬"},
        {"id":"C103","pantone":"11-0078 TPG","name":"Electric Volt","zhName":"电力绿","hex":"#CEFF00","cat":"Outdoor Tech","application":"警示标识、内衬"},
        {"id":"C104","pantone":"01-0001 TPG","name":"Abyss Blue","zhName":"深渊蓝","hex":"#000C1F","cat":"Outdoor Tech","application":"警示标识、内衬"},
        {"id":"C105","pantone":"16-0077 TPG","name":"Glacier Ice","zhName":"冰川冰","hex":"#D0F0C0","cat":"Outdoor Tech","application":"警示标识、内衬"},
        {"id":"C106","pantone":"03-0033 TPG","name":"Magma","zhName":"岩浆","hex":"#8B0000","cat":"Outdoor Tech","application":"主料 (防水/耐磨)"},
        {"id":"C107","pantone":"06-0060 TPG","name":"Siren Red","zhName":"警笛红","hex":"#FF0000","cat":"Outdoor Tech","application":"主料 (防水/耐磨)"},
        {"id":"C108","pantone":"06-0030 TPG","name":"Night Vision","zhName":"夜视绿","hex":"#00FF00","cat":"Outdoor Tech","application":"主料 (防水/耐磨)"},
        {"id":"C109","pantone":"19-0089 TPG","name":"Polar White","zhName":"极地白","hex":"#FBFCF8","cat":"Outdoor Tech","application":"主料 (防水/耐磨)"},
        {"id":"C110","pantone":"12-0054 TPG","name":"Tundra Grey","zhName":"冻原灰","hex":"#95A5A6","cat":"Outdoor Tech","application":"主料 (防水/耐磨)"},
        {"id":"C111","pantone":"04-0014 TPG","name":"Storm Shadow","zhName":"风暴影","hex":"#243447","cat":"Outdoor Tech","application":"拼接、补强"},
        {"id":"C112","pantone":"08-0031 TPG","name":"Ultraviolet","zhName":"紫外线","hex":"#5F4B8B","cat":"Outdoor Tech","application":"拼接、补强"},
        {"id":"C113","pantone":"10-0063 TPG","name":"Acid Green","zhName":"酸性绿","hex":"#B0BF1A","cat":"Outdoor Tech","application":"拼接、补强"},
        {"id":"C114","pantone":"03-0004 TPG","name":"Deep Sea Blue","zhName":"深海蓝","hex":"#002366","cat":"Outdoor Tech","application":"拼接、补强"},
        {"id":"C115","pantone":"03-0013 TPG","name":"Volcanic Rock","zhName":"火山岩","hex":"#252525","cat":"Outdoor Tech","application":"拼接、补强"},
        {"id":"C116","pantone":"10-0076 TPG","name":"Solar Flare","zhName":"太阳耀斑","hex":"#FF8C00","cat":"Outdoor Tech","application":"拉链、抽绳"},
        {"id":"C117","pantone":"11-0022 TPG","name":"Oxygen Blue","zhName":"氧气蓝","hex":"#00BFFF","cat":"Outdoor Tech","application":"拉链、抽绳"},
        {"id":"C118","pantone":"04-0019 TPG","name":"Stealth Camo","zhName":"隐形迷彩基色","hex":"#353839","cat":"Outdoor Tech","application":"拉链、抽绳"},
        {"id":"C119","pantone":"10-0062 TPG","name":"High-Viz Pink","zhName":"高视度粉","hex":"#FF1493","cat":"Outdoor Tech","application":"拉链、抽绳"},
        {"id":"C120","pantone":"09-0031 TPG","name":"Cold Steel","zhName":"冷钢蓝","hex":"#4682B4","cat":"Outdoor Tech","application":"拉链、抽绳"},
        {"id":"C121","pantone":"05-0032 TPG","name":"Coyote Dark","zhName":"深狼棕","hex":"#654321","cat":"Tactical","application":"Cordura 主料、MOLLE织带"},
        {"id":"C122","pantone":"05-0025 TPG","name":"Ranger Green","zhName":"游骑兵绿","hex":"#444C38","cat":"Tactical","application":"Cordura 主料、MOLLE织带"},
        {"id":"C123","pantone":"06-0030 TPG","name":"Wolf Grey","zhName":"狼灰","hex":"#53565A","cat":"Tactical","application":"Cordura 主料、MOLLE织带"},
        {"id":"C124","pantone":"12-0067 TPG","name":"Desert Sand","zhName":"沙漠沙","hex":"#C2B280","cat":"Tactical","application":"Cordura 主料、MOLLE织带"},
        {"id":"C125","pantone":"10-0055 TPG","name":"Tan 499","zhName":"美军标卡其","hex":"#A58B6F","cat":"Tactical","application":"Cordura 主料、MOLLE织带"},
        {"id":"C126","pantone":"08-0044 TPG","name":"Multicam Green","zhName":"迷彩绿","hex":"#7C7C52","cat":"Tactical","application":"副料、拼接"},
        {"id":"C127","pantone":"04-0020 TPG","name":"Olive Drab","zhName":"橄榄褐","hex":"#3D3635","cat":"Tactical","application":"副料、拼接"},
        {"id":"C128","pantone":"08-0043 TPG","name":"Flat Dark Earth","zhName":"暗土色","hex":"#7E6D5A","cat":"Tactical","application":"副料、拼接"},
        {"id":"C129","pantone":"02-0009 TPG","name":"Special Ops Black","zhName":"特种黑","hex":"#1A1A1A","cat":"Tactical","application":"副料、拼接"},
        {"id":"C130","pantone":"04-0016 TPG","name":"Gunmetal","zhName":"枪色","hex":"#2C3539","cat":"Tactical","application":"副料、拼接"},
        {"id":"C131","pantone":"06-0035 TPG","name":"Field Drab","zhName":"野战褐","hex":"#6C541E","cat":"Tactical","application":"内衬、网布"},
        {"id":"C132","pantone":"08-0045 TPG","name":"Khaki Drill","zhName":"卡其斜纹","hex":"#827839","cat":"Tactical","application":"内衬、网布"},
        {"id":"C133","pantone":"10-0045 TPG","name":"Urban Camo Grey","zhName":"都市迷彩灰","hex":"#808080","cat":"Tactical","application":"内衬、网布"},
        {"id":"C134","pantone":"10-0047 TPG","name":"Battleship Grey","zhName":"舰艇灰","hex":"#848482","cat":"Tactical","application":"内衬、网布"},
        {"id":"C135","pantone":"01-0004 TPG","name":"Night Stalker","zhName":"夜袭者","hex":"#0B0B0B","cat":"Tactical","application":"内衬、网布"},
        {"id":"C136","pantone":"14-0076 TPG","name":"Savannah","zhName":"萨凡纳","hex":"#E1C699","cat":"Tactical","application":"扣具、拉链"},
        {"id":"C137","pantone":"12-0066 TPG","name":"Earth Khaki","zhName":"大地卡其","hex":"#BDB76B","cat":"Tactical","application":"扣具、拉链"},
        {"id":"C138","pantone":"10-0052 TPG","name":"Foliage Green","zhName":"叶绿","hex":"#8F9779","cat":"Tactical","application":"扣具、拉链"},
        {"id":"C139","pantone":"05-0022 TPG","name":"Commando","zhName":"突击队色","hex":"#3B444B","cat":"Tactical","application":"扣具、拉链"},
        {"id":"C140","pantone":"07-0047 TPG","name":"Dusty Brown","zhName":"落灰褐","hex":"#966919","cat":"Tactical","application":"扣具、拉链"}
      ].map(c => ({
        ...c,
        type: c.cat,
        category: c.cat, // Use the actual category for filtering
        ...(itemOverrides[c.id] || {})
      }));
      const allItems = [...presets, ...customItems.map((i: any) => ({ ...i, isCustom: true }))];
      if (selectedDir === 'all') {
        items = allItems;
      } else {
        items = allItems.filter(p => validDirIds.includes(p.category) || (!p.category && selectedDir === 'unassigned'));
      }
    } else if (activeTab === 'hardware') {
      const presets = [
        { id: 'sys_hw_fidlock', name: itemNames['sys_hw_fidlock'] || 'Fidlock V-Buckle', type: '紧估系统', material: '金属材质', finish: '拉丝', category: 'buckle', ...(itemOverrides['sys_hw_fidlock'] || {}) },
        { id: 'sys_hw_duraflex', name: itemNames['sys_hw_duraflex'] || 'Duraflex Stealth', type: '紧估系统', material: '塑料材质', finish: 'POM', category: 'buckle', ...(itemOverrides['sys_hw_duraflex'] || {}) },
        { id: 'sys_hw_ykk', name: itemNames['sys_hw_ykk'] || 'YKK AquaGuard', type: '闭合系统', material: '防水拉链', finish: '亚光', category: 'zipper', ...(itemOverrides['sys_hw_ykk'] || {}) },
      ];
      const allItems = [...presets, ...customItems.map((i: any) => ({ ...i, isCustom: true }))];
      if (selectedDir === 'all') {
        items = allItems;
      } else {
        items = allItems.filter(p => validDirIds.includes(p.category) || (!p.category && selectedDir === 'unassigned'));
      }
    } else if (activeTab === 'logo') {
      const presets = [
        { id: 'sys_logo_silicone', name: itemNames['sys_logo_silicone'] || '立体硅胶 (3D Silicone)', type: '立体工艺 (3D)', description: '高凸起，哑光质感', category: 'silicone', ...(itemOverrides['sys_logo_silicone'] || {}) },
        { id: 'sys_logo_metal', name: itemNames['sys_logo_metal'] || '金属铭牌 (Metal Plate)', type: '立体工艺 (3D)', description: '激光雕刻，拉丝表面', category: 'leather', ...(itemOverrides['sys_logo_metal'] || {}) },
        { id: 'sys_logo_embroidery', name: itemNames['sys_logo_embroidery'] || '刺绣 (Embroidery)', type: '平整工艺 (Flat)', description: '精细刺绣', category: 'embroidery', ...(itemOverrides['sys_logo_embroidery'] || {}) },
      ];
      const allItems = [...presets, ...customItems.map((i: any) => ({ ...i, isCustom: true }))];
      if (selectedDir === 'all') {
        items = allItems;
      } else {
        items = allItems.filter(p => validDirIds.includes(p.category) || (!p.category && selectedDir === 'unassigned'));
      }
    }

    if (searchQuery) {
      items = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Box size={48} className="mb-4 opacity-20" />
          <p>暂无相关资产</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          if (activeTab === 'material' || activeTab === 'color') {
            return (
              <div
                key={item.id || idx}
                onClick={(e) => {
                  if (activeTab === 'color' && item.hex) {
                    navigator.clipboard.writeText(item.hex);
                  }
                  handleItemClick(e, item);
                }}
                className={`relative h-28 rounded-xl border-2 p-3 text-center transition-all overflow-hidden group ${activeTab === 'color' ? '' : getTextureClass(item.id)} ${
                  isBatchMode && selectedItems.includes(item.id || item.name)
                    ? 'border-slate-500 bg-slate-900/20'
                    : 'glass-tile-premium hover:border-slate-500/50 hover:scale-[1.02]'
                } ${highlightColor === item.hex ? 'ring-4 ring-offset-4 ring-offset-black ring-blue-500 z-10 scale-105' : ''} cursor-pointer`}
                style={{
                  boxShadow: highlightColor === item.hex ? `0 0 30px 5px ${item.hex}80` : `0 0 0 0 ${item.hex || 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  if (activeTab === 'color' && item.hex && highlightColor !== item.hex) {
                    e.currentTarget.style.boxShadow = `0 0 15px 2px ${item.hex}80`;
                    e.currentTarget.style.borderColor = item.hex;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab === 'color' && highlightColor !== item.hex) {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '';
                  }
                }}
              >
                {activeTab === 'material' && item.image && !item.image.includes('picsum.photos') && (
                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
                {activeTab === 'color' && (
                  <>
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: item.hex }}></div>
                    {/* Texture Overlay */}
                    <div 
                      className={`absolute inset-0 w-full h-full mix-blend-overlay pointer-events-none ${item.cat === 'Urban Tech' ? 'opacity-5' : item.cat === 'Tactical' ? 'opacity-8' : 'opacity-10'}`}
                      style={{
                        backgroundImage: item.cat === 'Urban Tech'
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,1) 10px, rgba(0,0,0,1) 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,1) 10px, rgba(0,0,0,1) 11px)'
                          : item.cat === 'Tactical'
                          ? 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                          : item.mat?.includes('X-Pac') 
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)'
                          : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 3px)',
                        backgroundSize: item.cat === 'Urban Tech' ? '20px 20px' : item.cat === 'Tactical' ? '100px 100px' : item.mat?.includes('X-Pac') ? '15px 15px' : '4px 4px'
                      }}
                    ></div>
                  </>
                )}
                {activeTab === 'material' && (item.id === 'DP_CORDURA500D' || item.id === 'DP_XPAC_VX21') ? (
                  <div className="absolute top-2 left-2 bg-blue-500/80 px-1.5 py-0.5 rounded text-[9px] text-white font-bold uppercase tracking-wider flex items-center gap-1 z-20">
                    通用
                  </div>
                ) : item.tags && item.tags.length > 0 && (
                  <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-bold uppercase tracking-wider flex items-center gap-1 z-20">
                    {item.tags[0]}
                  </div>
                )}
                {activeTab === 'color' && item.cat && (
                  <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-bold uppercase tracking-wider flex items-center gap-1 z-20">
                    {item.cat}
                  </div>
                )}
                {item.isCustom && (
                  <div className="absolute top-2 right-2 bg-slate-500/80 backdrop-blur-sm text-[8px] px-1.5 py-0.5 rounded text-white font-bold z-20">LIBRARY</div>
                )}
                {isBatchMode && item.isCustom && (
                  <div className={`absolute top-2 left-2 w-5 h-5 rounded-lg border flex items-center justify-center transition-all z-20 ${selectedItems.includes(item.id || item.name) ? 'bg-slate-500 border-slate-500 shadow-lg shadow-slate-500/40' : 'bg-black/60 border-white/30 hover:border-white/50'}`}>
                    {selectedItems.includes(item.id || item.name) && <Check size={14} className="text-white" />}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent z-10" />
                <div className="relative z-20 mt-5 text-left">
                  <h4 className="text-[11px] font-bold text-white leading-tight truncate">{activeTab === 'color' ? item.zhName : item.name}</h4>
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-tight truncate">{activeTab === 'color' ? item.pantone : (item.type || item.description)}</p>
                  {activeTab === 'color' && (
                    <div className="mt-1 font-mono text-[9px] text-slate-400">
                      {item.hex}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  {/* Action buttons removed as functions are not defined in this scope */}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  const getIconColorClass = (id: string, isActive: boolean) => {
    const baseOpacity = isActive ? 'opacity-100' : 'opacity-70 group-hover/header:opacity-100';
    switch (id) {
      case 'material': return `text-indigo-300 ${baseOpacity} ${isActive ? 'drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]' : ''}`;
      case 'color': return `text-fuchsia-300 ${baseOpacity} ${isActive ? 'drop-shadow-[0_0_8px_rgba(240,171,252,0.5)]' : ''}`;
      case 'hardware': return `text-amber-100/70 ${baseOpacity} ${isActive ? 'drop-shadow-[0_0_8px_rgba(254,243,199,0.5)]' : ''}`;
      case 'logo': return `text-teal-100/70 ${baseOpacity} ${isActive ? 'drop-shadow-[0_0_8px_rgba(204,251,241,0.5)]' : ''}`;
      default: return `text-white ${baseOpacity} ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div 
        className="relative w-full max-w-6xl h-[85vh] glass-panel-premium rounded-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <Layers size={18} className="text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">资产库 (Asset Library)</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsImportModalOpen(true)} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors shadow-sm"
            >
              <UploadCloud size={14} /> 导入资产
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button 
              onClick={undoLibraryAction} 
              disabled={!libraryHistory || libraryHistory.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                libraryHistory && libraryHistory.length > 0 
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' 
                  : 'bg-transparent text-slate-600 border-transparent cursor-not-allowed'
              }`} 
              title="撤回上一步操作（如删除目录、删除资产等）"
            >
              <Undo2 size={14} /> 撤回
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>

            <div className="relative">
              <button 
                onClick={() => setShowConfigMenu(!showConfigMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded text-xs font-medium transition-colors border border-white/10"
                title="高级设置"
              >
                <Settings2 size={14} /> 设置
              </button>
              
              {showConfigMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowConfigMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-lg shadow-xl z-50 overflow-hidden py-1">
                    <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700/50 mb-1">
                      资产库配置备份
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">用于在不同设备间同步或备份您的自定义资产库数据</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImportLibrary} accept=".json" className="hidden" />
                    <button 
                      onClick={() => { fileInputRef.current?.click(); setShowConfigMenu(false); }} 
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                    >
                      <Upload size={14} /> 导入配置
                    </button>
                    <button 
                      onClick={() => { handleExportLibrary(); setShowConfigMenu(false); }} 
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                    >
                      <Download size={14} /> 导出配置
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: Directory Tree */}
          <div className="w-64 bg-white/5 border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar relative">
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-300 tracking-widest">目录管理</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleAddDirectory(activeTab)}
                    className="flex items-center gap-1 px-3 py-1.5 glass-tile-premium hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg border border-white/10 transition-all"
                    title="在当前分类下新增一级目录"
                  >
                    <Plus size={14} />
                    新增目录
                  </button>
                </div>
              </div>

              {menuItems.map((menu) => (
                <div key={menu.id} className="space-y-2">
                  <div className="flex items-center justify-between group/header">
                    <button 
                      onClick={() => {
                        setActiveTab(menu.id as any);
                        setSelectedDir('all');
                      }}
                      onDoubleClick={() => {
                        setExpandedCategories(prev => 
                          prev.includes(menu.id) 
                            ? prev.filter(id => id !== menu.id) 
                            : [...prev, menu.id]
                        );
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 flex-1 text-left transition-colors select-none ${activeTab === menu.id && selectedDir === 'all' ? 'glass-tile-premium text-white font-bold rounded-lg shadow-sm' : activeTab === menu.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-1.5 rounded-md ${activeTab === menu.id ? 'bg-white/5 border border-white/10' : ''}`}>
                          <menu.icon size={16} className={`transition-opacity ${getIconColorClass(menu.id, activeTab === menu.id)}`} />
                        </div>
                        <span className={`text-sm font-bold tracking-wider truncate cursor-pointer transition-colors ${activeTab === menu.id ? 'text-white drop-shadow-md' : 'text-slate-300 group-hover/header:text-white'}`}>
                          {menu.label}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCategories(prev => 
                          prev.includes(menu.id) 
                            ? prev.filter(id => id !== menu.id) 
                            : [...prev, menu.id]
                        );
                      }}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 transition-colors"
                    >
                      {expandedCategories.includes(menu.id) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  </div>
                  
                  {expandedCategories.includes(menu.id) && (
                    <div className="space-y-1 pl-2">
                      {menu.subDirs.filter(d => !d.parentId).map(dir => renderDirectory(dir, menu.id))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
            {/* Functional Top Bar */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4 bg-white/5">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="搜索资产名称、标签或属性..." 
                  className="w-full glass-input-flat rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                {isBatchMode ? (
                  <>
                    <span className="text-xs text-slate-400 mr-2">已选择 {selectedItems.length} 项</span>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setShowMoveMenu(!showMoveMenu)}
                        disabled={selectedItems.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-xl border border-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FolderInput size={16} />
                        移动至
                        <ChevronDown size={14} className={`transition-transform ${showMoveMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showMoveMenu && (
                        <div className="absolute top-full right-0 mt-2 w-64 glass-panel rounded-xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                          <div className="px-3 py-1 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">选择目标目录</div>
                          {menuItems.find(m => m.id === activeTab)?.subDirs.map(dir => {
                            const getDirFullPath = (tabId: string, dirId: string): string => {
                              const currentDirs = directories[tabId] || [];
                              const d = currentDirs.find(x => x.id === dirId);
                              if (!d) return '';
                              if (d.parentId) {
                                return `${getDirFullPath(tabId, d.parentId)} / ${d.label}`;
                              }
                              return d.label;
                            };
                            return (
                              <button
                                key={dir.id}
                                onClick={() => handleBatchMove(dir.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors truncate"
                                title={getDirFullPath(activeTab, dir.id)}
                              >
                                {getDirFullPath(activeTab, dir.id)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleBatchDelete}
                      disabled={selectedItems.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-bold rounded-xl transition-all border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={16} />
                      删除
                    </button>
                    <button 
                      onClick={() => {
                        setIsBatchMode(false);
                        setSelectedItems([]);
                        setShowMoveMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-xl border border-white/5 transition-all"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsBatchMode(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-xl border border-white/5 transition-all"
                    >
                      <Filter size={16} />
                      批量管理
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      {/* Context Menu for Directories */}
      {contextMenuDir && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setContextMenuDir(null)}></div>
          <div 
            className="fixed z-[70] w-48 glass-panel rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto custom-scrollbar"
            style={{ 
              left: Math.min(contextMenuDir.x, window.innerWidth - 200), 
              top: Math.min(contextMenuDir.y, window.innerHeight - 400) 
            }}
          >
            {contextMenuDir.level < 2 && (
              <button 
                onClick={() => {
                  handleAddDirectory(activeTab, contextMenuDir.id);
                  setContextMenuDir(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Plus size={14} />
                新建子目录
              </button>
            )}
            <button 
              onClick={() => {
                const currentDirs = directories[activeTab] || [];
                const dir = currentDirs.find(d => d.id === contextMenuDir.id);
                handleAddDirectory(activeTab, dir?.parentId);
                setContextMenuDir(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Plus size={14} />
              新建同级目录
            </button>
            <button 
              onClick={() => {
                setEditingDirId(contextMenuDir.id);
                const currentDirs = directories[activeTab] || [];
                const dir = currentDirs.find(d => d.id === contextMenuDir.id);
                if (dir) {
                  setEditingDirValue(dir.label);
                }
                setContextMenuDir(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Edit2 size={14} />
              重命名
            </button>
            <div className="h-px bg-white/5 my-1"></div>
            <div className="px-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">移动至目录</div>
            {(() => {
              const currentDirs = directories[activeTab] || [];
              const dir = currentDirs.find(d => d.id === contextMenuDir.id);
              if (dir && dir.parentId) {
                return (
                  <button 
                    onClick={() => {
                      handleMoveToSubdirectory(activeTab, contextMenuDir.id, null);
                      setContextMenuDir(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors truncate"
                  >
                    <FolderInput size={14} />
                    移至根目录
                  </button>
                );
              }
              return null;
            })()}
            {getValidTargetDirs(activeTab, contextMenuDir.id).map(dir => (
              <button 
                key={dir.id}
                onClick={() => {
                  handleMoveToSubdirectory(activeTab, contextMenuDir.id, dir.id);
                  setContextMenuDir(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors truncate"
              >
                <FolderInput size={14} />
                {dir.label}
              </button>
            ))}
            <div className="h-px bg-white/5 my-1"></div>
            <div className="px-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">移动至分类</div>
            {menuItems.filter(m => m.id !== activeTab).map(menu => (
              <button 
                key={menu.id}
                onClick={() => {
                  handleMoveDirectory(activeTab, contextMenuDir.id, menu.id);
                  setContextMenuDir(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <menu.icon size={14} />
                {menu.label.split(' ')[0]}
              </button>
            ))}
            <div className="h-px bg-white/5 my-1"></div>
            <button 
              onClick={() => {
                const currentLibrary = useDesignStore.getState().designData.library;
                const currentDirs = currentLibrary.directories || {};
                const tabDirs = currentDirs[activeTab] || [];
                
                const getDescendantIds = (parentId: string): string[] => {
                  const children = tabDirs.filter((d: any) => d.parentId === parentId).map((d: any) => d.id);
                  let descendants = [...children];
                  for (const childId of children) {
                    descendants = [...descendants, ...getDescendantIds(childId)];
                  }
                  return descendants;
                };
                const descendantIds = getDescendantIds(contextMenuDir.id);
                const allIds = [contextMenuDir.id, ...descendantIds];
                const count = ((currentLibrary as any)[activeTab] || []).filter((i: any) => allIds.includes(i.category)).length;
                setDeleteConfirmDir({ id: contextMenuDir.id, count });
                setContextMenuDir(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              删除目录
            </button>
          </div>
        </>
      )}

      {/* Delete Directory Confirmation */}
      {deleteConfirmDir && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmDir(null)}></div>
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">是否同时删除该目录下的 {deleteConfirmDir.count} 个资产？</h3>
            <p className="text-sm text-slate-400 mb-6">
              删除目录后，您可以选择保留资产并移动至根目录，或将其一并删除。
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => handleDeleteDirectory(activeTab, deleteConfirmDir.id, true)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all"
              >
                同时删除目录及其下的资产
              </button>
              <button 
                onClick={() => handleDeleteDirectory(activeTab, deleteConfirmDir.id, false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all border border-white/5"
              >
                仅删除目录并移动资产至根目录
              </button>
              <button 
                onClick={() => setDeleteConfirmDir(null)}
                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {detailItem && (
        <AssetDetailModal
          item={detailItem}
          activeTab={activeTab}
          onClose={() => setDetailItem(null)}
          onSave={handleSaveDetail}
          onSelect={onSelect ? (item) => {
            onSelect(activeTab as any, item);
            setDetailItem(null);
            onClose();
          } : undefined}
        />
      )}

      {/* Asset Import Modal */}
      <AssetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeTab={activeTab as any}
        selectedDir={selectedDir}
      />
    </div>
  );
};
