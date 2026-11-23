import {AnimatePresence, motion} from 'motion/react';
import {Activity, Clock, CornerUpLeft, Layers, Target} from 'lucide-react';
import {FrameStatus, StackFrame} from '../lib/recursionTrace';

interface CallStackPaneProps {
  frames: StackFrame[];
}

function getStatusMeta(status: FrameStatus) {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'ACTIVE',
        Icon: Activity,
        textClass: 'text-emerald-300',
        borderClass: 'border-emerald-500/60',
        bgClass: 'bg-slate-900',
        tagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    case 'WAITING':
      return {
        label: 'WAITING',
        Icon: Clock,
        textClass: 'text-amber-300',
        borderClass: 'border-amber-500/35',
        bgClass: 'bg-slate-950/80',
        tagBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      };
    case 'BASE_CASE':
      return {
        label: 'BASE CASE',
        Icon: Target,
        textClass: 'text-sky-300',
        borderClass: 'border-sky-400/60',
        bgClass: 'bg-slate-900',
        tagBg: 'bg-sky-500/15 text-sky-300 border-sky-400/35',
      };
    case 'RETURNING':
      return {
        label: 'RETURNING',
        Icon: CornerUpLeft,
        textClass: 'text-emerald-300',
        borderClass: 'border-emerald-400/60',
        bgClass: 'bg-emerald-950/30',
        tagBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      };
  }
}

export function CallStackPane({frames}: CallStackPaneProps) {
  // Render top-of-stack at the top so push adds to top and pop removes from top
  const reversedFrames = [...frames].reverse();

  return (
    <aside
      aria-label="Recursive call stack memory"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
    >
      {/* Pane Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/90 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Layers className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span className="font-semibold text-slate-200">Call Stack Memory</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {frames.length} {frames.length === 1 ? 'frame' : 'frames'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">Top of Stack ↑</span>
      </div>

      {/* Stack Container */}
      <div className="custom-scrollbar flex min-h-[250px] max-h-[340px] flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {reversedFrames.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center">
            <p className="font-mono text-xs font-medium text-slate-300">
              Stack is empty (0 frames)
            </p>
            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
              Run Insert, Search, or a Traversal to watch activation frames push onto the call
              stack and pop as returns unwind.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {reversedFrames.map((frame, idx) => {
              const isTop = idx === 0;
              const meta = getStatusMeta(frame.status);
              const StatusIcon = meta.Icon;

              return (
                <motion.div
                  key={frame.id}
                  layout
                  initial={{opacity: 0, y: -10, scale: 0.98}}
                  animate={{opacity: 1, y: 0, scale: 1}}
                  exit={{opacity: 0, y: -10, scale: 0.97}}
                  transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
                  className={`rounded-lg border p-3 transition-colors ${meta.borderClass} ${meta.bgClass}`}
                >
                  {/* Top Row: Frame Depth + Signature + Dual-Coded State Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                        #{frame.depth + 1}
                      </span>
                      <code className="truncate font-mono text-xs font-semibold text-slate-100">
                        {frame.signature}
                      </code>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide whitespace-nowrap shrink-0 ${meta.tagBg}`}
                    >
                      <StatusIcon className="h-3 w-3" aria-hidden="true" />
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  {/* Parameters & Locals Grid */}
                  <div className="mt-2.5 grid grid-cols-1 gap-1.5 border-t border-slate-800/80 pt-2 text-[11px] sm:grid-cols-2">
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-medium text-slate-500">
                        Parameters
                      </span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-slate-300">
                        {frame.params.map((p) => (
                          <span key={p.name}>
                            <span className="text-slate-500">{p.name}:</span>{' '}
                            <span className="text-slate-200">{p.value}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-medium text-slate-500">
                        Local State
                      </span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-slate-300">
                        {frame.locals.map((l) => (
                          <span key={l.name}>
                            <span className="text-slate-500">{l.name}:</span>{' '}
                            <span className={meta.textClass}>{l.value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Return Value Banner when Returning */}
                  {frame.returnValue !== undefined && (
                    <div className="mt-2 flex items-center justify-between rounded bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-300">
                      <span>Return value bubbling up</span>
                      <span className="font-semibold">→ {frame.returnValue}</span>
                    </div>
                  )}

                  {isTop && frames.length > 1 && frame.returnValue === undefined && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Currently executing frame (Line {frame.activeLine})</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </aside>
  );
}
