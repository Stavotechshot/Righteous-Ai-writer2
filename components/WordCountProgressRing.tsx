import React, { useState, useRef, useEffect } from 'react';
import { Target, Check, X, Sparkles, ChevronDown } from 'lucide-react';

interface WordCountProgressRingProps {
  currentWords: number;
  targetWords: number | null;
  onSetTarget: (target: number | null) => void;
  compact?: boolean;
}

const PRESET_GOALS = [
  { label: '150w', value: 150, desc: 'Quick note / email' },
  { label: '300w', value: 300, desc: 'Short post' },
  { label: '500w', value: 500, desc: 'Article / section' },
  { label: '1,000w', value: 1000, desc: 'Longform essay' },
];

export const WordCountProgressRing: React.FC<WordCountProgressRingProps> = ({
  currentWords,
  targetWords,
  onSetTarget,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState(targetWords ? targetWords.toString() : '');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0) {
      onSetTarget(val);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onSetTarget(null);
    setCustomInput('');
    setIsOpen(false);
  };

  const radius = compact ? 15 : 18;
  const strokeWidth = compact ? 3 : 3.5;
  const size = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;

  const percentage = targetWords && targetWords > 0 
    ? Math.min(100, Math.round((currentWords / targetWords) * 100)) 
    : null;

  const isGoalReached = Boolean(targetWords && currentWords >= targetWords);

  const strokeDashoffset = targetWords && targetWords > 0
    ? circumference - (Math.min(1, currentWords / targetWords) * circumference)
    : circumference;

  if (compact) {
    return (
      <div className="relative inline-flex items-center" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          title={targetWords ? `Goal: ${currentWords}/${targetWords} words (${percentage}%)` : 'Set Target Word Count'}
        >
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90 transform">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {targetWords && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  className={`transition-all duration-500 ease-out ${
                    isGoalReached ? 'stroke-emerald-500' : 'stroke-indigo-600'
                  }`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isGoalReached ? (
                <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
              ) : (
                <Target className={`w-2.5 h-2.5 ${targetWords ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              )}
            </div>
          </div>
          <div className="text-left">
            <span className="tabular-nums font-bold">
              {currentWords}
              {targetWords && <span className="text-slate-400 font-normal">/{targetWords}</span>}
            </span>
            {targetWords && (
              <span className={`ml-1 text-[9px] font-black ${isGoalReached ? 'text-emerald-500' : 'text-indigo-500'}`}>
                {percentage}%
              </span>
            )}
          </div>
        </button>

        {/* Popover */}
        {isOpen && renderPopover()}
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <div className="flex items-center gap-3">
        {/* Progress Ring with central metric / icon */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="relative cursor-pointer group"
          title={targetWords ? `Goal: ${currentWords}/${targetWords} words (${percentage}%) - Click to change` : 'Click to set target word count'}
        >
          <svg width={size} height={size} className="-rotate-90 transform">
            {/* Background circle track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated progress circle */}
            {targetWords ? (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className={`transition-all duration-500 ease-out ${
                  isGoalReached 
                    ? 'stroke-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]' 
                    : 'stroke-indigo-600 dark:stroke-indigo-400 drop-shadow-[0_0_4px_rgba(99,102,241,0.3)]'
                }`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            ) : (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-slate-300 dark:stroke-slate-700 stroke-dasharray-[3,3]"
                strokeWidth={strokeWidth - 1}
                strokeDasharray="4 3"
                fill="transparent"
              />
            )}
          </svg>

          {/* Center icon / target badge */}
          <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform">
            {isGoalReached ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <Target className={`w-3.5 h-3.5 ${targetWords ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
            )}
          </div>
        </div>

        {/* Word Count Text & Target Button */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Words
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`px-1.5 py-0.2 rounded-md text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-0.5 ${
                isGoalReached
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : targetWords
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {targetWords ? (
                <>
                  <span>{isGoalReached ? 'Goal Met' : `${percentage}%`}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </>
              ) : (
                <>
                  <span>+ Set Goal</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {currentWords}
            </span>
            {targetWords && (
              <span className="text-xs font-bold text-slate-400 tabular-nums">
                / {targetWords}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Popover */}
      {isOpen && renderPopover()}
    </div>
  );

  function renderPopover() {
    return (
      <div 
        className="absolute bottom-full left-0 mb-3 z-50 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 text-left animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Target Word Count
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 mb-3">
          Set a writing goal for this session. The progress ring tracks your completion.
        </p>

        {/* Presets */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {PRESET_GOALS.map((preset) => {
            const isSelected = targetWords === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  onSetTarget(preset.value);
                  setCustomInput(preset.value.toString());
                  setIsOpen(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                <span className="block text-xs font-black">{preset.label}</span>
                <span className={`block text-[9px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {preset.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <form onSubmit={handleApplyCustom} className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                step="10"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Custom (e.g. 750)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                words
              </span>
            </div>
            <button
              type="submit"
              disabled={!customInput || parseInt(customInput, 10) <= 0}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all"
            >
              Set
            </button>
          </div>

          {targetWords && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full py-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors text-center"
            >
              Remove Target Goal
            </button>
          )}
        </form>
      </div>
    );
  }
};
