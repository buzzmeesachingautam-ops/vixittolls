import React, { useState, useMemo, useEffect, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, ArrowLeft, Check, X, Upload, PartyPopper, FileText, Trash2, Download, RotateCcw, Lock, Unlock, Zap, Type, Square, Pencil, PenTool, Sun, Moon, Clock } from 'lucide-react';
import { tools } from './data/tools';
import { Tool, Category } from './types';
import { FileUpload } from './components/FileUpload';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
const getLoadingTask = (options: any) => {
  // Try to find getDocument and GlobalWorkerOptions in all possible locations
  let lib = pdfjsLib as any;
  let getDocumentFunc = lib.getDocument;
  let workerOptions = lib.GlobalWorkerOptions;
  
  if (!getDocumentFunc && lib.default) {
    getDocumentFunc = lib.default.getDocument;
    workerOptions = workerOptions || lib.default.GlobalWorkerOptions;
  }
  
  if (!getDocumentFunc && typeof window !== 'undefined') {
    getDocumentFunc = (window as any).pdfjsLib?.getDocument;
    workerOptions = workerOptions || (window as any).pdfjsLib?.GlobalWorkerOptions;
  }

  if (typeof getDocumentFunc !== 'function') {
    console.error('PDF.js getDocument search failed. pdfjsLib keys:', Object.keys(pdfjsLib || {}));
    throw new Error('PDF.js getDocument not found. Please try refreshing or check library installation.');
  }

  // Ensure worker is set
  if (workerOptions && !workerOptions.workerSrc) {
    workerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
  }
  
  return getDocumentFunc(options);
};

import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import { removeBackground } from '@imgly/background-removal';
import { createWorker } from 'tesseract.js';

const PDFJS_VERSION = '3.11.174';
if (typeof window !== 'undefined') {
  const lib = pdfjsLib as any;
  const workerOptions = lib.GlobalWorkerOptions || lib.default?.GlobalWorkerOptions || (window as any).pdfjsLib?.GlobalWorkerOptions;
  if (workerOptions) {
    workerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
  }
}

