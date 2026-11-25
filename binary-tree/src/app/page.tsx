'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  StandardBinaryTree,
  ExpressionTree,
  TraversalType,
  TreeNode,
} from './lib/bst';
import TreeCanvas from './components/TreeCanvas';

type TabMode = 'builder' | 'expression' | 'traversal' | 'game' | 'concepts';

interface GameLevel {
  id: number;
  title: string;
  description: string;
  treeNodes: string[];
  mode: 'leaves' | 'traversal' | 'postfix-quiz';
  traversalType?: TraversalType;
  expression?: string;
}

const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    title: 'STAGE 01: LEAF HUNTER',
    description:
      'CLICK ALL 5 LEAF NODES (NODES WITH NO CHILDREN: 8, 5, 9, 10, 7)!',
    treeNodes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    mode: 'leaves',
  },
  {
    id: 2,
    title: 'STAGE 02: INORDER (LTR)',
    description:
      'VISIT LEFT -> ROOT -> RIGHT (LTR). CLICK NODES IN INORDER SEQUENCE!',
    treeNodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    mode: 'traversal',
    traversalType: 'inorder',
  },
  {
    id: 3,
    title: 'STAGE 03: PREORDER (TLR)',
    description:
      'VISIT ROOT -> LEFT -> RIGHT (TLR). CLICK NODES IN PREORDER SEQUENCE!',
    treeNodes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13', '14'],
    mode: 'traversal',
    traversalType: 'preorder',
  },
  {
    id: 4,
    title: 'STAGE 04: POSTORDER (LRT)',
    description:
      'VISIT LEFT -> RIGHT -> ROOT (LRT). CLICK NODES IN POSTORDER SEQUENCE!',
    treeNodes: ['+', '*', '/', 'A', 'B', 'C', 'D'],
    mode: 'traversal',
    traversalType: 'postorder',
  },
  {
    id: 5,
    title: 'STAGE 05: SEATWORK BOSS',
    description:
      'SOLVE THE SEATWORK EXPRESSION TREE: TYPE PREFIX (TLR) & POSTFIX (LRT)!',
    treeNodes: [],
    mode: 'postfix-quiz',
    expression: 'A*B+C^D/E-F^G',
  },
];

const LESSON_TREE_PRESETS = [
  {
    label: 'INTRO DIAGRAM (1-10)',
    values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  },
  {
    label: 'ALPHABET TREE (A-J)',
    values: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  },
  {
    label: 'FULL BINARY TREE (1-7)',
    values: ['1', '2', '3', '4', '5', '6', '7'],
  },
  {
    label: 'ARRAY [1, 2, 3, 4, 5]',
    values: ['1', '2', '3', '4', '5'],
  },
];

const SEATWORK_EXPRESSIONS = [
  { label: 'EXAMPLE 01', expr: 'A*B+C/D' },
  { label: 'EXAMPLE 02', expr: '3+5+9*2' },
  { label: 'SEATWORK 01', expr: '(A+B^C/D*E^F-G*H)' },
  { label: 'SEATWORK 02', expr: 'A*(B^C+D/(E^F+G/H))-I' },
  { label: 'SEATWORK 03', expr: 'A-B*C/D+E/F^G+H' },
  { label: 'SEATWORK 04', expr: '(A/B-(C/D/E*F)+G/H*I)' },
  { label: 'SEATWORK 05', expr: 'A+B-(C/D^E+F*H*I/J)' },
  { label: 'SEATWORK 06', expr: 'A*B+C^D/E-F^G' },
];

