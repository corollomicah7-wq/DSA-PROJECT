export interface TreeNode {
  id: string;
  value: string;
  isOperator?: boolean;
  left: TreeNode | null;
  right: TreeNode | null;
  x?: number;
  y?: number;
}

export type TraversalType = 'inorder' | 'preorder' | 'postorder';

/**
 * Standard Level-Order Binary Tree (matches [1, 2, 3, 4, 5...] from lesson)
 */
export class StandardBinaryTree {
  root: TreeNode | null = null;
  values: string[] = [];

  constructor(initialValues: string[] = []) {
    this.buildFromArray(initialValues);
  }

  buildFromArray(vals: string[]): void {
    this.values = [...vals];
    if (vals.length === 0) {
      this.root = null;
      return;
    }

    const nodes: TreeNode[] = vals.map((val, idx) => ({
      id: `bt-${idx}-${val}`,
      value: val,
      left: null,
      right: null,
    }));

    for (let i = 0; i < nodes.length; i++) {
      const leftIdx = 2 * i + 1;
      const rightIdx = 2 * i + 2;
      if (leftIdx < nodes.length) nodes[i].left = nodes[leftIdx];
      if (rightIdx < nodes.length) nodes[i].right = nodes[rightIdx];
    }

    this.root = nodes[0];
  }

  addNode(val: string): void {
    this.buildFromArray([...this.values, val]);
  }

  removeLastNode(): void {
    if (this.values.length === 0) return;
    this.buildFromArray(this.values.slice(0, -1));
  }

  traverseNodes(type: TraversalType): TreeNode[] {
    const result: TreeNode[] = [];
    const dfs = (node: TreeNode | null) => {
      if (!node) return;
      if (type === 'preorder') result.push(node);
      dfs(node.left);
      if (type === 'inorder') result.push(node);
      dfs(node.right);
      if (type === 'postorder') result.push(node);
    };
    dfs(this.root);
    return result;
  }

  getLeafNodes(): TreeNode[] {
    const leaves: TreeNode[] = [];
    const dfs = (node: TreeNode | null) => {
      if (!node) return;
      if (!node.left && !node.right) leaves.push(node);
      dfs(node.left);
      dfs(node.right);
    };
    dfs(this.root);
    return leaves;
  }

  isFullBinaryTree(node: TreeNode | null = this.root): boolean {
    if (!node) return true;
    if (!node.left && !node.right) return true;
    if (node.left && node.right) {
      return this.isFullBinaryTree(node.left) && this.isFullBinaryTree(node.right);
    }
    return false;
  }

  isCompleteBinaryTree(): boolean {
    return this.values.length > 0;
  }

  getEdgeHeight(node: TreeNode | null = this.root): number {
    if (!node) return 0;
    if (!node.left && !node.right) return 0;
    return 1 + Math.max(this.getEdgeHeight(node.left), this.getEdgeHeight(node.right));
  }

  computeLayout(width = 880, levelHeight = 80) {
    return computeTreeLayout(this.root, width, levelHeight);
  }
}

/**
 * Algebraic Expression Tree (Inorder LTR, Preorder TLR / Prefix, Postorder LRT / Postfix)
 */
export class ExpressionTree {
  root: TreeNode | null = null;
  error: string | null = null;

  constructor(expression: string) {
    this.build(expression);
  }

  private getPrecedence(op: string): number {
    if (op === '+' || op === '-') return 1;
    if (op === '*' || op === '/') return 2;
    if (op === '^') return 3;
    return 0;
  }

  private isOperator(ch: string): boolean {
    return ['+', '-', '*', '/', '^'].includes(ch);
  }

