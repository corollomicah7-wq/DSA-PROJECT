import {useCallback, useEffect, useRef, useState} from 'react';
import {CallStackPane} from './components/CallStackPane';
import {CodeTracePane} from './components/CodeTracePane';
import {Navbar} from './components/Navbar';
import {OperationControls} from './components/OperationControls';
import {RecursionGuide} from './components/RecursionGuide';
import {TreeCanvas} from './components/TreeCanvas';
import {BSTNode, buildSampleTree, countNodes} from './lib/bst';
import {
  OperationTrace,
  OperationType,
  generateInsertTrace,
  generateSearchTrace,
  generateTraversalTrace,
} from './lib/recursionTrace';

export default function App() {
  // Initialize with an EMPTY tree (root = null)
  const [tree, setTree] = useState<BSTNode | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const [trace, setTrace] = useState<OperationTrace | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(800);
  const [codeOperation, setCodeOperation] = useState<OperationType>('insert');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the number input when the page loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !trace) return;

    if (stepIndex >= trace.steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex((prev) => {
        if (!trace) return prev;
        const next = Math.min(prev + 1, trace.steps.length - 1);
        if (next >= trace.steps.length - 1) {
          setIsPlaying(false);
        }
        return next;
      });
    }, speed);

    return () => window.clearTimeout(timer);
  }, [isPlaying, stepIndex, trace, speed]);

  const parseInputInt = (): number | null => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError('Enter an integer value first.');
      inputRef.current?.focus();
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || Math.abs(parsed) > 9999) {
      setInputError('Please enter an integer between -9999 and 9999.');
      inputRef.current?.focus();
      return null;
    }
    setInputError(null);
    return parsed;
  };

  const startTrace = useCallback((newTrace: OperationTrace) => {
    setTrace(newTrace);
    setCodeOperation(newTrace.operation);
    setStepIndex(0);
    setIsPlaying(true);
  }, []);

  const handleInsert = () => {
    const val = parseInputInt();
    if (val === null) return;

    const newTrace = generateInsertTrace(tree, val);
    setTree(newTrace.finalTree);
    setInputValue('');
    startTrace(newTrace);
    inputRef.current?.focus();
  };

  const handleSearch = () => {
    const val = parseInputInt();
    if (val === null) return;

    const newTrace = generateSearchTrace(tree, val);
    startTrace(newTrace);
  };

  const handleTraversal = (order: 'inorder' | 'preorder' | 'postorder') => {
    setInputError(null);
    const newTrace = generateTraversalTrace(tree, order);
    startTrace(newTrace);
  };

  const handleClearTree = () => {
    setIsPlaying(false);
    setTree(null);
    setTrace(null);
    setStepIndex(0);
    setCodeOperation('insert');
    setInputError(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleLoadSample = () => {
    setIsPlaying(false);
    const sample = buildSampleTree();
    setTree(sample);
    setTrace(null);
    setStepIndex(0);
    setCodeOperation('inorder');
    setInputError(null);
    inputRef.current?.focus();
  };

  const handlePlayPause = useCallback(() => {
    if (!trace) return;
    if (stepIndex >= trace.steps.length - 1) {
      setStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [trace, stepIndex]);

  const handleStepPrev = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleStepNext = useCallback(() => {
    if (!trace) return;
    setIsPlaying(false);
    setStepIndex((prev) => Math.min(trace.steps.length - 1, prev + 1));
  }, [trace]);

  const handleStepReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleScrub = (index: number) => {
    setIsPlaying(false);
    setStepIndex(index);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (isInput) return;

      if (e.code === 'Space' && trace) {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'ArrowLeft' && trace) {
        e.preventDefault();
        handleStepPrev();
      } else if (e.key === 'ArrowRight' && trace) {
        e.preventDefault();
        handleStepNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [trace, handlePlayPause, handleStepPrev, handleStepNext]);

  const currentStep = trace ? trace.steps[stepIndex] ?? null : null;
  const hasNodes = countNodes(tree) > 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar onClearTree={handleClearTree} hasNodes={hasNodes} />

      <OperationControls
        inputValue={inputValue}
        onInputChange={(val) => {
          setInputValue(val);
          if (inputError) setInputError(null);
        }}
        inputRef={inputRef}
        inputError={inputError}
        onInsert={handleInsert}
        onSearch={handleSearch}
        onTraversal={handleTraversal}
        activeOperation={trace?.operation ?? null}
        hasTrace={Boolean(trace)}
        stepIndex={stepIndex}
        totalSteps={trace?.steps.length ?? 0}
        isPlaying={isPlaying}
        speed={speed}
        onPlayPause={handlePlayPause}
        onStepPrev={handleStepPrev}
        onStepNext={handleStepNext}
        onStepReset={handleStepReset}
        onScrub={handleScrub}
        onSpeedChange={setSpeed}
        hasNodes={hasNodes}
      />

      {/* Dual-Pane Interactive Workspace */}
      <main id="workbench" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
          {/* Left / Main Pane: Tree Canvas */}
          <div className="flex flex-col lg:col-span-7 xl:col-span-8">
            <TreeCanvas
              tree={tree}
              currentStep={currentStep}
              onLoadSample={handleLoadSample}
            />
          </div>

          {/* Right Pane: Recursive Call Stack Memory + Code Highlighter */}
          <div className="flex flex-col gap-5 lg:col-span-5 xl:col-span-4">
            <CallStackPane frames={currentStep?.stackFrames ?? []} />
            <CodeTracePane
              operation={codeOperation}
              steps={trace?.steps ?? []}
              currentStepIndex={stepIndex}
              onSelectStep={handleScrub}
            />
          </div>
        </div>
      </main>

      {/* Educational Reference Section */}
      <RecursionGuide />

      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        <p>RecursionTree · Binary Search Tree &amp; Call Stack Memory Visualizer</p>
      </footer>
    </div>
  );
}
