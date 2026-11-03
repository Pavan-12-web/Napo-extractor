/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#161f30] bg-[#05070c] mt-24 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Extractors & Platforms */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Platforms</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('platforms')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  ChatGPT Extractor
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('platforms')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Gemini Extractor
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('platforms')}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-slate-500"
                >
                  Claude (Awaiting link)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('platforms')}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-slate-500"
                >
                  Grok (Awaiting link)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('platforms')}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-slate-500"
                >
                  Meta AI & Perplexity
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Export & Guides */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Guides & Exports</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('chatgpt-to-markdown')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  ChatGPT to Markdown
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('notion-export')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Notion Export Workflow
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('bookmarklet')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Browser Bookmarklet
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('use-cases')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Personal Use Cases
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('comparison')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Comparison Table
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Product Info */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Overview</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  How It Works (3 Steps)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('features')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Integrity & Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faq')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('changelog')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Changelog
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  About Napo Extractor
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Privacy */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Legal & Trust</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Privacy Policy (Stateless)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Contact & Feedback
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Zero Affiliation Notice */}
        <div className="pt-8 border-t border-[#121927] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Napo extractor is an independent personal-use tool. Not affiliated with OpenAI, Google, Anthropic, xAI, Meta, or Perplexity.
            </span>
          </div>
          <div>
            Trademarks belong to their respective owners. Completely stateless and private.
          </div>
        </div>
      </div>
    </footer>
  );
};
