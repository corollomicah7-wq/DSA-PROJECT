export interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x?: number;
  y?: number;
}

export type TraversalType = 'inorder' | 'preorder' | 'postorder' | 'levelorder';

export class BinarySearchTree {
  root: TreeNode | null = null;

  constructor(initialValues: number[] = []) {
    initialValues.forEach((val) => this.insert(val));
  }

  clone(): BinarySearchTree {
    const newTree = new BinarySearchTree();
    const copyNode = (node: TreeNode | null): TreeNode | null => {
      if (!node) return null;
      return {
        value: node.value,
        left: copyNode(node.left),
        right: copyNode(node.right),
      };
    };
    newTree.root = copyNode(this.root);
    return newTree;
  }

  insert(value: number): { inserted: boolean; path: number[] } {
    const path: number[] = [];
    const newNode: TreeNode = { value, left: null, right: null };

    if (!this.root) {
      this.root = newNode;
      path.push(value);
      return { inserted: true, path };
    }

    let current: TreeNode | null = this.root;
    while (current) {
      path.push(current.value);
      if (value === current.value) {
        return { inserted: false, path }; // Avoid duplicates
      }
      if (value < current.value) {
        if (!current.left) {
          current.left = newNode;
          path.push(value);
          return { inserted: true, path };
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          path.push(value);
          return { inserted: true, path };
        }
        current = current.right;
      }
    }
    return { inserted: false, path };
  }

  search(value: number): { found: boolean; path: number[] } {
    const path: number[] = [];
    let current = this.root;
    while (current) {
      path.push(current.value);
      if (value === current.value) return { found: true, path };
      current = value < current.value ? current.left : current.right;
    }
    return { found: false, path };
  }

  delete(value: number): boolean {
    let deleted = false;
    const removeNode = (node: TreeNode | null, val: number): TreeNode | null => {
      if (!node) return null;
      if (val < node.value) {
        node.left = removeNode(node.left, val);
        return node;
      } else if (val > node.value) {
        node.right = removeNode(node.right, val);
        return node;
      } else {
        deleted = true;
        if (!node.left && !node.right) return null;
        if (!node.left) return node.right;
        if (!node.right) return node.left;

        let minRight = node.right;
        while (minRight.left) minRight = minRight.left;
        node.value = minRight.value;
        node.right = removeNode(node.right, minRight.value);
        return node;
      }
    };
    this.root = removeNode(this.root, value);
    return deleted;
  }

  traverse(type: TraversalType): number[] {
    const result: number[] = [];
    if (!this.root) return result;

    if (type === 'levelorder') {
      const queue: TreeNode[] = [this.root];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        result.push(curr.value);
        if (curr.left) queue.push(curr.left);
        if (curr.right) queue.push(curr.right);
      }
      return result;
    }

    const dfs = (node: TreeNode | null) => {
      if (!node) return;
      if (type === 'preorder') result.push(node.value);
      dfs(node.left);
      if (type === 'inorder') result.push(node.value);
      dfs(node.right);
      if (type === 'postorder') result.push(node.value);
    };

    dfs(this.root);
    return result;
  }

  getNodeCount(): number {
    return this.traverse('preorder').length;
  }

  getHeight(node: TreeNode | null = this.root): number {
    if (!node) return 0;
    return 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  // Assign clean SVG coordinates using in-order horizontal spacing
  computeLayout(width = 820, levelHeight = 85): {
    nodes: TreeNode[];
    edges: { from: TreeNode; to: TreeNode }[];
  } {
    const nodes: TreeNode[] = [];
    const edges: { from: TreeNode; to: TreeNode }[] = [];
    const total = this.getNodeCount();
    if (!this.root || total === 0) return { nodes, edges };

    let index = 0;
    const paddingX = 60;
    const usableWidth = Math.max(width - paddingX * 2, 300);

    const assignCoords = (node: TreeNode | null, depth: number) => {
      if (!node) return;
      assignCoords(node.left, depth + 1);

      node.x =
        total === 1
          ? width / 2
          : paddingX + (index / (total - 1)) * usableWidth;
      node.y = 55 + depth * levelHeight;
      index++;
      nodes.push(node);

      assignCoords(node.right, depth + 1);
    };

    assignCoords(this.root, 0);

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

    collectEdges(this.root);
    return { nodes, edges };
  }
}