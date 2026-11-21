import { CHAT_VIBES, DEFAULT_LANGUAGE, DEFAULT_TONE, LANGUAGES, TONE_OPTIONS } from '../types';
import type { GenerationRequest, HistoryEntry, ResponseSettings } from '../types';

export function normalizeSettings(value: unknown): ResponseSettings {
  const saved = value && typeof value === 'object' ? value as Partial<ResponseSettings> : {};
  return {
    tone: TONE_OPTIONS.some(t => t.id === saved.tone) ? saved.tone! : DEFAULT_TONE,
    language: LANGUAGES.includes(saved.language || '') ? saved.language! : DEFAULT_LANGUAGE,
    length: saved.length === 'short' || saved.length === 'long' ? saved.length : 'balanced',
    customPrompt: typeof saved.customPrompt === 'string' ? saved.customPrompt : '',
    chatVibe: saved.chatVibe === null ? null : CHAT_VIBES.some(v => v.id === saved.chatVibe) ? saved.chatVibe! : 'flirty',
    chatGoal: typeof saved.chatGoal === 'string' ? saved.chatGoal : ''
  };
}

export function searchEntries<T extends HistoryEntry>(entries: T[], query: string): T[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return terms.length ? entries.filter(entry => {
    const text = [entry.inputText, entry.outputText, entry.mode, entry.tone, 'title' in entry ? entry.title : ''].join(' ').toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  }) : entries;
}

// Images remain session-only: avoid saving large image data into workspace/history documents.
export function persistableRequest(request: GenerationRequest | null): GenerationRequest | null {
  if (!request || request.media) return null;
  return { text: request.text, mode: request.mode, tone: request.tone, language: request.language, instruction: request.instruction };
}
