
export const PRIMARY_ADMIN_EMAIL = 'bryan2wyatt@gmail.com';

export interface AccessControlConfig {
  enforceWhitelist: boolean;
  allowedEmails: string[];
  adminEmails: string[];
  updatedAt?: number;
  updatedBy?: string;
}

export interface AttachedMedia {
  base64: string;
  mimeType: string;
  name: string;
  previewUrl: string;
  size?: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

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

export const DEFAULT_TONE = 'natural';
export const DEFAULT_LANGUAGE = 'English (US)';

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

export const LANGUAGES: string[] = [
  "English (US)", "English (UK)", "Spanish", "French", "German", "Chinese", "Japanese"
];

export interface ChatVibe {
  id: string;
  label: string;
  icon: string;
  directive: string;
}

export const CHAT_VIBES: ChatVibe[] = [
  { id: 'flirty', label: 'Flirty & Magnetic', icon: '🔥', directive: 'Be subtly teasing, charismatic, and create electric playful tension.' },
  { id: 'unbothered', label: 'Unbothered & High-Status', icon: '🕶️', directive: 'Keep it cool, relaxed, calm, zero desperation, effortlessly confident.' },
  { id: 'bold', label: 'Bold & Direct', icon: '⚡', directive: 'Direct, unapologetic, cut straight through hesitation with high conviction.' },
  { id: 'meetup', label: 'Lock In The Date', icon: '🎯', directive: 'Smoothly transition the conversation to setting up concrete plans or a real-life meetup.' },
  { id: 'casual', label: 'Casual Banter', icon: '☕', directive: 'Low-stakes, natural, chill vibes with warm banter.' },
  { id: 'witty', label: 'Witty & Sarcastic', icon: '🃏', directive: 'Clever, dry humor, witty comeback or funny observation.' },
  { id: 'warm', label: 'Empathetic & Sincere', icon: '🤍', directive: 'Grounded, emotionally connected, attentive, and sincere.' },
  { id: 'boundary', label: 'Decline / Boundary', icon: '🛡️', directive: 'Graceful, firm, respectful but decisive boundary or gentle pass.' }
];

export type FocusAtmosphere = 'default' | 'sepia' | 'minimal' | 'midnight';
