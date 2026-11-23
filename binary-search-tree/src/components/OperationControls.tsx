import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import {OperationType} from '../lib/recursionTrace';

interface OperationControlsProps {
  inputValue: string;
  onInputChange: (val: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputError: string | null;
  onInsert: () => void;
  onSearch: () => void;
  onTraversal: (order: 'inorder' | 'preorder' | 'postorder') => void;
  activeOperation: OperationType | null;
  hasTrace: boolean;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlayPause: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onStepReset: () => void;
  onScrub: (index: number) => void;
  onSpeedChange: (speed: number) => void;
  hasNodes: boolean;
}

const SPEEDS = [
  {label: '0.5x', ms: 1400},
  {label: '1x', ms: 800},
  {label: '2x', ms: 380},
];

export function OperationControls({
  inputValue,
  onInputChange,
  inputRef,
  inputError,
  onInsert,
  onSearch,
  onTraversal,
  activeOperation,
  hasTrace,
  stepIndex,
  totalSteps,
  isPlaying,
  speed,
  onPlayPause,
  onStepPrev,
  onStepNext,
  onStepReset,
  onScrub,
  onSpeedChange,
  hasNodes,
}: OperationControlsProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsert();
  };

  return (
    <section
      aria-label="Tree operations and playback controls"
      className="border-b border-slate-800/90 bg-slate-900/50"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        {/* Left: Value Input + Insert / Search + Traversals */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative">
              <label htmlFor="bst-node-input" className="sr-only">
                Integer value for BST insert or search
              </label>
              <input
                id="bst-node-input"
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Enter number (e.g. 50)"
                className={`h-10 w-44 rounded-lg border bg-slate-950 px-3 font-mono text-sm text-slate-100 placeholder:font-sans placeholder:text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                  inputError
                    ? 'border-rose-500/80 focus:ring-rose-500/40'
                    : 'border-slate-700/90 focus:border-emerald-500 focus:ring-emerald-500/30'
                }`}
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 active:bg-emerald-600 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Insert</span>
            </button>

            <button
              type="button"
              onClick={onSearch}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Search</span>
            </button>
          </form>

          <div className="hidden h-6 w-px bg-slate-800 sm:block" aria-hidden="true" />

          {/* Recursive Traversals */}
          <div
            role="group"
            aria-label="Recursive traversals"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-1"
          >
            <span className="hidden items-center gap-1.5 px-2 text-xs font-medium text-slate-500 sm:inline-flex whitespace-nowrap shrink-0">
              <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
              Traverse
            </span>
            {(['inorder', 'preorder', 'postorder'] as const).map((order) => {
              const label =
                order === 'inorder'
                  ? 'In-order'
                  : order === 'preorder'
                    ? 'Pre-order'
                    : 'Post-order';
              const isSelected = activeOperation === order && hasTrace;
              return (
                <button
                  key={order}
                  type="button"
                  onClick={() => onTraversal(order)}
                  disabled={!hasNodes}
                  className={`h-8 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Step Control Scrubber */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Step playback controls"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-1"
          >
            <button
              type="button"
              onClick={onStepReset}
              disabled={!hasTrace || stepIndex === 0}
              title="Reset to step 0"
              aria-label="Reset playback to start"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onStepPrev}
              disabled={!hasTrace || stepIndex <= 0}
              title="Previous step (Left Arrow)"
              aria-label="Previous step"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onPlayPause}
              disabled={!hasTrace}
              title="Play / Pause (Space)"
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                isPlaying
                  ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/25'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStepNext}
              disabled={!hasTrace || stepIndex >= totalSteps - 1}
              title="Next step (Right Arrow)"
              aria-label="Next step"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Scrubber Slider */}
          <div className="flex items-center gap-2.5">
            <label htmlFor="step-scrubber" className="sr-only">
              Step progress scrubber
            </label>
            <input
              id="step-scrubber"
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={hasTrace ? stepIndex : 0}
              disabled={!hasTrace || totalSteps <= 1}
              onChange={(e) => onScrub(Number(e.target.value))}
              className="step-scrubber w-28 sm:w-36 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <span className="min-w-[74px] text-right font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap">
              {hasTrace ? `Step ${stepIndex + 1}/${totalSteps}` : 'Idle'}
            </span>
          </div>

          {/* Speed Selector */}
          <div
            role="group"
            aria-label="Playback speed"
            className="flex items-center rounded-lg border border-slate-800 bg-slate-950/70 p-0.5"
          >
            {SPEEDS.map((s) => {
              const active = speed === s.ms;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => onSpeedChange(s.ms)}
                  className={`h-7 rounded-md px-2 font-mono text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-slate-800 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {inputError && (
        <div className="mx-auto max-w-[1440px] px-4 pb-2.5 sm:px-6">
          <p role="alert" className="text-xs font-medium text-rose-400">
            {inputError}
          </p>
        </div>
      )}
    </section>
  );
}
