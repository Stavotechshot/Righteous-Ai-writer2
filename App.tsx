
import * as React from 'react';
import { useState, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  User, 
  MessageSquare, 
  CheckCheck, 
  Languages, 
  Minimize2, 
  Mail, 
  ShieldAlert, 
  Maximize2,
  ChevronDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  File,
  Type as TypeIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { AIMode, TONE_OPTIONS, LANGUAGES, HistoryEntry, SavedEntry, CustomPrompt, BatchItem } from './types';
import { processText, processTextStream } from './services/geminiService';
import { Button } from './components/Button';
import { Tooltip } from './components/Tooltip';

const THEME_KEY = 'rightshore_theme_preference';
const STORAGE_KEY = 'rightshore_app_workspace';

const MODE_CONFIG: Record<AIMode, { icon: any, label: string, description: string, color: string }> = {
  [AIMode.REPHRASE]: { 
    icon: RefreshCw, 
    label: "Rewrite", 
    description: "Complete rewrite for maximum impact and clarity",
    color: "text-indigo-500"
  },
  [AIMode.HUMANIZE]: { 
    icon: User, 
    label: "Humanize", 
    description: "Strip robotic patterns for natural flow",
    color: "text-emerald-500"
  },
  [AIMode.RESPOND]: { 
    icon: MessageSquare, 
    label: "Respond", 
    description: "Social intelligence for authentic replies",
    color: "text-blue-500"
  },
  [AIMode.GRAMMAR]: { 
    icon: CheckCheck, 
    label: "Polish", 
    description: "Refine for clarity and correctness without changing meaning",
    color: "text-purple-500"
  },
  [AIMode.TRANSLATE]: { 
    icon: Languages, 
    label: "Translate", 
    description: "Convert text to another language fluently",
    color: "text-orange-500"
  },
  [AIMode.SHORTEN]: { 
    icon: Minimize2, 
    label: "Condense", 
    description: "Cut the fluff and condense to core message",
    color: "text-rose-500"
  },
  [AIMode.EMAIL]: { 
    icon: Mail, 
    label: "Email", 
    description: "Draft high-conversion professional emails",
    color: "text-sky-500"
  },
  [AIMode.DETECT]: { 
    icon: ShieldAlert, 
    label: "AI Detect", 
    description: "Analyze text for AI-generated signatures",
    color: "text-amber-500"
  },
  [AIMode.EXPAND]: { 
    icon: Maximize2, 
    label: "Expand", 
    description: "Continue and elaborate on your text",
    color: "text-violet-500"
  }
};

/**
 * Utility to render inline markdown elements like bold and code.
 */
const InlineFormatter: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={idx}>{part.slice(1, -1)}</code>;
        }
        return part;
      })}
    </>
  );
};

/**
 * Enhanced utility to convert AI markdown output into structured React components.
 */
