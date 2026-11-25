'use client';

import React from 'react';
import { BinarySearchTree, TreeNode } from '@/lib/bst';

interface TreeCanvasProps {
  tree: BinarySearchTree;
  activeNode: number | null;
  visitedNodes: number[];
  errorNode: number | null;
  onNodeClick?: (value: number) => void;
  interactive?: boolean;
}

export default function TreeCanvas({
  tree,
  activeNode,
  visitedNodes,
  errorNode,
  onNodeClick,
  interactive = false,
}: TreeCanvasProps) {
  const height = Math.max(360, tree.getHeight() * 90 + 70);
  const { nodes, edges } = tree.computeLayout(820, 85);

  const getNodeStateClass = (val: number) => {
    if (errorNode === val) return 'node-error';
    if (activeNode === val) return 'node-active';
    if (visitedNodes.includes(val)) return 'node-visited';
    return 'node-default';
  };

  return (
    <div className="canvas-wrapper">
      {nodes.length === 0 ? (
        <div className="empty-canvas">
          <div className="empty-badge">🌱 Empty Tree</div>
          <p>Insert a number or click <strong>Generate Random Tree</strong> to begin!</p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 820 ${height}`}
          className="tree-svg"
          role="img"
          aria-label="Binary Search Tree Visualization"
        >
          {/* Connecting Edges */}
          {edges.map((edge, idx) => (
            <line
              key={`${edge.from.value}-${edge.to.value}-${idx}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              className="tree-edge"
            />
          ))}

          {/* Tree Nodes */}
          {nodes.map((node: TreeNode) => {
            const stateClass = getNodeStateClass(node.value);
            return (
              <g
                key={node.value}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => interactive && onNodeClick?.(node.value)}
                className={`tree-node-group ${stateClass} ${
                  interactive ? 'clickable' : ''
                }`}
              >
                <circle r="24" className="tree-node-circle" />
                <text dy="5" textAnchor="middle" className="tree-node-text">
                  {node.value}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}