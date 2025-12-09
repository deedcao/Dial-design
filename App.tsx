
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { generateWatchFaceSpecs, generateWatchFaceImage } from './services/geminiService';
import { WatchFaceData, GenerationState, DesignStyle, SUPPORTED_BRANDS, Language, AVAILABLE_COMPLICATIONS } from './types';
import { WatchMockup } from './components/WatchMockup';
import { SpecsPanel } from './components/SpecsPanel';
import { SparklesIcon, WatchIcon, HistoryIcon, RefreshCwIcon, ChevronRightIcon } from './components/Icons';
import { translations } from './localization';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('zh');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(DesignStyle.MINIMALIST);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(SUPPORTED_BRANDS[0].id);
  const [selectedComplications, setSelectedComplications] = useState<string[]>([]);
  const [showWrist, setShowWrist] = useState(false);
  
  const [generationState, setGenerationState] = useState<GenerationState>({ isGenerating: false, step: 'idle' });
  const [currentDesign, setCurrentDesign] = useState<WatchFaceData | null>(null);
  
  // Cache for combinations of brands and styles to prevent re-generation on toggle
  const [designCache, setDesignCache] = useState<Record<string, WatchFaceData>>({});
  
  const [history, setHistory] = useState<WatchFaceData[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const t = translations[currentLang] || translations['en'];

  const recipes = useMemo(() => [
    { key: 'minimal', phrase: "Minimalist layout with ultra-thin hands and plenty of white space." },
    { key: 'tech', phrase: "Forged carbon fiber chassis with neon matrix gauges and futuristic data flow." },
    { key: 'vintage', phrase: "Warm brass casing, ivory textured face, and high-contrast Breguet numbers." },
    { key: 'neon', phrase: "Electric blue highlights on deep matte black, synthwave aesthetic, pulsing ring glow." },
    { key: 'nature', phrase: "Organic patterns inspired by moss on stone, soft green gradients, earthy textures." },
  ], []);

  const currentBrand = useMemo(() => 
    SUPPORTED_BRANDS.find(b => b.id === selectedBrandId) || SUPPORTED_BRANDS[0], 
  [selectedBrandId]);

  useEffect(() => {
    const saved = localStorage.getItem('chronoGen_history');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed); 
      } catch (e) { console.error("Failed to load history:", e); }
    }
  }, []);

  const handleComplicationToggle = (comp: string) => {
    setSelectedComplications(prev => 
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    );
  };

  const handleToggleAllComplications = () => {
    if (selectedComplications.length === AVAILABLE_COMPLICATIONS.length) setSelectedComplications([]);
    else setSelectedComplications([...AVAILABLE_COMPLICATIONS]);
  };

  const handleRecipeClick = (phrase: string) => {
    setPrompt(prev => prev ? `${prev.trim()} ${phrase}` : phrase);
  };

  const handleGenerate = useCallback(async (
    brandOverride?: typeof SUPPORTED_BRANDS[0], 
    styleOverride?: DesignStyle,
    clearCache = true
  ) => {
    if (!prompt.trim() || generationState.isGenerating) return;
    
    const brandToUse = brandOverride || currentBrand;
    const styleToUse = styleOverride || selectedStyle;
    
    setGenerationState({ isGenerating: true, step: 'analyzing' });
    setCurrentDesign(null);

    if (clearCache) {
      setDesignCache({});
    }

    try {
      const specs = await generateWatchFaceSpecs(
        prompt, 
        styleToUse, 
        brandToUse.name, 
        currentLang, 
        brandToUse.shape,
        selectedComplications
      );
      
      setGenerationState({ isGenerating: true, step: 'rendering' });
      
      const imageUrl = await generateWatchFaceImage(specs.visualPrompt);
      
      const newDesign: WatchFaceData = {
        ...specs,
        id: crypto.randomUUID(),
        imageUrl,
        createdAt: Date.now(),
        language: currentLang,
        originalPrompt: prompt
      };
      
      setCurrentDesign(newDesign);
      
      const cacheKey = `${brandToUse.id}:${styleToUse}`;
      setDesignCache(prev => ({
        ...prev,
        [cacheKey]: newDesign
      }));

      setHistory(prev => {
        const updated = [newDesign, ...prev].filter((v, i, a) => a.findIndex(t => t.imageUrl === v.imageUrl) === i).slice(0, 10);
        try {
          localStorage.setItem('chronoGen_history', JSON.stringify(updated));
        } catch (storageError) {
          console.warn("LocalStorage full, history not saved");
        }
        return updated;
      });

      setGenerationState({ isGenerating: false, step: 'complete' });
    } catch (error) {
      console.error("Generation crash prevented:", error);
      setGenerationState({ isGenerating: false, step: 'error', errorMessage: t.error });
    } finally {
      setGenerationState(prev => prev.isGenerating ? { ...prev, isGenerating: false } : prev);
    }
  }, [prompt, selectedStyle, currentBrand, currentLang, selectedComplications, generationState.isGenerating, t.error]);

  const handleBrandSelect = (brand: typeof SUPPORTED_BRANDS[0]) => {
    if (generationState.isGenerating) return;
    setSelectedBrandId(brand.id);
    
    const cacheKey = `${brand.id}:${selectedStyle}`;
    if (designCache[cacheKey]) {
      setCurrentDesign(designCache[cacheKey]);
      return;
    }

    if (currentDesign && prompt.trim()) {
      handleGenerate(brand, undefined, false); 
    }
  };

  const handleStyleSelect = (style: DesignStyle) => {
    if (generationState.isGenerating) return;
    setSelectedStyle(style);
    
    const cacheKey = `${selectedBrandId}:${style}`;
    if (designCache[cacheKey]) {
      setCurrentDesign(designCache[cacheKey]);
      return;
    }

    if (currentDesign && prompt.trim()) {
      handleGenerate(undefined, style, false);
    }
  };

  const loadFromHistory = (design: WatchFaceData) => {
    if (generationState.isGenerating) return;
    
    setDesignCache({});
    setCurrentDesign(design);
    setPrompt(design.originalPrompt || '');
    
    const matchedBrand = SUPPORTED_BRANDS.find(b => b.name === design.targetDevice) || SUPPORTED_BRANDS[0];
    const matchedStyle = Object.values(DesignStyle).find(s => s === design.style) || design.style as DesignStyle;
    
    setSelectedBrandId(matchedBrand.id);
    setSelectedStyle(matchedStyle);
    setShowHistory(false);
    
    const cacheKey = `${matchedBrand.id}:${matchedStyle}`;
    setDesignCache({ [cacheKey]: design });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans selection:bg-indigo-500">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <WatchIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t.appTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  disabled={generationState.isGenerating}
                  onClick={() => setCurrentLang(lang.code)}
                  className={`px-3 py-1 flex items-center justify-center text-sm rounded transition-all ${
                    currentLang === lang.code ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                  } ${generationState.isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button 
              disabled={generationState.isGenerating}
              onClick={() => setShowHistory(!showHistory)} 
              className={`p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center gap-2 ${generationState.isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <HistoryIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">{t.history}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6 overflow-hidden">
        <section className={`flex flex-col gap-6 w-full md:w-1/3 ${showHistory ? 'hidden md:flex' : 'flex'} overflow-y-auto custom-scrollbar pr-1 pb-10`}>
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-indigo-400" />{t.designStudio}</h2>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t.targetDevice}</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {SUPPORTED_BRANDS.map((brand) => (
                  <button 
                    key={brand.id} 
                    disabled={generationState.isGenerating}
                    onClick={() => handleBrandSelect(brand)} 
                    className={`text-xs px-2 py-2 rounded-md border text-left flex items-center gap-2 transition-all ${selectedBrandId === brand.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'} ${generationState.isGenerating ? 'opacity-50' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${brand.color}`}></span>
                    <span className="truncate">{brand.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t.designStyle}</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(DesignStyle).map((style) => (
                  <button 
                    key={style} 
                    disabled={generationState.isGenerating}
                    onClick={() => handleStyleSelect(style)} 
                    className={`text-xs p-2 rounded-md border text-left truncate transition-all ${selectedStyle === style ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'} ${generationState.isGenerating ? 'opacity-50' : ''}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t.features}</label>
                <button 
                  disabled={generationState.isGenerating}
                  onClick={handleToggleAllComplications} 
                  className={`text-[10px] text-indigo-400 font-medium ${generationState.isGenerating ? 'opacity-50' : ''}`}
                >
                  {selectedComplications.length === AVAILABLE_COMPLICATIONS.length ? t.deselectAll : t.selectAll}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_COMPLICATIONS.map((comp) => (
                  <button 
                    key={comp} 
                    disabled={generationState.isGenerating}
                    onClick={() => handleComplicationToggle(comp)} 
                    className={`text-[10px] py-1.5 px-1 rounded-md border transition-all truncate ${selectedComplications.includes(comp) ? 'bg-teal-700/50 border-teal-500/50 text-teal-100' : 'bg-slate-900 border-slate-700 text-slate-500'} ${generationState.isGenerating ? 'opacity-50' : ''}`}
                  >
                    {t.complicationLabels[comp]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t.promptLabel}</label>
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder={t.promptPlaceholder} 
                disabled={generationState.isGenerating}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 transition-shadow disabled:opacity-50" 
              />
              <div className="mt-3 flex flex-wrap gap-2">
                 {recipes.map(r => (
                   <button 
                    key={r.key} 
                    disabled={generationState.isGenerating}
                    onClick={() => handleRecipeClick(r.phrase)} 
                    className={`text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-full transition-colors ${generationState.isGenerating ? 'opacity-30' : ''}`}
                   >
                     {t.recipes[r.key]}
                   </button>
                 ))}
              </div>
            </div>
            <button 
              onClick={() => handleGenerate()} 
              disabled={generationState.isGenerating || !prompt.trim()} 
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${generationState.isGenerating || !prompt.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white active:scale-95'}`}
            >
              {generationState.isGenerating ? (
                <>
                  <RefreshCwIcon className="w-5 h-5 animate-spin" />
                  {generationState.step === 'analyzing' ? t.analyzing : t.rendering}
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  {t.generateBtn}
                </>
              )}
            </button>
            {generationState.step === 'error' && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs animate-pulse">{generationState.errorMessage}</div>}
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
             <h3 className="text-sm font-semibold text-slate-300 mb-2">{t.designTipsTitle}</h3>
             <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
               {t.designTips.map((tip, idx) => (<li key={idx}>{tip}</li>))}
             </ul>
          </div>
        </section>

        <section className={`flex-1 flex flex-col items-center justify-start relative overflow-y-auto custom-scrollbar py-6 ${showHistory ? 'hidden md:flex' : 'flex'}`}>
          <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-8">
            <div className="w-full flex justify-between items-center px-4">
              <span className="text-sm font-medium text-slate-400">{currentBrand.name} - {currentBrand.shape}</span>
              <button 
                onClick={() => setShowWrist(!showWrist)} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${showWrist ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              >
                <div className={`w-2 h-2 rounded-full ${showWrist ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                {t.mockup.showWrist}
              </button>
            </div>
            <WatchMockup data={currentDesign || undefined} isLoading={generationState.isGenerating} language={currentLang} shape={currentBrand.shape} showWrist={showWrist} />
            {currentDesign && !generationState.isGenerating && (<div className="w-full pb-10 animate-fade-in"><SpecsPanel data={currentDesign} language={currentLang} /></div>)}
            {!currentDesign && !generationState.isGenerating && (
              <div className="text-center mt-10 opacity-50 flex flex-col items-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4"><SparklesIcon className="w-8 h-8 text-slate-600" /></div>
                <h3 className="text-slate-400 font-medium">{t.ready}</h3>
                <p className="text-slate-600 text-sm mt-1">{t.readyDesc}</p>
              </div>
            )}
          </div>
        </section>

        {showHistory && (
          <aside className="absolute md:relative inset-0 md:inset-auto z-40 bg-slate-900 md:bg-transparent md:w-80 border-l border-slate-800 flex flex-col animate-fade-in-right shadow-2xl">
             <div className="p-4 border-b border-slate-800 flex items-center justify-between md:hidden"><h3 className="font-bold">{t.history}</h3><button onClick={() => setShowHistory(false)} className="text-sm text-indigo-400">{t.close}</button></div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
               {history.length === 0 ? (<p className="text-slate-500 text-center text-sm mt-10">Empty history</p>) : (
                 history.map(item => (
                   <div key={item.id} onClick={() => loadFromHistory(item)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all group active:scale-95">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-black flex-shrink-0 border border-slate-600"><img src={item.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                      <div className="overflow-hidden"><h4 className="font-medium text-sm text-white truncate group-hover:text-indigo-400 transition-colors">{item.name}</h4><p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p></div>
                      <ChevronRightIcon className="w-4 h-4 ml-auto text-slate-600" />
                   </div>
                 ))
               )}
             </div>
          </aside>
        )}
      </main>
    </div>
  );
}
