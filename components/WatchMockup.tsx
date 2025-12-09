
import React from 'react';
import { WatchFaceData, Language, WatchShape } from '../types';
import { translations } from '../localization';

interface WatchMockupProps {
  data?: WatchFaceData;
  isLoading?: boolean;
  language?: Language;
  shape?: WatchShape;
  showWrist?: boolean;
}

export const WatchMockup: React.FC<WatchMockupProps> = ({ 
  data, 
  isLoading, 
  language = 'en',
  shape = 'circle',
  showWrist = false
}) => {
  const t = translations[language] || translations['en'];

  const containerRadius = shape === 'circle' ? 'rounded-full' : 'rounded-[2.5rem]';
  const innerRadius = shape === 'circle' ? 'rounded-full' : 'rounded-[2rem]';
  const crownPosition = shape === 'circle' ? 'top-1/2 -translate-y-1/2' : 'top-16';

  return (
    <div className="relative flex justify-center items-center w-full max-w-[420px] aspect-square mx-auto transition-all duration-700">
      
      {/* Wrist / Arm Composite Layer */}
      {showWrist && (
        <div className="absolute inset-0 z-0 animate-fade-in pointer-events-none overflow-hidden rounded-[3rem]">
          {/* Subsurface scattering base (arm flesh tone) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f3cfb0] via-[#e5b999] to-[#d4a373] opacity-90" />
          
          {/* Arm geometry - Simulated vertical wrist bone/muscle depth */}
          <div className="absolute inset-x-0 top-0 bottom-0 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-r from-black/5 via-white/5 to-black/10 blur-xl opacity-60" />
          
          {/* Skin texture overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 mix-blend-multiply" />

          {/* Environmental light interaction (simulating indoor lighting) */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-orange-100/20 blur-[100px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-40 bg-white/5 blur-[50px] rotate-12" />
        </div>
      )}

      {/* Dynamic Shadows beneath Watch and Straps */}
      {showWrist && (
        <div className="absolute inset-0 z-[5] animate-fade-in pointer-events-none">
          {/* Main Case Shadow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${shape === 'circle' ? 'w-[75%] h-[75%] rounded-full' : 'w-[75%] h-[75%] rounded-[3rem]'} bg-black/40 blur-2xl transform scale-105`} />
          {/* Strap Shadows */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-32 h-20 bg-black/25 blur-xl" />
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-32 h-20 bg-black/25 blur-xl" />
        </div>
      )}

      {/* Watch Body / Casing */}
      <div className={`z-10 relative ${showWrist ? 'w-[78%] h-[78%]' : 'w-full h-full'} p-2 ${containerRadius} bg-slate-800 border-8 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500 transform ease-in-out`}>
        <div className={`w-full h-full ${innerRadius} bg-black flex items-center justify-center overflow-hidden border border-slate-800 relative`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">{t.mockup.designing}</span>
            </div>
          ) : data?.imageUrl ? (
            <img 
              src={data.imageUrl} 
              alt={data.name} 
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : (
            <div className="text-center p-10 text-slate-600 animate-fade-in">
              <p className="text-xs font-medium leading-relaxed uppercase tracking-wider">{t.mockup.empty}</p>
            </div>
          )}
          {/* Surface reflection */}
          <div className={`absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none ${innerRadius}`} />
          {/* Screen edge vignette */}
          <div className={`absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none ${innerRadius}`} />
        </div>
      </div>

      {/* Simulated Straps - Integrated more tightly with wrist context */}
      <div className={`absolute -top-6 ${shape === 'circle' ? 'w-[140px]' : 'w-[180px]'} h-32 bg-zinc-800/90 -z-10 rounded-t-xl transition-all shadow-inner border-t border-slate-700/50 ${showWrist ? 'scale-y-110 opacity-100 blur-[0.5px]' : 'opacity-80'}`} />
      <div className={`absolute -bottom-6 ${shape === 'circle' ? 'w-[140px]' : 'w-[180px]'} h-32 bg-zinc-800/90 -z-10 rounded-b-xl transition-all shadow-inner border-b border-slate-700/50 ${showWrist ? 'scale-y-110 opacity-100 blur-[0.5px]' : 'opacity-80'}`} />
      
      {/* Side Button/Crown */}
      <div className={`absolute -right-2 w-3 h-12 bg-slate-600 rounded-r-md z-20 ${crownPosition} shadow-lg shadow-black/50 transition-all border-l border-slate-500/30`} />
    </div>
  );
};
