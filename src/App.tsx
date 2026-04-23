import React from 'react';
import localforage from 'localforage';
import { useDesignStore, ModuleId } from './store/useDesignStore';
import { CompetitorLibrary } from './modules/CompetitorLibrary';
import { DesignDefinition } from './modules/DesignDefinition';
import { AppearanceAnalysis } from './modules/AppearanceAnalysis';
import { MaterialSelection } from './modules/MaterialSelection';
import { StructureFunction } from './modules/StructureFunction';
import { DivergenceReview } from './modules/DivergenceReview';
import { FinalGeneration } from './modules/FinalGeneration';
import { 
  LayoutDashboard, 
  Palette, 
  Box, 
  Layers, 
  FileText, 
  CheckCircle2,
  Settings,
  HelpCircle,
  ChevronRight,
  Sparkles,
  LogIn,
  LogOut,
  Cloud
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackgroundMeteor } from './components/BackgroundMeteor';
import { STYLE_CATEGORIES } from './modules/CompetitorLibrary';
import { auth, loginWithGoogle, logout } from './utils/firebaseUtils';

const SidebarItem = ({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  isExpanded,
  onClick,
  onDoubleClick
}: { 
  id: ModuleId, 
  label: string, 
  icon: any, 
  isActive: boolean, 
  isExpanded?: boolean,
  onClick: () => void,
  onDoubleClick?: () => void
}) => (
  <button
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
      isActive 
        ? 'bg-white/10 border border-white/10 text-white shadow-lg backdrop-blur-md' 
        : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
    <span className={`font-medium text-sm tracking-wide ${isActive ? 'text-white' : ''}`}>{label}</span>
    {isActive && <ChevronRight size={16} className={`ml-auto text-white/50 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />}
  </button>
);

export default function App() {
  const activeModule = useDesignStore(state => state.activeModule);
  const setActiveModule = useDesignStore(state => state.setActiveModule);
  const activeStyleCategory = useDesignStore(state => state.activeStyleCategory);
  const designData = useDesignStore(state => state.designData);
  const selectedCategories = designData.competitor?.styleCategories || (designData.competitor?.styleCategory ? [designData.competitor.styleCategory] : []);
  const [isCmfExpanded, setIsCmfExpanded] = React.useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    // Globally load unpersisted large data from IndexedDB on app startup
    // so we don't rely only on CompetitorLibrary unmounting/mounting.
    const loadGlobalData = async () => {
      try {
        const storedImages = await localforage.getItem<any>('competitorImages');
        if (storedImages) {
          const forStore: Record<string, string[]> = {};
          if (Array.isArray(storedImages)) {
            // legacy migration handled inside CompetitorLibrary
            return;
          } else {
            Object.keys(storedImages).forEach(key => {
              forStore[key] = storedImages[key].map((img: any) => img.data);
            });
            const currentDesignData = useDesignStore.getState().designData;
            useDesignStore.getState().updateDesignData('competitor', { 
              ...currentDesignData.competitor, 
              competitorImages: forStore 
            });
          }
        }
      } catch (err) {
        console.error("Failed to load global data:", err);
      }
    };
    loadGlobalData();
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case 'competitor':
        return <CompetitorLibrary />;
      case 'definition':
        return <DesignDefinition />;
      case 'appearance':
        return <AppearanceAnalysis />;
      case 'structure':
        return <StructureFunction />;
      case 'divergence':
        return <DivergenceReview />;
      case 'final':
        return <FinalGeneration />;
      default:
        return <CompetitorLibrary />;
    }
  };

  const modules = [
    { id: 'competitor' as ModuleId, label: 'CMF风格库', icon: Box },
    { id: 'definition' as ModuleId, label: '设计定义', icon: FileText },
    { id: 'appearance' as ModuleId, label: '外观设计', icon: Palette },
    { id: 'structure' as ModuleId, label: '结构设计', icon: Box },
    { id: 'divergence' as ModuleId, label: '产品展示', icon: Layers },
    { id: 'final' as ModuleId, label: '设计方案', icon: CheckCircle2 },
  ];

  return (
    <div className="flex h-screen text-gray-100 font-sans overflow-hidden bg-transparent">
      {/* Decorative background elements */}
      <BackgroundMeteor />
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(79,70,229,0.1)_0%,transparent_70%)] rounded-full -z-20 pointer-events-none" style={{ transform: 'translateZ(0)', willChange: 'transform' }} />
      <div className="fixed bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(37,99,235,0.1)_0%,transparent_70%)] rounded-full -z-20 pointer-events-none" style={{ transform: 'translateZ(0)', willChange: 'transform' }} />

      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`fixed top-6 z-50 p-2.5 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md rounded-xl text-white shadow-xl transition-all duration-500 flex items-center justify-center ${isSidebarCollapsed ? 'left-4' : 'left-[276px]'}`}
        title={isSidebarCollapsed ? "展开导航" : "收起导航"}
      >
        <ChevronRight size={18} className={`transform transition-transform duration-500 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Sidebar */}
      <aside className={`transition-all duration-500 ease-in-out glass-panel-premium flex flex-col z-40 my-3 ml-3 rounded-[32px] shrink-0 overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0 mr-0 border-transparent shadow-none' : 'w-[260px] mr-1.5'}`}>
        <div className="p-6 flex items-center gap-4 relative z-10 whitespace-nowrap w-[260px]">
          <div className="w-10 h-10 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">BagCraft AI</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Design Expert</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2 relative z-10 w-[260px]">
          <div className="px-4 mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Workflow</p>
          </div>
          {modules.map((module) => (
            <div key={module.id}>
              <SidebarItem
                id={module.id}
                label={module.label}
                icon={module.icon}
                isActive={activeModule === module.id}
                isExpanded={module.id === 'competitor' ? isCmfExpanded : false}
                onClick={() => {
                  if (activeModule !== module.id) {
                    setActiveModule(module.id);
                    if (module.id === 'competitor') setIsCmfExpanded(true);
                  }
                }}
                onDoubleClick={() => {
                  if (activeModule === module.id && module.id === 'competitor') {
                    setIsCmfExpanded(prev => !prev);
                  }
                }}
              />
              {module.id === 'competitor' && activeModule === 'competitor' && isCmfExpanded && (
                <div className="relative mt-1 mb-2">
                  {/* Track */}
                  <div className="absolute left-[35px] top-[16px] bottom-[16px] w-[2px] bg-slate-800/80 rounded-full" />
                  
                  {/* Meteor */}
                  <div 
                    className="absolute left-[34px] w-[4px] h-[16px] bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1),0_0_4px_rgba(255,255,255,0.8)_inset] transition-all duration-500 ease-out z-10 animate-pulse"
                    style={{ 
                      top: `${8 + Math.max(0, STYLE_CATEGORIES.findIndex(c => c.id === activeStyleCategory)) * 36}px`,
                      opacity: activeStyleCategory ? 1 : 0
                    }}
                  />

                  <div className="pl-[12px] space-y-1">
                    {STYLE_CATEGORIES.map((category) => {
                      const isSelected = selectedCategories.includes(category.id);
                      const isActive = activeStyleCategory === category.id;

                      return (
                        <button
                          key={category.id}
                          onClick={(e) => {
                            // 单次点击： 仅跳转并更新流星位置，不触发选中逻辑（避免卡顿）
                            useDesignStore.getState().setActiveStyleCategory(category.id);
                            
                            const element = document.getElementById(`style-category-${category.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              // 流星进度条同步闪烁
                              element.classList.add('ring-4', 'ring-blue-400', 'ring-offset-4', 'ring-offset-black');
                              setTimeout(() => {
                                element.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-4', 'ring-offset-black');
                              }, 1000);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 group ${
                            isActive 
                              ? 'bg-white/5 text-white' 
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'opacity-0 scale-0' : 'opacity-100 scale-100'} ${isSelected ? 'bg-purple-300 shadow-[0_0_8px_rgba(216,180,254,0.6)]' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                          </div>
                          <span className="text-xs font-medium truncate text-left">{category.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 space-y-2 bg-transparent relative z-10 w-[260px]">
          {currentUser ? (
            <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-400 border border-white/5 hover:border-white/10 hover:text-white hover:bg-white/5 transition-all text-sm font-medium relative group">
              <Cloud size={20} className="text-emerald-400" />
              <div className="flex flex-col items-start leading-tight">
                <span>云端已连接</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{currentUser.email}</span>
              </div>
              <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <LogOut size={16} className="text-red-400" />
              </div>
            </button>
          ) : (
            <button onClick={loginWithGoogle} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-blue-400 border border-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/10 transition-all text-sm font-medium">
              <LogIn size={20} />
              <div className="flex flex-col items-start leading-tight">
                <span>云端同步登录</span>
                <span className="text-[10px] text-blue-400/60">跨设备同步你的资料库</span>
              </div>
            </button>
          )}

          <button className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Settings size={20} />
            设置
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <HelpCircle size={20} />
            帮助中心
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative p-3 pl-1.5 z-10 h-full overflow-hidden">
        <div className="w-full h-full rounded-3xl overflow-y-auto overscroll-none custom-scrollbar relative">
          <ErrorBoundary>
            {renderModule()}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
