# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla JS Tetris (HTML5 Canvas). No dependencies, no package.json, no build, no tests, no linter. The README (in Spanish) documents controls and customization; UI strings are in Spanish.

## Running

Open `index.html` directly in a browser, or serve the folder (e.g. `python3 -m http.server`). Verification is manual in the browser.

## Architecture

Three files, all logic in `game.js` (loaded as a classic script, `'use strict'`, global state):

- `index.html` defines the DOM that `game.js` looks up by id at load time (`board`, `next-canvas`, `score`, `lines`, `level`, `overlay`, `overlay-title`, `overlay-score`, `restart-btn`). Renaming an id requires updating the lookups at the top of `game.js`.
- `style.css` — styling only.
- `game.js` — module-level mutable state (`board`, `current`, `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `dropInterval`, ...) reset by `init()`.

Key flow:
- `loop(ts)` (requestAnimationFrame) accumulates time into `dropAccum`; when it exceeds `dropInterval` the piece falls one row or locks. It always calls `draw()`.
- Locking: `lockPiece()` → `merge()` → `clearLines()` (updates lines/score/level and `dropInterval`) → `spawn()` (promotes `next`, detects game over via collision on spawn).
- Pieces are matrices in `PIECES`; cell values are indices into `COLORS` (0 = empty), so the board stores color indices directly. Index 0 of both arrays is `null`.
- Rotation is `rotateCW` plus horizontal wall kicks `[0,-1,1,-2,2]` in `tryRotate()` (no SRS, no floor kicks).
- Pause/game-over stop the loop via `cancelAnimationFrame`; resume restarts it manually in `togglePause()`, and `endGame()` shows the overlay whose button calls `init()`.
- Input is a single `keydown` handler at the bottom of `game.js`; soft drop/hard drop add score directly (1 and 2 per cell).