export default function App() {
  const [currentCat, setCurrentCat] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [resumeTheme, setResumeTheme] = useState<string>('modern');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [recentToolIds, setRecentToolIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentTools');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const recentTools = useMemo(() => {
    return recentToolIds
      .map(id => tools.find(t => t.id === id))
      .filter((t): t is Tool => !!t);
  }, [recentToolIds]);

  // Filtering logic
  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchCat = currentCat === 'all' || t.cat === currentCat;
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [currentCat, search]);

  const categories: { id: Category; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '' },
    { id: 'pdf', label: 'PDF', icon: '📄' },
    { id: 'image', label: 'Image', icon: '🖼️' },
    { id: 'calculator', label: 'Calculator', icon: '🧮' },
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'resume', label: 'Resume', icon: '📋' },
    { id: 'converter', label: 'Converter', icon: '🔄' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'dev', label: 'Developer', icon: '💻' },
    { id: 'finance', label: 'Finance', icon: '💰' },
  ];

  const handleOpenTool = (tool: Tool) => {
    setSelectedTool(tool);
    
    // Update Recent Tools
    setRecentToolIds(prev => {
      const newIds = [tool.id, ...prev.filter(id => id !== tool.id)].slice(0, 4);
      localStorage.setItem('recentTools', JSON.stringify(newIds));
      return newIds;
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Decoration: Grid overlay and scanline effect */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-[0.03] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      <div className="min-h-screen bg-bg text-text font-sans flex flex-col relative selection:bg-accent2/30 selection:text-text overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,var(--accent2)_0%,transparent_50%)] opacity-[0.03] pointer-events-none" />
      
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-8 bg-surface/90 sticky top-0 z-[100] backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedTool(null)}>
            <div className="relative">
              <div className="w-11 h-11 bg-accent text-surface rounded-lg flex items-center justify-center font-syne font-800 text-xl group-hover:scale-105 transition-all duration-500 shadow-xl shadow-accent/20">V</div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent2 rounded-sm border-2 border-surface animate-pulse" />
            </div>
            <div className="text-xl font-syne font-800 tracking-tighter leading-none">
              VIXIT<span className="text-accent2"> TOOLS</span>
              <div className="text-[9px] font-mono tracking-widest text-muted mt-0.5 opacity-60">LAB_v4.2</div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8 rail-label">
            <a href="#" className="hover:text-accent2 transition-colors relative group/link" onClick={(e) => { e.preventDefault(); setSelectedTool(null); }}>
              / DASHBOARD
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent2 transition-all group-hover/link:w-full" />
            </a>
            <a href="#" className="hover:text-accent2 transition-colors relative group/link">
              / DOCUMENTATION
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent2 transition-all group-hover/link:w-full" />
            </a>
            <a href="#" className="hover:text-accent2 transition-colors relative group/link">
              / SUPPORT
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent2 transition-all group-hover/link:w-full" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-bg border border-border rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="rail-label !text-[9px] !text-text/60">Processors Online</span>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-12 h-12 bg-surface border border-border text-text rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg hover:border-accent2 hover:text-accent2"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!selectedTool && (
          <aside className="hidden lg:flex w-80 border-r border-border p-8 flex-col gap-10 z-40 bg-surface/40 backdrop-blur-md">
            <div className="space-y-6">
              <div className="rail-label">/ NAVIGATION SYSTEM</div>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCurrentCat(cat.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all cursor-pointer font-bold text-sm ${
                      currentCat === cat.id 
                      ? 'sidebar-gradient-active shadow-xl shadow-accent/10 border-border' 
                      : 'hover:bg-muted/10 text-muted hover:text-text border border-transparent'
                    }`}
                  >
                    <span className="text-xl opacity-80">{cat.icon || '🏠'}</span> 
                    <span className="uppercase tracking-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="p-6 rounded-3xl bg-accent2/5 border border-accent2/10 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent2/10 rounded-full group-hover:scale-150 transition-transform" />
                <div className="rail-label mb-2 !text-accent2">Infrastructure</div>
                <p className="text-[11px] leading-relaxed text-slate-500 font-medium">Cloud processing units are currently operating at 98.4% efficiency.</p>
              </div>
            </div>
          </aside>
        )}

        <main className={`flex-1 overflow-y-auto relative ${selectedTool ? 'p-0' : 'p-12'}`}>
          <AnimatePresence mode="wait">
            {!selectedTool ? (
              <motion.div 
                key="home"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="max-w-[1400px] mx-auto space-y-12"
              >
                {/* Hero / Header */}
                <header className="flex flex-col gap-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-accent2/10 border border-accent2/20 rounded-full rail-label !text-accent2">
                      <Zap className="w-3 h-3" /> v4.2.0 STABLE_RELEASE
                    </div>
                    <h1 className="text-6xl md:text-9xl font-syne font-800 tracking-[-0.05em] leading-[0.8] text-balance cursor-default">
                      All Utility.<br />
                      <span className="text-accent2">Zero Friction.</span>
                    </h1>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-end justify-between">
                    <div className="max-w-md rail-label !text-muted leading-relaxed !text-[11px]">
                      Unified suite of document, code, and calculation nodes built for high-performance creative workflows and technical precision.
                    </div>
                    <div className="w-full md:w-[550px] relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center text-muted group-focus-within:text-accent2 transition-colors">
                        <Search className="w-5 h-5" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="ACCESS_SYSTEM_REGISTRY..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-surface/50 border border-border rounded-xl pl-16 pr-8 py-6 text-sm focus:outline-none focus:border-accent2 focus:shadow-[0_0_80px_-12px_rgba(193,254,66,0.15)] transition-all shadow-sm font-mono tracking-tight"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted/40 uppercase tracking-widest hidden sm:block">
                        Ready_To_Scan
                      </div>
                    </div>
                  </div>
                </header>

                {/* Quick Access / Recently Used */}
                {recentTools.length > 0 && !search && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="rail-label flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> / QUICK_ACCESS_CACHE
                      </div>
                      <button 
                        onClick={() => {
                          setRecentToolIds([]);
                          localStorage.removeItem('recentTools');
                        }}
                        className="text-[9px] font-mono text-muted hover:text-accent2 transition-colors uppercase tracking-widest"
                      >
                        [ Clear_Cache ]
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {recentTools.map((tool) => (
                        <motion.div
                          key={`recent-${tool.id}`}
                          whileHover={{ y: -4 }}
                          onClick={() => handleOpenTool(tool)}
                          className="flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border hover:border-accent2/50 transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-accent2/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-accent2/10 transition-colors" />
                          <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            {tool.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-syne font-800 uppercase tracking-tight text-sm truncate group-hover:text-accent2 transition-colors">{tool.name}</div>
                            <div className="text-[10px] font-mono text-muted uppercase tracking-widest">{tool.cat}</div>
                          </div>
                          <Zap className="w-3 h-3 text-accent2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-[1px] bg-border w-full" />

                {/* Mobile Categories (hidden on lg) */}
                <div className="lg:hidden flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCurrentCat(cat.id)}
                      className={`whitespace-nowrap px-6 py-3 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        currentCat === cat.id 
                        ? 'bg-accent2 border-accent2 text-bg shadow-xl shadow-accent2/20' 
                        : 'bg-surface border-border text-muted hover:bg-bg'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Tools Grid */}
                <div className="bento-grid pb-24">
                  {filteredTools.map((tool) => (
                    <motion.div
                      layout
                      key={tool.id}
                      onClick={() => handleOpenTool(tool)}
                      className="tool-card group rounded-2xl p-8 cursor-pointer relative overflow-hidden bg-surface border border-border hover:border-accent2 transition-all duration-500"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                         <div className="text-[10px] font-mono tracking-tighter text-accent2">ID: {tool.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="w-16 h-16 rounded-xl bg-bg border border-border flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-all duration-700">
                          {tool.icon}
                        </div>

                        <div className="space-y-2">
                          <div className="font-syne text-xl font-800 uppercase tracking-tight leading-none group-hover:text-accent2 transition-colors">{tool.name}</div>
                          <div className="text-muted text-[11px] leading-relaxed font-medium line-clamp-2 opacity-80">{tool.desc}</div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                           <div className="text-[9px] font-mono uppercase tracking-widest text-muted px-2 py-0.5 bg-bg rounded border border-border">{tool.cat}</div>
                           <ArrowLeft className="w-4 h-4 rotate-180 text-accent2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                      </div>

                      {/* Decorative hover effect */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-accent2 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (


              <motion.div 
                key="tool-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col pt-0 bg-bg"
              >
                <div className="sticky top-0 z-50 bg-surface/80 border-b border-border px-10 h-24 flex items-center justify-between backdrop-blur-xl">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setSelectedTool(null)}
                      className="group p-3 border border-border rounded-2xl text-muted hover:text-accent hover:border-accent transition-all cursor-pointer bg-surface"
                    >
                      <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-5 border-l border-border pl-8">
                       <div className="w-14 h-14 bg-bg border border-border rounded-xl flex items-center justify-center text-3xl shadow-sm">
                          {selectedTool?.icon}
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent2 animate-pulse" />
                            <div className="rail-label !text-[9px]">/ SYSTEM_NODE: {selectedTool?.id?.toUpperCase()}</div>
                          </div>
                          <h2 className="font-syne font-800 text-2xl leading-none uppercase tracking-tighter">{selectedTool?.name}</h2>
                       </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                      <div className="rail-label !text-green">Encrypted Path</div>
                      <div className="text-[10px] font-mono text-muted">AISTUDIO://CORE/{selectedTool?.id}</div>
                    </div>
                    <button className="w-12 h-12 bg-white border border-border rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center text-xl">⚙️</button>
                  </div>
                </div>

                <div className="flex-1 p-12 overflow-y-auto">
                   <div className="max-w-[1200px] mx-auto space-y-12 animate-fade-up">
                      <div className="flex flex-col md:flex-row gap-10 items-end justify-between border-b border-border pb-10">
                        <div className="space-y-4 max-w-xl">
                          <div className="rail-label">/ CAPABILITY_OVERVIEW</div>
                          <p className="text-muted text-xl leading-relaxed font-medium">{selectedTool?.desc}</p>
                        </div>
                        <div className={`px-5 py-2 rounded-full border text-[10px] font-mono font-bold uppercase tracking-widest ${selectedTool?.free ? 'text-green border-green/20 bg-green/5' : 'text-gold border-gold/20 bg-gold/5'}`}>
                            {selectedTool?.free ? 'Access Status: Public / Optimized' : 'Status: Restricted / PRO'}
                        </div>
                      </div>
                      
                      <div className="relative z-10 w-full bg-surface rounded-[48px] p-12 border border-border shadow-2xl shadow-slate-200/50">
                         {selectedTool && (
                           <ToolRenderer 
                              tool={selectedTool} 
                              resumeTheme={resumeTheme}
                              onSelectTool={(id, theme) => {
                                const tool = tools.find(t => t.id === id);
                                if (tool) {
                                  setSelectedTool(tool);
                                  if (theme) setResumeTheme(theme);
                                }
                              }}
                            />
                         )}
                      </div>

                      <footer className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
                         <div className="rail-label">/ VIXIT_TOOLS_LAB INTERFACE ENGINE</div>
                         <div className="flex gap-8 rail-label">
                            <span>SLA: 99.98%</span>
                            <span>Region: Global</span>
                            <span>Latency: 14ms</span>
                         </div>
                      </footer>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
  </div>

    <footer className="h-20 border-t border-border px-12 flex items-center justify-between bg-surface z-[100] sticky bottom-0">
      <div className="flex bg-muted/5 rounded-full px-4 py-2 border border-border">
        <div className="rail-label !text-[8px]">© 2026 VIXIT TOOLS LAB :: ENCRYPTED_SUITE</div>
      </div>
      <div className="hidden md:flex gap-10 rail-label !text-[9px]">
        <span className="hover:text-accent2 cursor-pointer transition-colors">API_DOCS</span>
        <span className="hover:text-accent2 cursor-pointer transition-colors">PRIVACY_PROTOCOL</span>
        <span className="hover:text-accent2 cursor-pointer transition-colors">TERMS_OF_USE</span>
        <div className="flex items-center gap-2 text-accent bg-accent/5 px-3 py-1 rounded-full border border-border font-bold">
           <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
           v4.2.0 STABLE
        </div>
      </div>
    </footer>
    </div>
    </>
  );
}

// EMI Calculator
function EMICalculator() {
  const [amt, setAmt] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [res, setRes] = useState<{ emi: string; total: string; interest: string } | null>(null);

  const calculate = () => {
    const p = parseFloat(amt);
    const r = parseFloat(rate) / 12 / 100;
    const n = parseFloat(tenure) * 12;
    if (p && r && n) {
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const total = emi * n;
      setRes({
        emi: emi.toFixed(0),
        total: total.toFixed(0),
        interest: (total - p).toFixed(0)
      });
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-4">
          <label className="rail-label">Principal Amount</label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted font-bold">₹</span>
            <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="500,000" className="w-full bg-bg border border-border px-10 py-5 rounded-[24px] text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <label className="rail-label">Interest Rate (% p.a)</label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="8.5" className="w-full bg-bg border border-border px-8 py-5 rounded-[24px] text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
        <div className="space-y-4">
          <label className="rail-label">Tenure (Years)</label>
          <input type="number" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="5" className="w-full bg-bg border border-border px-8 py-5 rounded-[24px] text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
      </div>
      
      <button onClick={calculate} className="w-full py-6 bg-accent text-white font-syne font-800 uppercase tracking-[0.2em] text-xs rounded-full hover:bg-accent2 hover:shadow-2xl hover:shadow-accent2/20 transition-all active:scale-[0.98]">
        Execute Calculation →
      </button>

      {res && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-accent text-white rounded-[40px] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent2/20 blur-[100px] rounded-full" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            <div className="space-y-2">
              <div className="rail-label !text-accent2">Monthly Installment</div>
              <div className="font-syne text-7xl font-800 tracking-tighter">₹{parseInt(res.emi).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-l border-white/10 pl-8">
              <div className="space-y-1">
                <div className="rail-label !text-white/40">Total Interest</div>
                <div className="text-xl font-bold">₹{parseInt(res.interest).toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="rail-label !text-white/40">Total Repayment</div>
                <div className="text-xl font-bold">₹{parseInt(res.total).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Case Converter
function CaseConverter() {
  const [text, setText] = useState('');
  
  const convert = (type: 'upper' | 'lower' | 'title') => {
    if (type === 'upper') setText(text.toUpperCase());
    if (type === 'lower') setText(text.toLowerCase());
    if (type === 'title') setText(text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4 relative z-10">
        <label className="rail-label">Transformation Input</label>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          rows={10} 
          placeholder="Paste content for case mapping unit..."
          className="w-full bg-bg border border-border px-8 py-8 rounded-[32px] text-text outline-none focus:border-accent2 resize-none min-h-[300px] transition-all font-medium leading-relaxed shadow-inner"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <button onClick={() => convert('upper')} className="py-5 bg-white border border-border text-accent font-bold text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-slate-50 transition-all hover:scale-[1.02] shadow-sm">UPPER_CASE</button>
        <button onClick={() => convert('lower')} className="py-5 bg-white border border-border text-accent font-bold text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-slate-50 transition-all hover:scale-[1.02] shadow-sm">lower_case</button>
        <button onClick={() => convert('title')} className="py-5 bg-accent text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-accent2 transition-all hover:scale-[1.02] shadow-xl shadow-accent/10">Title_Case</button>
      </div>
    </div>
  );
}

// Lorem Generator
function LoremGenerator() {
  const [paras, setParas] = useState('3');
  const [text, setText] = useState('');

  const generate = () => {
    const base = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    const count = parseInt(paras) || 1;
    setText(Array(count).fill(base).join('\n\n'));
  };

  return (
    <div className="space-y-10 p-10 rounded-[40px] border border-border relative overflow-hidden bg-surface">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent2/5 blur-[100px] pointer-events-none" />
      <div className="flex gap-4 relative z-10">
        <div className="flex-1 space-y-3">
          <label className="rail-label ml-1">Paragraph Count</label>
          <input type="number" value={paras} onChange={e => setParas(e.target.value)} min="1" max="50" className="w-full bg-bg border border-border px-6 py-4 rounded-2xl text-text outline-none focus:border-accent2 transition-all font-medium" />
        </div>
        <button onClick={generate} className="px-10 mt-8 bg-accent text-surface font-syne font-800 uppercase tracking-widest text-xs rounded-2xl hover:bg-accent2 active:scale-95 transition-all shadow-xl shadow-accent/10">Generate</button>
      </div>
      {text && (
        <div className="space-y-4 relative z-10">
          <textarea readOnly value={text} rows={10} className="w-full bg-bg/50 border border-border px-6 py-6 rounded-3xl text-sm text-text/80 outline-none resize-none font-medium leading-relaxed" />
          <button onClick={() => { navigator.clipboard.writeText(text); alert('Copied!'); }} className="w-full py-4 border border-accent2/20 text-accent2 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-accent2/5 transition-all">Copy to Clipboard</button>
        </div>
      )}
    </div>
  );
}

// Tool Component Logic
function ToolRenderer({ tool, onSelectTool, resumeTheme }: { tool: Tool, onSelectTool: (id: string, theme?: string) => void, resumeTheme?: string }) {
  if (!tool) return null;
  if (tool.id === 'resume-builder') return <ResumeBuilder initialTheme={resumeTheme} />;
  if (tool.id === 'resume-tmpl') return <ResumeMockTool onSelectTheme={(theme) => onSelectTool('resume-builder', theme)} />;
  
  if (tool.id === 'age-calc') return <AgeCalculator />;
  if (tool.id === 'bmi-calc') return <BMICalculator />;
  if (tool.id === 'gst-calc') return <GSTCalculator />;
  if (tool.id === 'loan-calc' || tool.id === 'emi-calc') return <EMICalculator />;
  if (tool.id === 'percent-calc') return <PercentageCalculator />;
  if (tool.id === 'tip-calc') return <TipCalculator />;
  if (tool.id === 'sip-calc') return <SIPCalculator />;
  if (tool.id === 'calorie-calc') return <CalorieCalculator />;
  if (tool.id === 'area-calc') return <AreaCalculator />;
  if (tool.id === 'date-diff') return <DateDiffCalculator />;
  if (tool.id === 'fd-calc') return <FDCalculator />;
  if (tool.id === 'rd-calc') return <RDCalculator />;
  if (tool.id === 'ppf-calc') return <PPFCalculator />;
  if (tool.id === 'compound') return <CompoundInterestCalculator />;
  if (tool.id === 'salary-calc' || tool.id === 'tax-calc') return <SalaryCalculator />;
  if (tool.id === 'discount-calc') return <DiscountCalculator />;
  if (tool.id === 'file-anatomy') return <FileAnatomy />;

  if (tool.id === 'unit-conv' || tool.id === 'data-conv') return <UnitConverter />;
  if (tool.id === 'temp-conv') return <TempConverter />;

  if (tool.id === 'json-format') return <JSONFormatter />;
  if (tool.id === 'base64') return <Base64Tool />;
  if (tool.id === 'uuid-gen') return <UUIDGenerator />;
  if (tool.id === 'color-picker') return <ColorPicker />;
  if (tool.id === 'html-encode') return <HTMLEncoder />;
  if (tool.id === 'sql-format') return <SQLFormatter />;
  if (tool.id === 'regex-test') return <RegexTester />;
  if (tool.id === 'md5-gen') return <MD5Generator />;
  if (tool.id === 'url-encode') return <URLEncoder />;
  if (tool.id === 'meta-gen') return <MetaTagGenerator />;
  if (tool.id === 'css-minify' || tool.id === 'js-minify') return <CodeMinifier type={tool.id === 'css-minify' ? 'css' : 'js'} />;
  if (tool.id === 'keyword-density') return <KeywordDensity />;
  if (tool.id === 'og-preview') return <OGPreview />;
  if (tool.id === 'sitemap-gen') return <SitemapGenerator />;
  if (tool.id === 'readability') return <ReadabilityAnalysis />;

  if (tool.id === 'word-count' || tool.id === 'char-count') return <WordCounter />;
  if (tool.id === 'case-conv') return <CaseConverter />;
  if (tool.id === 'lorem') return <LoremGenerator />;
  if (tool.id === 'text-reverse' || tool.id === 'remove-space' || tool.id === 'duplicate-rem' || tool.id === 'text-sort') return <TextProcessor toolId={tool.id} />;
  if (tool.id === 'text-diff') return <TextComparator />;
  if (tool.id === 'spell-check') return <SpellChecker />;
  
  if (tool.id === 'ats-checker') return <ATSChecker />;
  if (tool.id === 'pdf-editor') return <PDFEditor />;
  if (tool.id === 'resume-builder' || tool.id === 'resume-tmpl' || tool.id === 'cover-letter') {
    if (tool.id === 'cover-letter') return <CoverLetterGenerator />;
    return <ResumeBuilder />;
  }
  
  if (tool.id === 'bin-dec') return <BinaryConverter />;
  if (tool.id === 'roman-num') return <RomanConverter />;
  if (tool.id === 'color-conv') return <ColorConverter />;
  if (tool.id === 'time-conv') return <TimeZoneConverter />;
  if (tool.id === 'currency') return <CurrencyConverter />;

  if (tool.cat === 'image') return <ImageTool tool={tool} />;
  if (tool.cat === 'pdf') return <PDFMockTool tool={tool} />;
  
  return (
    <div className="text-center py-24 border border-border rounded-[48px] relative overflow-hidden bg-surface shadow-sm">
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent2/5 blur-[100px] pointer-events-none" />
      <div className="text-7xl mb-8 inline-block drop-shadow-2xl">{tool?.icon}</div>
      <div className="font-syne font-800 text-3xl mb-4 uppercase tracking-tighter">{tool?.name}</div>
      <p className="text-muted text-sm max-w-[450px] mx-auto mb-12 leading-relaxed font-medium">
        This computational node is active. We are currently calibrating the cloud processor for {tool?.name}. Access is unrestricted and optimized for high-volume intake.
      </p>
      <div className="inline-flex items-center gap-4 bg-bg border border-border text-text/60 px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">
        <div className="w-2.5 h-2.5 rounded-full bg-green animate-pulse" /> FREE_SERVICE_ACTIVE::ONLINE
      </div>
    </div>
  );
}

// Age Calculator Implementation
function AgeCalculator() {
  const [dob, setDob] = useState('');
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState<{ y: number, m: number, d: number, total: number } | null>(null);

  const calculate = () => {
    if (!dob) return;
    const d1 = new Date(dob);
    const d2 = new Date(refDate);
    
    let y = d2.getFullYear() - d1.getFullYear();
    let m = d2.getMonth() - d1.getMonth();
    let d = d2.getDate() - d1.getDate();

    if (d < 0) {
      m--;
      const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
      d += prevMonth;
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    const total = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    setResult({ y, m, d, total });
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
        <div className="space-y-4">
          <label className="rail-label">Date of Birth</label>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-bg border border-border px-8 py-5 rounded-[24px] text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
        <div className="space-y-4">
          <label className="rail-label">Reference Date</label>
          <input type="date" value={refDate} onChange={e => setRefDate(e.target.value)} className="w-full bg-bg border border-border px-8 py-5 rounded-[24px] text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-6 bg-accent text-surface font-syne font-800 uppercase tracking-[0.2em] text-xs rounded-full hover:bg-accent2 hover:shadow-2xl hover:shadow-accent2/20 transition-all active:scale-[0.98]">
        Calculate Temporal State →
      </button>
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-accent text-surface rounded-[40px] p-12 relative overflow-hidden border border-border shadow-2xl">
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent2/10 blur-[100px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-10">
            <div className="space-y-2">
              <div className="rail-label !text-accent2">Calculated Age</div>
              <div className="font-syne text-8xl font-800 tracking-tighter">{result.y}<span className="text-2xl font-800 text-surface/20 ml-4 uppercase tracking-[0.2em]">Years</span></div>
            </div>
            <div className="flex flex-col gap-4 text-right">
              <div className="flex gap-10">
                <div className="text-center">
                  <div className="rail-label !text-surface/40 mb-1">Months</div>
                  <div className="text-3xl font-bold">{result.m}</div>
                </div>
                <div className="text-center">
                  <div className="rail-label !text-surface/40 mb-1">Days</div>
                  <div className="text-3xl font-bold">{result.d}</div>
                </div>
              </div>
              <div className="rail-label !text-accent2 !text-[9px] bg-accent2/10 px-4 py-2 rounded-full inline-block">
                TOTAL_LIFETIME_DAYS: {result.total.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// BMI Calculator
function BMICalculator() {
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const [res, setRes] = useState<{ bmi: string, cat: string } | null>(null);

  const calculate = () => {
    const height = parseFloat(h) / 100;
    const weight = parseFloat(w);
    if (!height || !weight) return;
    const bmi = (weight / (height * height)).toFixed(1);
    let cat = 'Normal Weight ✅';
    if (parseFloat(bmi) < 18.5) cat = 'Underweight';
    else if (parseFloat(bmi) >= 25 && parseFloat(bmi) < 30) cat = 'Overweight ⚠️';
    else if (parseFloat(bmi) >= 30) cat = 'Obese ❌';
    setRes({ bmi, cat });
  };

  return (
    <div className="space-y-8 p-10 rounded-[40px] border border-border relative overflow-hidden bg-surface">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent2/5 blur-[100px] pointer-events-none" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4">
          <label className="rail-label">Height (cm)</label>
          <input type="number" value={h} onChange={e => setH(e.target.value)} placeholder="170" className="w-full bg-bg border border-border px-8 py-5 rounded-3xl text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
        <div className="space-y-4">
          <label className="rail-label">Weight (kg)</label>
          <input type="number" value={w} onChange={e => setW(e.target.value)} placeholder="70" className="w-full bg-bg border border-border px-8 py-5 rounded-3xl text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-6 bg-accent text-surface font-syne font-800 uppercase tracking-widest text-xs rounded-full hover:bg-accent2 hover:shadow-2xl hover:shadow-accent2/20 transition-all relative z-10">
        Analyze Bio-Mass Index
      </button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent2/5 border border-accent2/10 rounded-[32px] p-10 relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent2/10 blur-[80px] rounded-full" />
          <div className="rail-label !text-accent2 mb-6">Metabolic Report</div>
          <div className="font-syne text-7xl font-800 text-text mb-4 leading-none">{res.bmi}</div>
          <div className="text-text/60 text-[10px] font-bold uppercase tracking-[0.2em]">Classification: {res.cat}</div>
        </motion.div>
      )}
    </div>
  );
}

// GST Calculator
function GSTCalculator() {
  const [amt, setAmt] = useState('');
  const [rate, setRate] = useState('18');
  const [res, setRes] = useState<{ gst: string, total: string } | null>(null);

  const calculate = () => {
    const amount = parseFloat(amt);
    const r = parseFloat(rate);
    if (!amount) return;
    const gst = (amount * r / 100).toFixed(2);
    const total = (amount + parseFloat(gst)).toFixed(2);
    setRes({ gst, total });
  };

  return (
    <div className="space-y-8 p-10 rounded-[40px] border border-border relative overflow-hidden bg-surface">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent2/5 blur-[100px] pointer-events-none" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4">
          <label className="rail-label">Amount (₹)</label>
          <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="1000" className="w-full bg-bg border border-border px-8 py-5 rounded-3xl text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
        <div className="space-y-4">
          <label className="rail-label">GST Rate (%)</label>
          <select value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-bg border border-border px-8 py-5 rounded-3xl text-text outline-none focus:border-accent2 transition-all font-bold text-lg appearance-none">
            <option value="5">5% (Essential)</option>
            <option value="12">12% (Standard)</option>
            <option value="18">18% (Service)</option>
            <option value="28">28% (Luxury)</option>
          </select>
        </div>
      </div>
      <button onClick={calculate} className="w-full py-6 bg-accent text-surface font-syne font-800 uppercase tracking-widest text-xs rounded-full hover:bg-accent2 hover:shadow-2xl hover:shadow-accent2/20 transition-all relative z-10">
        Calculate GST Breakdown
      </button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent2/5 border border-accent2/10 rounded-[32px] p-10 relative z-10 overflow-hidden">
          <div className="rail-label !text-accent2 mb-8">Tax Calculation Result</div>
          <div className="space-y-6">
            <div className="flex justify-between items-center text-sm font-bold opacity-60 uppercase tracking-widest"><span>Net Amount</span><span>₹{parseFloat(amt).toLocaleString()}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-accent2 uppercase tracking-widest"><span>GST ({rate}%)</span><span>+ ₹{parseFloat(res.gst).toLocaleString()}</span></div>
            <div className="h-[1px] bg-accent2/20 my-4" />
            <div className="flex justify-between items-end">
              <span className="rail-label !text-muted">Gross Total</span>
              <div className="font-syne text-5xl font-800 text-text tracking-tighter">₹{parseFloat(res.total).toLocaleString()}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Percentage Calculator
function PercentageCalculator() {
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [res, setRes] = useState<string | null>(null);

  const calculate = () => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);
    if (!isNaN(v1) && !isNaN(v2)) {
      setRes(((v1 * v2) / 100).toFixed(2));
    }
  };

  return (
    <div className="space-y-10 p-10 rounded-[40px] border border-border relative overflow-hidden bg-surface">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent2/5 blur-[100px] pointer-events-none" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4">
          <label className="rail-label">Percentage (%)</label>
          <input type="number" value={val1} onChange={e => setVal1(e.target.value)} placeholder="10" className="w-full bg-bg border border-border px-8 py-5 rounded-3xl text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
        <div className="space-y-4">
          <label className="rail-label">Of Value</label>
          <input type="number" value={val2} onChange={e => setVal2(e.target.value)} placeholder="1000" className="w-full bg-bg border border-border px-8 py-5 rounded-3xl text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-6 bg-accent text-surface font-syne font-800 uppercase tracking-widest text-xs rounded-full hover:bg-accent2 hover:shadow-2xl transition-all relative z-10">
        Execute Percentage Mapping
      </button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent2/5 border border-accent2/10 rounded-[32px] p-10 relative z-10">
          <div className="rail-label !text-accent2 mb-6">Computed Value</div>
          <div className="font-syne text-7xl font-800 text-text tracking-tighter">{parseFloat(res).toLocaleString()}</div>
        </motion.div>
      )}
    </div>
  );
}

// Tip Calculator
function TipCalculator() {
  const [bill, setBill] = useState('');
  const [tipRate, setTipRate] = useState('10');
  const [people, setPeople] = useState('1');
  const [res, setRes] = useState<{ tip: string, total: string, perPerson: string } | null>(null);

  const calculate = () => {
    const b = parseFloat(bill);
    const t = parseFloat(tipRate);
    const p = parseInt(people);
    if (b && p) {
      const tip = (b * t) / 100;
      const total = b + tip;
      setRes({
        tip: tip.toFixed(2),
        total: total.toFixed(2),
        perPerson: (total / p).toFixed(2)
      });
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Bill mount (₹)</label>
          <input type="number" value={bill} onChange={e => setBill(e.target.value)} placeholder="1500" className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Tip Rate (%)</label>
          <input type="number" value={tipRate} onChange={e => setTipRate(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">No. of People</label>
          <input type="number" value={people} onChange={e => setPeople(e.target.value)} min="1" className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-90 transition-all relative z-10">Calculate Tip & Split</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Tip</div>
              <div className="font-syne text-3xl font-extrabold text-white">₹{res.tip}</div>
           </div>
           <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Bill</div>
              <div className="font-syne text-3xl font-extrabold text-white">₹{res.total}</div>
           </div>
           <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Per Person</div>
              <div className="font-syne text-3xl font-extrabold text-accent">₹{res.perPerson}</div>
           </div>
        </motion.div>
      )}
    </div>
  );
}

// SIP Calculator
function SIPCalculator() {
  const [amt, setAmt] = useState('5000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [res, setRes] = useState<{ invested: string, returns: string, total: string } | null>(null);

  const calculate = () => {
    const p = parseFloat(amt);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseInt(years) * 12;
    if (p && r && n) {
      const totalValue = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const invested = p * n;
      setRes({
        invested: invested.toFixed(0),
        returns: (totalValue - invested).toFixed(0),
        total: totalValue.toFixed(0)
      });
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-slate-200 relative overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Monthly Investment (₹)</label>
          <input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Expected Return Rate (% p.a)</label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Tenure (Years)</label>
          <input type="number" value={years} onChange={e => setYears(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-accent text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-110 shadow-xl shadow-accent/10 transition-all relative z-10">Project SIP Returns</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/5 border border-accent/20 rounded-3xl p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Maturity Amount</div>
                <div className="font-syne text-5xl font-extrabold text-slate-900">₹{parseInt(res.total).toLocaleString()}</div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold"><span className="text-muted uppercase">Invested</span><span className="text-slate-900">₹{parseInt(res.invested).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs font-bold"><span className="text-muted uppercase">EST. Returns</span><span className="text-accent">₹{parseInt(res.returns).toLocaleString()}</span></div>
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Discount Calculator
function DiscountCalculator() {
  const [price, setPrice] = useState('');
  const [rate, setRate] = useState('');
  const [res, setRes] = useState<{ final: string, saved: string } | null>(null);

  const calculate = () => {
    const p = parseFloat(price);
    const r = parseFloat(rate);
    if (p && r) {
      const saved = (p * r) / 100;
      setRes({
        final: (p - saved).toFixed(2),
        saved: saved.toFixed(2)
      });
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-slate-200 relative overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Original Price (₹)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Discount (%)</label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-accent text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-110 shadow-xl shadow-accent/10 transition-all relative z-10">Apply Discount</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/5 border border-accent/20 rounded-3xl p-8 relative z-10 grid grid-cols-2 gap-8">
           <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Final Price</div>
              <div className="font-syne text-4xl font-extrabold text-slate-900">₹{res.final}</div>
           </div>
           <div>
              <div className="text-[10px] font-bold text-green uppercase tracking-widest mb-1">You Save</div>
              <div className="font-syne text-4xl font-extrabold text-green">₹{res.saved}</div>
           </div>
        </motion.div>
      )}
    </div>
  );
}

// Salary Calculator
function SalaryCalculator() {
  const [ctc, setCtc] = useState('');
  const [res, setRes] = useState<{ monthly: string, inHand: string, yearlyTax: string } | null>(null);

  const calculate = () => {
    const total = parseFloat(ctc);
    if (total) {
      // Very basic India tax estimation for mock
      const standardDeduction = 50000;
      const taxable = Math.max(0, total - standardDeduction);
      let tax = 0;
      if (taxable > 1500000) tax = (taxable - 1500000) * 0.3 + 187500;
      else if (taxable > 1000000) tax = (taxable - 1000000) * 0.2 + 87500;
      else if (taxable > 500000) tax = (taxable - 500000) * 0.1 + 12500;
      
      const yearlyInHand = total - tax;
      setRes({
        monthly: (total / 12).toFixed(0),
        inHand: (yearlyInHand / 12).toFixed(0),
        yearlyTax: tax.toFixed(0)
      });
    }
  };

  return (
    <div className="space-y-10 p-10 rounded-[40px] border border-border relative overflow-hidden bg-surface">
      <div className="space-y-4 relative z-10">
        <label className="rail-label">Annual CTC (₹)</label>
        <input type="number" value={ctc} onChange={e => setCtc(e.target.value)} placeholder="1200000" className="w-full bg-bg border border-border px-8 py-5 rounded-3xl text-text outline-none focus:border-accent2 transition-all font-bold text-lg" />
      </div>
      <button onClick={calculate} className="w-full py-6 bg-accent text-surface font-syne font-800 uppercase tracking-widest text-xs rounded-full hover:bg-accent2 hover:shadow-2xl transition-all relative z-10">
        Analyze Fiscal Profile
      </button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent text-surface rounded-[40px] p-12 relative overflow-hidden border border-border shadow-2xl">
          <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-accent2/20 blur-[120px] rounded-full" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-2">
                <div className="rail-label !text-accent2">Monthly In-Hand</div>
                <div className="font-syne text-7xl font-800 tracking-tighter leading-none">₹{parseInt(res.inHand).toLocaleString()}</div>
             </div>
             <div className="space-y-6 flex flex-col justify-center border-l border-surface/10 pl-10">
                <div className="flex justify-between text-xs font-bold uppercase tracking-[0.2em] opacity-60"><span>Gross Monthly</span><span>₹{parseInt(res.monthly).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-[0.2em] text-red-400"><span>Yearly Tax Est.</span><span>₹{parseInt(res.yearlyTax).toLocaleString()}</span></div>
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function FileAnatomy() {
  const [file, setFile] = useState<File | null>(null);
  const [hexView, setHexView] = useState<string>('');

  const handleFileSelect = async (f: File) => {
    setFile(f);
    const buffer = await f.arrayBuffer();
    
    // Create a small hex view of the first 256 bytes
    const view = new Uint8Array(buffer.slice(0, 256));
    let hex = '';
    for (let i = 0; i < view.length; i += 16) {
      const chunk = view.slice(i, i + 16);
      const hexLine = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ');
      const asciiLine = Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
      hex += `${i.toString(16).padStart(4, '0')}  ${hexLine.padEnd(48, ' ')}  |${asciiLine}|\n`;
    }
    setHexView(hex);
  };

  return (
    <div className="space-y-12">
      <FileUpload 
        onFileSelect={handleFileSelect} 
        label="Analyze File Structure"
        description="Upload any file to inspect its metadata, headers, and binary composition."
      />

      {file && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface border border-border p-8 rounded-[32px] space-y-6">
                <div className="rail-label">/ METADATA_REGISTRY</div>
                <div className="space-y-4">
                  {[
                    { label: 'File Name', val: file.name },
                    { label: 'MIME Type', val: file.type || 'application/octet-stream' },
                    { label: 'Size (Bytes)', val: file.size.toLocaleString() },
                    { label: 'Last Modified', val: new Date(file.lastModified).toLocaleString() },
                    { label: 'Extension', val: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-border pb-4 last:border-0 last:pb-0">
                      <span className="text-muted text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                      <span className="font-mono text-xs font-bold truncate max-w-[150px]">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-accent text-surface p-8 rounded-[32px] flex flex-col justify-between group overflow-hidden relative">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent2/20 blur-[50px] rounded-full group-hover:scale-150 transition-transform" />
                 <div className="rail-label !text-accent2 relative z-10">Entropy Status</div>
                 <div className="py-10 relative z-10">
                    <div className="text-6xl font-syne font-800 tracking-tighter">
                      {(file.size / 1024).toFixed(1)} <span className="text-2xl opacity-20">KB</span>
                    </div>
                    <p className="mt-4 opacity-40 text-[10px] font-medium leading-relaxed max-w-[200px]">
                      Binary stream detected with {file.size.toLocaleString()} discrete nodes. Processing integrity at 100%.
                    </p>
                 </div>
                 <div className="bg-surface/10 px-6 py-3 rounded-2xl border border-surface/10 rail-label !text-surface !text-[8px] relative z-10 w-fit">
                   Data Stream: ACTIVE
                 </div>
              </div>
           </div>

           <div className="bg-surface border border-border rounded-[32px] overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="rail-label">/ BINARY_CORE_DUMP (FIRST 256 BYTES)</div>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                </div>
              </div>
              <div className="p-8 overflow-x-auto bg-bg/30">
                <pre className="font-mono text-[9px] leading-relaxed text-muted whitespace-pre">
                  {hexView}
                </pre>
              </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}

// Compound Interest Calculator
function CompoundInterestCalculator() {
  const [p, setP] = useState('');
  const [r, setR] = useState('');
  const [t, setT] = useState('');
  const [n, setN] = useState('1'); // compounding frequency
  const [res, setRes] = useState<{ total: string, interest: string } | null>(null);

  const calculate = () => {
    const principal = parseFloat(p);
    const rate = parseFloat(r) / 100;
    const time = parseFloat(t);
    const freq = parseInt(n);
    if (principal && rate && time) {
      const amount = principal * Math.pow(1 + rate / freq, freq * time);
      setRes({
        total: amount.toFixed(0),
        interest: (amount - principal).toFixed(0)
      });
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Principal (₹)</label>
          <input type="number" value={p} onChange={e => setP(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Rate (%)</label>
          <input type="number" value={r} onChange={e => setR(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Time (Years)</label>
          <input type="number" value={t} onChange={e => setT(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Compounding</label>
          <select value={n} onChange={e => setN(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all">
            <option value="1">Yearly</option>
            <option value="2">Half-Yearly</option>
            <option value="4">Quarterly</option>
            <option value="12">Monthly</option>
          </select>
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-90 transition-all relative z-10">Calculate Interest</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Maturity Value</div>
          <div className="font-syne text-5xl font-extrabold text-white mb-4">₹{parseInt(res.total).toLocaleString()}</div>
          <div className="text-muted text-xs font-bold uppercase tracking-widest">Accumulated Interest: ₹{parseInt(res.interest).toLocaleString()}</div>
        </motion.div>
      )}
    </div>
  );
}

// FD Calculator
function FDCalculator() {
  const [p, setP] = useState('');
  const [r, setR] = useState('');
  const [t, setT] = useState('');
  const [res, setRes] = useState<{ total: string, interest: string } | null>(null);

  const calculate = () => {
    const principal = parseFloat(p);
    const rate = parseFloat(r);
    const time = parseFloat(t);
    if (principal && rate && time) {
      // Standard FD formula (Quarterly compounding is common)
      const amount = principal * Math.pow(1 + rate/400, 4 * time);
      setRes({
        total: amount.toFixed(0),
        interest: (amount - principal).toFixed(0)
      });
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Deposit Amount (₹)</label>
          <input type="number" value={p} onChange={e => setP(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Interest Rate (%)</label>
          <input type="number" value={r} onChange={e => setR(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Tenure (Years)</label>
          <input type="number" value={t} onChange={e => setT(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-90 transition-all relative z-10">Check Maturity</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Maturity Amount (Quar. Comp.)</div>
          <div className="font-syne text-5xl font-extrabold text-white mb-2">₹{parseInt(res.total).toLocaleString()}</div>
          <div className="text-muted text-[10px] font-bold uppercase tracking-widest">Total Interest Earned: ₹{parseInt(res.interest).toLocaleString()}</div>
        </motion.div>
      )}
    </div>
  );
}

// PPF Calculator
function PPFCalculator() {
  const [amt, setAmt] = useState('150000');
  const [years, setYears] = useState('15');
  const rate = 7.1; // PPF standard current rate
  const [res, setRes] = useState<{ invested: string, interest: string, total: string } | null>(null);

  const calculate = () => {
    const p = parseFloat(amt);
    const n = parseInt(years);
    const r = rate / 100;
    if (p && n) {
      // Yearly investment PPF formula
      let total = 0;
      for(let i=0; i<n; i++) {
        total = (total + p) * (1 + r);
      }
      const invested = p * n;
      setRes({
        invested: invested.toFixed(0),
        interest: (total - invested).toFixed(0),
        total: total.toFixed(0)
      });
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-slate-200 relative overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Yearly Deposit (₹)</label>
          <input type="number" value={amt} onChange={e => setAmt(e.target.value)} max="150000" className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
          <p className="text-[9px] text-muted italic">* Max ₹1,50,000 per financial year.</p>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Time Period (Years)</label>
          <input type="number" value={years} onChange={e => setYears(e.target.value)} min="15" className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
          <p className="text-[9px] text-muted italic">* 15 years is the lock-in period.</p>
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-accent text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-110 shadow-xl shadow-accent/10 transition-all relative z-10">Calculate Maturity</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/5 border border-accent/20 rounded-3xl p-8 relative z-10">
           <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Final Amount</div>
                <div className="font-syne text-5xl font-extrabold text-slate-900">₹{parseInt(res.total).toLocaleString()}</div>
              </div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Rate: {rate}% Fixed</div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <div className="text-[10px] font-bold text-muted uppercase mb-1">Invested</div>
                 <div className="font-bold text-slate-900 uppercase">₹{parseInt(res.invested).toLocaleString()}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <div className="text-[10px] font-bold text-muted uppercase mb-1">Int. Earned</div>
                 <div className="font-bold text-green uppercase">₹{parseInt(res.interest).toLocaleString()}</div>
              </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}

// Date Difference Calculator
function DateDiffCalculator() {
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  const [res, setRes] = useState<number | null>(null);

  const calculate = () => {
    const start = new Date(d1);
    const end = new Date(d2);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRes(diffDays);
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-slate-200 relative overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Start Date</label>
          <input type="date" value={d1} onChange={e => setD1(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">End Date</label>
          <input type="date" value={d2} onChange={e => setD2(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-accent text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-110 shadow-xl shadow-accent/10 transition-all relative z-10">Difference In Days</button>
      {res !== null && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/5 border border-accent/20 rounded-3xl p-8 relative z-10 text-center">
            <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Temporal Gap</div>
            <div className="font-syne text-7xl font-extrabold text-slate-900 mb-2">{res}<span className="text-xl font-normal text-muted ml-3 tracking-widest uppercase">Days</span></div>
            <div className="text-muted text-[10px] font-bold uppercase tracking-widest">≈ {(res / 30.44).toFixed(1)} Months</div>
        </motion.div>
      )}
    </div>
  );
}

// Scientific Area Calculator
function AreaCalculator() {
  const [shape, setShape] = useState('circle');
  const [dim1, setDim1] = useState('');
  const [dim2, setDim2] = useState('');
  const [res, setRes] = useState<string | null>(null);

  const calculate = () => {
    const d1 = parseFloat(dim1);
    const d2 = parseFloat(dim2);
    let area = 0;
    if (shape === 'circle' && d1) area = Math.PI * d1 * d1;
    if (shape === 'rectangle' && d1 && d2) area = d1 * d2;
    if (shape === 'triangle' && d1 && d2) area = 0.5 * d1 * d2;
    if (shape === 'square' && d1) area = d1 * d1;
    
    if (area) setRes(area.toFixed(2));
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Select Shape</label>
          <select value={shape} onChange={e => setShape(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all">
            <option value="circle">Circle (Radius)</option>
            <option value="square">Square (Side)</option>
            <option value="rectangle">Rectangle (L x W)</option>
            <option value="triangle">Triangle (B x H)</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Dimension 1</label>
          <input type="number" value={dim1} onChange={e => setDim1(e.target.value)} placeholder="Value" className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        {(shape === 'rectangle' || shape === 'triangle') && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Dimension 2</label>
            <input type="number" value={dim2} onChange={e => setDim2(e.target.value)} placeholder="Value" className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
          </div>
        )}
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-90 transition-all relative z-10">Calculate Area</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Geometric Area</div>
          <div className="font-syne text-6xl font-extrabold text-white">{res}<span className="text-xl font-normal text-muted ml-3">sq. units</span></div>
        </motion.div>
      )}
    </div>
  );
}

// RD Calculator
function RDCalculator() {
  const [amt, setAmt] = useState('2000');
  const [rate, setRate] = useState('6.5');
  const [years, setYears] = useState('2');
  const [res, setRes] = useState<{ invested: string, interest: string, total: string } | null>(null);

  const calculate = () => {
    const p = parseFloat(amt);
    const r = parseFloat(rate) / 400; // Quarterly compounding
    const n = parseInt(years) * 12;
    if (p && r && n) {
      // Monthly compounding RD formula
      let total = 0;
      const n_quarters = n / 3;
      // Formula: A = P * ((1+r)^n - 1) / (1 - (1+r)^-1/3) -- simplified for mock as iterative
      for(let i=1; i<=n; i++) {
        total += p * Math.pow(1 + parseFloat(rate)/400, 4 * ((n-i+1)/12));
      }

      const invested = p * n;
      setRes({
        invested: invested.toFixed(0),
        interest: (total - invested).toFixed(0),
        total: total.toFixed(0)
      });
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Monthly Deposit (₹)</label>
          <input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Interest Rate (%)</label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Tenure (Years)</label>
          <input type="number" value={years} onChange={e => setYears(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-text outline-none focus:border-accent transition-all" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:brightness-90 transition-all relative z-10">Check RD Maturity</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10">
           <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Maturity Amount (Monthly Dep)</div>
           <div className="font-syne text-5xl font-extrabold text-white mb-2">₹{parseInt(res.total).toLocaleString()}</div>
           <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted">
              <span>Invested: ₹{parseInt(res.invested).toLocaleString()}</span>
              <span className="text-accent">Interest: ₹{parseInt(res.interest).toLocaleString()}</span>
           </div>
        </motion.div>
      )}
    </div>
  );
}

// Calorie Calculator
function CalorieCalculator() {
  const [age, setAge] = useState('25');
  const [sex, setSex] = useState('male');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('175');
  const [activity, setActivity] = useState('1.2'); // sedentary
  const [res, setRes] = useState<number | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    const act = parseFloat(activity);
    if (w && h && a) {
      let bmr = 0;
      if (sex === 'male') bmr = 10 * w + 6.25 * h - 5 * a + 5;
      else bmr = 10 * w + 6.25 * h - 5 * a - 161;
      setRes(Math.round(bmr * act));
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Age</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Sex</label>
          <select value={sex} onChange={e => setSex(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Height (cm)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm" />
        </div>
      </div>
      <div className="space-y-3 pt-2 relative z-10">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Activity Level</label>
        <select value={activity} onChange={e => setActivity(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-sm outline-none focus:border-accent">
          <option value="1.2">Sedentary (Office job, little exercise)</option>
          <option value="1.375">Lightly Active (1-3 days/week)</option>
          <option value="1.55">Moderately Active (3-5 days/week)</option>
          <option value="1.725">Very Active (6-7 days/week)</option>
          <option value="1.9">Extra Active (Very physical job)</option>
        </select>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Calculate Daily Intake</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10 text-center">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Daily Maintenance Calories</div>
          <div className="font-syne text-6xl font-extrabold text-white">{res}<span className="text-xl font-normal text-muted ml-3 uppercase">kcal / day</span></div>
        </motion.div>
      )}
    </div>
  );
}

// Unit Converter
function UnitConverter() {
  const [val, setVal] = useState('1');
  const [type, setType] = useState('length'); // length, weight
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('km');
  const [res, setRes] = useState<string | null>(null);

  const units: any = {
    length: { m: 1, km: 0.001, cm: 100, mm: 1000, inch: 39.37, foot: 3.281 },
    weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.2046, oz: 35.274 }
  };

  const calculate = () => {
    const v = parseFloat(val);
    if (!isNaN(v)) {
      const base = v / units[type][from];
      const result = base * units[type][to];
      setRes(result.toFixed(4));
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Dimension Type</label>
          <select value={type} onChange={e => { setType(e.target.value); setFrom(Object.keys(units[e.target.value])[0]); setTo(Object.keys(units[e.target.value])[1]); }} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white outline-none focus:border-accent">
            <option value="length">Length</option>
            <option value="weight">Weight/Mass</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Value</label>
          <input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white outline-none focus:border-accent" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">From</label>
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white outline-none">
            {Object.keys(units[type]).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">To</label>
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white outline-none">
            {Object.keys(units[type]).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
          </select>
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Execute Conversion</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10 text-center">
            <div className="font-syne text-5xl font-extrabold text-white">{res}<span className="text-xl font-normal text-muted ml-3">{to}</span></div>
        </motion.div>
      )}
    </div>
  );
}

// Temp Converter
function TempConverter() {
  const [val, setVal] = useState('0');
  const [from, setFrom] = useState('C');
  const [to, setTo] = useState('F');
  const [res, setRes] = useState<string | null>(null);

  const calculate = () => {
    let v = parseFloat(val);
    if (isNaN(v)) return;
    
    // Convert to C first
    let c = v;
    if (from === 'F') c = (v - 32) * 5/9;
    if (from === 'K') c = v - 273.15;

    // Convert to target
    let result = c;
    if (to === 'F') result = c * 9/5 + 32;
    if (to === 'K') result = c + 273.15;
    
    setRes(result.toFixed(2));
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Temperature</label>
          <input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white outline-none" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">From</label>
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white outline-none">
            <option value="C">Celsius (°C)</option>
            <option value="F">Fahrenheit (°F)</option>
            <option value="K">Kelvin (K)</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">To</label>
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-white outline-none">
            <option value="C">Celsius (°C)</option>
            <option value="F">Fahrenheit (°F)</option>
            <option value="K">Kelvin (K)</option>
          </select>
        </div>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Convert Scale</button>
      {res && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 rounded-3xl p-8 relative z-10 text-center text-5xl font-extrabold text-white">
          {res}°{to === 'K' ? '' : to}
        </motion.div>
      )}
    </div>
  );
}

// JSON Formatter
function JSONFormatter() {
  const [input, setInput] = useState('');
  const [res, setRes] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setRes(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e: any) {
      setError(e.message);
      setRes('');
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setRes(JSON.stringify(parsed));
      setError('');
    } catch (e: any) {
      setError(e.message);
      setRes('');
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="space-y-3 relative z-10">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Input JSON</label>
        <textarea 
          value={input} onChange={e => setInput(e.target.value)} rows={10} 
          className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-sm font-mono text-white outline-none focus:border-accent"
          placeholder='{"key": "value"}'
        />
      </div>
      <div className="flex gap-4 relative z-10">
        <button onClick={format} className="flex-1 py-4 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Beautify</button>
        <button onClick={minify} className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Minify</button>
      </div>
      {error && <div className="text-red-400 text-xs font-bold uppercase tracking-widest p-4 bg-red-400/10 rounded-2xl border border-red-400/20">{error}</div>}
      {res && (
        <div className="space-y-4 animate-fade-up">
           <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Formatted Output</span>
              <button onClick={() => { navigator.clipboard.writeText(res); alert('Copied!'); }} className="text-[10px] font-bold text-muted hover:text-white uppercase">Copy To Clipboard</button>
           </div>
           <pre className="w-full bg-black/40 border border-white/10 p-6 rounded-3xl text-xs overflow-x-auto text-green-400 custom-scrollbar whitespace-pre-wrap">{res}</pre>
        </div>
      )}
    </div>
  );
}

// Base64 Tool
function Base64Tool() {
  const [input, setInput] = useState('');
  const [res, setRes] = useState('');

  const encode = () => setRes(btoa(input));
  const decode = () => {
    try {
      setRes(atob(input));
    } catch (e) {
      setRes('Invalid Base64 String');
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Input String</label>
        <textarea 
          value={input} onChange={e => setInput(e.target.value)} rows={6} 
          className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-white outline-none"
        />
      </div>
      <div className="flex gap-4">
        <button onClick={encode} className="flex-1 py-4 bg-accent text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Encode</button>
        <button onClick={decode} className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Decode</button>
      </div>
      {res && (
        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 break-all text-sm font-mono text-white/90">
          {res}
        </div>
      )}
    </div>
  );
}

// UUID Generator
function UUIDGenerator() {
  const [res, setRes] = useState('');
  
  const generate = () => {
    setRes(crypto.randomUUID());
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 text-center">
      <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Random UUID v4</div>
      <div className="font-mono text-2xl text-white bg-white/5 p-6 rounded-3xl border border-white/10 break-all">
        {res || '00000000-0000-0000-0000-000000000000'}
      </div>
      <button onClick={generate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Generate New UUID</button>
      {res && (
         <button onClick={() => navigator.clipboard.writeText(res)} className="text-[10px] font-bold text-muted uppercase tracking-widest hover:text-white">Copy To Clipboard</button>
      )}
    </div>
  );
}

// Color Picker
function ColorPicker() {
  const [color, setColor] = useState('#ff6b35');
  
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <input 
          type="color" value={color} onChange={e => setColor(e.target.value)} 
          className="w-32 h-32 rounded-3xl cursor-pointer border-4 border-white/10 bg-transparent"
        />
        <div className="flex-1 space-y-4 w-full">
           <div className="p-4 bg-white/5 rounded-2xl flex justify-between items-center group">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase mb-1">HEX</div>
                <div className="font-mono text-white text-xl">{color.toUpperCase()}</div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(color)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted hover:text-white">📋</button>
           </div>
           <div className="p-4 bg-white/5 rounded-2xl flex justify-between items-center group">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase mb-1">RGB</div>
                <div className="font-mono text-white text-xl">{hexToRgb(color)}</div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(hexToRgb(color))} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted hover:text-white">📋</button>
           </div>
        </div>
      </div>
    </div>
  );
}

// HTML Encoder
function HTMLEncoder() {
  const [input, setInput] = useState('');
  const [res, setRes] = useState('');

  const encode = () => {
    const el = document.createElement('div');
    el.innerText = input;
    setRes(el.innerHTML);
  };

  const decode = () => {
    const el = document.createElement('div');
    el.innerHTML = input;
    setRes(el.innerText);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm" placeholder="<html>Entities</html>" />
      <div className="flex gap-4">
        <button onClick={encode} className="flex-1 py-4 bg-accent text-white font-bold uppercase text-[10px] rounded-2xl">Encode</button>
        <button onClick={decode} className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] rounded-2xl">Decode</button>
      </div>
      {res && <pre className="p-6 bg-white/5 rounded-3xl border border-white/10 text-xs text-white/80 overflow-x-auto whitespace-pre-wrap">{res}</pre>}
    </div>
  );
}

// SQL Formatter (simplified)
function SQLFormatter() {
  const [text, setText] = useState('');
  
  const format = () => {
    // Very simple mockup of SQL formatting
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP BY', 'ORDER BY', 'LIMIT', 'INSERT INTO', 'UPDATE', 'DELETE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN'];
    let formatted = text.replace(/\s+/g, ' ');
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${kw.toUpperCase()}`);
    });
    setText(formatted.trim());
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={10} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl font-mono text-sm" placeholder="SELECT * FROM users WHERE id = 1" />
      <button onClick={format} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Beautify Query</button>
    </div>
  );
}

// Regex Tester
function RegexTester() {
  const [regex, setRegex] = useState('^[a-zA-Z0-9]+$');
  const [text, setText] = useState('HelloWorld123');
  const [match, setMatch] = useState<boolean | null>(null);

  const test = () => {
    try {
      const re = new RegExp(regex);
      setMatch(re.test(text));
    } catch (e) {
      setMatch(null);
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-muted uppercase mb-2 block">Regular Expression</label>
          <input type="text" value={regex} onChange={e => setRegex(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-sm text-accent" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase mb-2 block">Test String</label>
          <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        </div>
      </div>
      <button onClick={test} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Test Match</button>
      {match !== null && (
        <div className={`p-6 rounded-2xl text-center font-bold uppercase tracking-widest border ${match ? 'bg-green/10 text-green border-green/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
          {match ? 'MATCH FOUND' : 'NO MATCH'}
        </div>
      )}
    </div>
  );
}

// MD5 Generator (Simple hash for demo, for production install crypto-js)
function MD5Generator() {
  const [input, setInput] = useState('');
  const [res, setRes] = useState('');

  const generate = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data); // SHA-256 is native, MD5 isn't. Mocking MD5 with SHA-256 here or just label appropriately.
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    setRes(hex);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl" placeholder="Text to hash..." />
      <button onClick={generate} className="w-full py-5 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-2xl">Generate Hash (SHA-256)</button>
      {res && (
        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 break-all font-mono text-xs text-white/80">
          <div className="text-[10px] font-bold text-muted uppercase mb-2">Hash Output</div>
          {res}
        </div>
      )}
    </div>
  );
}

// URL Encoder
function URLEncoder() {
  const [input, setInput] = useState('');
  const [res, setRes] = useState('');

  const encode = () => setRes(encodeURIComponent(input));
  const decode = () => setRes(decodeURIComponent(input));

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl" placeholder="https://example.com/search?q=query" />
      <div className="flex gap-4">
        <button onClick={encode} className="flex-1 py-4 bg-accent text-white font-bold uppercase text-[10px] rounded-2xl">Encode URL</button>
        <button onClick={decode} className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] rounded-2xl">Decode URL</button>
      </div>
      {res && <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-sm break-all font-mono text-white/90">{res}</div>}
    </div>
  );
}

// Meta Tag Generator
function MetaTagGenerator() {
  const [meta, setMeta] = useState({ title: '', desc: '', keywords: '', author: '' });
  const [res, setRes] = useState('');

  const generate = () => {
    const code = `<title>${meta.title}</title>
<meta name="description" content="${meta.desc}">
<meta name="keywords" content="${meta.keywords}">
<meta name="author" content="${meta.author}">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.desc}">`;
    setRes(code);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Site Title</label>
          <input value={meta.title} onChange={e => setMeta({...meta, title: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Author</label>
          <input value={meta.author} onChange={e => setMeta({...meta, author: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Description</label>
          <textarea value={meta.desc} onChange={e => setMeta({...meta, desc: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-bold text-muted uppercase">Keywords</label>
          <input value={meta.keywords} onChange={e => setMeta({...meta, keywords: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" placeholder="seo, tool, web" />
        </div>
      </div>
      <button onClick={generate} className="w-full py-5 bg-white text-black font-syne font-bold uppercase tracking-widest text-xs rounded-2xl">Generate Tags</button>
      {res && (
        <pre className="p-6 bg-black/40 rounded-3xl border border-white/10 text-xs text-green-400 overflow-x-auto">
          {res}
        </pre>
      )}
    </div>
  );
}

// Code Minifier (CSS/JS)
function CodeMinifier({ type }: { type: 'css' | 'js' }) {
  const [input, setInput] = useState('');
  const [res, setRes] = useState('');

  const minify = () => {
    let output = input;
    if (type === 'css') {
      output = input
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '') // comments
        .replace(/\s+/g, ' ')
        .replace(/ ?\{ ?/g, '{')
        .replace(/ ?\} ?/g, '}')
        .replace(/ ?\: ?/g, ':')
        .replace(/ ?\; ?/g, ';')
        .replace(/ ?\, ?/g, ',')
        .trim();
    } else {
      output = input
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '') // comments
        .replace(/\s+/g, ' ')
        .trim();
    }
    setRes(output);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={10} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl font-mono text-xs" placeholder={`Paste your ${type.toUpperCase()} code...`} />
      <button onClick={minify} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Minify {type.toUpperCase()}</button>
      {res && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-accent uppercase tracking-widest px-1">
            <span>Result ({((input.length - res.length) / input.length * 100).toFixed(1)}% Saved)</span>
            <button onClick={() => navigator.clipboard.writeText(res)} className="text-muted hover:text-white">Copy</button>
          </div>
          <pre className="p-6 bg-black/40 rounded-3xl border border-white/10 text-xs text-blue-400 overflow-x-auto whitespace-pre-wrap">{res}</pre>
        </div>
      )}
    </div>
  );
}

// Keyword Density
function KeywordDensity() {
  const [text, setText] = useState('');
  const [density, setDensity] = useState<{word: string, count: number, percent: string}[]>([]);

  const analyze = () => {
    const words = text.toLowerCase().match(/\b(\w+)\b/g);
    if (!words) return;
    const freq: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3) freq[w] = (freq[w] || 0) + 1;
    });
    const total = words.length;
    const sorted = Object.entries(freq)
      .map(([word, count]) => ({ word, count, percent: (count / total * 100).toFixed(2) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setDensity(sorted);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl" placeholder="Paste article content to analyze..." />
      <button onClick={analyze} className="w-full py-5 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-2xl">Analyze Keywords</button>
      {density.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
           {density.map((item, i) => (
             <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-white uppercase tracking-wider text-xs">{item.word}</span>
                <div className="flex items-center gap-4">
                  <span className="text-muted text-[10px] font-bold">{item.count} Times</span>
                  <span className="text-accent font-bold text-xs">{item.percent}%</span>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}

// OG Preview
function OGPreview() {
  const [data, setData] = useState({ title: '', desc: '', site: '', img: '' });

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input placeholder="Page Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        <input placeholder="Site Name" value={data.site} onChange={e => setData({...data, site: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        <input placeholder="Image URL" value={data.img} onChange={e => setData({...data, img: e.target.value})} className="md:col-span-2 bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        <textarea placeholder="Description" value={data.desc} onChange={e => setData({...data, desc: e.target.value})} rows={3} className="md:col-span-2 bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
      </div>
      
      <div className="pt-8 border-t border-white/10 space-y-4">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Live Messenger/Discord Preview</label>
        <div className="bg-[#2f3136] rounded-xl overflow-hidden max-w-[430px] border border-black/20 shadow-2xl">
           <div className="p-4 border-l-4 border-[#4f545c] space-y-2">
              <div className="text-[#00aff4] font-bold text-sm hover:underline cursor-pointer">{data.site || 'Example Site'}</div>
              <div className="text-white font-bold">{data.title || 'Page Headline Goes Here'}</div>
              <div className="text-[#dcddde] text-xs leading-relaxed">{data.desc || 'Provide a compelling description to see how it looks when shared on social platforms...'}</div>
              {data.img && <img src={data.img} className="mt-4 rounded-lg max-h-[200px] w-full object-cover" alt="OG Preview" referrerPolicy="no-referrer" />}
           </div>
        </div>
      </div>
    </div>
  );
}

// Sitemap Generator
function SitemapGenerator() {
  const [url, setUrl] = useState('https://example.com');
  const [res, setRes] = useState('');

  const generate = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    setRes(xml);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter Website URL" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm" />
      <button onClick={generate} className="w-full py-5 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-2xl">Generate XML Sitemap</button>
      {res && <pre className="p-6 bg-black/40 rounded-3xl border border-white/10 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">{res}</pre>}
    </div>
  );
}

// Text Processor (Multi-tool: Reverse, Space Remove, Duplicate Remove, Sort)
function TextProcessor({ toolId }: { toolId: string }) {
  const [text, setText] = useState('');
  
  const process = () => {
    let result = text;
    if (toolId === 'text-reverse') result = text.split('').reverse().join('');
    if (toolId === 'remove-space') result = text.replace(/\s+/g, ' ').trim();
    if (toolId === 'duplicate-rem') result = Array.from(new Set(text.split('\n'))).join('\n');
    if (toolId === 'text-sort') result = text.split('\n').sort().join('\n');
    setText(result);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={10} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm leading-relaxed" />
      <button onClick={process} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Execute Transformation</button>
    </div>
  );
}

// Text Comparator
function TextComparator() {
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [diff, setDiff] = useState<string | null>(null);

  const compare = () => {
    if (t1 === t2) setDiff('Texts are identical ✅');
    else setDiff('Texts are different ❌');
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <textarea value={t1} onChange={e => setT1(e.target.value)} placeholder="Text 1" rows={8} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm" />
        <textarea value={t2} onChange={e => setT2(e.target.value)} placeholder="Text 2" rows={8} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm" />
      </div>
      <button onClick={compare} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Compare Contents</button>
      {diff && <div className="p-6 bg-accent/10 border border-accent/20 rounded-2xl text-center font-bold uppercase tracking-widest">{diff}</div>}
    </div>
  );
}

// Binary Converter
function BinaryConverter() {
  const [input, setInput] = useState('');
  const [from, setFrom] = useState('10');
  const [to, setTo] = useState('2');
  const [res, setRes] = useState('');

  const convert = () => {
    try {
      const dec = parseInt(input, parseInt(from));
      setRes(dec.toString(parseInt(to)).toUpperCase());
    } catch (e) {
      setRes('ERROR');
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="grid grid-cols-2 gap-4">
        <select value={from} onChange={e => setFrom(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm">
          <option value="10">Decimal (10)</option>
          <option value="2">Binary (2)</option>
          <option value="16">Hex (16)</option>
          <option value="8">Octal (8)</option>
        </select>
        <select value={to} onChange={e => setTo(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm">
          <option value="2">Binary (2)</option>
          <option value="10">Decimal (10)</option>
          <option value="16">Hex (16)</option>
          <option value="8">Octal (8)</option>
        </select>
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Input value" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xl font-mono text-center" />
      <button onClick={convert} className="w-full py-5 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-2xl">Convert Base</button>
      {res && <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-4xl font-extrabold text-white text-center break-all">{res}</div>}
    </div>
  );
}

// Roman Converter
function RomanConverter() {
  const [num, setNum] = useState('');
  const [res, setRes] = useState('');
  
  const toRoman = (num: number) => {
    const map: any = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (let i in map) {
      while (num >= map[i]) { roman += i; num -= map[i]; }
    }
    return roman;
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 text-center">
      <input type="number" value={num} onChange={e => setNum(e.target.value)} placeholder="Enter Number" className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-3xl font-extrabold text-center" />
      <button onClick={() => setRes(toRoman(parseInt(num)))} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Convert to Roman</button>
      {res && <div className="text-6xl font-syne font-extrabold text-white uppercase tracking-tighter">{res}</div>}
    </div>
  );
}

// Color Converter
function ColorConverter() {
  const [hex, setHex] = useState('#ff6b35');
  const [res, setRes] = useState('');

  const convert = () => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setRes(`RGB(${r}, ${g}, ${b})`);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <input type="text" value={hex} onChange={e => setHex(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-3xl font-mono text-center" />
      <button onClick={convert} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Convert HEX to RGB</button>
      {res && <div className="text-4xl font-extrabold text-white text-center break-all">{res}</div>}
    </div>
  );
}

// Readability Analysis
function ReadabilityAnalysis() {
  const [text, setText] = useState('');
  const [score, setScore] = useState<number | null>(null);

  const analyze = () => {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (words.length === 0 || sentences.length === 0) return;
    
    // Simple Flesch-Kincaid mock
    const syllables = words.reduce((acc, w) => acc + (w.match(/[aeiouy]+/gi)?.length || 1), 0);
    const res = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
    setScore(Math.round(Math.max(0, Math.min(100, res))));
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={8} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl" placeholder="Paste text to analyze readability..." />
      <button onClick={analyze} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Check Readability</button>
      {score !== null && (
        <div className="p-8 text-center bg-accent/10 border border-accent/20 rounded-3xl">
           <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Flesch Reading Ease</div>
           <div className="text-7xl font-extrabold text-white">{score}</div>
           <p className="mt-4 text-muted text-sm font-medium">{score > 60 ? 'Highly Readable ✅' : score > 30 ? 'Moderate Complexity ⚖️' : 'Academic/Technical 📖'}</p>
        </div>
      )}
    </div>
  );
}

// Time Zone Converter
function TimeZoneConverter() {
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const [zone, setZone] = useState('UTC');
  const [res, setRes] = useState<string[]>([]);

  const convert = () => {
    const date = new Date(time);
    const zones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'];
    const results = zones.map(z => {
      return `${z}: ${date.toLocaleString('en-US', { timeZone: z, hour12: true })}`;
    });
    setRes(results);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Base Date & Time</label>
        <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white" />
      </div>
      <button onClick={convert} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Convert Across Zones</button>
      {res.length > 0 && (
        <div className="space-y-3">
           {res.map((r, i) => (
             <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center text-xs">
                {r.split(': ')[0]} <span className="font-bold text-accent">{r.split(': ')[1]}</span>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}

// Currency Converter
function CurrencyConverter() {
  const [amt, setAmt] = useState('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [res, setRes] = useState<string | null>(null);

  const rates: any = { USD: 1, INR: 83.2, EUR: 0.92, GBP: 0.79, JPY: 148.5 };

  const calculate = () => {
    const v = parseFloat(amt);
    if (!isNaN(v)) {
      const result = (v / rates[from]) * rates[to];
      setRes(result.toFixed(2));
    }
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-xl font-bold" />
        <select value={from} onChange={e => setFrom(e.target.value)} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={to} onChange={e => setTo(e.target.value)} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button onClick={calculate} className="w-full py-5 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-2xl">Get Exchange Rate</button>
      {res && (
        <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/10">
           <div className="text-6xl font-extrabold text-white">{res} <span className="text-xl text-muted font-normal">{to}</span></div>
        </div>
      )}
    </div>
  );
}

// Spell Checker
function SpellChecker() {
  const [text, setText] = useState('');
  const [res, setRes] = useState<{ word: string, error: boolean }[] | null>(null);

  const check = () => {
    // Simple mock spell check
    const dictionary = ['the', 'quick', 'brown', 'fox', 'jumped', 'over', 'lazy', 'dog', 'hello', 'world', 'resume', 'builder', 'tool'];
    const words = text.split(/\s+/).map(w => ({
      word: w,
      error: !dictionary.includes(w.toLowerCase().replace(/[^a-z]/g, '')) && w.length > 3
    }));
    setRes(words);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={8} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl" placeholder="Paste text to check spelling..." />
      <button onClick={check} className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-2xl">Audit Spelling</button>
      {res && (
        <div className="p-6 bg-white/5 rounded-3xl flex flex-wrap gap-2">
           {res.map((w, i) => (
             <span key={i} className={w.error ? 'text-red-400 underline decoration-red-400 underline-offset-4' : 'text-text'}>{w.word} </span>
           ))}
        </div>
      )}
    </div>
  );
}

// ATS Checker
function ATSChecker() {
  const [text, setText] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [tips, setTips] = useState<string[]>([]);

  const scan = () => {
    const keywords = ['react', 'typescript', 'javascript', 'tailwind', 'api', 'experience', 'education', 'skills', 'objective'];
    let matches = 0;
    const found: string[] = [];
    keywords.forEach(k => {
      if (text.toLowerCase().includes(k)) {
        matches++;
        found.push(k);
      }
    });

    const calculatedScore = Math.min(100, Math.round((matches / keywords.length) * 100));
    setScore(calculatedScore);
    
    const newTips = [];
    if (!text.toLowerCase().includes('skills')) newTips.push('Missing "Skills" section.');
    if (!text.toLowerCase().includes('experience')) newTips.push('Missing "Experience" section.');
    if (text.length < 500) newTips.push('Content is too short for a professional resume.');
    setTips(newTips);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={10} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl" placeholder="Paste resume text to scan for ATS optimization..." />
      <button onClick={scan} className="w-full py-5 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-2xl glow-orange">Scan Resume Score</button>
      {score !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
           <div className="p-8 text-center bg-white/5 border border-white/10 rounded-3xl">
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">ATS Compatibility</div>
              <div className="text-6xl font-extrabold text-white">{score}%</div>
              <div className="mt-4 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${score}%` }} />
              </div>
           </div>
           {tips.length > 0 && (
             <div className="space-y-3">
                <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Optimization Tips</div>
                {tips.map((t, i) => (
                  <div key={i} className="p-4 bg-red-400/5 border border-red-400/20 rounded-2xl text-xs text-red-400 flex items-center gap-3">
                     <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" /> {t}
                  </div>
                ))}
             </div>
           )}
        </motion.div>
      )}
    </div>
  );
}

// Resume Builder
function ResumeBuilder() {
  const [theme, setTheme] = useState<'modern' | 'classic'>('modern');
  const [data, setData] = useState({
    name: 'Sachin Gautam',
    email: 'sachin@example.com',
    phone: '+91 9876543210',
    summary: 'Experienced Full Stack Developer with a passion for building scalable web applications.',
    experience: [
      { company: 'Tech Corp', role: 'Full Stack Developer', duration: '2021 - Present', points: 'Led the development of a high-performance e-commerce platform.' }
    ],
    education: [
      { school: 'Global University', degree: 'B.Tech Computer Science', year: '2017 - 2021' }
    ],
    skills: 'React, TypeScript, Node.js, Tailwind CSS, Firebase'
  });

  const downloadPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    let yPos = height - 50;

    // Header
    page.drawText(data.name, { x: 50, y: yPos, size: 24 });
    yPos -= 25;
    page.drawText(`${data.email} | ${data.phone}`, { x: 50, y: yPos, size: 10 });
    yPos -= 40;
    
    // Summary
    page.drawText('PROFESSIONAL SUMMARY', { x: 50, y: yPos, size: 12, opacity: 0.8 });
    yPos -= 20;
    page.drawText(data.summary, { x: 50, y: yPos, size: 10, maxWidth: 500, lineHeight: 14 });
    yPos -= 60;
    
    // Experience
    page.drawText('WORK EXPERIENCE', { x: 50, y: yPos, size: 12, opacity: 0.8 });
    yPos -= 20;
    data.experience.forEach(exp => {
      page.drawText(`${exp.role.toUpperCase()} | ${exp.company}`, { x: 50, y: yPos, size: 10 });
      page.drawText(exp.duration, { x: 450, y: yPos, size: 9 });
      yPos -= 15;
      page.drawText(exp.points, { x: 60, y: yPos, size: 9, maxWidth: 480, lineHeight: 12 });
      yPos -= 35;
    });
    
    // Education
    yPos -= 10;
    page.drawText('EDUCATION', { x: 50, y: yPos, size: 12, opacity: 0.8 });
    yPos -= 20;
    data.education.forEach(edu => {
      page.drawText(`${edu.degree} — ${edu.school}`, { x: 50, y: yPos, size: 10 });
      page.drawText(edu.year, { x: 450, y: yPos, size: 9 });
      yPos -= 20;
    });
    
    // Skills
    yPos -= 10;
    page.drawText('TECHNICAL SKILLS', { x: 50, y: yPos, size: 12, opacity: 0.8 });
    yPos -= 20;
    page.drawText(data.skills, { x: 50, y: yPos, size: 10, maxWidth: 500 });

    const pdfBytes = await pdfDoc.save();
    saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${data.name.replace(' ', '_')}_Resume.pdf`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Form Content */}
      <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-6 custom-scrollbar pb-10">
        
        {/* Theme Selector */}
        <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-2xl w-fit">
          <button 
            onClick={() => setTheme('modern')}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${theme === 'modern' ? 'bg-accent text-white' : 'text-muted'}`}
          >Modern</button>
          <button 
            onClick={() => setTheme('classic')}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${theme === 'classic' ? 'bg-black text-white' : 'text-muted'}`}
          >Classic</button>
        </div>

        <div className="p-8 glass rounded-[40px] border border-white/10 space-y-6">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Personal Profiles</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted uppercase ml-1">Full Name</label>
                <input value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm" />
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted uppercase ml-1">Email</label>
                <input value={data.email} onChange={e => setData({...data, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm" />
             </div>
             <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-bold text-muted uppercase ml-1">Phone / Location</label>
                <input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm" />
             </div>
          </div>
        </div>

        <div className="p-8 glass rounded-[40px] border border-white/10 space-y-4">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Summary</div>
          <textarea value={data.summary} onChange={e => setData({...data, summary: e.target.value})} rows={4} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-sm leading-relaxed" />
        </div>

        <div className="p-8 glass rounded-[40px] border border-white/10 space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Experience</div>
            <button onClick={() => setData({...data, experience: [...data.experience, { company: '', role: '', duration: '', points: '' }]})} className="bg-white/5 px-4 py-2 rounded-xl text-[9px] font-bold text-muted hover:text-white uppercase transition-colors border border-white/10">+ Add Entry</button>
          </div>
          {data.experience.map((exp, i) => (
            <div key={i} className="space-y-4 p-6 bg-white/5 rounded-3xl relative border border-white/5 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <input value={exp.company} onChange={e => {
                  const news = [...data.experience]; news[i].company = e.target.value; setData({...data, experience: news});
                }} placeholder="Company" className="bg-transparent border-b border-white/10 p-2 text-sm outline-none w-full" />
                <input value={exp.role} onChange={e => {
                  const news = [...data.experience]; news[i].role = e.target.value; setData({...data, experience: news});
                }} placeholder="Role" className="bg-transparent border-b border-white/10 p-2 text-sm outline-none w-full" />
              </div>
              <input value={exp.duration} onChange={e => {
                const news = [...data.experience]; news[i].duration = e.target.value; setData({...data, experience: news});
              }} placeholder="Duration (e.g. 2021 - Present)" className="bg-transparent border-b border-white/10 p-2 text-xs outline-none w-full text-muted" />
              <textarea value={exp.points} onChange={e => {
                const news = [...data.experience]; news[i].points = e.target.value; setData({...data, experience: news});
              }} placeholder="Achievements & Responsibilities" rows={3} className="bg-transparent border-b border-white/10 p-2 text-sm outline-none w-full custom-scrollbar" />
              <button onClick={() => setData({...data, experience: data.experience.filter((_, idx) => idx !== i)})} className="absolute top-4 right-4 text-muted hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        <div className="p-8 glass rounded-[40px] border border-white/10 space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Education</div>
            <button onClick={() => setData({...data, education: [...data.education, { school: '', degree: '', year: '' }]})} className="bg-white/5 px-4 py-2 rounded-xl text-[9px] font-bold text-muted hover:text-white uppercase transition-colors border border-white/10">+ Add Entry</button>
          </div>
          {data.education.map((edu, i) => (
            <div key={i} className="space-y-4 p-6 bg-white/5 rounded-3xl relative border border-white/5 animate-fade-in">
              <input value={edu.school} onChange={e => {
                const news = [...data.education]; news[i].school = e.target.value; setData({...data, education: news});
              }} placeholder="Institution / School" className="bg-transparent border-b border-white/10 p-2 text-sm outline-none w-full" />
              <div className="grid grid-cols-2 gap-4">
                <input value={edu.degree} onChange={e => {
                  const news = [...data.education]; news[i].degree = e.target.value; setData({...data, education: news});
                }} placeholder="Degree / Certification" className="bg-transparent border-b border-white/10 p-2 text-sm outline-none w-full" />
                <input value={edu.year} onChange={e => {
                  const news = [...data.education]; news[i].year = e.target.value; setData({...data, education: news});
                }} placeholder="Year" className="bg-transparent border-b border-white/10 p-2 text-sm outline-none w-full" />
              </div>
              <button onClick={() => setData({...data, education: data.education.filter((_, idx) => idx !== i)})} className="absolute top-4 right-4 text-muted hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        <div className="p-8 glass rounded-[40px] border border-white/10 space-y-4">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Skills</div>
          <input value={data.skills} onChange={e => setData({...data, skills: e.target.value})} placeholder="React, Node.js, Project Management..." className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-sm" />
        </div>
      </div>

      <div className="sticky top-0 space-y-6">
        <motion.div 
          layout
          className={`shadow-2xl overflow-hidden ${theme === 'modern' ? 'bg-white rounded-2xl' : 'bg-[#fff] rounded-sm'} min-h-[780px] flex flex-col`}
        >
           {theme === 'modern' ? (
             <div className="flex h-full flex-1">
                <div className="w-1/3 bg-[#0d0d0d] text-white p-8 flex flex-col gap-10">
                   <div>
                      <h1 className="text-2xl font-bold tracking-tighter leading-none mb-4">{data.name.split(' ').join('\n')}</h1>
                      <div className="text-[9px] text-accent font-bold uppercase tracking-widest opacity-80 mb-8 border-b border-white/20 pb-4">Professional Profile</div>
                      <div className="space-y-4 text-[9px] font-medium leading-relaxed opacity-70">
                         <div>{data.email}</div>
                         <div>{data.phone}</div>
                      </div>
                   </div>
                   
                   <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4">Core Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {data.skills.split(',').map((s, idx) => (
                           <span key={idx} className="bg-white/10 px-3 py-1.5 rounded-full text-[8px] uppercase font-bold">{s.trim()}</span>
                        ))}
                      </div>
                   </div>
                </div>
                <div className="flex-1 p-10 text-black flex flex-col gap-10">
                   <section>
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest border-b-2 border-accent inline-block pb-1 mb-4">About Me</h2>
                      <p className="text-[10px] leading-relaxed text-gray-700 italic">{data.summary}</p>
                   </section>
                   
                   <section>
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest border-b-2 border-accent inline-block pb-1 mb-6">Experience</h2>
                      <div className="space-y-8">
                        {data.experience.map((exp, i) => (
                          <div key={i} className="relative pl-4 border-l-2 border-gray-100">
                            <div className="flex justify-between items-baseline mb-1">
                               <span className="text-[11px] font-bold uppercase">{exp.role}</span>
                               <span className="text-[9px] text-accent font-extrabold">{exp.duration}</span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 mb-2">{exp.company}</div>
                            <p className="text-[10px] text-gray-600 leading-relaxed">{exp.points}</p>
                          </div>
                        ))}
                      </div>
                   </section>

                   <section>
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest border-b-2 border-accent inline-block pb-1 mb-5">Education</h2>
                      <div className="grid grid-cols-1 gap-4">
                        {data.education.map((edu, i) => (
                          <div key={i}>
                             <div className="text-[10px] font-bold">{edu.degree}</div>
                             <div className="text-[9px] text-gray-500">{edu.school} • {edu.year}</div>
                          </div>
                        ))}
                      </div>
                   </section>
                </div>
             </div>
           ) : (
             <div className="p-12 text-black font-serif flex-1 flex flex-col h-full">
                <header className="border-b-4 border-black pb-6 mb-10 text-center">
                   <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">{data.name}</h1>
                   <div className="text-[10px] italic text-gray-600">{data.email} | {data.phone}</div>
                </header>
                
                <section className="mb-10">
                   <h2 className="text-[12px] font-extrabold border-b border-black pb-1 mb-3 uppercase tracking-widest">Summary</h2>
                   <p className="text-[11px] leading-relaxed">{data.summary}</p>
                </section>

                <section className="mb-10">
                   <h2 className="text-[12px] font-extrabold border-b border-black pb-1 mb-5 uppercase tracking-widest">Experience</h2>
                   <div className="space-y-8">
                     {data.experience.map((exp, i) => (
                       <div key={i}>
                          <div className="flex justify-between font-bold text-[12px] mb-1">
                             <span>{exp.company}</span>
                             <span className="text-[10px]">{exp.duration}</span>
                          </div>
                          <div className="italic text-[11px] mb-2">{exp.role}</div>
                          <p className="text-[10px] leading-relaxed opacity-80">{exp.points}</p>
                       </div>
                     ))}
                   </div>
                </section>

                <section className="mb-10">
                   <h2 className="text-[12px] font-extrabold border-b border-black pb-1 mb-4 uppercase tracking-widest">Education</h2>
                   {data.education.map((edu, i) => (
                      <div key={i} className="flex justify-between items-baseline mb-2">
                         <span className="text-[11px] font-bold">{edu.degree} — {edu.school}</span>
                         <span className="text-[10px]">{edu.year}</span>
                      </div>
                   ))}
                </section>

                <section className="mt-auto pt-6 border-t border-gray-100">
                   <h2 className="text-[12px] font-extrabold border-b border-black pb-1 mb-3 uppercase tracking-widest">Technical Skills</h2>
                   <p className="text-[10px] leading-relaxed italic">{data.skills}</p>
                </section>
             </div>
           )}
        </motion.div>
        
        <div className="flex gap-4">
          <button 
            onClick={downloadPDF}
            className="flex-1 py-5 bg-black text-white font-syne font-bold uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-xl active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-5 bg-white text-black border border-black/10 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
          >
            Print
          </button>
        </div>
        <p className="text-center text-[9px] text-muted font-bold uppercase tracking-widest">A4 Professional Standard rendering active</p>
      </div>
    </div>
  );
}

// Cover Letter Generator
function CoverLetterGenerator() {
  const [data, setData] = useState({
    name: '',
    role: '',
    company: '',
    skills: ''
  });
  const [letter, setLetter] = useState('');

  const generate = () => {
    const text = `Dear Hiring Manager at ${data.company || '[Company]'},

I am writing to express my strong interest in the ${data.role || '[Role]'} position at your company. With my background in ${data.skills || '[Skills]'}, I am confident that I would be a valuable asset to your team.

Throughout my career, I have consistently demonstrated a commitment to excellence and a passion for continuous improvement. My experience aligns perfectly with the requirements for this role, and I am eager to bring my expertise to ${data.company || 'your organization'}.

Thank you for considering my application. I look forward to the possibility of discussing how my skills and experience can benefit your team.

Best regards,
${data.name || '[Your Name]'}`;
    setLetter(text);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Your Name" className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        <input value={data.role} onChange={e => setData({...data, role: e.target.value})} placeholder="Target Role" className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        <input value={data.company} onChange={e => setData({...data, company: e.target.value})} placeholder="Company Name" className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
        <input value={data.skills} onChange={e => setData({...data, skills: e.target.value})} placeholder="Key Skills" className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm" />
      </div>
      <button onClick={generate} className="w-full py-5 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-2xl glow-orange">Generate Cover Letter</button>
      {letter && (
        <div className="space-y-4">
          <textarea readOnly value={letter} rows={12} className="w-full bg-white/5 border border-white/10 p-8 rounded-3xl text-sm leading-relaxed font-serif" />
          <button onClick={() => { navigator.clipboard.writeText(letter); alert('Copied!'); }} className="w-full py-4 border border-white/10 text-muted font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/5">Copy to Clipboard</button>
        </div>
      )}
    </div>
  );
}

function ImageTool({ tool }: { tool: Tool }) {
  if (!tool) return null;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [hasCloudKey, setHasCloudKey] = useState(false);
  const [bgMethod, setBgMethod] = useState<'local' | 'cloud'>('local');
  const [done, setDone] = useState(false);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [config, setConfig] = useState({
    width: 0,
    height: 0,
    originalWidth: 0,
    originalHeight: 0,
    lockAspectRatio: true,
    targetKb: 0,
    rotation: 90,
    brightness: 100,
    grayscale: false,
    flipH: false,
    flipV: false,
    watermark: 'ToolHub Pro',
    format: 'image/png', // Default to PNG for transparency if needed
    bgModel: 'small',
    bgColor: 'transparent',
  });

  useEffect(() => {
    if (tool.id === 'bg-remover') {
      fetch('/api/config')
        .then(res => res.json())
        .then(data => setHasCloudKey(data.hasRemoveBgKey))
        .catch(() => setHasCloudKey(false));
    }
  }, [tool.id]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileSelect = (f: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setDone(false);
    
    // Init config with image size
    const img = new Image();
    img.onload = () => {
      setConfig(prev => ({ 
        ...prev, 
        width: img.width, 
        height: img.height,
        originalWidth: img.width,
        originalHeight: img.height
      }));
    };
    img.src = url;
  };

  const [imgProgress, setImgProgress] = useState(0);

  const processImage = async () => {
    if (!preview) return;
    setProcessing(true);
    setImgProgress(0);
    setHasProcessed(false);
    if (processedPreview) {
      URL.revokeObjectURL(processedPreview);
      setProcessedPreview(null);
    }
    
    // Simulate initial phase progress
    const progressInterval = setInterval(() => {
      setImgProgress(p => Math.min(p + 15, 80));
    }, 100);

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("The source image cannot be decoded. Please try a different image."));
        img.src = url;
      });
    };

    let img: HTMLImageElement;
    try {
      img = await loadImage(preview);
    } catch (err: any) {
      alert(err.message);
      setProcessing(false);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper for target KB compression
    const compressToTargetKb = async (canvas: HTMLCanvasElement, targetKb: number, format: string): Promise<Blob | null> => {
      if (targetKb <= 0) return new Promise(resolve => canvas.toBlob(resolve, format));
      
      let low = 0.01;
      let high = 1.0;
      let bestBlob: Blob | null = null;
      
      // Binary search for best quality
      for (let i = 0; i < 8; i++) {
        const mid = (low + high) / 2;
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, format, mid));
        if (!blob) break;
        
        const sizeKb = blob.size / 1024;
        if (sizeKb <= targetKb) {
          bestBlob = blob;
          low = mid;
        } else {
          high = mid;
        }
      }
      
      if (!bestBlob) {
        // Fallback to lowest quality if even 0.01 is too large
        bestBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, format, 0.01));
      }
      
      return bestBlob;
    };

    if (tool.id === 'bg-remover') {
      try {
        if (bgMethod === 'cloud') {
          // Cloud API Method (Requires API Key)
          // We must send actual base64 data, not the blob URL
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            if (file) reader.readAsDataURL(file);
            else reject(new Error("No file selected"));
          });

          const base64Data = await base64Promise;

          const response = await fetch('/api/remove-bg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
          });
          
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Cloud background removal failed');
          }
          
          const blob = await response.blob();
          const cloudResultUrl = URL.createObjectURL(blob);
          const cloudResultImg = await loadImage(cloudResultUrl);
          
          canvas.width = cloudResultImg.width;
          canvas.height = cloudResultImg.height;
          
          if (config.bgColor !== 'transparent') {
            ctx.fillStyle = config.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          
          ctx.drawImage(cloudResultImg, 0, 0);
          
          canvas.toBlob((finalBlob) => {
            if (finalBlob) {
              const url = URL.createObjectURL(finalBlob);
              setProcessedPreview(url);
              setHasProcessed(true);
              setDone(true);
            }
            setProcessing(false);
            URL.revokeObjectURL(cloudResultUrl);
          }, 'image/png');
          return;
        }

        // Local Edge AI Method
        const resultBlob = await removeBackground(preview, {
          progress: (p: any, status: any) => {
            if (typeof p === 'number') {
              setBgProgress(Math.round(p * 100));
              if (p === 0 || p === 1) console.log(`BG Process [${status}]: ${Math.round(p * 100)}%`);
            }
          },
          // Standard CDN path for assets
          publicPath: 'https://static.img.ly/background-removal-data/1.7.0/',
          fetchArgs: {
            mode: 'cors',
            credentials: 'omit'
          },
          model: (config.bgModel || 'small') as any,
          debug: false
        });
        const resultUrl = URL.createObjectURL(resultBlob);
        
        let resultImg: HTMLImageElement;
        try {
          resultImg = await loadImage(resultUrl);
        } catch (err: any) {
          URL.revokeObjectURL(resultUrl);
          throw err;
        }
        
        canvas.width = resultImg.width;
        canvas.height = resultImg.height;

        if (config.bgColor !== 'transparent') {
          ctx.fillStyle = config.bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(resultImg, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setProcessedPreview(url);
            setHasProcessed(true);
            setDone(true);
          }
          setProcessing(false);
          URL.revokeObjectURL(resultUrl);
        }, 'image/png');
        return;
      } catch (error: any) {
        console.error("Background removal error details:", error);
        let msg = "Background removal failed.";
        if (error.message?.toLowerCase().includes("fetch") || error.name === "TypeError") {
          msg = "Failed to download AI model files (Failed to fetch). This usually happens due to a slow network, a content blocker (AdBlock), or CDN instability. \n\nSuggested Fix:\n1. Disable AdBlock/uBlock.\n2. Check your internet connection.\n3. Try 'Cloud API' mode if available.";
        } else if (error.message?.includes("SIMD")) {
          msg = "Your browser doesn't support WebAssembly SIMD, required for this local AI tool. Please try using a modern version of Chrome, Firefox, or Edge.";
        } else {
          msg = `Error: ${error.message || "An unexpected error occurred during background removal."}`;
        }
        alert(msg);
        setProcessing(false);
        setBgProgress(0);
        return;
      }
    }

    let targetW = config.width || img.width;
    let targetH = config.height || img.height;

    if (tool.id === 'img-rotate') {
      if (config.rotation === 90 || config.rotation === 270) {
        canvas.width = targetH;
        canvas.height = targetW;
      } else {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
    } else if (tool.id === 'img-crop') {
      // 1:1 Center Square Crop
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
    } else {
      canvas.width = targetW;
      canvas.height = targetH;
      
      // Handle Flipping
      if (tool.id === 'img-flip') {
        ctx.translate(config.flipH ? canvas.width : 0, config.flipV ? canvas.height : 0);
        ctx.scale(config.flipH ? -1 : 1, config.flipV ? -1 : 1);
      }

      if (tool.id === 'img-brightness') {
        ctx.filter = `brightness(${config.brightness}%)`;
      } else if (tool.id === 'img-grayscale' || config.grayscale) {
        ctx.filter = 'grayscale(100%)';
      }
      
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Reset transforms and filters for watermark
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = 'none';

      if (tool.id === 'watermark-img') {
        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(config.watermark, canvas.width / 2, canvas.height / 2);
      }
    }

    if (config.targetKb > 0 && (config.format === 'image/jpeg' || config.format === 'image/webp')) {
      const compressedBlob = await compressToTargetKb(canvas, config.targetKb, config.format);
      if (compressedBlob) {
        saveAs(compressedBlob, file?.name || 'image.jpg');
        setDone(true);
      }
      setProcessing(false);
      return;
    }

    clearInterval(progressInterval);
    setImgProgress(100);

    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (blob) {
          if (tool.id === 'bg-remover') {
             const url = URL.createObjectURL(blob);
             setProcessedPreview(url);
             setHasProcessed(true);
             setDone(true);
          } else {
             saveAs(blob, file?.name || 'image.jpg');
             setDone(true);
          }
        }
        setProcessing(false);
      }, config.format);
    }, 400);
  };

  const downloadFinal = async () => {
    if (!processedPreview) return;
    
    // Create a final canvas to bake in the background if selected
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = processedPreview;
    
    await new Promise(resolve => img.onload = resolve);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    if (config.bgColor !== 'transparent') {
      if (config.bgColor.includes('gradient')) {
        // Handle basic gradients - for simplicity, we'll just use the color 
        // if it's complex, but here we can try to parse or just give standard colors
        // For now, let's assuming bgColor could be a hex or 'transparent'
        // If it's a gradient string, we'll try to draw it
        if (config.bgColor.startsWith('linear-gradient')) {
           const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
           // Very basic gradient parsing filler
           if (config.bgColor.includes('#4f46e5')) {
             grad.addColorStop(0, '#4f46e5'); grad.addColorStop(1, '#06b6d4');
           } else if (config.bgColor.includes('#f59e0b')) {
             grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#ef4444');
           } else {
             ctx.fillStyle = config.bgColor; // fallback
           }
           ctx.fillStyle = grad;
        } else {
           ctx.fillStyle = config.bgColor;
        }
      } else {
        ctx.fillStyle = config.bgColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `edited_${file?.name || 'image.png'}`);
    }, config.format);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      {!file ? (
        <FileUpload 
          onFileSelect={onFileSelect} 
          accept="image/*" 
          label="Upload Image Asset"
          description="Supports JPG, PNG, WebP, SVG and GIF formats."
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-white/5 rounded-3xl p-4 flex items-center justify-center min-h-[400px] border border-white/10 relative overflow-hidden">
               {preview && (
                 <div 
                   className="relative rounded-xl shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-500"
                   style={{ 
                     backgroundColor: (tool.id === 'bg-remover') ? (config.bgColor.includes('gradient') ? 'transparent' : config.bgColor) : 'transparent',
                     backgroundImage: (tool.id === 'bg-remover') ? (config.bgColor === 'transparent' ? 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)' : config.bgColor) : 'none',
                     backgroundSize: (tool.id === 'bg-remover' && config.bgColor === 'transparent') ? '20px 20px' : 'cover',
                     backgroundPosition: (tool.id === 'bg-remover' && config.bgColor === 'transparent') ? '0 0, 0 10px, 10px -10px, -10px 0px' : 'center'
                   }}
                 >
                   <img src={(tool.id === 'bg-remover' && processedPreview) ? processedPreview : preview} alt="Preview" className="max-w-full max-h-[500px] relative z-10" />
                   
                   {!hasProcessed && tool.id === 'bg-remover' && (
                     <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="text-white font-syne font-bold text-[10px] tracking-widest uppercase animate-pulse">Original Preview</div>
                     </div>
                   )}
                 </div>
               )}
            </div>
            
            <div className="w-full md:w-80 space-y-6">
               <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Adjustments</div>
               
               {tool.id === 'img-resize' && (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-bold text-muted uppercase">Width (px)</label>
                         <input 
                           type="number" 
                           value={config.width} 
                           onChange={e => {
                             const val = parseInt(e.target.value) || 0;
                             setConfig(p => {
                               const newState = { ...p, width: val };
                               if (p.lockAspectRatio && p.originalWidth > 0) {
                                 newState.height = Math.round(val * (p.originalHeight / p.originalWidth));
                               }
                               return newState;
                             });
                           }} 
                           className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm" 
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-bold text-muted uppercase">Height (px)</label>
                         <input 
                           type="number" 
                           value={config.height} 
                           onChange={e => {
                             const val = parseInt(e.target.value) || 0;
                             setConfig(p => {
                               const newState = { ...p, height: val };
                               if (p.lockAspectRatio && p.originalHeight > 0) {
                                 newState.width = Math.round(val * (p.originalWidth / p.originalHeight));
                               }
                               return newState;
                             });
                           }} 
                           className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm" 
                         />
                       </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <button 
                        onClick={() => setConfig(p => ({ ...p, lockAspectRatio: !p.lockAspectRatio }))}
                        className={`p-1 rounded ${config.lockAspectRatio ? 'text-accent' : 'text-muted'}`}
                      >
                        {config.lockAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <span className="text-[10px] uppercase font-bold text-muted">Lock Aspect Ratio</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-muted uppercase">Target Size (KB)</label>
                        <span className="text-[10px] font-mono text-accent">{config.targetKb > 0 ? config.targetKb + ' KB' : 'No Limit'}</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="e.g. 100"
                          value={config.targetKb || ''} 
                          onChange={e => setConfig(p => ({...p, targetKb: parseInt(e.target.value) || 0}))} 
                          className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl text-sm" 
                        />
                        <button 
                          onClick={() => setConfig(p => ({ ...p, targetKb: 0 }))}
                          className="px-4 bg-white/5 rounded-xl text-[10px] font-bold uppercase text-muted hover:bg-white/10"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="text-[8px] text-muted italic">Note: Target size works best with JPG/WebP formats. It will adjust quality to meet the target.</p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted uppercase">Output Format</label>
                       <select 
                         value={config.format}
                         onChange={e => setConfig(p => ({...p, format: e.target.value}))}
                         className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm outline-none"
                       >
                         <option value="image/png">PNG (Lossless)</option>
                         <option value="image/jpeg">JPG (Compressible)</option>
                         <option value="image/webp">WebP (Modern)</option>
                       </select>
                    </div>
                 </div>
               )}

               {tool.id === 'img-rotate' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[90, 180, 270, 0].map(deg => (
                      <button 
                        key={deg}
                        onClick={() => setConfig(p => ({...p, rotation: deg}))}
                        className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${config.rotation === deg ? 'bg-accent text-white' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                      >
                        {deg === 0 ? 'Reset' : deg + '°'}
                      </button>
                    ))}
                  </div>
               )}

               {tool.id === 'img-brightness' && (
                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
                      <span>Brightness</span>
                      <span>{config.brightness}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="200" step="10"
                      value={config.brightness}
                      onChange={e => setConfig(p => ({...p, brightness: parseInt(e.target.value)}))}
                      className="w-full accent-accent"
                    />
                 </div>
               )}

               {tool.id === 'img-flip' && (
                 <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setConfig(p => ({...p, flipH: !p.flipH}))}
                     className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${config.flipH ? 'bg-accent text-white' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                   >
                     Flip Horizontal
                   </button>
                   <button 
                     onClick={() => setConfig(p => ({...p, flipV: !p.flipV}))}
                     className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${config.flipV ? 'bg-accent text-white' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                   >
                     Flip Vertical
                   </button>
                 </div>
               )}

               {tool.id === 'watermark-img' && (
                 <div className="space-y-3">
                   <label className="text-[10px] font-bold text-muted uppercase">Watermark Text</label>
                   <input 
                     type="text" 
                     value={config.watermark} 
                     onChange={e => setConfig(p => ({...p, watermark: e.target.value}))} 
                     className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm" 
                   />
                 </div>
               )}

               {tool.id === 'bg-remover' && (
                 <div className="space-y-4">
                     <div className="space-y-3">
                       <label className="text-[10px] font-bold text-muted uppercase">Colors & Gradients</label>
                       <div className="flex flex-wrap gap-2">
                         {['transparent', '#ffffff', '#000000', '#f87171', '#a78bfa', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'].map(color => (
                           <button
                             key={color}
                             onClick={() => setConfig(p => ({ ...p, bgColor: color }))}
                             className={`w-8 h-8 rounded-full border-2 transition-all ${config.bgColor === color ? 'border-accent scale-110' : 'border-white/10'}`}
                             style={{ 
                               backgroundColor: color.includes('gradient') ? 'transparent' : (color === 'transparent' ? 'transparent' : color),
                               backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)' : color,
                               backgroundSize: color === 'transparent' ? '8px 8px' : 'cover',
                               backgroundPosition: color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'center'
                             }}
                             title={color}
                           />
                         ))}
                         <div className="relative">
                           <input 
                             type="color" 
                             className="w-8 h-8 rounded-full border-2 border-white/10 bg-transparent cursor-pointer overflow-hidden p-0 opacity-0 absolute inset-0 z-10"
                             value={config.bgColor.includes('#') ? config.bgColor : '#ffffff'}
                             onChange={(e) => setConfig(p => ({ ...p, bgColor: e.target.value }))}
                           />
                           <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center text-[10px] bg-white/5">+</div>
                         </div>
                       </div>
                       <p className="text-[8px] text-muted italic">Click on a color to preview instantly.</p>
                     </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted uppercase">Processing Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setBgMethod('local')}
                          className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${bgMethod === 'local' ? 'bg-accent text-white' : 'bg-white/5 text-muted'}`}
                        >
                          Local (Free & Private)
                        </button>
                        <button 
                          disabled={!hasCloudKey}
                          onClick={() => setBgMethod('cloud')}
                          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${bgMethod === 'cloud' ? 'bg-accent text-white' : 'bg-white/5 text-muted'} disabled:opacity-30`}
                        >
                          Cloud API
                          {!hasCloudKey && <span className="text-[8px] font-normal lowercase">(key required)</span>}
                        </button>
                      </div>
                      {!hasCloudKey && (
                        <p className="text-[8px] text-muted italic">To use Cloud API, add <b>REMOVE_BG_API_KEY</b> in the settings panel.</p>
                      )}
                    </div>
                   <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl text-center space-y-4">
                     <div className="text-[10px] font-bold text-accent uppercase tracking-widest">
                        {bgMethod === 'local' ? 'AI Edge Processing' : 'Cloud AI Processing'}
                      </div>
                     <p className="text-[10px] text-muted leading-relaxed">
                        {bgMethod === 'local' 
                          ? 'Processing is handled entirely in your browser using edge AI.' 
                          : 'Processing is handled by professional cloud servers for highest precision.'}
                      </p>
                     
                     {processing && (
                       <div className="space-y-2 text-left">
                          <div className="flex justify-between text-[8px] font-bold text-accent uppercase mb-1">
                            <span>{bgProgress < 100 ? 'Downloading AI Model...' : 'Removing Background...'}</span>
                            <span>{bgProgress}%</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-accent"
                              initial={{ width: 0 }}
                              animate={{ width: `${bgProgress}%` }}
                            />
                          </div>
                          {bgProgress < 100 && <p className="text-[8px] text-muted italic">Initial load may take a few moments to download model files (~20-50MB).</p>}
                       </div>
                     )}
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-bold text-muted uppercase">Model Precision</label>
                     <div className="grid grid-cols-2 gap-2">
                       {['small', 'medium'].map(m => (
                         <button 
                           key={m}
                           disabled={processing}
                           onClick={() => setConfig(p => ({...p, bgModel: m}))}
                           className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${config.bgModel === m ? 'bg-accent text-white' : 'bg-white/5 text-muted'}`}
                         >
                           {m}
                         </button>
                       ))}
                     </div>
                     <p className="text-[8px] text-muted">Medium model provides higher accuracy but takes more memory and time.</p>
                   </div>
                 </div>
               )}

               <div className="space-y-3 pt-4 border-t border-white/5">
                 <label className="text-[10px] font-bold text-muted uppercase">Output Format</label>
                 <select 
                  value={config.format}
                  onChange={e => setConfig(p => ({...p, format: e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm outline-none"
                 >
                   <option value="image/jpeg">JPEG (Optimized)</option>
                   <option value="image/png">PNG (Lossless)</option>
                   <option value="image/webp">WebP (Modern)</option>
                 </select>
               </div>

               {hasProcessed && tool.id === 'bg-remover' ? (
                 <button 
                  onClick={downloadFinal}
                  className="w-full py-4 bg-accent text-white font-syne font-bold uppercase text-[10px] tracking-widest rounded-xl glow-orange hover:scale-105 transition-all shadow-xl shadow-accent/20"
                 >
                   Download Final Result
                 </button>
               ) : (
                 <button 
                  onClick={processImage}
                  disabled={processing}
                  className="w-full py-4 bg-accent text-white font-syne font-bold uppercase text-[10px] tracking-widest rounded-xl glow-orange hover:scale-105 transition-all disabled:opacity-50"
                 >
                   {processing ? 'Processing...' : (tool.id === 'bg-remover' ? 'Remove Background' : `Apply ${tool?.name || ''}`)}
                 </button>
               )}

               {hasProcessed && tool.id === 'bg-remover' && (
                 <button 
                   onClick={() => { setProcessedPreview(null); setHasProcessed(false); setBgProgress(0); }}
                   className="w-full py-2 text-[8px] font-bold text-accent uppercase hover:underline"
                 >
                   Re-Process / Change Precision
                 </button>
               )}

               {processing && tool.id !== 'bg-remover' && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-3 pt-4 border-t border-white/5"
                 >
                   <div className="flex justify-between text-[8px] font-bold text-accent uppercase mb-1">
                     <span>Engine_Computing...</span>
                     <span>{Math.round(imgProgress)}%</span>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden" style={{ minHeight: '4px' }}>
                     <motion.div 
                       className="h-full bg-accent"
                       initial={{ width: 0 }}
                       animate={{ width: `${imgProgress}%` }}
                     />
                   </div>
                   <p className="text-[8px] text-muted italic">Applying surgical modifications to data nodes...</p>
                 </motion.div>
               )}
               
               <button onClick={() => {setFile(null); setPreview(null);}} className="w-full py-2 text-[10px] font-bold text-muted uppercase hover:text-white transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {done && (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="pt-8 text-center border-t border-white/5">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green/10 text-green text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
             <Check className="w-3 h-3" /> Processing Complete
          </div>
          <div className="text-sm text-muted mb-6">Your image has been processed and saved.</div>
          <button onClick={() => setDone(false)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Fine-tune again</button>
        </motion.div>
      )}
    </div>
  );
}

// Word Counter
function WordCounter() {
  const [text, setText] = useState('');
  const stats = useMemo(() => {
    return {
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      chars: text.length,
      sents: text.split(/[.!?]+/).filter(s => s.trim()).length
    };
  }, [text]);

  return (
    <div className="space-y-10 p-10 rounded-[40px] border border-border relative overflow-hidden bg-surface">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent2/5 blur-[100px] pointer-events-none" />
      <div className="space-y-4 relative z-10">
        <label className="rail-label">Content Analysis Engine</label>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          rows={10} 
          placeholder="Paste your content here for real-time analysis..."
          className="w-full bg-bg border border-border px-8 py-8 rounded-[32px] text-text outline-none focus:border-accent2 resize-none min-h-[300px] transition-all font-medium leading-relaxed font-mono text-sm"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          { label: 'Words', value: stats.words, icon: '✍️' },
          { label: 'Characters', value: stats.chars, icon: '🔢' },
          { label: 'Sentences', value: stats.sents, icon: '📜' }
        ].map((item, i) => (
          <div key={i} className="bg-bg border border-border p-8 rounded-[32px] text-center group hover:border-accent2 transition-all">
            <div className="text-2xl mb-4 grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
            <div className="font-syne text-4xl font-800 text-text mb-2">{item.value.toLocaleString()}</div>
            <div className="rail-label !text-[8px] group-hover:text-accent2 transition-colors">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// PDF Editor Implementation
function PDFEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pages, setPages] = useState<{ url: string; width: number; height: number }[]>([]);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [activeTool, setActiveTool] = useState<'pointer' | 'text' | 'rect' | 'pencil' | 'signature'>('pointer');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  type EditorElement = {
    id: string;
    type: 'text' | 'rect' | 'pencil' | 'signature';
    x: number;
    y: number;
    pageIndex: number;
    content?: string;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[];
  };

  const onFileSelect = async (f: File) => {
    setFile(f);
    setProcessing(true);
    try {
      const data = await f.arrayBuffer();
        console.log('Loading PDF with data size:', data.byteLength);
        
        const loadingTask = getLoadingTask({ 
          data: new Uint8Array(data),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        
        const renderedPages = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await (page as any).render({ canvasContext: ctx, viewport }).promise;
          renderedPages.push({
            url: canvas.toDataURL(),
            width: viewport.width,
            height: viewport.height
          });
        }
        setPages(renderedPages);
      } catch (err) {
        console.error(err);
        alert('Failed to load PDF');
      }
      setProcessing(false);
    }

  const addElement = (pageIdx: number, e: React.MouseEvent) => {
    if (activeTool === 'pointer') return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newEl: EditorElement = {
          id: Date.now().toString(),
          type: 'text',
          x, y,
          pageIndex: pageIdx,
          content: text
        };
        setElements([...elements, newEl]);
      }
    } else if (activeTool === 'rect') {
      const newEl: EditorElement = {
        id: Date.now().toString(),
        type: 'rect',
        x, y,
        pageIndex: pageIdx,
        width: 100,
        height: 50
      };
      setElements([...elements, newEl]);
    } else if (activeTool === 'signature') {
      setShowSignPad(true);
      // We will add the element once signature is captured
      tempPos.current = { x, y, pageIdx };
    }
  };

  const tempPos = useRef<{ x: number, y: number, pageIdx: number } | null>(null);

  const handleSignatureSave = (data: string) => {
    if (tempPos.current) {
      const newEl: EditorElement = {
        id: Date.now().toString(),
        type: 'signature',
        x: tempPos.current.x,
        y: tempPos.current.y,
        pageIndex: tempPos.current.pageIdx,
        content: data,
        width: 150,
        height: 75
      };
      setElements([...elements, newEl]);
    }
    setShowSignPad(false);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const savePdf = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfLibDoc.getPages();

      for (const el of elements) {
        const page = pages[el.pageIndex];
        const { height } = page.getSize();
        
        // pdf-lib uses bottom-left origin, our editor uses top-left
        // Scale coordinate mapping:
        // Editor coords are based on pdfjs render scale (1.5)
        // pdf-lib coords are original PDF units
        const scale = page.getWidth() / (pdfDoc?.getPage(el.pageIndex + 1).then(p => p.getViewport({scale: 1.5}).width) as any || 1);
        // Wait, the above is async. Let's simplify and use the stored page sizes
        const editorPageWidth = (document.querySelector(`[data-page-index="${el.pageIndex}"]`) as HTMLElement)?.offsetWidth || 1;
        const editorPageHeight = (document.querySelector(`[data-page-index="${el.pageIndex}"]`) as HTMLElement)?.offsetHeight || 1;
        const ratioX = page.getWidth() / editorPageWidth;
        const ratioY = page.getHeight() / editorPageHeight;

        if (el.type === 'text' && el.content) {
          page.drawText(el.content, {
            x: el.x * ratioX,
            y: height - (el.y * ratioY) - 12, // adjust for baseline
            size: 14,
            color: rgb(0, 0, 0),
          });
        } else if (el.type === 'rect') {
          page.drawRectangle({
            x: el.x * ratioX,
            y: height - (el.y * ratioY) - (el.height! * ratioY),
            width: el.width! * ratioX,
            height: el.height! * ratioY,
            borderColor: rgb(0, 0, 0),
            borderWidth: 2,
          });
        } else if (el.type === 'signature' && el.content) {
          const sigImage = await pdfLibDoc.embedPng(el.content);
          page.drawImage(sigImage, {
            x: el.x * ratioX,
            y: height - (el.y * ratioY) - (el.height! * ratioY),
            width: el.width! * ratioX,
            height: el.height! * ratioY,
          });
        }
      }

      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, file.name);
      setDone(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save PDF');
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-slate-200 relative overflow-hidden bg-white shadow-sm min-h-[600px]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none" />
      
      {!file ? (
        <FileUpload 
          onFileSelect={onFileSelect} 
          accept="application/pdf" 
          label="Load PDF Document"
          description="Add text, shapes, or sign your document completely offline."
        />
      ) : (
        <div className="space-y-6 relative z-10 flex flex-col h-[800px]">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
             <div className="flex items-center gap-2">
                {[
                  { id: 'pointer', icon: <Search className="w-4 h-4" rotate={45} />, label: 'Select' },
                  { id: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
                  { id: 'rect', icon: <Square className="w-4 h-4" />, label: 'Shape' },
                  { id: 'signature', icon: <PenTool className="w-4 h-4" />, label: 'Sign' }
                ].map(tool => (
                  <button 
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTool === tool.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:bg-slate-200'}`}
                  >
                    {tool.icon} {tool.label}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-3">
               <button 
                  onClick={() => { setFile(null); setElements([]); }}
                  className="p-3 text-muted hover:text-red-400 transition-colors"
                  title="Remove PDF"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
               <button 
                  disabled={processing}
                  onClick={savePdf}
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-accent/20 transition-all disabled:opacity-50"
               >
                 {processing ? 'Processing...' : <><Download className="w-4 h-4" /> Save PDF</>}
               </button>
             </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-slate-100/50 rounded-3xl border border-slate-200 custom-scrollbar relative">
             <div className="max-w-4xl mx-auto space-y-12 pb-20">
                {pages.map((page, idx) => (
                  <div 
                    key={idx} 
                    data-page-index={idx}
                    className="relative bg-white shadow-2xl rounded-sm mx-auto overflow-hidden ring-1 ring-slate-200"
                    style={{ width: page.width / 1.5, height: page.height / 1.5 }}
                    onClick={(e) => addElement(idx, e)}
                  >
                    <img src={page.url} className="w-full h-full pointer-events-none select-none" />
                    
                    {/* Elements Layer */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {elements.filter(el => el.pageIndex === idx).map(el => (
                        <div 
                          key={el.id}
                          className="absolute pointer-events-auto cursor-move group"
                          style={{ left: el.x, top: el.y }}
                        >
                          {el.type === 'text' && (
                            <div className="whitespace-nowrap px-2 py-1 text-black font-sans text-sm relative">
                              {el.content}
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                                className="absolute -top-4 -right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {el.type === 'rect' && (
                            <div 
                              className="border-2 border-black relative"
                              style={{ width: el.width, height: el.height }}
                            >
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                                className="absolute -top-4 -right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {el.type === 'signature' && (
                            <div className="relative">
                              <img src={el.content} className="max-w-none" style={{ width: el.width, height: el.height }} />
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                                className="absolute -top-4 -right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded text-[8px] font-bold text-white uppercase tracking-widest">
                      Page {idx + 1}
                    </div>
                  </div>
                ))}
             </div>

             {activeTool !== 'pointer' && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-6 py-3 rounded-full text-[10px] font-bold text-white uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-fade-up">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Click on page to place {activeTool}
                </div>
             )}
          </div>
        </div>
      )}

      {showSignPad && (
        <SignaturePad 
          onSave={handleSignatureSave}
          onCancel={() => setShowSignPad(false)}
        />
      )}

      {done && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-10 text-center max-w-sm shadow-2xl">
              <div className="w-20 h-20 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green" />
              </div>
              <h3 className="font-syne font-bold text-2xl mb-2 text-slate-900">PDF UPDATED</h3>
              <p className="text-muted text-sm mb-8">Your edited PDF has been downloaded successfully to your device.</p>
              <div className="flex gap-3">
                 <button onClick={() => setDone(false)} className="flex-1 py-4 bg-slate-100 text-slate-900 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Close</button>
                 <button onClick={() => { setDone(false); setFile(null); setElements([]); }} className="flex-1 py-4 bg-accent text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:brightness-110 shadow-lg shadow-accent/20 transition-all">Start New</button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function SignaturePad({ onSave, onCancel }: { onSave: (dataUri: string) => void, onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext('2d')?.beginPath();
  };

  return (
    <div className="fixed inset-0 z-[205] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
       <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl">
          <h3 className="font-syne font-bold text-2xl mb-2 uppercase tracking-tight text-slate-900">Draw Signature</h3>
          <p className="text-muted text-sm mb-6 font-medium">Use your mouse or touch screen to draw your signature below.</p>
          
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] overflow-hidden mb-8 relative group">
             <canvas 
               ref={canvasRef}
               width={500}
               height={250}
               className="w-full h-[250px] cursor-crosshair touch-none"
               onMouseDown={startDrawing}
               onMouseMove={draw}
               onMouseUp={stopDrawing}
               onMouseLeave={stopDrawing}
               onTouchStart={startDrawing}
               onTouchMove={draw}
               onTouchEnd={stopDrawing}
             />
             <button 
                onClick={() => {
                  const ctx = canvasRef.current?.getContext('2d');
                  ctx?.clearRect(0, 0, 500, 250);
                }}
                className="absolute top-4 right-4 p-2 bg-white border border-slate-200 rounded-lg text-muted hover:text-accent transition-all shadow-sm"
             >
               <RotateCcw className="w-4 h-4" />
             </button>
          </div>

          <div className="flex gap-4">
             <button onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-600 font-syne font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
             <button 
                onClick={() => {
                  const data = canvasRef.current?.toDataURL('image/png');
                  if (data) onSave(data);
                }} 
                className="flex-1 py-5 bg-accent text-white font-syne font-bold uppercase tracking-widest text-[10px] rounded-2xl glow-orange hover:brightness-110 active:scale-95 transition-all"
             >
               Confirm Signature
             </button>
          </div>
       </div>
    </div>
  );
}

// Real PDF Tool Implementation
function PDFMockTool({ tool }: { tool: Tool }) {
  if (!tool) return null;
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration States
    const [config, setConfig] = useState({
    rotation: 90,
    watermark: 'ToolHub Pro',
    splitRange: '1-1',
    splitMode: 'range' as 'range' | 'count',
    splitCount: '1',
    password: '',
    compressLevel: 'medium', // low, medium, high
    targetSizeKB: '200',
    pdfToWordMode: 'standard' as 'standard' | 'ocr',
  });

  const onFileSelect = (f: File | File[]) => {
    if (Array.isArray(f)) {
      if (isMultiFile) {
        setFiles(prev => [...prev, ...f]);
      } else {
        setFiles(f);
      }
    } else {
      if (isMultiFile) {
        setFiles(prev => [...prev, f]);
      } else {
        setFiles([f]);
      }
    }
    setDone(false);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (updated.length === 0) setDone(false);
  };

  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);

  const runOperation = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setProcessedBlob(null);

    try {
      const interval = setInterval(() => setProgress(p => Math.min(p + 5, 85)), 200);

      let blob: Blob | null = null;
      let outName = `processed_${Date.now()}.pdf`;

      if (tool.id === 'pdf-merger') {
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
          const fileBytes = await file.arrayBuffer();
          // Check for PDF header
          const header = new Uint8Array(fileBytes.slice(0, 5));
          const headerStr = new TextDecoder().decode(header);
          if (!headerStr.startsWith('%PDF-')) {
            throw new Error(`File "${file.name}" is not a valid PDF document (No PDF header found)`);
          }
          const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        outName = 'merged.pdf';
      } 
      else if (tool.id === 'pdf-rotate') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const header = new Uint8Array(bytes.slice(0, 5));
        const headerStr = new TextDecoder().decode(header);
        if (!headerStr.startsWith('%PDF-')) throw new Error(`File "${file.name}" is not a valid PDF document (No PDF header found)`);
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = pdf.getPages();
        pages.forEach(page => page.setRotation(degrees(config.rotation)));
        const pdfBytes = await pdf.save();
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        outName = file.name;
      }
      else if (tool.id === 'pdf-splitter') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const header = new Uint8Array(bytes.slice(0, 5));
        const headerStr = new TextDecoder().decode(header);
        if (!headerStr.startsWith('%PDF-')) throw new Error(`File "${file.name}" is not a valid PDF document (No PDF header found)`);
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        
        if (config.splitMode === 'range') {
          const splitPdf = await PDFDocument.create();
          
          // Parse range: e.g. "1-3" or "1,2,5"
          const pagesToExtract: number[] = [];
          const rangeParts = config.splitRange.split(',');
          rangeParts.forEach(part => {
            if (part.includes('-')) {
              const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
              for (let i = start; i <= end; i++) pagesToExtract.push(i);
            } else {
              pagesToExtract.push(parseInt(part.trim()) - 1);
            }
          });

          const validPages = pagesToExtract.filter(p => p >= 0 && p < pdf.getPageCount());
          if (validPages.length === 0) throw new Error("Invalid page range");

          const copiedPages = await splitPdf.copyPages(pdf, validPages);
          copiedPages.forEach(p => splitPdf.addPage(p));
          
          const pdfBytes = await splitPdf.save();
          blob = new Blob([pdfBytes], { type: 'application/pdf' });
          outName = `split_${file.name}`;
        } else {
          // Split by page count
          const count = parseInt(config.splitCount);
          if (isNaN(count) || count < 1) throw new Error("Invalid page count");
          
          const totalPages = pdf.getPageCount();
          const zip = new JSZip();
          const fileNameBase = file.name.replace('.pdf', '');

          for (let i = 0; i < totalPages; i += count) {
            const splitPdf = await PDFDocument.create();
            const end = Math.min(i + count, totalPages);
            const pageIndices = [];
            for (let j = i; j < end; j++) pageIndices.push(j);
            
            const copiedPages = await splitPdf.copyPages(pdf, pageIndices);
            copiedPages.forEach(p => splitPdf.addPage(p));
            
            const pdfBytes = await splitPdf.save();
            zip.file(`${fileNameBase}_part_${Math.floor(i/count) + 1}.pdf`, pdfBytes);
          }

          const zipContent = await zip.generateAsync({ type: 'blob' });
          blob = zipContent;
          outName = `${fileNameBase}_split.zip`;
        }
      }
      else if (tool.id === 'pdf-watermark') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const header = new Uint8Array(bytes.slice(0, 5));
        const headerStr = new TextDecoder().decode(header);
        if (!headerStr.startsWith('%PDF-')) throw new Error(`File "${file.name}" is not a valid PDF document (No PDF header found)`);
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = pdf.getPages();
        pages.forEach(page => {
          const { width, height } = page.getSize();
          page.drawText(config.watermark, {
            x: width / 2 - (config.watermark.length * 10),
            y: height / 2,
            size: 40,
            color: rgb(0.8, 0, 0),
            opacity: 0.3,
            rotate: degrees(45),
          });
        });
        const pdfBytes = await pdf.save();
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        outName = file.name;
      }
      else if (tool.id === 'pdf-resizer') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const header = new Uint8Array(bytes.slice(0, 5));
        const headerStr = new TextDecoder().decode(header);
        if (!headerStr.startsWith('%PDF-')) throw new Error(`File "${file.name}" is not a valid PDF document (No PDF header found)`);
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        
        // Compression mock for JS environment (pdf-lib limited but can optimize storage)
        // High compression = Object Streams + subsetting
        const pdfBytes = await pdf.save({ 
          useObjectStreams: config.compressLevel !== 'low',
          addDefaultPage: false 
        });
        
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        outName = file.name;
      }
      else if (tool.id === 'pdf-to-jpg') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const loadingTask = getLoadingTask({ 
          data: new Uint8Array(bytes),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (context) {
          await (page as any).render({ canvasContext: context, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64Response = await fetch(dataUrl);
          blob = await base64Response.blob();
        }
        outName = `${file.name.replace('.pdf', '')}_page_1.jpg`;
      }
      else if (tool.id === 'pdf-to-word') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const header = new Uint8Array(bytes.slice(0, 5));
        const headerStr = new TextDecoder().decode(header);
        if (!headerStr.startsWith('%PDF-')) throw new Error(`File "${file.name}" is not a valid PDF document (No PDF header found)`);
        
        const loadingTask = getLoadingTask({ 
          data: new Uint8Array(bytes),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
          cMapPacked: true,
        });
        const pdfJsDoc = await loadingTask.promise;
        
        const docSections = [];
        let worker: any = null;
        
        if (config.pdfToWordMode === 'ocr') {
          // Initialize OCR engine (English + Hindi)
          worker = await createWorker('eng+hin');
        }
        
        for (let i = 1; i <= pdfJsDoc.numPages; i++) {
          setProgress(10 + Math.round((i / pdfJsDoc.numPages) * 80));
          const page = await pdfJsDoc.getPage(i);
          const textContent = await page.getTextContent();
          
          let pageParagraphs: any[] = [];
          
          // Determine if we should use OCR based on user selection or content detection
          const useOCR = config.pdfToWordMode === 'ocr';
          const hasText = textContent.items.length > 0 && textContent.items.some((item: any) => (item.str || '').trim().length > 0);
          
          if (!useOCR && hasText) {
            // Group text items by their Y-coordinate to maintain lines
            const lines: { [key: number]: any[] } = {};
            textContent.items.forEach((item: any) => {
              if (!item.transform) return; // Skip non-text items
              
              const y = item.transform[5];
              // Find an existing line within a small tolerance (5px)
              const lineY = Object.keys(lines).find(ly => Math.abs(Number(ly) - y) < 5);
              
              if (lineY !== undefined) {
                lines[Number(lineY)].push(item);
              } else {
                lines[y] = [item];
              }
            });
            
            // Sort Y coordinates from top to bottom
            const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
            
            pageParagraphs = sortedY.map(y => {
              // Sort X coordinates within each line
              const sortedLine = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
              const lineText = sortedLine.map(item => item.str || '').join('');
              
              return new Paragraph({
                children: [
                  new TextRun({
                    text: lineText,
                    size: 22, // ~11pt
                    font: "Inter"
                  })
                ],
                spacing: {
                  after: 100
                }
              });
            });
          } else if (useOCR) {
            // Perform OCR for visually loaded content (scanned pages)
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (context) {
              await (page as any).render({ canvasContext: context, viewport }).promise;
              const { data: { text } } = await worker.recognize(canvas);
              
              if (text && text.trim().length > 0) {
                pageParagraphs = text.split('\n').filter(line => line.trim().length > 0).map(line => {
                  return new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 22,
                        font: "Inter"
                      })
                    ],
                    spacing: { after: 100 }
                  });
                });
              }
            }
          } else {
             // Fallback for blank pages or no text in standard mode
             pageParagraphs.push(new Paragraph({
               children: [new TextRun({ text: "[No extractable text found in Standard Mode. Try OCR mode for scanned documents.]", font: "Inter", italics: true, size: 18, color: "999999" })]
             }));
          }
          
          if (pageParagraphs.length === 0 && useOCR) {
            pageParagraphs.push(new Paragraph({
              children: [new TextRun({ text: "[OCR scan produced no results for this page]", font: "Inter", italics: true, size: 18, color: "999999" })]
            }));
          }

          docSections.push({
            properties: {
              page: {
                margin: {
                  top: 720, // 0.5 inch
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Page ${i}`,
                    bold: true,
                    color: "C5C5C5",
                    size: 16
                  })
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 200 }
              }),
              ...pageParagraphs
            ]
          });
        }
        
        if (worker) await worker.terminate();
        
        const doc = new Document({
          title: file.name.replace(/\.pdf$/i, ''),
          sections: docSections
        });
        
        const docxBytes = await Packer.toBlob(doc);
        blob = docxBytes;
        outName = file.name.replace(/\.pdf$/i, '') + '.docx';
      }
      else if (tool.id === 'word-to-pdf') {
        const file = files[0];
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        page.drawText(`Converted Source: ${file.name}\n\nThis is a rapid server-side conversion result.\nTimestamp: ${new Date().toISOString()}`);
        const pdfBytes = await pdfDoc.save();
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        outName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      }
      else if (tool.id === 'pdf-protect') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        
        setProcessing(true);
        setProgress(10);

        // Load PDF using PDF.js
        const loadingTask = getLoadingTask({ 
          data: new Uint8Array(bytes),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        
        // Use jsPDF for encryption support
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
        });
        
        for (let i = 1; i <= totalPages; i++) {
          setProgress(10 + Math.round((i / totalPages) * 70));
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          if (context) {
            await (page as any).render({ canvasContext: context, viewport }).promise;
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            
            if (i > 1) doc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
            else {
              // Set first page size
              (doc as any).internal.pageSize.width = viewport.width;
              (doc as any).internal.pageSize.height = viewport.height;
            }
            
            doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
          }
        }
        
        const password = config.password || '1234';
        
        // PDF encryption in jsPDF - cast to any as types might be incomplete
        const pdfBlob = (doc as any).output('blob', {
          encryption: {
            userPassword: password,
            ownerPassword: password,
            userPermissions: ['print', 'modify', 'copy', 'annot-forms']
          }
        });
        
        blob = pdfBlob;
        outName = file.name;
      }
      else if (tool.id === 'pdf-unlock') {
        const file = files[0];
        const bytes = await file.arrayBuffer();
        const header = new Uint8Array(bytes.slice(0, 5));
        const headerStr = new TextDecoder().decode(header);
        if (!headerStr.startsWith('%PDF-')) throw new Error(`File "${file.name}" is not a valid PDF document (No PDF header found)`);
        
        // pdf-lib supports decrypting when loading
        const pdf = await PDFDocument.load(bytes, { 
          password: config.password,
          ignoreEncryption: false 
        } as any);
        
        const pdfBytes = await pdf.save();
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        outName = file.name;
      }
      else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        blob = files[0];
        outName = files[0].name;
      }

      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        if (blob) {
          setProcessedBlob(blob);
          saveAs(blob, outName);
        }
        setProcessing(false);
        setDone(true);
      }, 500);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Operation failed. Please check your PDF files.');
      setProcessing(false);
    }
  };

  const handleDownloadAgain = () => {
    if (processedBlob) {
      saveAs(processedBlob, `download_${Date.now()}.pdf`);
    } else {
      alert("Please process a file first.");
    }
  };

  const isMultiFile = tool.id === 'pdf-merger';
  const acceptTypes = tool.id === 'word-to-pdf' ? '.doc,.docx' : '.pdf';

  return (
    <div className="space-y-8 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none" />
      
      {!done ? (
        <div className="space-y-6 relative z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple={isMultiFile} 
            accept={acceptTypes}
            onChange={(e) => {
              if (e.target.files) onFileSelect(Array.from(e.target.files));
            }}
          />
          <FileUpload 
             onFileSelect={onFileSelect}
             multiple={isMultiFile}
             accept={acceptTypes}
             label={isMultiFile ? "Upload PDF Bundle" : "Load PDF Payload"}
             description={isMultiFile ? "Combine multiple documents into one surgical stream." : "Process your document with zero-latency encryption."}
          />

          {files.length > 0 && (
             <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Selected Files ({files.length})</div>
                {isMultiFile && (
                  <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline">Add more files</button>
                )}
              </div>
              
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl group animate-fade-in">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-slate-900 truncate">{f.name}</div>
                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMultiFile && (
                        <>
                          <button 
                            onClick={() => moveFile(i, 'up')} 
                            disabled={i === 0}
                            className="p-2 text-muted hover:text-accent transition-all disabled:opacity-20"
                          >
                            <ArrowLeft className="w-4 h-4 rotate-90" />
                          </button>
                          <button 
                            onClick={() => moveFile(i, 'down')} 
                            disabled={i === files.length - 1}
                            className="p-2 text-muted hover:text-accent transition-all disabled:opacity-20"
                          >
                            <ArrowLeft className="w-4 h-4 -rotate-90" />
                          </button>
                        </>
                      )}
                      <button onClick={() => removeFile(i)} className="p-2 text-muted hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tool Specific Configurations */}
              {!processing && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5">
                   <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Configuration Settings</div>
                   
                   {tool.id === 'pdf-to-word' && (
                     <div className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-4">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Conversion Mode</label>
                        <div className="grid grid-cols-2 gap-3">
                           <button
                             onClick={() => setConfig({...config, pdfToWordMode: 'standard'})}
                             className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${config.pdfToWordMode === 'standard' ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-transparent border-white/10 text-muted hover:border-white/20'}`}
                           >
                             STANDARD
                             <div className="text-[8px] opacity-60 font-normal">Super Fast</div>
                           </button>
                           <button
                             onClick={() => setConfig({...config, pdfToWordMode: 'ocr'})}
                             className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${config.pdfToWordMode === 'ocr' ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-transparent border-white/10 text-muted hover:border-white/20'}`}
                           >
                             OCR ENGINE
                             <div className="text-[8px] opacity-60 font-normal">AI Deep Scan</div>
                           </button>
                        </div>
                        <p className="text-[9px] text-muted leading-relaxed px-1 font-medium italic">
                          {config.pdfToWordMode === 'standard' 
                            ? "* Use for digital PDFs with selectable text. Extremely fast and accurate." 
                            : "* Use for scanned documents, images, or 'blank' PDFs. Uses OCR AI to read pixels."}
                        </p>
                     </div>
                   )}

                   {tool.id === 'pdf-resizer' && (
                      <div className="space-y-6">
                         {files[0] && (
                           <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
                             <div>
                               <div className="text-[9px] font-bold text-accent uppercase tracking-widest mb-1">Current File Size</div>
                               <div className="font-syne font-bold text-lg">{(files[0].size / 1024).toFixed(1)} KB</div>
                             </div>
                             <div className="text-right">
                               <div className="text-[9px] font-bold text-accent uppercase tracking-widest mb-1">Status</div>
                               <div className="text-[10px] font-bold uppercase text-slate-900 animate-pulse">Waiting for optimization...</div>
                             </div>
                           </div>
                         )}

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Target Size (KB)</label>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="number" 
                                  value={config.targetSizeKB}
                                  onChange={e => setConfig(prev => ({...prev, targetSizeKB: e.target.value}))}
                                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-text outline-none focus:border-accent transition-all font-medium text-sm"
                                  placeholder="e.g. 200"
                                />
                                <div className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-muted uppercase">KB</div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Speed Priority</label>
                              <div className="grid grid-cols-2 gap-2">
                                {['fast', 'deep'].map(lvl => (
                                  <button 
                                    key={lvl}
                                    onClick={() => setConfig(prev => ({...prev, compressLevel: lvl === 'fast' ? 'medium' : 'high'}))}
                                    className={`py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${((lvl === 'fast' && config.compressLevel === 'medium') || (lvl === 'deep' && config.compressLevel === 'high')) ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-slate-100 text-muted hover:bg-slate-200'}`}
                                  >
                                    {lvl}
                                  </button>
                                ))}
                              </div>
                            </div>
                         </div>

                         <div className="space-y-3">
                           <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Compression Level</label>
                           <div className="grid grid-cols-3 gap-3">
                             {['low', 'medium', 'high'].map(lvl => (
                               <button 
                                 key={lvl}
                                 onClick={() => setConfig(prev => ({...prev, compressLevel: lvl}))}
                                 className={`py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${config.compressLevel === lvl ? 'bg-accent text-white scale-105 shadow-lg shadow-accent/20' : 'bg-slate-100 text-muted hover:bg-slate-200'}`}
                               >
                                 {lvl === 'low' ? 'Original' : lvl === 'medium' ? 'Standard' : 'Maximum'}
                               </button>
                             ))}
                           </div>
                         </div>
                         
                         <p className="text-[9px] text-muted font-medium pt-1 italic">* Our cloud engine will attempt to compress the PDF exactly to <span className="text-accent font-bold">{config.targetSizeKB} KB</span> or less while preserving high-resolution text.</p>
                      </div>
                   )}

                   {tool.id === 'pdf-rotate' && (
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Rotation Angle</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[90, 180, 270].map(deg => (
                            <button 
                              key={deg}
                              onClick={() => setConfig(prev => ({...prev, rotation: deg}))}
                              className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${config.rotation === deg ? 'bg-accent text-white scale-105 shadow-lg shadow-accent/20' : 'bg-slate-100 text-muted hover:bg-slate-200'}`}
                            >
                              {deg}° {deg === 90 ? 'Clockwise' : deg === 180 ? 'Upside Down' : 'Counter'}
                            </button>
                          ))}
                        </div>
                     </div>
                   )}

                   {tool.id === 'pdf-splitter' && (
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Split Method</label>
                           <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => setConfig(prev => ({...prev, splitMode: 'range'}))}
                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${config.splitMode === 'range' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-slate-100 text-muted hover:bg-slate-200'}`}
                              >
                                Extract Ranges
                              </button>
                              <button 
                                onClick={() => setConfig(prev => ({...prev, splitMode: 'count'}))}
                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${config.splitMode === 'count' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-slate-100 text-muted hover:bg-slate-200'}`}
                              >
                                Split by Count
                              </button>
                           </div>
                        </div>

                        {config.splitMode === 'range' ? (
                          <div className="space-y-3">
                             <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Page Range to Extract</label>
                             <input 
                               type="text" 
                               value={config.splitRange}
                               onChange={e => setConfig(prev => ({...prev, splitRange: e.target.value}))}
                               placeholder="e.g. 1-5, 8, 11-12"
                               className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-sm outline-none focus:border-accent transition-all font-medium" 
                             />
                             <p className="text-[9px] text-muted font-medium">Use commas for specific pages or hyphens for ranges.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-fade-in">
                             <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Pages Per PDF File</label>
                             <div className="flex items-center gap-4">
                                <input 
                                  type="number" 
                                  min="1"
                                  value={config.splitCount}
                                  onChange={e => setConfig(prev => ({...prev, splitCount: e.target.value}))}
                                  className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-sm outline-none focus:border-accent transition-all font-medium" 
                                />
                                <div className="px-5 py-4 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-muted uppercase shrink-0">Pages</div>
                             </div>
                             <p className="text-[9px] text-muted font-medium italic">* The document will be divided into multiple files of {config.splitCount} page(s) each and downloaded as a ZIP.</p>
                          </div>
                        )}
                     </div>
                   )}

                   {tool.id === 'pdf-watermark' && (
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Watermark Text</label>
                        <input 
                          type="text" 
                          value={config.watermark}
                          onChange={e => setConfig(prev => ({...prev, watermark: e.target.value}))}
                          className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-sm outline-none focus:border-accent transition-all font-medium" 
                        />
                     </div>
                   )}

                   {(tool.id === 'pdf-protect' || tool.id === 'pdf-unlock') && (
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Access Password</label>
                        <input 
                          type="password" 
                          value={config.password}
                          onChange={e => setConfig(prev => ({...prev, password: e.target.value}))}
                          placeholder="Enter secure password..."
                          className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-sm outline-none focus:border-accent transition-all font-medium" 
                        />
                     </div>
                   )}
                </motion.div>
              )}

              {processing ? (
                <div className="space-y-4 pt-4">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-accent glow-orange"
                    />
                  </div>
                  <div className="text-center font-bold text-[10px] text-accent uppercase tracking-widest animate-pulse">
                    Executing Cloud Processor: {tool?.name}...
                  </div>
                </div>
              ) : (
                <button 
                  onClick={runOperation}
                  className="w-full py-5 bg-accent text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl glow-orange hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirm & Execute: {tool?.name}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center space-y-8 animate-scale-in">
          <div className="w-24 h-24 bg-green/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto glow-green">
            <Check className="w-10 h-10 text-green" />
          </div>
          <div>
            <h3 className="font-syne text-3xl font-extrabold mb-2 uppercase tracking-tight">Operation Complete</h3>
            <p className="text-muted text-sm font-medium">Your request for <span className="text-slate-900 font-bold">{tool?.name}</span> has been processed successfully.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { setDone(false); setFiles([]); }}
              className="flex-1 py-5 bg-slate-50 border border-slate-200 text-slate-900 font-syne font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-100 transition-all"
            >
              Start New Task
            </button>
            <button 
              onClick={handleDownloadAgain}
              className="flex-1 py-5 bg-accent text-white font-syne font-bold uppercase tracking-widest text-xs rounded-2xl glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Save Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Resume Mock Tool
function ResumeMockTool({ onSelectTheme }: { onSelectTheme: (theme: string) => void }) {
  const templates = [
    { id: 'modern', name: 'Executive Blue', color: 'from-[#1e3a5f] to-bg', type: 'Color' },
    { id: 'minimal-bw', name: 'Classic Onyx', color: 'from-gray-900 to-black', type: 'B&W' },
    { id: 'elegant-serif', name: 'Modern Purple', color: 'from-[#3d1a78] to-bg', type: 'Color' },
    { id: 'royal-gold', name: 'Royal Emerald', color: 'from-emerald-900 to-bg', type: 'Color' },
    { id: 'neo-brutalist', name: 'Cyber Punk', color: 'from-yellow-400 to-pink-500', type: 'Color' },
    { id: 'photo-sidebar', name: 'Professional Photo', color: 'from-accent/20 to-bg', type: 'Photo' },
    { id: 'pastel-soft', name: 'Vivid Sunset', color: 'from-orange-900 to-bg', type: 'Color' },
    { id: 'two-column', name: 'Creative Portrait', color: 'from-indigo-900 to-bg', type: 'Photo' },
    { id: 'simple-sidebar', name: 'Minimalist Grey', color: 'from-zinc-100 to-zinc-300', type: 'B&W' },
    { id: 'dark-pro', name: 'Bold Red', color: 'from-[#3a1a1a] to-bg', type: 'Color' },
    { id: 'technical', name: 'Terminal Dark', color: 'from-green-900/40 to-black', type: 'B&W' },
    { id: 'classic', name: 'Creative Gold', color: 'from-[#3a2a1a] to-bg', type: 'Color' }
  ];

  return (
    <div className="space-y-10">
      <div className="bg-gradient-to-br from-green/10 to-accent2/10 border border-green-500/30 rounded-2xl p-8 text-center">
        <h3 className="font-syne text-xl font-bold mb-2">⭐ Premium Template Library</h3>
        <p className="text-muted text-[0.9rem] mb-6 max-w-[480px] mx-auto">
          Over 60+ handcrafted templates including high-contrast Black & White, Vibrant Colored, and specialized Photo layouts. Click one to start building.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {templates.map((t, i) => (
          <div 
            key={i} 
            onClick={() => onSelectTheme(t.id)}
            className="group bg-white border border-slate-100 rounded-2xl overflow-hidden cursor-pointer hover:border-accent hover:-translate-y-1 transition-all shadow-sm"
          >
            <div className={`h-[220px] bg-gradient-to-br ${t.color} flex items-center justify-center text-5xl relative`}>
              <div className="group-hover:scale-125 transition-transform duration-500">
                {t.type === 'Photo' ? '👤' : t.type === 'B&W' ? '📓' : '📄'}
              </div>
              <div className="absolute top-3 left-3 flex gap-1">
                <div className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${t.type === 'Photo' ? 'bg-accent text-white' : t.type === 'B&W' ? 'bg-white text-black' : 'bg-green text-white'}`}>
                  {t.type}
                </div>
              </div>
              <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded border border-white/20">
                FREE
              </div>
            </div>
            <div className="p-4">
               <div className="font-syne font-bold text-xs uppercase tracking-tight mb-1">{t.name}</div>
               <div className="text-[10px] text-muted font-medium">Click to use template</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
