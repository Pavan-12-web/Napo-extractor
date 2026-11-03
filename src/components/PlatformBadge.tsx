/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlatformId } from '../types/extractor';

interface PlatformBadgeProps {
  platform: PlatformId | null;
  className?: string;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, className = '' }) => {
  if (!platform) {
    return (
      <span className={`inline-flex items-center text-xs text-slate-400 font-mono ${className}`}>
        Auto-detecting platform...
      </span>
    );
  }

  const configs: Record<
    PlatformId,
    { label: string; isActive: boolean; note?: string }
  > = {
    chatgpt: { label: 'ChatGPT', isActive: true },
    gemini: { label: 'Gemini', isActive: true },
    claude: { label: 'Claude', isActive: false, note: 'awaiting sample link' },
    grok: { label: 'Grok', isActive: false, note: 'awaiting sample link' },
    meta: { label: 'Meta AI', isActive: false, note: 'awaiting sample link' },
    perplexity: { label: 'Perplexity', isActive: false, note: 'awaiting sample link' },
  };

  const current = configs[platform];

  return (
    <div className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <span className="font-semibold text-white">{current.label}</span>
      <span aria-hidden="true" className="text-slate-600">·</span>
      {current.isActive ? (
        <span className="text-blue-400 font-mono">Adapter Active</span>
      ) : (
        <span className="text-amber-400/90 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
          Awaiting Sample Link
        </span>
      )}
    </div>
  );
};