  build(expression: string): void {
    this.error = null;
    this.root = null;

    const clean = expression.replace(/\s+/g, '');
    if (!clean) {
      this.error = 'Enter an algebraic expression (e.g., A*B+C/D).';
      return;
    }

    const nodeStack: TreeNode[] = [];
    const opStack: string[] = [];
    let idCounter = 0;

    const applyOperator = (): boolean => {
      const op = opStack.pop();
      if (!op) return false;
      const right = nodeStack.pop();
      const left = nodeStack.pop();
      if (!left || !right) {
        this.error = `Invalid syntax near operator "${op}". Check operands.`;
        return false;
      }
      idCounter++;
      nodeStack.push({
        id: `exp-op-${idCounter}-${op}`,
        value: op,
        isOperator: true,
        left,
        right,
      });
      return true;
    };

    let i = 0;
    while (i < clean.length) {
      const ch = clean[i];

      if (/[a-zA-Z0-9]/.test(ch)) {
        let token = ch;
        while (i + 1 < clean.length && /[0-9]/.test(clean[i]) && /[0-9]/.test(clean[i + 1])) {
          i++;
          token += clean[i];
        }
        idCounter++;
        nodeStack.push({
          id: `exp-val-${idCounter}-${token}`,
          value: token,
          isOperator: false,
          left: null,
          right: null,
        });
      } else if (ch === '(') {
        opStack.push(ch);
      } else if (ch === ')') {
        while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
          if (!applyOperator()) return;
        }
        if (opStack.length === 0 || opStack[opStack.length - 1] !== '(') {
          this.error = 'Mismatched closing parenthesis ")".';
          return;
        }
        opStack.pop();
      } else if (this.isOperator(ch)) {
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1] !== '(' &&
          (this.getPrecedence(opStack[opStack.length - 1]) > this.getPrecedence(ch) ||
            (this.getPrecedence(opStack[opStack.length - 1]) === this.getPrecedence(ch) && ch !== '^'))
        ) {
          if (!applyOperator()) return;
        }
        opStack.push(ch);
      } else {
        this.error = `Unsupported character "${ch}". Use letters, numbers, + - * / ^ ( )`;
        return;
      }
      i++;
    }

    while (opStack.length > 0) {
      if (opStack[opStack.length - 1] === '(') {
        this.error = 'Mismatched opening parenthesis "(".';
        return;
      }
      if (!applyOperator()) return;
    }

    if (nodeStack.length !== 1) {
      this.error = 'Incomplete expression. Check missing operators.';
      return;
    }

    this.root = nodeStack[0];
  }

  traverseNodes(type: TraversalType): TreeNode[] {
    const result: TreeNode[] = [];
    const dfs = (node: TreeNode | null) => {
      if (!node) return;
      if (type === 'preorder') result.push(node);
      dfs(node.left);
      if (type === 'inorder') result.push(node);
      dfs(node.right);
      if (type === 'postorder') result.push(node);
    };
    dfs(this.root);
    return result;
  }

  computeLayout(width = 880, levelHeight = 78) {
    return computeTreeLayout(this.root, width, levelHeight);
  }
}

export function computeTreeLayout(
  root: TreeNode | null,
  width = 880,
  levelHeight = 80
): {
  nodes: TreeNode[];
  edges: { from: TreeNode; to: TreeNode }[];
} {
  const nodes: TreeNode[] = [];
  const edges: { from: TreeNode; to: TreeNode }[] = [];
  if (!root) return { nodes, edges };

  const countNodes = (n: TreeNode | null): number =>
    n ? 1 + countNodes(n.left) + countNodes(n.right) : 0;
  const total = countNodes(root);

  let index = 0;
  const paddingX = 55;
  const usableWidth = Math.max(width - paddingX * 2, 340);

  const assignCoords = (node: TreeNode | null, depth: number) => {
    if (!node) return;
    assignCoords(node.left, depth + 1);

    node.x =
      total === 1
        ? width / 2
        : paddingX + (index / (total - 1)) * usableWidth;
    node.y = 52 + depth * levelHeight;
    index++;
    nodes.push(node);

    assignCoords(node.right, depth + 1);
  };

  assignCoords(root, 0);

  const collectEdges = (node: TreeNode | null) => {
    if (!node) return;
    if (node.left) {
      edges.push({ from: node, to: node.left });
      collectEdges(node.left);
    }
    if (node.right) {
      edges.push({ from: node, to: node.right });
      collectEdges(node.right);
    }
  };

  collectEdges(root);
  return { nodes, edges };
}