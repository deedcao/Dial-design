
export type Language = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'de' | 'fr';

export type WatchShape = 'circle' | 'square';

export interface WatchFaceData {
  id: string;
  name: string;
  description: string;
  style: string; // Changed from enum to string to support translated styles
  targetDevice: string;
  colorPalette: string[];
  complications: string[];
  visualPrompt: string; 
  originalPrompt: string; // New field to store the user's original input for regeneration
  imageUrl?: string;
  createdAt: number;
  language: Language;
}

export interface GenerationState {
  isGenerating: boolean;
  step: 'idle' | 'analyzing' | 'designing' | 'rendering' | 'complete' | 'error';
  errorMessage?: string;
}

// Simple keys for logic, display names will be handled by UI translations if needed
// or we can just map these to generic names.
export enum DesignStyle {
  MINIMALIST = 'Minimalist',
  LUXURY = 'Luxury/Classic',
  CYBERPUNK = 'Cyberpunk/Sci-Fi',
  SPORT = 'Sport/Tactical',
  ARTISTIC = 'Artistic/Abstract',
  RETRO = 'Retro/Pixel'
}

export const SUPPORTED_BRANDS: { id: string; name: string; color: string; shape: WatchShape }[] = [
  { id: 'apple', name: 'Apple Watch', color: 'bg-zinc-800', shape: 'square' },
  { id: 'samsung', name: 'Samsung Galaxy', color: 'bg-blue-900', shape: 'circle' },
  { id: 'google', name: 'Google Pixel', color: 'bg-indigo-600', shape: 'circle' },
  { id: 'huawei', name: 'Huawei Watch', color: 'bg-red-900', shape: 'circle' },
  { id: 'xiaomi', name: 'Xiaomi/Redmi', color: 'bg-orange-800', shape: 'circle' },
  { id: 'garmin', name: 'Garmin', color: 'bg-emerald-900', shape: 'circle' },
  { id: 'fitbit', name: 'Fitbit', color: 'bg-teal-700', shape: 'square' },
  { id: 'amazfit', name: 'Amazfit', color: 'bg-teal-900', shape: 'circle' },
  { id: 'oppo', name: 'OPPO Watch', color: 'bg-green-800', shape: 'square' },
  { id: 'tagheuer', name: 'TAG Heuer', color: 'bg-slate-900', shape: 'circle' },
  { id: 'fossil', name: 'Fossil / WearOS', color: 'bg-stone-700', shape: 'circle' },
  { id: 'other', name: 'Generic / Other', color: 'bg-slate-700', shape: 'circle' },
];

export const AVAILABLE_COMPLICATIONS = [
  'date', 
  'steps', 
  'heartRate', 
  'weather', 
  'battery', 
  'notifications', 
  'music', 
  'timer', 
  'alarm',
  'altitude',
  'moonPhase',
  'spo2',
  'calendar',
  'aqi',
  'stocks'
] as const;

export type ComplicationType = typeof AVAILABLE_COMPLICATIONS[number];
