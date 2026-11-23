export function RecursionGuide() {
  return (
    <section
      aria-label="Recursion and BST educational reference"
      className="mx-auto max-w-[1440px] border-t border-slate-800/80 px-4 py-12 sm:px-6"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Stack Frames Anatomy */}
        <article id="stack-guide" className="scroll-mt-20 space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-100">
            01. How Stack Frames Expand and Contract
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Every recursive function call allocates a new{' '}
            <strong className="font-medium text-slate-200">activation frame</strong> on
            the call stack holding its own <code className="text-emerald-400">node</code>{' '}
            parameter and local comparison state. While waiting for a child call to
            finish, the parent frame stays paused in memory in a{' '}
            <code className="text-amber-300">WAITING</code> state.
          </p>
          <p className="text-sm leading-relaxed text-slate-400">
            Once execution hits a <code className="text-sky-300">BASE CASE</code> (such as{' '}
            <code className="text-slate-200">node === null</code> or a matching key), the
            frame returns its result and pops off the top of the stack—resuming each
            waiting parent frame one by one until the stack is empty.
          </p>
        </article>

        {/* Traversals Comparison */}
        <article id="traversals-guide" className="scroll-mt-20 space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-100">
            02. Recursive Tree Traversals
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="border-b border-slate-800/70 pb-2">
              <dt className="font-mono text-xs font-semibold text-emerald-400">
                In-order (Left → Visit → Right)
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-slate-400">
                Explores the entire left subtree before visiting the node, producing keys
                in ascending sorted order on any valid BST.
              </dd>
            </div>
            <div className="border-b border-slate-800/70 pb-2">
              <dt className="font-mono text-xs font-semibold text-emerald-400">
                Pre-order (Visit → Left → Right)
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-slate-400">
                Visits each node as soon as its frame is pushed, useful for cloning or
                serializing tree structure from root downward.
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs font-semibold text-emerald-400">
                Post-order (Left → Right → Visit)
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-slate-400">
                Defers visiting a node until both left and right subtrees have popped,
                ideal for bottom-up height calculation or deletion.
              </dd>
            </div>
          </dl>
        </article>

        {/* Keyboard Shortcuts */}
        <article id="shortcuts-guide" className="scroll-mt-20 space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-100">
            03. Keyboard Controls
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Step backward and forward through recursive call frames directly from your
            keyboard while inspecting variables and pointer updates.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center justify-between border-b border-slate-800/70 pb-1.5">
              <span>Insert typed value</span>
              <kbd className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                Enter
              </kbd>
            </li>
            <li className="flex items-center justify-between border-b border-slate-800/70 pb-1.5">
              <span>Play / Pause recursion playback</span>
              <kbd className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                Space
              </kbd>
            </li>
            <li className="flex items-center justify-between border-b border-slate-800/70 pb-1.5">
              <span>Step backward / forward</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                  ←
                </kbd>
                <kbd className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                  →
                </kbd>
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Focus number input</span>
              <kbd className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                /
              </kbd>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
