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

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="border-b border-[#141b2b] bg-[#07090e]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-white tracking-tight">
              Napo
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              AI Conversation Extractor
            </span>
          </div>
        </button>

        {/* Clean, quiet navigation links */}
        <nav className="flex items-center gap-5 text-xs font-medium text-slate-400">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors hover:text-white cursor-pointer ${
              currentView === 'home' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Extractor
          </button>
          <button
            onClick={() => onNavigate('test-lab')}
            className={`transition-colors hover:text-white cursor-pointer hidden sm:flex items-center gap-1 ${
              currentView === 'test-lab' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            <span>Test Lab</span>
          </button>
          <button
            onClick={() => onNavigate('extension')}
            className={`transition-colors hover:text-white cursor-pointer ${
              currentView === 'extension' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Bookmarklet
          </button>
          <button
            onClick={() => onNavigate('platforms')}
            className={`transition-colors hover:text-white cursor-pointer hidden md:inline ${
              currentView === 'platforms' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Supported AI
          </button>
        </nav>
      </div>
    </header>
  );
};
