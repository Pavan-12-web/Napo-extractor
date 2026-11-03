/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ACCEPTANCE_FIXTURES, TestFixture } from '../fixtures/acceptanceTests';
import { orchestrateParse } from '../lib/parserOrchestrator';
import { EMPTY_SHELL_ERROR_MESSAGE } from '../lib/validation';
import { NormalizedConversation } from '../types/schema';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TestLabProps {
  onLoadIntoApp: (payload: string, conversation: NormalizedConversation | null) => void;
}

export const TestLab: React.FC<TestLabProps> = ({ onLoadIntoApp }) => {
  const [testResults, setTestResults] = useState<Record<string, { passed: boolean; message: string }>>({});
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const runSingleTest = (fixture: TestFixture) => {
    const res = orchestrateParse(fixture.rawPayload, fixture.id === 'live-claude-sample' ? fixture.rawPayload : '');

    let passed = false;
    let message = '';

    if (fixture.id === 'claude-empty-shell') {
      // Must detect empty shell and return exact error message
      if (res.isEmptyShell && res.errorMessage === EMPTY_SHELL_ERROR_MESSAGE) {
        passed = true;
        message = 'Pass: Correctly caught empty application shell and output required recovery error.';
      } else {
        passed = false;
        message = `Fail: Expected empty shell error, got "${res.errorMessage}"`;
      }
    } else if (fixture.id === 'expired-private-link') {
      if (!res.success || res.conversation?.extractionStatus === 'error') {
        passed = true;
        message = 'Pass: Correctly detected expired/private share state.';
      } else {
        passed = false;
        message = 'Fail: Did not detect private link.';
      }
    } else if (fixture.id === 'malicious-html-xss') {
      // Verify script tags were completely stripped and window was not compromised
      const content = res.conversation?.messages.map(m => m.content).join(' ') || '';
      if (!content.includes('<script>') && !content.includes('onerror=') && !content.includes('javascript:')) {
        passed = true;
        message = 'Pass: Malicious <script> and onerror= handlers were strictly neutralized.';
      } else {
        passed = false;
        message = 'Fail: Malicious tokens survived sanitization.';
      }
    } else {
      if (res.success && res.conversation && res.conversation.messages.length > 0) {
        passed = true;
        message = `Pass: Extracted ${res.conversation.messages.length} message turn(s) with ${res.conversation.extractionStatus} status.`;
      } else {
        passed = false;
        message = `Fail: ${res.errorMessage || 'No messages extracted.'}`;
      }
    }

    setTestResults(prev => ({ ...prev, [fixture.id]: { passed, message } }));
    return { passed, conversation: res.conversation };
  };

  const runAllTests = () => {
    setIsRunningAll(true);
    const results: Record<string, { passed: boolean; message: string }> = {};

    ACCEPTANCE_FIXTURES.forEach(f => {
      const { passed, message } = runSingleTest(f) as any;
      // results recorded in state
    });

    setTimeout(() => {
      setIsRunningAll(false);
    }, 400);
  };

  const passedCount = Object.values(testResults).filter(r => r.passed).length;
  const totalRun = Object.keys(testResults).length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-[#0b101c] border border-blue-500/40 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#18253a]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Acceptance Test Lab
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated testing suite for 16 core extraction scenarios, shell detectors, and security vectors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {totalRun > 0 && (
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${
                passedCount === totalRun
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
              }`}>
                {passedCount} / {ACCEPTANCE_FIXTURES.length} Passed
              </span>
            )}

            <button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningAll ? 'Running Tests...' : 'Run All 16 Tests'}</span>
            </button>
          </div>
        </div>

        {/* Fixture Grid */}
        <div className="space-y-3 mt-6">
          {ACCEPTANCE_FIXTURES.map(fixture => {
            const result = testResults[fixture.id];
            const isExpanded = expandedFixture === fixture.id;

            return (
              <div
                key={fixture.id}
                className="bg-[#080d18] border border-[#162133] hover:border-[#1e2e47] rounded-xl p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{fixture.title}</h4>
                      <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-[#0e1626]">
                        {fixture.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{fixture.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {result && (
                      <span className={`flex items-center gap-1 text-[11px] font-mono font-semibold ${
                        result.passed ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>{result.passed ? 'Pass' : 'Fail'}</span>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        const { conversation } = runSingleTest(fixture);
                        onLoadIntoApp(fixture.rawPayload, conversation);
                      }}
                      className="px-3 py-1.5 bg-[#121a2a] hover:bg-[#1a2538] border border-[#22314a] text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Load into Extractor
                    </button>

                    <button
                      onClick={() => setExpandedFixture(isExpanded ? null : fixture.id)}
                      className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                      title="View Fixture Payload"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {result && (
                  <div className={`mt-2.5 pt-2.5 border-t border-[#141e30] text-[11px] font-mono ${
                    result.passed ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {result.message}
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#141e30]">
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">Raw Fixture Payload:</span>
                    <pre className="p-3 bg-[#05070e] rounded border border-[#121927] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                      <code>{fixture.rawPayload}</code>
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
