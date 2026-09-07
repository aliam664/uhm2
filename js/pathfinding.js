/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Navigation Grid, Optimized A* Pathfinding, Path Smoothing & Line-of-Sight
 */

class FastMinHeap {
  constructor() {
    this.heap = [];
  }

  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(idx) {
    const node = this.heap[idx];
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      const parent = this.heap[parentIdx];
      if (node.f >= parent.f) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = node;
  }

  _sinkDown(idx) {
    const length = this.heap.length;
    const node = this.heap[idx];

    while (true) {
      let leftChildIdx = (idx << 1) + 1;
      let rightChildIdx = leftChildIdx + 1;
      let swapIdx = -1;

      if (leftChildIdx < length) {
        if (this.heap[leftChildIdx].f < node.f) {
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        if (
          (swapIdx === -1 && this.heap[rightChildIdx].f < node.f) ||
          (swapIdx !== -1 && this.heap[rightChildIdx].f < this.heap[leftChildIdx].f)
        ) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === -1) break;
      this.heap[idx] = this.heap[swapIdx];
      idx = swapIdx;
    }
    this.heap[idx] = node;
  }
}

class NavigationGrid {
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);

    // 0 = Walkable, 1 = Solid Obstacle, >1 = Additional Cost (Danger/Zone)
    this.grid = new Uint8Array(this.cols * this.rows);
    this.dangerMap = new Float32Array(this.cols * this.rows);

