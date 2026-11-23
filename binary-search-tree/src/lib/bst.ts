export interface BSTNode {
  id: string;
  val: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

export interface PositionedNode {
  id: string;
  val: number;
  x: number;
  y: number;
  depth: number;
  parentId: string | null;
}

export interface PositionedEdge {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  direction: 'left' | 'right';
}

export interface TreeLayout {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  nodeMap: Map<string, PositionedNode>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

let nodeCounter = 0;

export function createNodeId(val: number): string {
  nodeCounter += 1;
  return `node-${val}-${nodeCounter}`;
}

export function cloneTree(node: BSTNode | null): BSTNode | null {
  if (!node) return null;
  return {
    id: node.id,
    val: node.val,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

export function countNodes(node: BSTNode | null): number {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

export function treeHeight(node: BSTNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

export function insertSync(node: BSTNode | null, val: number): BSTNode {
  if (!node) {
    return {
      id: createNodeId(val),
      val,
      left: null,
      right: null,
    };
  }
  if (val < node.val) {
    return {
      ...node,
      left: insertSync(node.left, val),
    };
  }
  if (val > node.val) {
    return {
      ...node,
      right: insertSync(node.right, val),
    };
  }
  return node;
}

export function buildSampleTree(): BSTNode {
  const values = [50, 25, 75, 12, 37, 62, 88];
  let root: BSTNode | null = null;
  for (const v of values) {
    root = insertSync(root, v);
  }
  return root!;
}

/**
 * Computes collision-free coordinates using in-order horizontal ranking
 * and depth-based vertical spacing.
 */
export function computeTreeLayout(root: BSTNode | null): TreeLayout {
  const nodes: PositionedNode[] = [];
  const edges: PositionedEdge[] = [];
  const nodeMap = new Map<string, PositionedNode>();

  if (!root) {
    return {
      nodes,
      edges,
      nodeMap,
      bounds: {
        minX: -260,
        maxX: 260,
        minY: -60,
        maxY: 260,
        width: 520,
        height: 320,
      },
    };
  }

  const slotX = 82;
  const levelY = 96;
  let rank = 0;

  function assign(node: BSTNode, depth: number, parentId: string | null): PositionedNode {
    const leftPos = node.left ? assign(node.left, depth + 1, node.id) : null;
    const x = rank * slotX;
    const y = depth * levelY;
    rank += 1;

    const positioned: PositionedNode = {
      id: node.id,
      val: node.val,
      x,
      y,
      depth,
      parentId,
    };
    nodes.push(positioned);
    nodeMap.set(node.id, positioned);

    const rightPos = node.right ? assign(node.right, depth + 1, node.id) : null;

    if (leftPos) {
      edges.push({
        id: `${node.id}->${leftPos.id}`,
        fromId: node.id,
        toId: leftPos.id,
        x1: positioned.x,
        y1: positioned.y,
        x2: leftPos.x,
        y2: leftPos.y,
        direction: 'left',
      });
    }
    if (rightPos) {
      edges.push({
        id: `${node.id}->${rightPos.id}`,
        fromId: node.id,
        toId: rightPos.id,
        x1: positioned.x,
        y1: positioned.y,
        x2: rightPos.x,
        y2: rightPos.y,
        direction: 'right',
      });
    }

    return positioned;
  }

  assign(root, 0, null);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const padX = 110;
  const padTop = 74;
  const padBottom = 110;

  minX -= padX;
  maxX += padX;
  minY -= padTop;
  maxY += padBottom;

  const minWidth = 540;
  const currentWidth = maxX - minX;
  if (currentWidth < minWidth) {
    const extra = (minWidth - currentWidth) / 2;
    minX -= extra;
    maxX += extra;
  }

  const minHeight = 340;
  const currentHeight = maxY - minY;
  if (currentHeight < minHeight) {
    maxY += minHeight - currentHeight;
  }

  return {
    nodes,
    edges,
    nodeMap,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}
