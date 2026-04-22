
export enum AIMode {
  REPHRASE = 'REPHRASE',
  HUMANIZE = 'HUMANIZE',
  RESPOND = 'RESPOND BACK',
  GRAMMAR = 'GRAMMAR & POLISH',
  TRANSLATE = 'TRANSLATE',
  SHORTEN = 'CONDENSE',
  EMAIL = 'EMAIL ARCHITECT',
  DETECT = 'AI DETECT',
  EXPAND = 'EXPAND'
}

export interface CustomPrompt {
  id: string;
  name: string;
  content: string;
}

export interface HistoryEntry {
  id: string;
  inputText: string;
  outputText: string;
  timestamp: number;
  mode: AIMode;
  tone: string;
}

export interface SavedEntry extends HistoryEntry {
  title: string;
}

export interface BatchItem {
  id: string;
  name: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
  aiScore?: number;
}

export interface Version {
  id: string;
  text: string;
  timestamp: number;
  label: string;
  author: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  suggestion?: string;
}

export interface ProcessingResult {
  original: string;
  processed: string;
  timestamp: number;
  mode: AIMode;
  aiScore?: number;
}

export interface ToneOption {
  id: string;
  label: string;
  description: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { 
    id: 'natural', 
    label: 'Natural & Balanced', 
    description: 'The standard human voice: clear, conversational, and direct.' 
  },
  { 
    id: 'charismatic', 
    label: 'Charismatic & Flirty', 
    description: 'Playful wit and romantic chemistry for dating and social charm.' 
  },
  { 
    id: 'professional', 
    label: 'Executive Professional', 
    description: 'Polished and formal for business reports and high-stakes comms.' 
  },
  { 
    id: 'casual', 
    label: 'Warm & Friendly', 
    description: 'Relaxed and approachable for social and personal use.' 
  },
  { 
    id: 'academic', 
    label: 'Scholarly Academic', 
    description: 'Rigorous and precise for research and technical writing.' 
  },
];

export const LANGUAGES = [
  "English (US)", "English (UK)", "Spanish", "French", "German", "Chinese", "Japanese"
];
