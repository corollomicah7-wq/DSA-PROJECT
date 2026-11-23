import {BSTNode, cloneTree, createNodeId} from './bst';

export type OperationType = 'insert' | 'search' | 'inorder' | 'preorder' | 'postorder';

export type FrameStatus = 'ACTIVE' | 'WAITING' | 'BASE_CASE' | 'RETURNING';

export interface StackFrame {
  id: string;
  depth: number;
  fnName: string;
  signature: string;
  nodeId: string | null;
  nodeLabel: string;
  params: Array<{name: string; value: string}>;
  locals: Array<{name: string; value: string}>;
  status: FrameStatus;
  returnValue?: string;
  activeLine: number;
}

export interface ActiveEdgeRef {
  fromId: string | null; // null if probing root
  toId: string | null; // null if probing a null pointer
  direction: 'left' | 'right' | 'root';
}

export type StepPhase =
  | 'PUSH'
  | 'COMPARE'
  | 'DESCEND'
  | 'BASE_CASE'
  | 'VISIT'
  | 'UNWIND'
  | 'COMPLETE';

export interface TraceStep {
  stepIndex: number;
  operation: OperationType;
  phase: StepPhase;
  treeSnapshot: BSTNode | null;
  stackFrames: StackFrame[];
  activeNodeId: string | null;
  waitingNodeIds: string[];
  visitedNodeIds: string[];
  newlyCreatedNodeId: string | null;
  pendingLinkNodeId: string | null;
  foundNodeId: string | null;
  notFound: boolean;
  activeEdge: ActiveEdgeRef | null;
  comparisonText: string | null;
  traversalOutput: number[];
  activeLine: number;
  explanation: string;
  logSummary: string;
}

export interface OperationTrace {
  operation: OperationType;
  targetValue?: number;
  steps: TraceStep[];
  finalTree: BSTNode | null;
  resultLabel: string;
}

export const OPERATION_CODE: Record<OperationType, string[]> = {
  insert: [
    'function insert(node: TreeNode | null, val: number): TreeNode {',
    '  if (node === null) {',
    '    return new TreeNode(val);',
    '  }',
    '  if (val < node.val) {',
    '    node.left = insert(node.left, val);',
    '  } else if (val > node.val) {',
    '    node.right = insert(node.right, val);',
    '  }',
    '  return node;',
    '}',
  ],
  search: [
    'function search(node: TreeNode | null, val: number): boolean {',
    '  if (node === null) {',
    '    return false;',
    '  }',
    '  if (val === node.val) {',
    '    return true;',
    '  }',
    '  if (val < node.val) {',
    '    return search(node.left, val);',
    '  }',
    '  return search(node.right, val);',
    '}',
  ],
  inorder: [
    'function inOrder(node: TreeNode | null): void {',
    '  if (node === null) {',
    '    return;',
    '  }',
    '  inOrder(node.left);',
    '  visit(node.val);',
    '  inOrder(node.right);',
    '}',
  ],
  preorder: [
    'function preOrder(node: TreeNode | null): void {',
    '  if (node === null) {',
    '    return;',
    '  }',
    '  visit(node.val);',
    '  preOrder(node.left);',
    '  preOrder(node.right);',
    '}',
  ],
  postorder: [
    'function postOrder(node: TreeNode | null): void {',
    '  if (node === null) {',
    '    return;',
    '  }',
    '  postOrder(node.left);',
    '  postOrder(node.right);',
    '  visit(node.val);',
    '}',
  ],
};

function cloneFrames(frames: StackFrame[]): StackFrame[] {
  return frames.map((f) => ({
    ...f,
    params: f.params.map((p) => ({...p})),
    locals: f.locals.map((l) => ({...l})),
  }));
}

let frameIdCounter = 0;
function nextFrameId(fnName: string): string {
  frameIdCounter += 1;
  return `${fnName}-frame-${frameIdCounter}`;
}

