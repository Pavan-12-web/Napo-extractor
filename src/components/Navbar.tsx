/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, FileText, Bookmark, FlaskConical, Layers, HelpCircle } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSelectInputMode: (mode: 'paste' | 'link' | 'extension') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onSelectInputMode }) => {
  return (
    <header className="border-b border-[#161f30] bg-[#070a10]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:border-blue-400 transition-colors">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight block">
              Napo extractor
            </span>
            <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
              multi-provider · lossless
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentView === 'home' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Extractor
          </button>
          <button
            onClick={() => onNavigate('test-lab')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer flex items-center gap-1.5 ${
              currentView === 'test-lab' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Test Lab (16 Fixtures)</span>
          </button>
          <button
            onClick={() => onNavigate('extension')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentView === 'extension' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Local Extractor
          </button>
          <button
            onClick={() => onNavigate('platforms')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentView === 'platforms' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Provider Registry
          </button>
          <button
            onClick={() => onNavigate('how-it-works')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentView === 'how-it-works' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => onNavigate('faq')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              currentView === 'faq' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            FAQ
          </button>
        </nav>

        {/* Zone 3: Quick Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              onNavigate('test-lab');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm shadow-blue-900/30"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Open Test Lab</span>
          </button>
        </div>
      </div>
    </header>
  );
};
