/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Utility Library & Math Helpers
 */

const Utils = {
  // Math & Vector functions
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  },

  dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.hypot(dx, dy);
  },

  distSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  },

  normalize(x, y) {
    const len = Math.hypot(x, y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  },

  dot(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
  },

  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  },

  randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  },

  randomChoice(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  },

  approach(current, target, maxDelta) {
    if (current < target) {
      return Math.min(current + maxDelta, target);
    } else {
      return Math.max(current - maxDelta, target);
    }
  },

  // Formatting
  formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  formatScore(score) {
    return Math.floor(score).toLocaleString('en-US');
  },

  // Color operations
  hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(Utils.clamp(x, 0, 255)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  alphaColor(hex, alpha) {
    const rgb = Utils.hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Utils.clamp(alpha, 0, 1)})`;
  },

  lerpColor(hexA, hexB, t) {
    const a = Utils.hexToRgb(hexA);
    const b = Utils.hexToRgb(hexB);
    return Utils.rgbToHex(
      Utils.lerp(a.r, b.r, t),
      Utils.lerp(a.g, b.g, t),
      Utils.lerp(a.b, b.b, t)
    );
  },

  // Collision Checks
  circleIntersect(c1x, c1y, r1, c2x, c2y, r2) {
    return Utils.distSq(c1x, c1y, c2x, c2y) <= (r1 + r2) * (r1 + r2);
  },

  pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  },

  circleRectIntersect(cx, cy, r, rx, ry, rw, rh) {
    const closestX = Utils.clamp(cx, rx, rx + rw);
    const closestY = Utils.clamp(cy, ry, ry + rh);
    return Utils.distSq(cx, cy, closestX, closestY) <= r * r;
  },

  resolveCircleRectCollision(circle, rect) {
    const closestX = Utils.clamp(circle.x, rect.x, rect.x + rect.w);
    const closestY = Utils.clamp(circle.y, rect.y, rect.y + rect.h);
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const dSq = dx * dx + dy * dy;

    if (dSq < circle.radius * circle.radius && dSq > 0.0001) {
      const d = Math.sqrt(dSq);
      const overlap = circle.radius - d;
      circle.x += (dx / d) * overlap;
      circle.y += (dy / d) * overlap;
      return true;
    } else if (dSq <= 0.0001) {
      // Circle center inside rectangle: push out to nearest edge
      const dl = circle.x - rect.x;
      const dr = (rect.x + rect.w) - circle.x;
      const dt = circle.y - rect.y;
      const db = (rect.y + rect.h) - circle.y;
      const minEdge = Math.min(dl, dr, dt, db);
      if (minEdge === dl) circle.x = rect.x - circle.radius;
      else if (minEdge === dr) circle.x = rect.x + rect.w + circle.radius;
      else if (minEdge === dt) circle.y = rect.y - circle.radius;
      else circle.y = rect.y + rect.h + circle.radius;
      return true;
    }
    return false;
  },

  // Line segment intersects bounding box
  lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Liang-Barsky line clipping algorithm
    let p1 = -(x2 - x1);
    let p2 = -p1;
    let p3 = -(y2 - y1);
    let p4 = -p3;

    let q1 = x1 - rx;
    let q2 = (rx + rw) - x1;
    let q3 = y1 - ry;
    let q4 = (ry + rh) - y1;

    let u1 = 0;
    let u2 = 1;

    const p = [p1, p2, p3, p4];
    const q = [q1, q2, q3, q4];

    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return false;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > u2) return false;
          if (t > u1) u1 = t;
        } else {
          if (t < u1) return false;
          if (t < u2) u2 = t;
        }
      }
    }
    return u1 <= u2;
  },

  // Generic Object Pool for high-frequency objects
  createPool(factory, resetFn, initialSize = 50) {
    const pool = [];
    for (let i = 0; i < initialSize; i++) {
      pool.push(factory());
    }
    return {
      get(...args) {
        let obj = pool.length > 0 ? pool.pop() : factory();
        if (resetFn) resetFn(obj, ...args);
        return obj;
      },
      release(obj) {
        pool.push(obj);
      },
      size() {
        return pool.length;
      }
    };
  },

  // LocalStorage wrapper with fallback
  storage: {
    get(key, defaultValue) {
      try {
        const val = localStorage.getItem('DOCKLANDS_' + key);
        return val !== null ? JSON.parse(val) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('DOCKLANDS_' + key, JSON.stringify(value));
      } catch (e) {
        // Ignore quota/private mode errors
      }
    }
  }
};

// Spatial Hash Grid for fast spatial queries
class SpatialGrid {
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.grid = new Array(this.cols * this.rows).fill(null).map(() => []);
  }

  clear() {
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i].length = 0;
    }
  }

  _getKey(x, y) {
    const col = Utils.clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const row = Utils.clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    return row * this.cols + col;
  }

  insert(entity) {
    const minCol = Utils.clamp(Math.floor((entity.x - entity.radius) / this.cellSize), 0, this.cols - 1);
    const maxCol = Utils.clamp(Math.floor((entity.x + entity.radius) / this.cellSize), 0, this.cols - 1);
    const minRow = Utils.clamp(Math.floor((entity.y - entity.radius) / this.cellSize), 0, this.rows - 1);
    const maxRow = Utils.clamp(Math.floor((entity.y + entity.radius) / this.cellSize), 0, this.rows - 1);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const idx = r * this.cols + c;
        this.grid[idx].push(entity);
      }
    }
  }

  queryRadius(x, y, radius) {
    const minCol = Utils.clamp(Math.floor((x - radius) / this.cellSize), 0, this.cols - 1);
    const maxCol = Utils.clamp(Math.floor((x + radius) / this.cellSize), 0, this.cols - 1);
    const minRow = Utils.clamp(Math.floor((y - radius) / this.cellSize), 0, this.rows - 1);
    const maxRow = Utils.clamp(Math.floor((y + radius) / this.cellSize), 0, this.rows - 1);

    const found = new Set();
    const rSq = radius * radius;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const list = this.grid[r * this.cols + c];
        for (let i = 0; i < list.length; i++) {
          const e = list[i];
          if (!found.has(e)) {
            const dSq = Utils.distSq(x, y, e.x, e.y);
            const combinedR = radius + (e.radius || 0);
            if (dSq <= combinedR * combinedR) {
              found.add(e);
            }
          }
        }
      }
    }
    return Array.from(found);
  }
}

if (typeof window !== 'undefined') {
  window.Utils = Utils;
  window.SpatialGrid = SpatialGrid;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Utils = Utils;
  globalThis.SpatialGrid = SpatialGrid;
}