export function generateInsertTrace(initialRoot: BSTNode | null, val: number): OperationTrace {
  const workingRoot = cloneTree(initialRoot);
  const steps: TraceStep[] = [];
  const frames: StackFrame[] = [];

  const emit = (partial: Omit<TraceStep, 'stepIndex' | 'operation' | 'treeSnapshot' | 'stackFrames' | 'waitingNodeIds'>) => {
    const waitingNodeIds = frames
      .filter((f) => f.status === 'WAITING' && f.nodeId)
      .map((f) => f.nodeId as string);

    steps.push({
      stepIndex: steps.length,
      operation: 'insert',
      treeSnapshot: cloneTree(workingRoot),
      stackFrames: cloneFrames(frames),
      waitingNodeIds,
      ...partial,
    });
  };

  let createdNodeId: string | null = null;
  let duplicateDetected = false;

  function recurse(
    node: BSTNode | null,
    parent: BSTNode | null,
    direction: 'left' | 'right' | 'root',
  ): BSTNode {
    const nodeLabel = node ? `Node(${node.val})` : 'null';
    const frame: StackFrame = {
      id: nextFrameId('insert'),
      depth: frames.length,
      fnName: 'insert',
      signature: `insert(${nodeLabel}, ${val})`,
      nodeId: node ? node.id : null,
      nodeLabel,
      params: [
        {name: 'node', value: nodeLabel},
        {name: 'val', value: String(val)},
      ],
      locals: [{name: 'branch', value: direction}],
      status: 'ACTIVE',
      activeLine: 1,
    };

    frames.push(frame);
    emit({
      phase: 'PUSH',
      activeNodeId: node ? node.id : null,
      visitedNodeIds: [],
      newlyCreatedNodeId: null,
      pendingLinkNodeId: null,
      foundNodeId: null,
      notFound: false,
      activeEdge: {fromId: parent ? parent.id : null, toId: node ? node.id : null, direction},
      comparisonText: node ? `Entering Node(${node.val})` : `Reached null ${direction === 'root' ? 'root' : `${direction} child`}`,
      traversalOutput: [],
      activeLine: 1,
      explanation: `Pushed stack frame ${frame.signature}. Checking base case.`,
      logSummary: `PUSH ${frame.signature}`,
    });

    if (node === null) {
      frame.activeLine = 2;
      frame.status = 'BASE_CASE';
      frame.locals = [
        {name: 'isNull', value: 'true'},
        {name: 'action', value: `allocate Node(${val})`},
      ];

      emit({
        phase: 'BASE_CASE',
        activeNodeId: null,
        visitedNodeIds: [],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: parent ? parent.id : null, toId: null, direction},
        comparisonText: `node === null → Base Case`,
        traversalOutput: [],
        activeLine: 2,
        explanation: `Base case condition (node === null) is true. Preparing to allocate a new node with value ${val}.`,
        logSummary: `BASE CASE node === null`,
      });

      const newNode: BSTNode = {
        id: createNodeId(val),
        val,
        left: null,
        right: null,
      };
      createdNodeId = newNode.id;

      // Attach temporarily in working tree with pendingLink flag for clear visual placement
      if (!parent) {
        // Inserting root
        frame.activeLine = 3;
        frame.status = 'RETURNING';
        frame.returnValue = `Node(${val})`;
        frame.nodeId = newNode.id;
        // Reflect new root in snapshot
        const rootStepTree = cloneTree(newNode);
        const waitingNodeIds = frames
          .filter((f) => f.status === 'WAITING' && f.nodeId)
          .map((f) => f.nodeId as string);
        steps.push({
          stepIndex: steps.length,
          operation: 'insert',
          phase: 'BASE_CASE',
          treeSnapshot: rootStepTree,
          stackFrames: cloneFrames(frames),
          activeNodeId: newNode.id,
          waitingNodeIds,
          visitedNodeIds: [],
          newlyCreatedNodeId: newNode.id,
          pendingLinkNodeId: newNode.id,
          foundNodeId: null,
          notFound: false,
          activeEdge: null,
          comparisonText: `Created root Node(${val})`,
          traversalOutput: [],
          activeLine: 3,
          explanation: `Allocated new TreeNode(${val}) and returning it as the new root.`,
          logSummary: `RETURN new TreeNode(${val})`,
        });

        frames.pop();
        return newNode;
      }

      if (direction === 'left') {
        parent.left = newNode;
      } else if (direction === 'right') {
        parent.right = newNode;
      }

      frame.activeLine = 3;
      frame.status = 'RETURNING';
      frame.returnValue = `Node(${val})`;
      frame.nodeId = newNode.id;

      emit({
        phase: 'BASE_CASE',
        activeNodeId: newNode.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: newNode.id,
        pendingLinkNodeId: newNode.id,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: parent.id, toId: newNode.id, direction},
        comparisonText: `Allocated Node(${val})`,
        traversalOutput: [],
        activeLine: 3,
        explanation: `Allocated new TreeNode(${val}). Returning reference back up to parent Node(${parent.val}).`,
        logSummary: `RETURN new TreeNode(${val})`,
      });

      frames.pop();
      return newNode;
    }

    // Not null -> check line 5 (val < node.val)
    frame.activeLine = 5;
    if (val < node.val) {
      frame.locals = [
        {name: 'compare', value: `${val} < ${node.val} (true)`},
        {name: 'next', value: 'node.left'},
      ];
      emit({
        phase: 'COMPARE',
        activeNodeId: node.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: null,
        comparisonText: `${val} < ${node.val} → Go Left`,
        traversalOutput: [],
        activeLine: 5,
        explanation: `${val} is less than ${node.val}. Branching into the left subtree.`,
        logSummary: `COMPARE ${val} < ${node.val} (Left)`,
      });

      frame.activeLine = 6;
      frame.status = 'WAITING';
      frame.locals = [
        {name: 'awaiting', value: `insert(node.left, ${val})`},
        {name: 'target', value: 'node.left'},
      ];
      emit({
        phase: 'DESCEND',
        activeNodeId: node.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.left ? node.left.id : null, direction: 'left'},
        comparisonText: `Descending to ${node.val}.left`,
        traversalOutput: [],
        activeLine: 6,
        explanation: `Suspending insert(${node.val}, ${val}) on the stack while resolving node.left.`,
        logSummary: `WAIT node.left = insert(...)`,
      });

      node.left = recurse(node.left, node, 'left');

      // Resumed after child returned
      frame.status = 'ACTIVE';
      frame.activeLine = 6;
      frame.locals = [
        {name: 'node.left', value: `Node(${node.left.val})`},
        {name: 'status', value: 'pointer updated'},
      ];
      emit({
        phase: 'UNWIND',
        activeNodeId: node.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: createdNodeId,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.left.id, direction: 'left'},
        comparisonText: `Linked ${node.val}.left = Node(${node.left.val})`,
        traversalOutput: [],
        activeLine: 6,
        explanation: `Child frame popped. Assigned returned reference to Node(${node.val}).left.`,
        logSummary: `RESUME ${node.val}.left = Node(${node.left.val})`,
      });
    } else if (val > node.val) {
      frame.activeLine = 7;
      frame.locals = [
        {name: 'compare', value: `${val} > ${node.val} (true)`},
        {name: 'next', value: 'node.right'},
      ];
      emit({
        phase: 'COMPARE',
        activeNodeId: node.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: null,
        comparisonText: `${val} > ${node.val} → Go Right`,
        traversalOutput: [],
        activeLine: 7,
        explanation: `${val} is greater than ${node.val}. Branching into the right subtree.`,
        logSummary: `COMPARE ${val} > ${node.val} (Right)`,
      });

      frame.activeLine = 8;
      frame.status = 'WAITING';
      frame.locals = [
        {name: 'awaiting', value: `insert(node.right, ${val})`},
        {name: 'target', value: 'node.right'},
      ];
      emit({
        phase: 'DESCEND',
        activeNodeId: node.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.right ? node.right.id : null, direction: 'right'},
        comparisonText: `Descending to ${node.val}.right`,
        traversalOutput: [],
        activeLine: 8,
        explanation: `Suspending insert(${node.val}, ${val}) on the stack while resolving node.right.`,
        logSummary: `WAIT node.right = insert(...)`,
      });

      node.right = recurse(node.right, node, 'right');

      frame.status = 'ACTIVE';
      frame.activeLine = 8;
      frame.locals = [
        {name: 'node.right', value: `Node(${node.right.val})`},
        {name: 'status', value: 'pointer updated'},
      ];
      emit({
        phase: 'UNWIND',
        activeNodeId: node.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: createdNodeId,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.right.id, direction: 'right'},
        comparisonText: `Linked ${node.val}.right = Node(${node.right.val})`,
        traversalOutput: [],
        activeLine: 8,
        explanation: `Child frame popped. Assigned returned reference to Node(${node.val}).right.`,
        logSummary: `RESUME ${node.val}.right = Node(${node.right.val})`,
      });
    } else {
      duplicateDetected = true;
      frame.locals = [
        {name: 'compare', value: `${val} === ${node.val}`},
        {name: 'action', value: 'duplicate skipped'},
      ];
      emit({
        phase: 'COMPARE',
        activeNodeId: node.id,
        visitedNodeIds: [],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: node.id,
        notFound: false,
        activeEdge: null,
        comparisonText: `${val} === ${node.val} · Duplicate`,
        traversalOutput: [],
        activeLine: 7,
        explanation: `Value ${val} already exists at Node(${node.val}). BSTs do not insert duplicate keys.`,
        logSummary: `DUPLICATE ${val} === ${node.val}`,
      });
    }

    // Line 10: return node
    frame.status = 'RETURNING';
    frame.activeLine = 10;
    frame.returnValue = `Node(${node.val})`;
    emit({
      phase: 'UNWIND',
      activeNodeId: node.id,
      visitedNodeIds: [],
      newlyCreatedNodeId: createdNodeId,
      pendingLinkNodeId: null,
      foundNodeId: duplicateDetected ? node.id : null,
      notFound: false,
      activeEdge: null,
      comparisonText: `Returning Node(${node.val})`,
      traversalOutput: [],
      activeLine: 10,
      explanation: `Frame ${frame.signature} returns Node(${node.val}) and pops off the call stack.`,
      logSummary: `POP ${frame.signature} → Node(${node.val})`,
    });

    frames.pop();
    return node;
  }

  const finalRoot = recurse(workingRoot, null, 'root');

  // Final completed step with empty stack
  steps.push({
    stepIndex: steps.length,
    operation: 'insert',
    phase: 'COMPLETE',
    treeSnapshot: cloneTree(finalRoot),
    stackFrames: [],
    activeNodeId: null,
    waitingNodeIds: [],
    visitedNodeIds: [],
    newlyCreatedNodeId: createdNodeId,
    pendingLinkNodeId: null,
    foundNodeId: duplicateDetected ? createdNodeId : null,
    notFound: false,
    activeEdge: null,
    comparisonText: duplicateDetected ? `Node(${val}) already in tree` : `Inserted Node(${val})`,
    traversalOutput: [],
    activeLine: 11,
    explanation: duplicateDetected
      ? `Recursion unwound completely. Tree unchanged because ${val} already exists.`
      : `All stack frames popped. Node(${val}) is now permanently part of the BST.`,
    logSummary: duplicateDetected ? `COMPLETE (Duplicate ${val})` : `COMPLETE Inserted ${val}`,
  });

  return {
    operation: 'insert',
    targetValue: val,
    steps,
    finalTree: finalRoot,
    resultLabel: duplicateDetected ? `Duplicate ${val} skipped` : `Inserted ${val}`,
  };
}

