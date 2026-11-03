/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProgressStage } from '../types/extractor';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface ProgressStepperProps {
  stage: ProgressStage;
  liveMessageCount?: number;
  liveCharCount?: number;
}

const STAGES: { id: ProgressStage; label: string }[] = [
  { id: 'connect', label: 'Connect' },
  { id: 'load', label: 'Load' },
  { id: 'extract', label: 'Extract' },
  { id: 'done', label: 'Done' },
];

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  stage,
  liveMessageCount = 0,
  liveCharCount = 0,
}) => {
  if (stage === 'idle') return null;

  const stageOrder = ['connect', 'load', 'extract', 'done'];
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="w-full bg-[#0c121e] border border-[#1b263b] rounded-xl p-4 my-4">
      <div className="flex items-center justify-between relative max-w-xl mx-auto">
        {/* Progress line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#1b263b] -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-300"
          style={{
            width:
              stage === 'done'
                ? '100%'
                : stage === 'error'
                ? '50%'
                : `${Math.max(0, currentIndex) * 33.3}%`,
          }}
        />

        {STAGES.map((s, index) => {
          const isDone = stage === 'done' || (currentIndex > index && stage !== 'error');
          const isCurrent = stage === s.id;
          const isFailed = stage === 'error' && currentIndex <= index;

          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  isDone
                    ? 'bg-blue-600 text-white ring-4 ring-[#0c121e]'
                    : isCurrent
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500 ring-4 ring-[#0c121e]'
                    : isFailed
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : 'bg-[#151e2e] text-slate-500 border border-[#24334c]'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  isDone || isCurrent ? 'text-white' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live extraction metrics counter */}
      {(stage === 'load' || stage === 'extract') && (
        <div className="mt-4 pt-3 border-t border-[#1b263b]/60 flex items-center justify-center gap-6 text-xs font-mono text-blue-300/80">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Inspecting messages:</span>
            <span className="tabular-nums font-semibold text-white">{liveMessageCount}</span>
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Streamed chars:</span>
            <span className="tabular-nums font-semibold text-white">{liveCharCount}</span>
          </span>
        </div>
      )}
    </div>
  );
};
