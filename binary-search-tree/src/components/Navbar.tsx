import {RotateCcw} from 'lucide-react';

interface NavbarProps {
  onClearTree: () => void;
  hasNodes: boolean;
}

export function Navbar({onClearTree, hasNodes}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workbench"
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500"
        >
          RecursionTree
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <a
            href="#workbench"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Visualizer
          </a>
          <a
            href="#stack-guide"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Stack Frames
          </a>
          <a
            href="#traversals-guide"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Traversals
          </a>
          <a
            href="#shortcuts-guide"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Shortcuts
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onClearTree}
            disabled={!hasNodes}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear Tree</span>
          </button>
        </div>
      </div>
    </header>
  );
}
