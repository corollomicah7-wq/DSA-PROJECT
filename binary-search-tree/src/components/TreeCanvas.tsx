import {ArrowDownLeft, ArrowDownRight, GitFork} from 'lucide-react';
import {BSTNode, computeTreeLayout, countNodes, treeHeight} from '../lib/bst';
import {TraceStep} from '../lib/recursionTrace';

interface TreeCanvasProps {
  tree: BSTNode | null;
  currentStep: TraceStep | null;
  onLoadSample: () => void;
}

export function TreeCanvas({tree, currentStep, onLoadSample}: TreeCanvasProps) {
  const displayTree = currentStep ? currentStep.treeSnapshot : tree;
  const nodeCount = countNodes(displayTree);
  const height = treeHeight(displayTree);

  const layout = computeTreeLayout(displayTree);
  const activeEdge = currentStep?.activeEdge ?? null;

  // Compute phantom null target if the current step is probing a null child or null root
  let nullProbe: {
    x: number;
    y: number;
    fromX: number | null;
    fromY: number | null;
    direction: 'left' | 'right' | 'root';
    isBaseCase: boolean;
  } | null = null;

  if (currentStep && activeEdge && activeEdge.toId === null) {
    if (activeEdge.fromId === null) {
      nullProbe = {
        x: 0,
        y: 24,
        fromX: null,
        fromY: null,
        direction: 'root',
        isBaseCase: currentStep.phase === 'BASE_CASE',
      };
    } else {
      const parentPos = layout.nodeMap.get(activeEdge.fromId);
      if (parentPos) {
        const offsetX = activeEdge.direction === 'left' ? -64 : 64;
        nullProbe = {
          x: parentPos.x + offsetX,
          y: parentPos.y + 88,
          fromX: parentPos.x,
          fromY: parentPos.y,
          direction: activeEdge.direction,
          isBaseCase: currentStep.phase === 'BASE_CASE',
        };
      }
    }
  }

  // Expand viewBox to include any phantom null probe node
  let minX = layout.bounds.minX;
  let maxX = layout.bounds.maxX;
  let minY = layout.bounds.minY;
  let maxY = layout.bounds.maxY;

  if (nullProbe) {
    minX = Math.min(minX, nullProbe.x - 80);
    maxX = Math.max(maxX, nullProbe.x + 80);
    minY = Math.min(minY, nullProbe.y - 60);
    maxY = Math.max(maxY, nullProbe.y + 80);
  }

  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  const isTraversal =
    currentStep?.operation === 'inorder' ||
    currentStep?.operation === 'preorder' ||
    currentStep?.operation === 'postorder';

  const waitingSet = new Set(currentStep?.waitingNodeIds ?? []);
  const visitedList = currentStep?.visitedNodeIds ?? [];
  const visitedSet = new Set(visitedList);

  const showEmptyPlaceholder = !displayTree && !nullProbe;

  return (
    <section
      aria-label="Binary Search Tree canvas"
      className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 lg:min-h-[540px]"
    >
      {/* Canvas Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <GitFork className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span className="font-semibold text-slate-200">Tree Canvas</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">Nodes: {nodeCount}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">Height: {height}</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {currentStep?.comparisonText ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              {activeEdge?.direction === 'left' && (
                <ArrowDownLeft className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              )}
              {activeEdge?.direction === 'right' && (
                <ArrowDownRight className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              )}
              <span>{currentStep.comparisonText}</span>
            </span>
          ) : (
            <span className="text-slate-500">
              {displayTree ? 'Ready for next operation' : 'root = null'}
            </span>
          )}
        </div>
      </div>

      {/* Interactive SVG Stage */}
      <figure className="tree-grid-bg relative flex flex-1 flex-col items-center justify-center overflow-hidden p-4">
        {showEmptyPlaceholder ? (
          <div className="flex max-w-md flex-col items-center text-center">
            <div
              aria-hidden="true"
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-700 bg-slate-900/70 font-mono text-xs font-medium text-slate-500"
            >
              null
            </div>
            <p className="text-sm font-medium text-slate-200">
              Tree is empty. Enter a number to insert the root node.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Type an integer in the input bar above and press Enter to trigger your first
              recursive <code className="text-emerald-400">insert(null, val)</code> call.
            </p>
            <button
              type="button"
              onClick={onLoadSample}
              className="mt-4 text-xs font-medium text-slate-400 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-emerald-400 hover:decoration-emerald-500/60"
            >
              Or load a 7-node sample tree
            </button>
          </div>
        ) : (
          <svg
            viewBox={viewBox}
            className="h-full max-h-[470px] w-full select-none"
            role="img"
            aria-label={`Binary search tree with ${nodeCount} nodes`}
          >
            <defs>
              <filter id="emerald-glow" x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Existing Edges */}
            <g aria-label="Tree branches">
              {layout.edges.map((edge) => {
                const isEdgeActive =
                  activeEdge &&
                  activeEdge.fromId === edge.fromId &&
                  activeEdge.toId === edge.toId;
                const isPendingLink = currentStep?.pendingLinkNodeId === edge.toId;

                const midX = (edge.x1 + edge.x2) / 2;
                const midY = (edge.y1 + edge.y2) / 2;

                return (
                  <g key={edge.id}>
                    <line
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke={
                        isPendingLink
                          ? '#10b981'
                          : isEdgeActive
                            ? '#38bdf8'
                            : '#334155'
                      }
                      strokeWidth={isEdgeActive || isPendingLink ? 2.8 : 2}
                      strokeDasharray={isPendingLink ? '6 4' : undefined}
                      className="transition-all duration-200"
                    />
                    {isEdgeActive && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-11}
                          y={-9}
                          width={22}
                          height={18}
                          rx={4}
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth={1}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-sky-300 font-mono text-[10px] font-semibold"
                        >
                          {edge.direction === 'left' ? 'L' : 'R'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Phantom Null Probe Edge + Node */}
            {nullProbe && (
              <g aria-label="Null pointer base case target">
                {nullProbe.fromX !== null && nullProbe.fromY !== null && (
                  <line
                    x1={nullProbe.fromX}
                    y1={nullProbe.fromY}
                    x2={nullProbe.x}
                    y2={nullProbe.y}
                    stroke={nullProbe.isBaseCase ? '#10b981' : '#38bdf8'}
                    strokeWidth={2.2}
                    strokeDasharray="5 4"
                  />
                )}
                <g transform={`translate(${nullProbe.x}, ${nullProbe.y})`}>
                  <circle
                    r={22}
                    fill="#020617"
                    stroke={nullProbe.isBaseCase ? '#10b981' : '#38bdf8'}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`font-mono text-[11px] font-semibold ${
                      nullProbe.isBaseCase ? 'fill-emerald-400' : 'fill-sky-300'
                    }`}
                  >
                    null
                  </text>
                  <text
                    y={36}
                    textAnchor="middle"
                    className={`font-mono text-[10px] font-semibold tracking-wider ${
                      nullProbe.isBaseCase ? 'fill-emerald-400' : 'fill-sky-400'
                    }`}
                  >
                    {nullProbe.isBaseCase ? 'BASE CASE' : 'PROBING'}
                  </text>
                </g>
              </g>
            )}

            {/* Tree Nodes */}
            <g aria-label="Tree nodes">
              {layout.nodes.map((node) => {
                const isActive = currentStep?.activeNodeId === node.id;
                const isWaiting = waitingSet.has(node.id);
                const isNew = currentStep?.newlyCreatedNodeId === node.id;
                const isFound = currentStep?.foundNodeId === node.id;
                const visitIndex = visitedList.indexOf(node.id);
                const isVisited = visitedSet.has(node.id);

                let fill = '#0f172a';
                let stroke = '#475569';
                let strokeWidth = 2;
                let strokeDasharray: string | undefined;
                let textFill = 'fill-slate-100';
                let stateTag: string | null = null;
                let stateTagColor = 'fill-slate-400';

                if (isVisited && !isActive && !isFound) {
                  fill = '#064e3b';
                  stroke = '#059669';
                  textFill = 'fill-emerald-100';
                  if (isTraversal && visitIndex >= 0) {
                    stateTag = `#${visitIndex + 1}`;
                    stateTagColor = 'fill-emerald-400';
                  }
                }

                if (isWaiting) {
                  fill = '#0f172a';
                  stroke = '#f59e0b';
                  strokeWidth = 2.2;
                  strokeDasharray = '5 3';
                  stateTag = 'WAIT';
                  stateTagColor = 'fill-amber-400';
                }

                if (isNew) {
                  fill = '#065f46';
                  stroke = '#10b981';
                  strokeWidth = 3;
                  strokeDasharray = undefined;
                  textFill = 'fill-white';
                  stateTag = 'NEW';
                  stateTagColor = 'fill-emerald-300';
                }

                if (isFound) {
                  fill = '#065f46';
                  stroke = '#34d399';
                  strokeWidth = 3;
                  strokeDasharray = undefined;
                  textFill = 'fill-white';
                  stateTag = 'FOUND';
                  stateTagColor = 'fill-emerald-300';
                }

                if (isActive && !isNew && !isFound) {
                  fill = '#0f172a';
                  stroke = '#10b981';
                  strokeWidth = 3;
                  strokeDasharray = undefined;
                  textFill = 'fill-emerald-200';
                  stateTag = 'ACTIVE';
                  stateTagColor = 'fill-emerald-400';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="transition-transform duration-200"
                  >
                    {(isActive || isNew || isFound) && (
                      <circle
                        r={30}
                        fill="none"
                        stroke="#10b981"
                        strokeOpacity={0.28}
                        strokeWidth={4}
                      />
                    )}

                    <circle
                      r={24}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />

                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`font-mono text-[14px] font-bold ${textFill}`}
                    >
                      {node.val}
                    </text>

                    {node.depth === 0 && !stateTag && (
                      <text
                        y={-32}
                        textAnchor="middle"
                        className="font-mono text-[10px] font-medium fill-slate-500"
                      >
                        root
                      </text>
                    )}

                    {stateTag && (
                      <text
                        y={38}
                        textAnchor="middle"
                        className={`font-mono text-[10px] font-semibold tracking-wider ${stateTagColor}`}
                      >
                        {stateTag}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Traversal Live Sequence Output Bar */}
        {isTraversal && currentStep && (
          <div className="mt-2 flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-2">
            <span className="text-xs font-medium text-slate-400">
              {currentStep.operation === 'inorder'
                ? 'In-order Output (Left · Visit · Right)'
                : currentStep.operation === 'preorder'
                  ? 'Pre-order Output (Visit · Left · Right)'
                  : 'Post-order Output (Left · Right · Visit)'}
            </span>
            <div className="font-mono text-xs font-semibold text-emerald-300 tabular-nums">
              [{currentStep.traversalOutput.join(', ')}]
            </div>
          </div>
        )}
      </figure>

      {/* Canvas Footer Legend (Dual-coded symbols + text, zero pills) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-800/90 bg-slate-900/70 px-4 py-2 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full border-2 border-emerald-400 bg-slate-950"
          />
          <span>Active Frame Node</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed border-amber-400 bg-slate-950"
          />
          <span>Waiting on Stack</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full border border-emerald-400 bg-emerald-800"
          />
          <span>Base Case / Found</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-sky-400 bg-slate-950"
          />
          <span>Null Child Pointer</span>
        </span>
      </div>
    </section>
  );
}
