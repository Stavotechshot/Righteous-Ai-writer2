import * as React from 'react';
import { LANGUAGES, TONE_OPTIONS } from '../types';
import type { ResponseSettings } from '../types';

export function ResponseSettingsPanel({ settings, disabled, onChange }: {
  settings: ResponseSettings;
  disabled: boolean;
  onChange: (settings: ResponseSettings) => void;
}) {
  const control = 'mt-2 w-full min-h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50';
  return (
    <fieldset disabled={disabled} className="mx-4 sm:mx-8 mt-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 sm:p-5">
      <legend className="px-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Response settings</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tone
          <select aria-label="Response tone" value={settings.tone} onChange={e => onChange({ ...settings, tone: e.target.value })} className={control}>
            {TONE_OPTIONS.map(tone => <option key={tone.id} value={tone.id}>{tone.label}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Language
          <select aria-label="Response language" value={settings.language} onChange={e => onChange({ ...settings, language: e.target.value })} className={control}>
            {LANGUAGES.map(language => <option key={language}>{language}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Length
          <select aria-label="Response length" value={settings.length} onChange={e => onChange({ ...settings, length: e.target.value as ResponseSettings['length'] })} className={control}>
            <option value="short">Short</option><option value="balanced">Balanced</option><option value="long">Long</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Choose how your response should sound. Your settings are remembered for your next visit.</p>
    </fieldset>
  );
}