export function generateSearchTrace(initialRoot: BSTNode | null, val: number): OperationTrace {
  const treeCopy = cloneTree(initialRoot);
  const steps: TraceStep[] = [];
  const frames: StackFrame[] = [];
  const visitedPath: string[] = [];
  let foundId: string | null = null;

  const emit = (partial: Omit<TraceStep, 'stepIndex' | 'operation' | 'treeSnapshot' | 'stackFrames' | 'waitingNodeIds'>) => {
    const waitingNodeIds = frames
      .filter((f) => f.status === 'WAITING' && f.nodeId)
      .map((f) => f.nodeId as string);

    steps.push({
      stepIndex: steps.length,
      operation: 'search',
      treeSnapshot: treeCopy,
      stackFrames: cloneFrames(frames),
      waitingNodeIds,
      ...partial,
    });
  };

  function recurse(
    node: BSTNode | null,
    parent: BSTNode | null,
    direction: 'left' | 'right' | 'root',
  ): boolean {
    const nodeLabel = node ? `Node(${node.val})` : 'null';
    const frame: StackFrame = {
      id: nextFrameId('search'),
      depth: frames.length,
      fnName: 'search',
      signature: `search(${nodeLabel}, ${val})`,
      nodeId: node ? node.id : null,
      nodeLabel,
      params: [
        {name: 'node', value: nodeLabel},
        {name: 'val', value: String(val)},
      ],
      locals: [{name: 'branch', value: direction}],
      status: 'ACTIVE',
      activeLine: 1,
    };

    frames.push(frame);
    emit({
      phase: 'PUSH',
      activeNodeId: node ? node.id : null,
      visitedNodeIds: [...visitedPath],
      newlyCreatedNodeId: null,
      pendingLinkNodeId: null,
      foundNodeId: null,
      notFound: false,
      activeEdge: {fromId: parent ? parent.id : null, toId: node ? node.id : null, direction},
      comparisonText: node ? `Inspecting Node(${node.val})` : `Reached null pointer`,
      traversalOutput: [],
      activeLine: 1,
      explanation: `Pushed stack frame ${frame.signature}.`,
      logSummary: `PUSH ${frame.signature}`,
    });

    if (node === null) {
      frame.status = 'BASE_CASE';
      frame.activeLine = 2;
      frame.locals = [{name: 'isNull', value: 'true'}];
      emit({
        phase: 'BASE_CASE',
        activeNodeId: null,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: true,
        activeEdge: {fromId: parent ? parent.id : null, toId: null, direction},
        comparisonText: `node === null · Not Found`,
        traversalOutput: [],
        activeLine: 2,
        explanation: `Base case reached: node is null. Value ${val} does not exist in this branch.`,
        logSummary: `BASE CASE node === null`,
      });

      frame.status = 'RETURNING';
      frame.activeLine = 3;
      frame.returnValue = 'false';
      emit({
        phase: 'UNWIND',
        activeNodeId: null,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: true,
        activeEdge: null,
        comparisonText: `Returning false`,
        traversalOutput: [],
        activeLine: 3,
        explanation: `Returning false from base case and popping ${frame.signature}.`,
        logSummary: `POP ${frame.signature} → false`,
      });

      frames.pop();
      return false;
    }

    visitedPath.push(node.id);

    if (val === node.val) {
      foundId = node.id;
      frame.status = 'BASE_CASE';
      frame.activeLine = 5;
      frame.locals = [{name: 'match', value: `${val} === ${node.val} (true)`}];
      emit({
        phase: 'BASE_CASE',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: node.id,
        notFound: false,
        activeEdge: null,
        comparisonText: `${val} === ${node.val} · Match Found`,
        traversalOutput: [],
        activeLine: 5,
        explanation: `Match found! Target ${val} equals Node(${node.val}).`,
        logSummary: `FOUND ${val} === ${node.val}`,
      });

      frame.status = 'RETURNING';
      frame.activeLine = 6;
      frame.returnValue = 'true';
      emit({
        phase: 'UNWIND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: node.id,
        notFound: false,
        activeEdge: null,
        comparisonText: `Returning true`,
        traversalOutput: [],
        activeLine: 6,
        explanation: `Returning true up the call stack from Node(${node.val}).`,
        logSummary: `POP ${frame.signature} → true`,
      });

      frames.pop();
      return true;
    }

    let result: boolean;
    if (val < node.val) {
      frame.activeLine = 8;
      frame.locals = [
        {name: 'compare', value: `${val} < ${node.val} (true)`},
        {name: 'next', value: 'node.left'},
      ];
      emit({
        phase: 'COMPARE',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: null,
        comparisonText: `${val} < ${node.val} → Search Left`,
        traversalOutput: [],
        activeLine: 8,
        explanation: `${val} < ${node.val}, so the target can only be in the left subtree.`,
        logSummary: `COMPARE ${val} < ${node.val} (Left)`,
      });

      frame.activeLine = 9;
      frame.status = 'WAITING';
      frame.locals = [{name: 'awaiting', value: `search(node.left, ${val})`}];
      emit({
        phase: 'DESCEND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.left ? node.left.id : null, direction: 'left'},
        comparisonText: `Descending to ${node.val}.left`,
        traversalOutput: [],
        activeLine: 9,
        explanation: `Suspending search(${node.val}, ${val}) while evaluating search(node.left, ${val}).`,
        logSummary: `WAIT search(${node.val}.left, ${val})`,
      });

      result = recurse(node.left, node, 'left');

      frame.status = 'RETURNING';
      frame.activeLine = 9;
      frame.returnValue = String(result);
      frame.locals = [{name: 'returned', value: String(result)}];
      emit({
        phase: 'UNWIND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: foundId,
        notFound: !result,
        activeEdge: null,
        comparisonText: `Bubbling ${result} from Node(${node.val})`,
        traversalOutput: [],
        activeLine: 9,
        explanation: `Received ${result} from left child; returning ${result} to caller.`,
        logSummary: `POP ${frame.signature} → ${result}`,
      });
    } else {
      frame.activeLine = 11;
      frame.locals = [
        {name: 'compare', value: `${val} > ${node.val} (true)`},
        {name: 'next', value: 'node.right'},
      ];
      emit({
        phase: 'COMPARE',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: null,
        comparisonText: `${val} > ${node.val} → Search Right`,
        traversalOutput: [],
        activeLine: 8,
        explanation: `${val} > ${node.val}, so the target can only be in the right subtree.`,
        logSummary: `COMPARE ${val} > ${node.val} (Right)`,
      });

      frame.status = 'WAITING';
      frame.activeLine = 11;
      frame.locals = [{name: 'awaiting', value: `search(node.right, ${val})`}];
      emit({
        phase: 'DESCEND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.right ? node.right.id : null, direction: 'right'},
        comparisonText: `Descending to ${node.val}.right`,
        traversalOutput: [],
        activeLine: 11,
        explanation: `Suspending search(${node.val}, ${val}) while evaluating search(node.right, ${val}).`,
        logSummary: `WAIT search(${node.val}.right, ${val})`,
      });

      result = recurse(node.right, node, 'right');

      frame.status = 'RETURNING';
      frame.activeLine = 11;
      frame.returnValue = String(result);
      frame.locals = [{name: 'returned', value: String(result)}];
      emit({
        phase: 'UNWIND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedPath],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: foundId,
        notFound: !result,
        activeEdge: null,
        comparisonText: `Bubbling ${result} from Node(${node.val})`,
        traversalOutput: [],
        activeLine: 11,
        explanation: `Received ${result} from right child; returning ${result} to caller.`,
        logSummary: `POP ${frame.signature} → ${result}`,
      });
    }

    frames.pop();
    return result;
  }

  const found = recurse(treeCopy, null, 'root');

  steps.push({
    stepIndex: steps.length,
    operation: 'search',
    phase: 'COMPLETE',
    treeSnapshot: treeCopy,
    stackFrames: [],
    activeNodeId: null,
    waitingNodeIds: [],
    visitedNodeIds: [...visitedPath],
    newlyCreatedNodeId: null,
    pendingLinkNodeId: null,
    foundNodeId: foundId,
    notFound: !found,
    activeEdge: null,
    comparisonText: found ? `Found ${val}` : `${val} Not Found`,
    traversalOutput: [],
    activeLine: 12,
    explanation: found
      ? `Search complete: Node(${val}) was found and true bubbled back to the root caller.`
      : `Search complete: hit null leaf and false bubbled back to the root caller.`,
    logSummary: found ? `COMPLETE Found ${val}` : `COMPLETE ${val} Not Found`,
  });

  return {
    operation: 'search',
    targetValue: val,
    steps,
    finalTree: treeCopy,
    resultLabel: found ? `Found ${val}` : `${val} not in tree`,
  };
}