export default function BinaryTreeApp() {
  const [activeTab, setActiveTab] = useState<TabMode>('builder');

  // Builder State
  const [btree, setBtree] = useState<StandardBinaryTree>(
    () => new StandardBinaryTree(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
  );
  const [nodeInput, setNodeInput] = useState('');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [errorNodeId, setErrorNodeId] = useState<string | null>(null);
  const [speed] = useState<number>(450);

  // Expression Tree State
  const [exprInput, setExprInput] = useState('A*B+C/D');
  const [exprTree, setExprTree] = useState<ExpressionTree>(
    () => new ExpressionTree('A*B+C/D')
  );
  const [exprTraversalType, setExprTraversalType] = useState<TraversalType>('inorder');
  const [exprAnimatedList, setExprAnimatedList] = useState<string[]>([]);

  // Traversal State
  const [selectedTraversal, setSelectedTraversal] = useState<TraversalType>('inorder');
  const [traversalOutput, setTraversalOutput] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Arcade Game State
  const [levelIdx, setLevelIdx] = useState(0);
  const [gameTree, setGameTree] = useState<StandardBinaryTree>(
    () => new StandardBinaryTree(GAME_LEVELS[0].treeNodes)
  );
  const [gameExprTree, setGameExprTree] = useState<ExpressionTree>(
    () => new ExpressionTree('A*B+C^D/E-F^G')
  );
  const [clickedIds, setClickedIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'mistake'>('playing');
  const [gameBannerText, setGameBannerText] = useState<string>(GAME_LEVELS[0].description);
  const [prefixGuess, setPrefixGuess] = useState('');
  const [postfixGuess, setPostfixGuess] = useState('');

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsAnimating(false);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const resetHighlights = () => {
    clearTimers();
    setActiveNodeId(null);
    setVisitedNodeIds([]);
    setErrorNodeId(null);
    setTraversalOutput([]);
    setExprAnimatedList([]);
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    const val = nodeInput.trim().toUpperCase();
    if (!val) return;
    resetHighlights();
    setBtree(new StandardBinaryTree([...btree.values, val]));
    setNodeInput('');
  };

  const handleRemoveLast = () => {
    resetHighlights();
    setBtree(new StandardBinaryTree(btree.values.slice(0, -1)));
  };

  const handleLoadPreset = (vals: string[]) => {
    resetHighlights();
    setBtree(new StandardBinaryTree(vals));
  };

  const runTraversal = (
    treeObj: StandardBinaryTree | ExpressionTree,
    type: TraversalType,
    isExpr = false
  ) => {
    const ordered = treeObj.traverseNodes(type);
    if (ordered.length === 0) return;

    resetHighlights();
    if (isExpr) setExprTraversalType(type);
    else setSelectedTraversal(type);
    setIsAnimating(true);

    ordered.forEach((node, idx) => {
      const t = setTimeout(() => {
        setActiveNodeId(node.id);
        setVisitedNodeIds((prev) => [...prev, node.id]);
        if (isExpr) {
          setExprAnimatedList((prev) => [...prev, node.value]);
        } else {
          setTraversalOutput((prev) => [...prev, node.value]);
        }

        if (idx === ordered.length - 1) {
          const endT = setTimeout(() => {
            setActiveNodeId(null);
            setIsAnimating(false);
          }, speed);
          timersRef.current.push(endT);
        }
      }, idx * speed);
      timersRef.current.push(t);
    });
  };

  const handleBuildExpression = (customExpr?: string) => {
    const target = customExpr !== undefined ? customExpr : exprInput;
    if (customExpr !== undefined) setExprInput(customExpr);
    resetHighlights();
    setExprTree(new ExpressionTree(target));
  };

  const currentLevel = GAME_LEVELS[levelIdx];

  const loadLevel = (idx: number, resetLives = false) => {
    resetHighlights();
    const lvl = GAME_LEVELS[idx];
    setLevelIdx(idx);
    setClickedIds([]);
    if (resetLives) setLives(3);
    setGameStatus('playing');
    setGameBannerText(lvl.description);
    setPrefixGuess('');
    setPostfixGuess('');

    if (lvl.mode === 'postfix-quiz' && lvl.expression) {
      setGameExprTree(new ExpressionTree(lvl.expression));
    } else {
      setGameTree(new StandardBinaryTree(lvl.treeNodes));
    }
  };

  const handleGameNodeClick = (node: TreeNode) => {
    if (gameStatus !== 'playing' || currentLevel.mode === 'postfix-quiz') return;

    if (currentLevel.mode === 'leaves') {
      const leafIds = gameTree.getLeafNodes().map((n) => n.id);
      if (!leafIds.includes(node.id)) {
        setGameStatus('mistake');
        setErrorNodeId(node.id);
        setLives((l) => Math.max(0, l - 1));
        setGameBannerText(`GAME OVER! "${node.value}" HAS CHILDREN (NOT A LEAF).`);
        return;
      }
      if (clickedIds.includes(node.id)) return;

      const nextClicked = [...clickedIds, node.id];
      setClickedIds(nextClicked);
      setVisitedNodeIds(nextClicked);
      setActiveNodeId(node.id);

      if (nextClicked.length === leafIds.length) {
        setGameStatus('won');
        setScore((s) => s + 100);
        setGameBannerText('MISSION COMPLETE! ALL LEAF NODES FOUND (+100 PTS)');
      } else {
        setGameBannerText(`NICE HIT! ${nextClicked.length} OF ${leafIds.length} LEAVES FOUND.`);
      }
      return;
    }

    if (currentLevel.mode === 'traversal' && currentLevel.traversalType) {
      const expectedNodes = gameTree.traverseNodes(currentLevel.traversalType);
      const expectedNode = expectedNodes[clickedIds.length];

      if (node.id === expectedNode?.id) {
        const nextClicked = [...clickedIds, node.id];
        setClickedIds(nextClicked);
        setVisitedNodeIds(nextClicked);
        setActiveNodeId(node.id);

        if (nextClicked.length === expectedNodes.length) {
          setGameStatus('won');
          setScore((s) => s + 150);
          setGameBannerText('MISSION COMPLETE! PERFECT TRAVERSAL (+150 PTS)');
        } else {
          setGameBannerText(`COMBO x${nextClicked.length}! STEP ${nextClicked.length}/${expectedNodes.length}`);
        }
      } else {
        setGameStatus('mistake');
        setErrorNodeId(node.id);
        setLives((l) => Math.max(0, l - 1));
        setGameBannerText(
          `GAME OVER! "${node.value}" IS WRONG ORDER FOR ${currentLevel.traversalType.toUpperCase()}.`
        );
      }
    }
  };

  const handleCheckBossQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPrefix = gameExprTree
      .traverseNodes('preorder')
      .map((n) => n.value)
      .join('');
    const expectedPostfix = gameExprTree
      .traverseNodes('postorder')
      .map((n) => n.value)
      .join('');

    const cleanPre = prefixGuess.replace(/\s+/g, '').toUpperCase();
    const cleanPost = postfixGuess.replace(/\s+/g, '').toUpperCase();

    if (cleanPre === expectedPrefix && cleanPost === expectedPostfix) {
      setGameStatus('won');
      setScore((s) => s + 300);
      setGameBannerText('MISSION COMPLETE! BOSS DEFEATED (+300 PTS)');
    } else {
      setGameStatus('mistake');
      setLives((l) => Math.max(0, l - 1));
      setGameBannerText(
        `GAME OVER! PREFIX: ${expectedPrefix} | POSTFIX: ${expectedPostfix}`
      );
    }
  };

  const switchTab = (tab: TabMode) => {
    resetHighlights();
    setActiveTab(tab);
    if (tab === 'game') loadLevel(levelIdx, true);
  };

  const leafValues = btree.getLeafNodes().map((n) => n.value);
  const exprInorder = exprTree.traverseNodes('inorder').map((n) => n.value).join(' ');
  const exprPreorder = exprTree.traverseNodes('preorder').map((n) => n.value).join(' ');
  const exprPostorder = exprTree.traverseNodes('postorder').map((n) => n.value).join(' ');
  const exprPrefixCompact = exprTree.traverseNodes('preorder').map((n) => n.value).join('');
  const exprPostfixCompact = exprTree.traverseNodes('postorder').map((n) => n.value).join('');

  return (
    <div className="app-container">
      {/* Top 90s Arcade Console Header */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-badge">🕹️</div>
          <div>
            <div className="retro-tag">BACK TO 90S ★ 1 PLAYER</div>
            <h1>BINARY TREE</h1>
          </div>
        </div>

        <nav className="tab-group" aria-label="Main Navigation">
          <button
            className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => switchTab('builder')}
          >
            [1] BUILDER
          </button>
          <button
            className={`tab-btn ${activeTab === 'expression' ? 'active' : ''}`}
            onClick={() => switchTab('expression')}
          >
            [2] EXPRESSION
          </button>
          <button
            className={`tab-btn ${activeTab === 'traversal' ? 'active' : ''}`}
            onClick={() => switchTab('traversal')}
          >
            [3] TRAVERSAL
          </button>
          <button
            className={`tab-btn ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => switchTab('game')}
          >
            [4] START GAME
          </button>
          <button
            className={`tab-btn ${activeTab === 'concepts' ? 'active' : ''}`}
            onClick={() => switchTab('concepts')}
          >
            [5] MANUAL
          </button>
        </nav>
      </header>

      {/* TAB 1: TREE BUILDER */}
      {activeTab === 'builder' && (
        <main className="workspace-grid">
          <section className="card canvas-card">
            <div className="screen-top-bar">
              <span>MODE: LEVEL-ORDER BUILDER</span>
              <span>NODES: {btree.values.length}</span>
            </div>

            <TreeCanvas
              tree={btree}
              activeNodeId={activeNodeId}
              visitedNodeIds={visitedNodeIds}
              errorNodeId={errorNodeId}
            />

            <div className="anatomy-grid">
              <div className="anatomy-box">
                <span>ROOT NODE</span>
                <strong>{btree.root ? btree.root.value : 'NONE'}</strong>
              </div>
              <div className="anatomy-box">
                <span>LEAF NODES</span>
                <strong>{leafValues.length > 0 ? leafValues.join(', ') : 'NONE'}</strong>
              </div>
              <div className="anatomy-box">
                <span>HEIGHT (EDGES)</span>
                <strong>{btree.getEdgeHeight()}</strong>
              </div>
              <div className="anatomy-box">
                <span>TREE TYPE</span>
                <strong>
                  {btree.values.length === 0
                    ? 'EMPTY'
                    : btree.isFullBinaryTree()
                    ? 'FULL & COMPLETE'
                    : 'COMPLETE TREE'}
                </strong>
              </div>
            </div>
          </section>

          <aside className="controls-column">
            <div className="card control-card">
              <h2>+ INSERT NODE</h2>
              <p className="helper-text">
                ARRAY: [{btree.values.join(', ')}]
              </p>
              <form onSubmit={handleAddNode} className="input-row">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="VAL (E.G. 11)"
                  value={nodeInput}
                  onChange={(e) => setNodeInput(e.target.value)}
                />
                <button type="submit" className="btn btn-green">
                  ADD
                </button>
              </form>

              <div className="button-grid">
                <button
                  type="button"
                  className="btn btn-pink"
                  onClick={handleRemoveLast}
                  disabled={btree.values.length === 0}
                >
                  UNDO LAST
                </button>
                <button
                  type="button"
                  className="btn btn-red"
                  onClick={() => handleLoadPreset([])}
                >
                  CLEAR
                </button>
              </div>
            </div>

            <div className="card control-card">
              <h2>★ LESSON CARTRIDGES</h2>
              <div className="preset-list">
                {LESSON_TREE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="preset-btn"
                    onClick={() => handleLoadPreset(preset.values)}
                  >
                    <strong>► {preset.label}</strong>
                    <span>[{preset.values.join(', ')}]</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* TAB 2: EXPRESSION TREE */}
      {activeTab === 'expression' && (
        <main className="workspace-grid">
          <section className="card canvas-card">
            <div className="expr-header-bar">
              <div className="legend-pills">
                <span className="pill-op">OP: + − * / ^</span>
                <span className="pill-val">VAR: A, B, C...</span>
              </div>
              <div className="traversal-mini-btns">
                <button
                  type="button"
                  className="chip"
                  onClick={() => runTraversal(exprTree, 'inorder', true)}
                  disabled={isAnimating || !!exprTree.error}
                >
                  ► LTR
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => runTraversal(exprTree, 'preorder', true)}
                  disabled={isAnimating || !!exprTree.error}
                >
                  ► TLR
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => runTraversal(exprTree, 'postorder', true)}
                  disabled={isAnimating || !!exprTree.error}
                >
                  ► LRT
                </button>
              </div>
            </div>

            {exprTree.error ? (
              <div className="status-banner mistake">ERROR: {exprTree.error}</div>
            ) : (
              <TreeCanvas
                tree={exprTree}
                activeNodeId={activeNodeId}
                visitedNodeIds={visitedNodeIds}
                errorNodeId={errorNodeId}
                showRootBadge={false}
              />
            )}

            {exprAnimatedList.length > 0 && (
              <div className="sequence-box" style={{ marginTop: 12 }}>
                <strong style={{ fontSize: '0.85rem' }}>
                  {exprTraversalType.toUpperCase()}:
                </strong>
                {exprAnimatedList.map((v, idx) => (
                  <span key={idx} className="seq-pill">
                    {v}
                  </span>
                ))}
              </div>
            )}

            {!exprTree.error && (
              <div className="notation-grid" style={{ marginTop: 16 }}>
                <div className="notation-card">
                  <span className="notation-label">INORDER (LTR)</span>
                  <code>{exprInorder}</code>
                </div>
                <div className="notation-card">
                  <span className="notation-label">PREORDER (TLR)</span>
                  <code>{exprPreorder}</code>
                  <small>PREFIX: {exprPrefixCompact}</small>
                </div>
                <div className="notation-card">
                  <span className="notation-label">POSTORDER (LRT)</span>
                  <code>{exprPostorder}</code>
                  <small>POSTFIX: {exprPostfixCompact}</small>
                </div>
              </div>
            )}
          </section>

          <aside className="controls-column">
            <div className="card control-card">
              <h2>🧮 INFIX FORMULA</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBuildExpression();
                }}
                className="input-row"
              >
                <input
                  type="text"
                  placeholder="E.G. A*B+C/D"
                  value={exprInput}
                  onChange={(e) => setExprInput(e.target.value)}
                />
                <button type="submit" className="btn btn-green">
                  BUILD
                </button>
              </form>

              <p className="sub-label">SEATWORK STAGES:</p>
              <div className="preset-list">
                {SEATWORK_EXPRESSIONS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`preset-btn ${exprInput === item.expr ? 'active-preset' : ''}`}
                    onClick={() => handleBuildExpression(item.expr)}
                  >
                    <strong>► {item.label}</strong>
                    <code>{item.expr}</code>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* TAB 3: TRAVERSALS */}
      {activeTab === 'traversal' && (
        <main className="traversal-layout">
          <div className="card traversal-controls">
            <div>
              <h2>► TRAVERSAL SCANNER</h2>
              <p>SELECT LTR, TLR, OR LRT TO SCAN CURRENT TREE.</p>
            </div>
            <div className="traversal-buttons">
              <button
                className={`btn ${selectedTraversal === 'inorder' ? 'btn-yellow' : 'btn-outline'}`}
                onClick={() => runTraversal(btree, 'inorder')}
                disabled={isAnimating}
              >
                1. INORDER (LTR)
              </button>
              <button
                className={`btn ${selectedTraversal === 'preorder' ? 'btn-yellow' : 'btn-outline'}`}
                onClick={() => runTraversal(btree, 'preorder')}
                disabled={isAnimating}
              >
                2. PREORDER (TLR)
              </button>
              <button
                className={`btn ${selectedTraversal === 'postorder' ? 'btn-yellow' : 'btn-outline'}`}
                onClick={() => runTraversal(btree, 'postorder')}
                disabled={isAnimating}
              >
                3. POSTORDER (LRT)
              </button>
            </div>
          </div>

          <div className="card output-strip">
            <span className="output-label">
              {selectedTraversal === 'inorder'
                ? 'INORDER (LTR):'
                : selectedTraversal === 'preorder'
                ? 'PREORDER (TLR):'
                : 'POSTORDER (LRT):'}
            </span>
            <div className="sequence-box">
              {traversalOutput.length === 0 ? (
                <span className="placeholder-text">PRESS A BUTTON ABOVE TO SCAN...</span>
              ) : (
                traversalOutput.map((val, i) => (
                  <span key={i} className="seq-pill">
                    {val}
                  </span>
                ))
              )}
            </div>
          </div>

          <section className="card canvas-card">
            <TreeCanvas
              tree={btree}
              activeNodeId={activeNodeId}
              visitedNodeIds={visitedNodeIds}
              errorNodeId={errorNodeId}
            />
          </section>
        </main>
      )}

      {/* TAB 4: ARCADE GAME */}
      {activeTab === 'game' && (
        <main className="game-layout">
          <div className="card score-bar">
            <div className="level-selector">
              {GAME_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  className={`level-pill ${idx === levelIdx ? 'current' : ''}`}
                  onClick={() => loadLevel(idx)}
                >
                  LVL {lvl.id}
                </button>
              ))}
            </div>
            <div className="score-badges">
              <span className="badge-hearts">
                {'♥'.repeat(lives)}
                {'♡'.repeat(Math.max(0, 3 - lives))}
              </span>
              <span className="badge-score">POINT: {String(score).padStart(4, '0')}</span>
              <span className="badge-level">LEVEL: 0{levelIdx + 1}</span>
            </div>
          </div>

          <div className={`status-banner ${gameStatus}`}>
            <div>
              <strong>{currentLevel.title} — </strong>
              <span>{gameBannerText}</span>
            </div>
            <div className="banner-actions">
              {gameStatus === 'mistake' ? (
                <div className="play-again-box">
                  <span>PLAY AGAIN?</span>
                  <button
                    className="btn btn-green"
                    onClick={() => loadLevel(levelIdx, lives === 0)}
                  >
                    YES
                  </button>
                  <button className="btn btn-pink" onClick={() => switchTab('builder')}>
                    NO
                  </button>
                </div>
              ) : (
                <button className="btn btn-outline" onClick={() => loadLevel(levelIdx)}>
                  RESET
                </button>
              )}
              {gameStatus === 'won' && levelIdx < GAME_LEVELS.length - 1 && (
                <button className="btn btn-yellow" onClick={() => loadLevel(levelIdx + 1)}>
                  LEVEL UP ►
                </button>
              )}
            </div>
          </div>

          {currentLevel.mode === 'postfix-quiz' ? (
            <section className="card canvas-card">
              <div style={{ marginBottom: 12, textAlign: 'center' }}>
                <span className="pill-op">INORDER: {currentLevel.expression}</span>
              </div>
              <TreeCanvas
                tree={gameExprTree}
                activeNodeId={null}
                visitedNodeIds={[]}
                errorNodeId={null}
                showRootBadge={false}
              />
              <form onSubmit={handleCheckBossQuiz} className="boss-quiz-form">
                <input
                  type="text"
                  placeholder="ENTER PREFIX (TLR) E.G. -+*AB/^CDEF^G"
                  value={prefixGuess}
                  onChange={(e) => setPrefixGuess(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="ENTER POSTFIX (LRT) E.G. AB*CD^E/+FG^-"
                  value={postfixGuess}
                  onChange={(e) => setPostfixGuess(e.target.value)}
                />
                <button type="submit" className="btn btn-green">
                  PRESS START / SUBMIT
                </button>
              </form>
            </section>
          ) : (
            <section className="card canvas-card">
              <TreeCanvas
                tree={gameTree}
                activeNodeId={activeNodeId}
                visitedNodeIds={visitedNodeIds}
                errorNodeId={errorNodeId}
                onNodeClick={handleGameNodeClick}
                interactive={gameStatus === 'playing'}
              />
            </section>
          )}
        </main>
      )}

      {/* TAB 5: MANUAL / CONCEPTS */}
      {activeTab === 'concepts' && (
        <main className="guide-grid">
          <div className="card guide-card">
            <h3>[01] KEY TERMS</h3>
            <p>
              <strong>ROOT:</strong> TOP-MOST NODE IN THE TREE.<br />
              <strong>LEAF:</strong> NODE WITH NO CHILDREN.<br />
              <strong>HEIGHT:</strong> EDGES ON LONGEST PATH FROM ROOT TO LEAF.
            </p>
          </div>
          <div className="card guide-card">
            <h3>[02] TREE TYPES</h3>
            <p>
              <strong>FULL BINARY TREE:</strong> EVERY NODE HAS 0 OR 2 CHILDREN.<br />
              <strong>COMPLETE BINARY TREE:</strong> ALL LEVELS FULL EXCEPT LAST (LEFT TO RIGHT).
            </p>
          </div>
          <div className="card guide-card">
            <h3>[03] TRAVERSAL RULES</h3>
            <p>
              <strong>INORDER (LTR):</strong> LEFT → ROOT → RIGHT<br />
              <strong>PREORDER (TLR):</strong> ROOT → LEFT → RIGHT (PREFIX)<br />
              <strong>POSTORDER (LRT):</strong> LEFT → RIGHT → ROOT (POSTFIX)
            </p>
          </div>
          <div className="card guide-card">
            <h3>[04] PEMDAS PRIORITY</h3>
            <p>
              1. PARENTHESES ( )<br />
              2. EXPONENT ^<br />
              3. MULTIPLY / DIVIDE * /<br />
              4. ADD / SUBTRACT + −
            </p>
          </div>
        </main>
      )}
    </div>
  );
}