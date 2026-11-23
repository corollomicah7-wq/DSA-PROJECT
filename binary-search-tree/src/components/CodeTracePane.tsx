import {useState} from 'react';
import {Code2, ListOrdered} from 'lucide-react';
import {OPERATION_CODE, OperationType, TraceStep} from '../lib/recursionTrace';

interface CodeTracePaneProps {
  operation: OperationType;
  steps: TraceStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
}

export function CodeTracePane({
  operation,
  steps,
  currentStepIndex,
  onSelectStep,
}: CodeTracePaneProps) {
  const [tab, setTab] = useState<'code' | 'log'>('code');
  const currentStep = steps[currentStepIndex] ?? null;
  const codeLines = OPERATION_CODE[operation];
  const activeLine = currentStep ? currentStep.activeLine : null;

  const opTitle =
    operation === 'insert'
      ? 'insert(node, val)'
      : operation === 'search'
        ? 'search(node, val)'
        : operation === 'inorder'
          ? 'inOrder(node)'
          : operation === 'preorder'
            ? 'preOrder(node)'
            : 'postOrder(node)';

  return (
    <section
      aria-label="Recursive code highlighter and execution log"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
    >
      {/* Header with Segmented Switch */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/90 bg-slate-900/80 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Code2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span className="font-semibold text-slate-200">Execution Trace</span>
          <span aria-hidden="true">·</span>
          <code className="font-mono text-slate-300">{opTitle}</code>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 p-0.5">
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'code'
                ? 'bg-slate-800 text-emerald-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-3 w-3" aria-hidden="true" />
            <span>Code</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('log')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'log'
                ? 'bg-slate-800 text-emerald-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="h-3 w-3" aria-hidden="true" />
            <span>Step Log ({steps.length})</span>
          </button>
        </div>
      </div>

      {/* Live Step Narrative */}
      <div className="border-b border-slate-800/70 bg-slate-950/60 px-4 py-2.5">
        <p className="text-xs leading-relaxed text-slate-200">
          {currentStep
            ? currentStep.explanation
            : 'Insert a number or run a tree operation to follow line-by-line recursive execution.'}
        </p>
      </div>

      {/* Tab Content */}
      {tab === 'code' ? (
        <div className="custom-scrollbar overflow-x-auto bg-slate-950/80 py-2 font-mono text-xs leading-6">
          <pre className="m-0">
            <code>
              {codeLines.map((line, i) => {
                const lineNum = i + 1;
                const isActive = activeLine === lineNum;
                return (
                  <div
                    key={lineNum}
                    className={`flex items-center px-4 transition-colors ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`mr-4 inline-block w-4 select-none text-right tabular-nums ${
                        isActive ? 'font-bold text-emerald-400' : 'text-slate-600'
                      }`}
                    >
                      {lineNum}
                    </span>
                    <span className="flex-1 whitespace-pre">{line}</span>
                    {isActive && (
                      <span
                        aria-label="Currently executing line"
                        className="ml-3 text-[10px] font-semibold text-emerald-400"
                      >
                        ◀ EXEC
                      </span>
                    )}
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      ) : (
        <div className="custom-scrollbar max-h-[260px] overflow-y-auto bg-slate-950/80 p-2">
          {steps.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">
              No steps recorded yet.
            </p>
          ) : (
            <ol className="space-y-1">
              {steps.map((s) => {
                const isCurrent = s.stepIndex === currentStepIndex;
                return (
                  <li key={s.stepIndex}>
                    <button
                      type="button"
                      onClick={() => onSelectStep(s.stepIndex)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left font-mono text-[11px] transition-colors ${
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/35'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">
                        <span className="mr-2 text-slate-600 tabular-nums">
                          {String(s.stepIndex + 1).padStart(2, '0')}.
                        </span>
                        {s.logSummary}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500 tabular-nums">
                        depth {s.stackFrames.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