const FormattedText: React.FC<{ text: string }> = React.memo(({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      let codeContent = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeContent.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`}>
          <code>{codeContent.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      let quoteContent = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteContent.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${i}`}>
          {quoteContent.map((l, idx) => (
            <p key={idx}><InlineFormatter text={l} /></p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (line.startsWith('* ') || line.startsWith('- ')) {
      let listItems = [];
      while (i < lines.length && (lines[i].startsWith('* ') || lines[i].startsWith('- '))) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`}>
          {listItems.map((item, idx) => (
            <li key={idx}><InlineFormatter text={item} /></li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      let listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`}>
          {listItems.map((item, idx) => (
            <li key={idx}><InlineFormatter text={item} /></li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`}><InlineFormatter text={line.slice(2)} /></h1>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`}><InlineFormatter text={line.slice(3)} /></h2>);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`}><InlineFormatter text={line.slice(4)} /></h3>);
      i++;
      continue;
    }

    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
      i++;
      continue;
    }

    elements.push(
      <p key={`p-${i}`}>
        <InlineFormatter text={line} />
      </p>
    );
    i++;
  }

  return <>{elements}</>;
});

/**
 * Utility to parse multiple versions from AI output.
 */
const parseVersions = (text: string): string[] => {
  if (!text.includes('VERSION 1:')) return [text];
  
  const versions: string[] = [];
  const regex = /VERSION \d+:\s*([\s\S]*?)(?=VERSION \d+:|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1].trim()) {
      versions.push(match[1].trim());
    }
  }
  return versions.length > 0 ? versions : [text];
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    { id: '1', name: 'Snippet 1', content: '', status: 'pending' }
  ]);
  
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<CustomPrompt[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [mode, setMode] = useState<AIMode>(AIMode.REPHRASE);
  const [tone, setTone] = useState(TONE_OPTIONS[0].id);
  const [targetLang, setTargetLang] = useState(LANGUAGES[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isToneMenuOpen, setIsToneMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const toneMenuRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toneMenuRef.current && !toneMenuRef.current.contains(event.target as Node)) {
        setIsToneMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setInputText(data.inputText || '');
        setCustomSystemPrompt(data.customSystemPrompt || '');
        setSavedPrompts(data.savedPrompts || []);
        setResult(data.result || null);
        setHistory(data.history || []);
        setSavedEntries(data.savedEntries || []);
        if (data.mode) setMode(data.mode);
        if (data.tone) setTone(data.tone);
        if (data.batchItems) setBatchItems(data.batchItems);
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
  }, []);

  const deferredInputText = useDeferredValue(inputText);
  const deferredResult = useDeferredValue(result);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const dataToSave = { 
        inputText, 
        customSystemPrompt, 
        savedPrompts, 
        result, 
        history, 
        savedEntries,
        mode,
        tone,
        batchItems
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [inputText, customSystemPrompt, savedPrompts, result, history, savedEntries, mode, tone, batchItems]);

  const stats = useMemo(() => {
    const text = deferredResult || deferredInputText;
    if (!text) return { words: 0, humanityScore: 0, sentences: 0 };
    
    // Optimized word and sentence counting for large strings
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const chars = text.length;
    
    let humanityScore = 0;
    if (words > 0) {
      const avgWordLength = chars / words;
      const complexity = Math.abs(avgWordLength - 5.5) * 10;
      humanityScore = Math.max(45, Math.min(98, 100 - complexity + (sentences * 2)));
    }
    
    return { words, humanityScore, sentences };
  }, [deferredInputText, deferredResult]);

  const handleExecuteSingle = async () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    setResult(""); // Clear previous result and start fresh
    setError(null);
    
    let fullText = "";
    try {
      const stream = processTextStream(inputText, mode, tone, targetLang, customSystemPrompt);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setResult(fullText);
      }
      
      const newEntry: HistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        inputText: inputText,
        outputText: fullText,
        timestamp: Date.now(),
        mode: mode,
        tone: tone
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 20));
      
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteBatch = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const itemsToProcess = batchItems.filter(item => item.content.trim() !== '' && item.status !== 'completed');
    
    if (itemsToProcess.length === 0) {
      setIsProcessing(false);
      return;
    }

    const updatedItems = [...batchItems];
    
    // Process all items in parallel for maximum speed
    await Promise.all(itemsToProcess.map(async (item) => {
      const index = updatedItems.findIndex(i => i.id === item.id);
      updatedItems[index] = { ...updatedItems[index], status: 'processing' };
      setBatchItems([...updatedItems]);

      try {
        const output = await processText(item.content, mode, tone, targetLang, customSystemPrompt);
        updatedItems[index] = { 
          ...updatedItems[index], 
          status: 'completed', 
          result: output 
        };
        
        // Add to history
        const newEntry: HistoryEntry = {
          id: Math.random().toString(36).substr(2, 9),
          inputText: item.content,
          outputText: output,
          timestamp: Date.now(),
          mode: mode,
          tone: tone
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 20));
      } catch (err: any) {
        updatedItems[index] = { 
          ...updatedItems[index], 
          status: 'error', 
          error: err.message || 'Processing failed' 
        };
      }
      setBatchItems([...updatedItems]);
    }));
    
    setIsProcessing(false);
  };

  const handleClearWorkspace = () => {
    if (inputText || result || customSystemPrompt || batchItems.some(i => i.content)) {
      if (window.confirm("Clear current workspace? This will reset your active snippets.")) {
        setInputText('');
        setResult(null);
        setCustomSystemPrompt('');
        setError(null);
        setBatchItems([{ id: '1', name: 'Snippet 1', content: '', status: 'pending' }]);
      }
    }
  };

  const handleAddBatchItem = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setBatchItems(prev => [...prev, {
      id: newId,
      name: `Snippet ${prev.length + 1}`,
      content: '',
      status: 'pending'
    }]);
  };

  const handleUpdateBatchItem = (id: string, content: string) => {
    setBatchItems(prev => prev.map(item => item.id === id ? { ...item, content, status: 'pending' } : item));
  };

  const handleRemoveBatchItem = (id: string) => {
    if (batchItems.length <= 1) return;
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  const handleRestoreEntry = (entry: HistoryEntry | SavedEntry) => {
    setIsBatchMode(false);
    setInputText(entry.inputText);
    setResult(entry.outputText);
    setMode(entry.mode);
    setTone(entry.tone);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToLibrary = (textToSave?: string, originalText?: string) => {
    const finalResult = textToSave || result;
    const finalInput = originalText || inputText;
    
    if (!finalResult) return;
    const title = window.prompt("Name this snippet for your Library:");
    if (!title) return;

    const saved: SavedEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title: title,
      inputText: finalInput,
      outputText: finalResult,
      timestamp: Date.now(),
      mode: mode,
      tone: tone
    };

    setSavedEntries(prev => [saved, ...prev]);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleDeleteSavedEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleDeleteHistoryEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(entry => entry.id !== id));
  };

  const handleCopy = (text?: string) => {
    const finalCopy = text || result;
    if (finalCopy) {
      navigator.clipboard.writeText(finalCopy);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleExportTxt = (customText?: string) => {
    const text = customText || result;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `rightshore-export-${Date.now()}.txt`);
  };

  const handleExportDocx = async (customText?: string) => {
    const text = customText || result;
    if (!text) return;
    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => new Paragraph({
          children: [new TextRun(line)],
        })),
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `rightshore-export-${Date.now()}.docx`);
  };

  const handleExportPdf = async () => {
    const element = outputRef.current;
    if (!element) return;
    
    // Temporarily hide buttons for clean export
    const buttons = element.parentElement?.querySelector('.flex.gap-2');
    if (buttons) (buttons as HTMLElement).style.display = 'none';

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`rightshore-export-${Date.now()}.pdf`);
    } finally {
      if (buttons) (buttons as HTMLElement).style.display = 'flex';
    }
  };

  const handleSavePrompt = () => {
    if (!customSystemPrompt.trim()) return;
    const name = window.prompt("Name this persona preset:");
    if (!name) return;

    const newPrompt: CustomPrompt = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      content: customSystemPrompt
    };
    setSavedPrompts(prev => [...prev, newPrompt]);
  };

  const handleDeletePrompt = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };

  const currentTone = TONE_OPTIONS.find(t => t.id === tone) || TONE_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-[#020617] transition-all duration-300 pb-20 relative overflow-x-hidden">
      {/* Background Atmosphere - Enhanced Mesh Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[10%] right-[20%] w-[35%] h-[35%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-[100] border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white leading-none mb-1">Rightshore</h1>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Intelligence Suite</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setIsBatchMode(false)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isBatchMode ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Single
              </button>
              <button 
                onClick={() => setIsBatchMode(true)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isBatchMode ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Batch
              </button>
            </div>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 dark:border-slate-700"
            >
              {isDark ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 relative z-10">
        {/* Left Column: Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Mode Selector - Refined Horizontal Tabs */}
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar shadow-sm">
            {Object.entries(MODE_CONFIG).map(([key, config]) => {
              const m = key as AIMode;
              const Icon = config.icon;
              const isActive = mode === m;
              
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-500 relative group ${
                    isActive 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap relative z-10">
                    {config.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {!isBatchMode ? (
            <div className="relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[40px] blur opacity-5 transition duration-1000 group-hover:opacity-10 ${isProcessing ? 'opacity-30 animate-pulse' : ''}`}></div>
              <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/50 dark:border-slate-800/50 rounded-[40px] shadow-2xl overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Workspace</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2">
                      {React.createElement(MODE_CONFIG[mode].icon, { className: "w-3 h-3 text-indigo-500" })}
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{MODE_CONFIG[mode].label}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Tooltip text="Reset current workspace">
                      <button 
                        onClick={handleClearWorkspace}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        Reset
                      </button>
                    </Tooltip>
                    <div className="relative" ref={toneMenuRef}>
                      <Tooltip text="Adjust conversational flavor">
                        <button 
                          onClick={() => setIsToneMenuOpen(!isToneMenuOpen)}
                          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-3 hover:border-indigo-500 transition-all"
                        >
                          {currentTone.label}
                          <svg className={`w-3 h-3 transition-transform ${isToneMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </Tooltip>
                      {isToneMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                          {TONE_OPTIONS.map(o => (
                            <button 
                              key={o.id}
                              onClick={() => { setTone(o.id); setIsToneMenuOpen(false); }}
                              className={`w-full text-left p-4 rounded-xl transition-all ${tone === o.id ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                              <span className="block text-[11px] font-black uppercase mb-1">{o.label}</span>
                              <span className="block text-[10px] text-slate-400 leading-tight">{o.description}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {mode === AIMode.TRANSLATE && (
                      <div className="relative">
                        <Tooltip text="Select target language">
                          <button 
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-3 hover:border-indigo-500 transition-all"
                          >
                            To: {targetLang}
                            <svg className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </Tooltip>
                        {isLangMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                            {LANGUAGES.map(l => (
                              <button 
                                key={l}
                                onClick={() => { setTargetLang(l); setIsLangMenuOpen(false); }}
                                className={`w-full text-left p-3 rounded-xl transition-all text-[11px] font-bold ${targetLang === l ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type or paste your content here..."
                    className="w-full min-h-[300px] text-lg font-serif-content outline-none bg-transparent resize-none leading-[1.6] text-slate-900 dark:text-slate-100 placeholder:text-slate-200 dark:placeholder:text-slate-800 custom-scrollbar selection:bg-indigo-100 dark:selection:bg-indigo-900/50"
                  />
                </div>

                <div className="px-8 py-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Word Count</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{stats.words}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sentences</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{stats.sentences}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {error && <span className="text-[11px] font-bold text-rose-500 animate-pulse">{error}</span>}
                    <Button 
                      onClick={handleExecuteSingle} 
                      isLoading={isProcessing} 
                      className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 text-base font-black uppercase tracking-widest"
                    >
                      Process Intelligence
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="flex justify-between items-center px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Batch Pipeline</h3>
                  </div>
                  <Tooltip text="Process all pending snippets">
                    <Button 
                      onClick={handleExecuteBatch} 
                      isLoading={isProcessing}
                      className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 text-[11px] font-black uppercase tracking-widest"
                    >
                      Process All Snippets
                    </Button>
                  </Tooltip>
               </div>
               
               <div className="grid grid-cols-1 gap-6">
                 {batchItems.map((item) => (
                   <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-xl transition-all hover:border-slate-300 dark:hover:border-slate-700">
                      <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {item.id.slice(0, 4)}</span>
                            {item.status === 'processing' && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>}
                            {item.status === 'completed' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            {item.status === 'error' && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
                         </div>
                         <Tooltip text="Remove this snippet">
                           <button 
                             onClick={() => handleRemoveBatchItem(item.id)}
                             className="text-slate-300 hover:text-rose-500 transition-colors"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                         </Tooltip>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Input Text</span>
                            <textarea 
                              value={item.content}
                              onChange={(e) => handleUpdateBatchItem(item.id, e.target.value)}
                              placeholder="Add snippet content..."
                              className="w-full h-[140px] bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 text-xs font-serif-content outline-none focus:border-indigo-500 border border-transparent transition-all resize-none custom-scrollbar"
                            />
                         </div>
                         <div className="space-y-3">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">AI Output</span>
                            <div className="w-full h-[140px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto custom-scrollbar relative">
                               {item.status === 'pending' && <p className="text-slate-300 italic text-sm">Ready to process...</p>}
                               {item.status === 'processing' && <p className="text-indigo-400 animate-pulse text-sm">Analysing text intelligence...</p>}
                               {item.status === 'error' && <p className="text-rose-500 text-sm font-bold">{item.error}</p>}
                               {item.status === 'completed' && item.result && (
                                 <div className="text-sm font-serif-content leading-relaxed">
                                   {mode === AIMode.REPHRASE ? (
                                     <div className="space-y-4">
                                       {parseVersions(item.result).map((v, idx) => (
                                         <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group/batch-version">
                                           <div className="text-[8px] font-black text-indigo-500 uppercase mb-2 flex justify-between items-center">
                                             <span>Option {idx + 1}</span>
                                             <div className="flex gap-2 opacity-0 group-hover/batch-version:opacity-100 transition-opacity">
                                               <button onClick={() => handleCopy(v)} className="text-indigo-600 hover:text-indigo-800">Copy</button>
                                               <button onClick={() => handleSaveToLibrary(v, item.content)} className="text-indigo-600 hover:text-indigo-800">Save</button>
                                             </div>
                                           </div>
                                           <FormattedText text={v} />
                                         </div>
                                       ))}
                                     </div>
                                   ) : (
                                     <>
                                       <FormattedText text={item.result} />
                                       <div className="mt-4 flex gap-4">
                                          <Tooltip text="Copy to clipboard">
                                            <button 
                                              onClick={() => handleCopy(item.result)} 
                                              className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800"
                                            >
                                              Copy
                                            </button>
                                          </Tooltip>
                                          <Tooltip text="Add to saved library">
                                            <button 
                                              onClick={() => handleSaveToLibrary(item.result, item.content)} 
                                              className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800"
                                            >
                                              Save
                                            </button>
                                          </Tooltip>
                                          <Tooltip text="Export as text">
                                            <button 
                                              onClick={() => handleExportTxt(item.result)} 
                                              className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800"
                                            >
                                              Export
                                            </button>
                                          </Tooltip>
                                       </div>
                                     </>
                                   )}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 <Tooltip text="Create a new input card">
                   <button 
                    onClick={handleAddBatchItem}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[28px] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-3"
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                     Add Another Snippet
                   </button>
                 </Tooltip>
               </div>
            </div>
          )}

          {!isBatchMode && (isProcessing || result) && (
            <div ref={outputRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex justify-between items-center px-6">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] ${isProcessing ? 'animate-pulse' : ''}`} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">
                    {isProcessing ? 'Intelligence Generating...' : 'Intelligence Output'}
                  </h3>
                </div>
                {result && (
                  <div className="flex gap-2">
                    <Tooltip text="Store in permanent library">
                      <button 
                        className="h-9 px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" 
                        onClick={() => handleSaveToLibrary()}
                      >
                        {saveFeedback ? 'Stored' : 'Store'}
                      </button>
                    </Tooltip>
                    <Tooltip text="Copy output text">
                      <button 
                        className="h-9 px-5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20" 
                        onClick={() => handleCopy()}
                      >
                        {copyFeedback ? 'Copied' : 'Copy'}
                      </button>
                    </Tooltip>

                    <div className="relative group/export">
                      <button className="h-9 px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Download className="w-3 h-3" />
                        Export
                      </button>
                      <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-[110] p-2">
                        <button 
                          onClick={handleExportPdf}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-500" />
                          PDF Document
                        </button>
                        <button 
                          onClick={handleExportDocx}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                        >
                          <File className="w-3.5 h-3.5 text-blue-500" />
                          Word (.docx)
                        </button>
                        <button 
                          onClick={handleExportTxt}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                        >
                          <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                          Plain Text
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="paper-texture bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-[40px] p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-[0.07]">
                  <span className="text-[12rem] font-black text-slate-900 dark:text-slate-100 select-none">R</span>
                </div>
                <div className="output-typography font-serif-content relative z-10 selection:bg-indigo-100 dark:selection:bg-indigo-900/50 text-lg leading-[1.8]">
                  {result ? (
                    mode === AIMode.REPHRASE ? (
                      <div className="space-y-8">
                        {parseVersions(result).map((v, idx) => (
                          <div key={idx} className="relative p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 group/version">
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                              Option {idx + 1}
                            </div>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <FormattedText text={v} />
                              </div>
                              <div className="flex flex-col gap-2 opacity-0 group-hover/version:opacity-100 transition-opacity">
                                <Tooltip text="Copy this version">
                                  <button onClick={() => handleCopy(v)} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                  </button>
                                </Tooltip>
                                <Tooltip text="Save this version">
                                  <button onClick={() => handleSaveToLibrary(v)} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <FormattedText text={result} />
                    )
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  )}
                  {isProcessing && result && (
                    <motion.span 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-2 h-5 bg-indigo-500 ml-1 align-middle"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-slate-950 dark:bg-white rounded-[32px] p-6 text-white dark:text-slate-950 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-8 opacity-40 relative z-10">Neural Analysis Core</h3>
              <div className="space-y-10 relative z-10">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Linguistic Authenticity</span>
                     <span className="text-3xl font-black tracking-tighter">{stats.humanityScore}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 dark:bg-slate-100 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.humanityScore}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full ${stats.humanityScore > 80 ? 'bg-emerald-400' : 'bg-indigo-400'}`} 
                      ></motion.div>
                   </div>
                   <p className="text-[9px] opacity-30 leading-relaxed font-medium uppercase tracking-tight">
                     Real-time structural pattern recognition engine.
                   </p>
                </div>

                <div className="pt-6 border-t border-white/5 dark:border-slate-100/50">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 dark:bg-slate-50 p-4 rounded-2xl border border-white/5 dark:border-slate-200/50">
                         <span className="block text-[7px] font-black uppercase opacity-30 mb-1 tracking-widest">Status</span>
                         <div className="flex items-center gap-1.5">
                           <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                           <span className="text-[10px] font-black text-emerald-400 uppercase">Active</span>
                         </div>
                      </div>
                      <div className="bg-white/5 dark:bg-slate-50 p-4 rounded-2xl border border-white/5 dark:border-slate-200/50">
                         <span className="block text-[7px] font-black uppercase opacity-30 mb-1 tracking-widest">Engine</span>
                         <span className="text-[10px] font-black uppercase">Gemini 3.1</span>
                      </div>
                   </div>
                </div>
              </div>
           </div>

           {/* Saved Entries Library */}
           {savedEntries.length > 0 && (
             <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-[32px] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Saved Library</h4>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg">{savedEntries.length}</span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {savedEntries.map((s) => (
                    <Tooltip key={s.id} text="Restore this saved result" position="left">
                      <div 
                        className="w-full p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 cursor-pointer transition-all group relative"
                        onClick={() => handleRestoreEntry(s)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 line-clamp-1">{s.title}</span>
                          <button 
                            onClick={(e) => handleDeleteSavedEntry(e, s.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[8px] font-black uppercase text-indigo-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">{s.mode}</span>
                          <span className="text-[8px] font-bold text-slate-400 self-center">{new Date(s.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
             </div>
           )}

           {/* Custom Persona / System Prompt Section */}
           <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-[32px] p-6 shadow-sm space-y-6">
             <div className="flex justify-between items-center">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Persona / Prompt</h4>
               <div className="flex gap-3">
                 <Tooltip text="Save as a persona preset">
                   <button 
                    onClick={handleSavePrompt}
                    className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                   >
                     <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                     Save
                   </button>
                 </Tooltip>
                 <Tooltip text="Clear custom prompt">
                   <button 
                    onClick={() => setCustomSystemPrompt('')}
                    className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
                   >
                     Reset
                   </button>
                 </Tooltip>
               </div>
             </div>
             
             <div className="space-y-3">
               <textarea
                 value={customSystemPrompt}
                 onChange={(e) => setCustomSystemPrompt(e.target.value)}
                 placeholder="e.g. Act like a snarky tech CEO, or sound like a Victorian era poet..."
                 className="w-full min-h-[120px] p-4 text-xs font-medium bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all resize-none custom-scrollbar leading-relaxed"
               />

               {savedPrompts.length > 0 && (
                 <div className="space-y-3">
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Presets</span>
                    <div className="flex flex-wrap gap-2">
                      {savedPrompts.map(p => (
                        <Tooltip key={p.id} text="Apply persona preset">
                          <div 
                            onClick={() => setCustomSystemPrompt(p.content)}
                            className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                          >
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600">{p.name}</span>
                            <button 
                              onClick={(e) => handleDeletePrompt(e, p.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                 </div>
               )}
             </div>
           </div>

           {/* Context History Section */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
             <div className="flex justify-between items-center mb-8">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context History</h4>
               <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg">{history.length}</span>
             </div>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((entry) => (
                  <Tooltip key={entry.id} text="Restore session to this point" position="left">
                    <div 
                      className="w-full p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all group relative"
                      onClick={() => handleRestoreEntry(entry)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded">{entry.mode}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button 
                            onClick={(e) => handleDeleteHistoryEntry(e, entry.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2 italic">"{entry.outputText}"</p>
                      <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-black uppercase text-indigo-500">Restore Session</span>
                        <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      </div>
                    </div>
                  </Tooltip>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-300">No History Yet</p>
                  </div>
                )}
             </div>
           </div>
        </aside>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 dark:border-slate-800">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">© 2024 Rightshore AI Intelligence Platform</span>
            <div className="flex gap-8">
               <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Privacy</a>
               <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Terms</a>
               <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">API</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;