    this.obstacles = [];
    this.searchSession = 0;
    this.nodeMeta = new Int32Array(this.cols * this.rows * 4); // [session, g, f, parent]
  }

  _index(col, row) {
    return row * this.cols + col;
  }

  isWalkable(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.grid[this._index(col, row)] === 0;
  }

  isWalkableWorld(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return this.isWalkable(col, row);
  }

  worldToGrid(x, y) {
    return {
      col: Utils.clamp(Math.floor(x / this.cellSize), 0, this.cols - 1),
      row: Utils.clamp(Math.floor(y / this.cellSize), 0, this.rows - 1)
    };
  }

  gridToWorld(col, row) {
    return {
      x: (col + 0.5) * this.cellSize,
      y: (row + 0.5) * this.cellSize
    };
  }

  setObstacles(obstacles) {
    this.obstacles = obstacles;
    this.grid.fill(0);

    // Mark water borders as obstacles
    const marginCols = Math.ceil(CONFIG.MAP.WATER_MARGIN / this.cellSize);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < marginCols; c++) {
        this.grid[this._index(c, r)] = 1;
        this.grid[this._index(this.cols - 1 - c, r)] = 1;
      }
    }
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < marginCols; r++) {
        this.grid[this._index(c, r)] = 1;
        this.grid[this._index(c, this.rows - 1 - r)] = 1;
      }
    }

    // Rasterize rectangles with padding for agent radius
    const padding = 14;
    obstacles.forEach(obs => {
      const minCol = Utils.clamp(Math.floor((obs.x - padding) / this.cellSize), 0, this.cols - 1);
      const maxCol = Utils.clamp(Math.floor((obs.x + obs.w + padding) / this.cellSize), 0, this.cols - 1);
      const minRow = Utils.clamp(Math.floor((obs.y - padding) / this.cellSize), 0, this.rows - 1);
      const maxRow = Utils.clamp(Math.floor((obs.y + obs.h + padding) / this.cellSize), 0, this.rows - 1);

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          this.grid[this._index(c, r)] = 1;
        }
      }
    });
  }

  addDangerZone(worldX, worldY, radius, dangerValue) {
    const minCol = Utils.clamp(Math.floor((worldX - radius) / this.cellSize), 0, this.cols - 1);
    const maxCol = Utils.clamp(Math.floor((worldX + radius) / this.cellSize), 0, this.cols - 1);
    const minRow = Utils.clamp(Math.floor((worldY - radius) / this.cellSize), 0, this.rows - 1);
    const maxRow = Utils.clamp(Math.floor((worldY + radius) / this.cellSize), 0, this.rows - 1);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const wp = this.gridToWorld(c, r);
        const d = Utils.dist(worldX, worldY, wp.x, wp.y);
        if (d <= radius) {
          const factor = 1.0 - (d / radius);
          this.dangerMap[this._index(c, r)] += dangerValue * factor;
        }
      }
    }
  }

  decayDanger(dt) {
    for (let i = 0; i < this.dangerMap.length; i++) {
      if (this.dangerMap[i] > 0) {
        this.dangerMap[i] = Math.max(0, this.dangerMap[i] - dt * 2.0);
      }
    }
  }

  hasLineOfSight(x1, y1, x2, y2) {
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (Utils.lineIntersectsRect(x1, y1, x2, y2, obs.x, obs.y, obs.w, obs.h)) {
        return false;
      }
    }
    return true;
  }

  findPath(startX, startY, endX, endY, avoidDanger = false) {
    // Check direct line of sight first (immediate shortcut)
    if (this.hasLineOfSight(startX, startY, endX, endY) && !avoidDanger) {
      return [{ x: endX, y: endY }];
    }

    const start = this.worldToGrid(startX, startY);
    let end = this.worldToGrid(endX, endY);

    // If target cell is solid, find closest walkable neighbor
    if (!this.isWalkable(end.col, end.row)) {
      let nearestDist = Infinity;
      let altCol = end.col;
      let altRow = end.row;

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nc = end.col + dc;
          const nr = end.row + dr;
          if (this.isWalkable(nc, nr)) {
            const d = dc * dc + dr * dr;
            if (d < nearestDist) {
              nearestDist = d;
              altCol = nc;
              altRow = nr;
            }
          }
        }
      }
      end.col = altCol;
      end.row = altRow;
    }

    if (start.col === end.col && start.row === end.row) {
      return [{ x: endX, y: endY }];
    }

    this.searchSession++;
    const currentSession = this.searchSession;

    const openHeap = new FastMinHeap();
    const startIdx = this._index(start.col, start.row);
    const endIdx = this._index(end.col, end.row);

    const closedSet = new Uint8Array(this.cols * this.rows);
    const gScore = new Float32Array(this.cols * this.rows);
    const parentMap = new Int32Array(this.cols * this.rows);

    gScore.fill(Infinity);
    gScore[startIdx] = 0;
    parentMap[startIdx] = -1;

    const h = (c, r) => {
      const dx = Math.abs(c - end.col);
      const dy = Math.abs(r - end.row);
      return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); // Octile distance
    };

    openHeap.push({
      idx: startIdx,
      col: start.col,
      row: start.row,
      f: h(start.col, start.row)
    });

    // 8-neighbor directions
    const neighbors = [
      { dc: 0, dr: -1, cost: 1.0 },
      { dc: 1, dr: 0, cost: 1.0 },
      { dc: 0, dr: 1, cost: 1.0 },
      { dc: -1, dr: 0, cost: 1.0 },
      { dc: 1, dr: -1, cost: 1.414 },
      { dc: 1, dr: 1, cost: 1.414 },
      { dc: -1, dr: 1, cost: 1.414 },
      { dc: -1, dr: -1, cost: 1.414 }
    ];

    let found = false;
    let maxSteps = 1200; // Step safety limit

    while (!openHeap.isEmpty() && maxSteps-- > 0) {
      const current = openHeap.pop();

      if (current.idx === endIdx) {
        found = true;
        break;
      }

      if (closedSet[current.idx] === 1) continue;
      closedSet[current.idx] = 1;

      for (let i = 0; i < neighbors.length; i++) {
        const n = neighbors[i];
        const nc = current.col + n.dc;
        const nr = current.row + n.dr;

        if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;
        const nIdx = this._index(nc, nr);

        if (this.grid[nIdx] === 1 || closedSet[nIdx] === 1) continue;

        // Diagonal corner cutting check
        if (n.cost > 1.0) {
          if (
            this.grid[this._index(current.col + n.dc, current.row)] === 1 ||
            this.grid[this._index(current.col, current.row + n.dr)] === 1
          ) {
            continue;
          }
        }

        let stepCost = n.cost;
        if (avoidDanger && this.dangerMap[nIdx] > 0) {
          stepCost += this.dangerMap[nIdx] * 4.0;
        }

        const tentativeG = gScore[current.idx] + stepCost;

        if (tentativeG < gScore[nIdx]) {
          parentMap[nIdx] = current.idx;
          gScore[nIdx] = tentativeG;
          const f = tentativeG + h(nc, nr);

          openHeap.push({
            idx: nIdx,
            col: nc,
            row: nr,
            f: f
          });
        }
      }
    }

    if (!found) {
      // Fallback: direct line to end
      return [{ x: endX, y: endY }];
    }

    // Reconstruct raw grid path
    const rawPath = [];
    let curr = endIdx;
    while (curr !== -1) {
      const c = curr % this.cols;
      const r = Math.floor(curr / this.cols);
      rawPath.unshift(this.gridToWorld(c, r));
      curr = parentMap[curr];
    }

    // Ensure final exact point is target
    if (rawPath.length > 0) {
      rawPath[rawPath.length - 1] = { x: endX, y: endY };
    }

    // Path smoothing / string-pulling
    return this._smoothPath(startX, startY, rawPath);
  }

  _smoothPath(startX, startY, rawPath) {
    if (rawPath.length <= 2) return rawPath;

    const smoothed = [];
    let currentX = startX;
    let currentY = startY;
    let idx = 0;

    while (idx < rawPath.length) {
      // Find furthest visible node from current position
      let furthestIdx = idx;
      for (let next = rawPath.length - 1; next > idx; next--) {
        if (this.hasLineOfSight(currentX, currentY, rawPath[next].x, rawPath[next].y)) {
          furthestIdx = next;
          break;
        }
      }

      const target = rawPath[furthestIdx];
      smoothed.push(target);
      currentX = target.x;
      currentY = target.y;

      if (furthestIdx === rawPath.length - 1) break;
      idx = furthestIdx + 1;
    }

    return smoothed.length > 0 ? smoothed : rawPath;
  }

  drawDebug(ctx) {
    if (!CONFIG.DEBUG.DRAW_GRID) return;

    ctx.save();
    ctx.lineWidth = 0.5;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = this._index(c, r);
        const x = c * this.cellSize;
        const y = r * this.cellSize;

        if (this.grid[idx] === 1) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
          ctx.fillRect(x, y, this.cellSize, this.cellSize);
        } else if (this.dangerMap[idx] > 0) {
          const alpha = Utils.clamp(this.dangerMap[idx] * 0.1, 0, 0.5);
          ctx.fillStyle = `rgba(255, 120, 0, ${alpha})`;
          ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }

    ctx.restore();
  }
}

let NavGrid = null;

if (typeof window !== 'undefined') {
  window.FastMinHeap = FastMinHeap;
  window.NavigationGrid = NavigationGrid;
  window.NavGrid = NavGrid;
}
if (typeof globalThis !== 'undefined') {
  globalThis.FastMinHeap = FastMinHeap;
  globalThis.NavigationGrid = NavigationGrid;
  globalThis.NavGrid = NavGrid;
}
