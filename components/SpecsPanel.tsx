import React from 'react';
import { WatchFaceData, Language } from '../types';
import { translations } from '../localization';
import { DownloadIcon } from './Icons';

interface SpecsPanelProps {
  data: WatchFaceData;
  language: Language;
}

export const SpecsPanel: React.FC<SpecsPanelProps> = ({ data, language }) => {
  const t = translations[language];

  const handleDownload = () => {
    // Create a version of the data suitable for developers (removing internal UI state if any)
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      tool: 'ChronoGen AI',
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watch-face-${data.name.replace(/\s+/g, '-').toLowerCase()}-${data.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{data.name}</h2>
          <div className="flex gap-2 mt-1">
             <span className="inline-block px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-md uppercase tracking-wider font-semibold">
              {data.style}
            </span>
            {data.targetDevice && (
              <span className="inline-block px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md border border-slate-600/50">
                {t.specs.compatible}: {data.targetDevice}
              </span>
            )}
          </div>
          <p className="mt-4 text-slate-300 leading-relaxed text-sm">
            {data.description}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{t.specs.palette}</h3>
        <div className="flex space-x-3">
          {data.colorPalette.map((color, idx) => (
            <div key={idx} className="group relative">
              <div 
                className="w-10 h-10 rounded-full border-2 border-slate-600 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{t.specs.complications}</h3>
        <div className="flex flex-wrap gap-2">
          {data.complications.map((comp, idx) => (
            <span key={idx} className="px-3 py-1.5 bg-slate-700/50 text-slate-200 text-xs rounded-full border border-slate-600/50">
              {comp}
            </span>
          ))}
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-700/50">
         <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{t.specs.prompt}</h3>
         <p className="text-[10px] text-slate-400 font-mono bg-black/20 p-2 rounded border border-slate-700/50 line-clamp-3 hover:line-clamp-none transition-all cursor-help">
           {data.visualPrompt}
         </p>
      </div>

      <div className="pt-4 border-t border-slate-700/50">
        <button 
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600 hover:border-slate-500 group"
        >
          <DownloadIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          {t.specs.exportBtn}
        </button>
        <p className="text-center text-[10px] text-slate-500 mt-2">
          {t.specs.devNote}
        </p>
      </div>
    </div>
  );
};