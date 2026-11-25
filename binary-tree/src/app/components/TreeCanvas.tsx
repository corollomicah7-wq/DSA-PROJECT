'use client';

import React from 'react';
import { StandardBinaryTree, ExpressionTree, TreeNode } from '../lib/bst';

interface TreeCanvasProps {
  tree: StandardBinaryTree | ExpressionTree;
  activeNodeId: string | null;
  visitedNodeIds: string[];
  errorNodeId: string | null;
  onNodeClick?: (node: TreeNode) => void;
  interactive?: boolean;
  showRootBadge?: boolean;
}

export default function TreeCanvas({
  tree,
  activeNodeId,
  visitedNodeIds,
  errorNodeId,
  onNodeClick,
  interactive = false,
  showRootBadge = true,
}: TreeCanvasProps) {
  const { nodes, edges } = tree.computeLayout(880, 78);
  const maxY = nodes.reduce((max, n) => Math.max(max, n.y || 0), 300);
  const height = Math.max(360, maxY + 60);

  const getNodeStateClass = (node: TreeNode) => {
    if (errorNodeId === node.id) return 'node-error';
    if (activeNodeId === node.id) return 'node-active';
    if (visitedNodeIds.includes(node.id)) return 'node-visited';
    if (node.isOperator) return 'node-operator';
    return 'node-default';
  };

  return (
    <div className="canvas-wrapper">
      {nodes.length === 0 ? (
        <div className="empty-canvas">
          <div className="empty-icon">👾</div>
          <p className="empty-title">NO TREE DATA LOADED</p>
          <p className="empty-sub">INSERT A NODE OR PRESS A PRESET TO START!</p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 880 ${height}`}
          className="tree-svg"
          role="img"
          aria-label="Binary Tree Visualization"
        >
          {/* Connecting Pixel Edges */}
          {edges.map((edge, idx) => (
            <line
              key={`${edge.from.id}-${edge.to.id}-${idx}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              className="tree-edge"
            />
          ))}

          {/* Root Label Pointer */}
          {showRootBadge &&
            tree.root &&
            tree.root.x !== undefined &&
            tree.root.y !== undefined && (
              <g transform={`translate(${tree.root.x - 86}, ${tree.root.y + 5})`}>
                <text className="root-pointer-text">ROOT►</text>
              </g>
            )}

          {/* Pixel Square/Octagon Arcade Nodes */}
          {nodes.map((node: TreeNode) => {
            const stateClass = getNodeStateClass(node);
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => interactive && onNodeClick?.(node)}
                className={`tree-node-group ${stateClass} ${
                  interactive ? 'clickable' : ''
                }`}
              >
                {/* Hard pixel shadow */}
                <rect
                  x="-18"
                  y="-18"
                  width="40"
                  height="40"
                  className="tree-node-shadow"
                />
                {/* Main pixel block */}
                <rect
                  x="-20"
                  y="-20"
                  width="40"
                  height="40"
                  className="tree-node-box"
                />
                <text dy="6" textAnchor="middle" className="tree-node-text">
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