export function generateTraversalTrace(
  initialRoot: BSTNode | null,
  order: 'inorder' | 'preorder' | 'postorder',
): OperationTrace {
  const treeCopy = cloneTree(initialRoot);
  const steps: TraceStep[] = [];
  const frames: StackFrame[] = [];
  const traversalOutput: number[] = [];
  const visitedNodeIds: string[] = [];

  const fnName = order === 'inorder' ? 'inOrder' : order === 'preorder' ? 'preOrder' : 'postOrder';

  const emit = (partial: Omit<TraceStep, 'stepIndex' | 'operation' | 'treeSnapshot' | 'stackFrames' | 'waitingNodeIds'>) => {
    const waitingNodeIds = frames
      .filter((f) => f.status === 'WAITING' && f.nodeId)
      .map((f) => f.nodeId as string);

    steps.push({
      stepIndex: steps.length,
      operation: order,
      treeSnapshot: treeCopy,
      stackFrames: cloneFrames(frames),
      waitingNodeIds,
      ...partial,
    });
  };

  function recurse(
    node: BSTNode | null,
    parent: BSTNode | null,
    direction: 'left' | 'right' | 'root',
  ): void {
    const nodeLabel = node ? `Node(${node.val})` : 'null';
    const frame: StackFrame = {
      id: nextFrameId(fnName),
      depth: frames.length,
      fnName,
      signature: `${fnName}(${nodeLabel})`,
      nodeId: node ? node.id : null,
      nodeLabel,
      params: [{name: 'node', value: nodeLabel}],
      locals: [{name: 'phase', value: 'enter'}],
      status: 'ACTIVE',
      activeLine: 1,
    };

    frames.push(frame);
    emit({
      phase: 'PUSH',
      activeNodeId: node ? node.id : null,
      visitedNodeIds: [...visitedNodeIds],
      newlyCreatedNodeId: null,
      pendingLinkNodeId: null,
      foundNodeId: null,
      notFound: false,
      activeEdge: {fromId: parent ? parent.id : null, toId: node ? node.id : null, direction},
      comparisonText: node ? `Entering ${fnName}(${node.val})` : `${fnName}(null)`,
      traversalOutput: [...traversalOutput],
      activeLine: 1,
      explanation: `Pushed stack frame ${frame.signature}.`,
      logSummary: `PUSH ${frame.signature}`,
    });

    if (node === null) {
      frame.status = 'BASE_CASE';
      frame.activeLine = 2;
      frame.locals = [{name: 'isNull', value: 'true'}];
      emit({
        phase: 'BASE_CASE',
        activeNodeId: null,
        visitedNodeIds: [...visitedNodeIds],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: parent ? parent.id : null, toId: null, direction},
        comparisonText: `node === null → Return`,
        traversalOutput: [...traversalOutput],
        activeLine: 3,
        explanation: `Base case reached: node is null. Returning immediately to parent frame.`,
        logSummary: `BASE CASE ${fnName}(null) → return`,
      });

      frames.pop();
      return;
    }

    const doVisit = (lineNum: number) => {
      frame.status = 'ACTIVE';
      frame.activeLine = lineNum;
      traversalOutput.push(node.val);
      visitedNodeIds.push(node.id);
      frame.locals = [
        {name: 'visited', value: String(node.val)},
        {name: 'outputLen', value: String(traversalOutput.length)},
      ];
      emit({
        phase: 'VISIT',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedNodeIds],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: null,
        comparisonText: `Visit Node(${node.val})`,
        traversalOutput: [...traversalOutput],
        activeLine: lineNum,
        explanation: `Visited Node(${node.val}) and appended ${node.val} to traversal output.`,
        logSummary: `VISIT ${node.val}`,
      });
    };

    const doLeft = (lineNum: number) => {
      frame.status = 'WAITING';
      frame.activeLine = lineNum;
      frame.locals = [{name: 'awaiting', value: `${fnName}(${node.val}.left)`}];
      emit({
        phase: 'DESCEND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedNodeIds],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.left ? node.left.id : null, direction: 'left'},
        comparisonText: `Recurse Left from ${node.val}`,
        traversalOutput: [...traversalOutput],
        activeLine: lineNum,
        explanation: `Pausing ${frame.signature} on the call stack to traverse left subtree.`,
        logSummary: `CALL ${fnName}(${node.val}.left)`,
      });

      recurse(node.left, node, 'left');

      frame.status = 'ACTIVE';
      frame.activeLine = lineNum;
      frame.locals = [{name: 'leftDone', value: 'true'}];
      emit({
        phase: 'UNWIND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedNodeIds],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: null,
        comparisonText: `Resumed Node(${node.val}) after Left`,
        traversalOutput: [...traversalOutput],
        activeLine: lineNum,
        explanation: `Left subtree of Node(${node.val}) completed; resuming ${frame.signature}.`,
        logSummary: `RESUME ${frame.signature}`,
      });
    };

    const doRight = (lineNum: number) => {
      frame.status = 'WAITING';
      frame.activeLine = lineNum;
      frame.locals = [{name: 'awaiting', value: `${fnName}(${node.val}.right)`}];
      emit({
        phase: 'DESCEND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedNodeIds],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: {fromId: node.id, toId: node.right ? node.right.id : null, direction: 'right'},
        comparisonText: `Recurse Right from ${node.val}`,
        traversalOutput: [...traversalOutput],
        activeLine: lineNum,
        explanation: `Pausing ${frame.signature} on the call stack to traverse right subtree.`,
        logSummary: `CALL ${fnName}(${node.val}.right)`,
      });

      recurse(node.right, node, 'right');

      frame.status = 'ACTIVE';
      frame.activeLine = lineNum;
      frame.locals = [{name: 'rightDone', value: 'true'}];
      emit({
        phase: 'UNWIND',
        activeNodeId: node.id,
        visitedNodeIds: [...visitedNodeIds],
        newlyCreatedNodeId: null,
        pendingLinkNodeId: null,
        foundNodeId: null,
        notFound: false,
        activeEdge: null,
        comparisonText: `Resumed Node(${node.val}) after Right`,
        traversalOutput: [...traversalOutput],
        activeLine: lineNum,
        explanation: `Right subtree of Node(${node.val}) completed; resuming ${frame.signature}.`,
        logSummary: `RESUME ${frame.signature}`,
      });
    };

    if (order === 'inorder') {
      doLeft(5);
      doVisit(6);
      doRight(7);
    } else if (order === 'preorder') {
      doVisit(5);
      doLeft(6);
      doRight(7);
    } else {
      doLeft(5);
      doRight(6);
      doVisit(7);
    }

    frame.status = 'RETURNING';
    frame.activeLine = 8;
    frame.returnValue = 'void';
    emit({
      phase: 'UNWIND',
      activeNodeId: node.id,
      visitedNodeIds: [...visitedNodeIds],
      newlyCreatedNodeId: null,
      pendingLinkNodeId: null,
      foundNodeId: null,
      notFound: false,
      activeEdge: null,
      comparisonText: `Finished ${frame.signature}`,
      traversalOutput: [...traversalOutput],
      activeLine: 8,
      explanation: `${frame.signature} finished all branches and pops off the call stack.`,
      logSummary: `POP ${frame.signature}`,
    });

    frames.pop();
  }

  recurse(treeCopy, null, 'root');

  steps.push({
    stepIndex: steps.length,
    operation: order,
    phase: 'COMPLETE',
    treeSnapshot: treeCopy,
    stackFrames: [],
    activeNodeId: null,
    waitingNodeIds: [],
    visitedNodeIds: [...visitedNodeIds],
    newlyCreatedNodeId: null,
    pendingLinkNodeId: null,
    foundNodeId: null,
    notFound: false,
    activeEdge: null,
    comparisonText: `${fnName} Complete`,
    traversalOutput: [...traversalOutput],
    activeLine: 8,
    explanation: `All stack frames popped. ${order.charAt(0).toUpperCase() + order.slice(1)} sequence: [${traversalOutput.join(', ')}].`,
    logSummary: `COMPLETE [${traversalOutput.join(', ')}]`,
  });

  return {
    operation: order,
    steps,
    finalTree: treeCopy,
    resultLabel: traversalOutput.length > 0 ? `[${traversalOutput.join(', ')}]` : 'Empty tree []',
  };
}
