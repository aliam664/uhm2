/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Industrial Docklands Arena Generator, Obstacles & Procedural Canvas Rendering
 */

class IndustrialMap {
  constructor(width = 2600, height = 2000) {
    this.width = width;
    this.height = height;
    this.obstacles = [];
    this.itemSpawnNodes = [];
    this.lights = [];
    this.ambientAnimTime = 0;

    this.waterMargin = CONFIG.MAP.WATER_MARGIN;

    // Cache pre-rendered background layer
    this.bgCanvas = null;
    this.bgCtx = null;
  }

  init() {
    this.obstacles = [];
    this.itemSpawnNodes = [];
    this.lights = [];

    this._generateLayout();
    this._generateItemNodes();
    this._generateLighting();
    this._renderStaticBackground();

    // Pass obstacles to navigation grid
    if (window.NavGrid) {
      window.NavGrid.setObstacles(this.obstacles);
    }
  }

  _generateLayout() {
    // 1. BOUNDARY QUAY WALLS
    const W = this.width;
    const H = this.height;
    const M = this.waterMargin;

    // Outer water boundaries
    this.obstacles.push({ x: 0, y: 0, w: W, h: M, type: 'water_wall' });
    this.obstacles.push({ x: 0, y: H - M, w: W, h: M, type: 'water_wall' });
    this.obstacles.push({ x: 0, y: 0, w: M, h: H, type: 'water_wall' });
    this.obstacles.push({ x: W - M, y: 0, w: M, h: H, type: 'water_wall' });

    // 2. WEST MOORED CONTAINER FREIGHTER (Ship Hull)
    this.obstacles.push({ x: M + 40, y: 320, w: 140, h: 580, type: 'ship_hull', label: 'CARGO VESSEL: OSMOSIS' });
    this.obstacles.push({ x: M + 40, y: 1100, w: 140, h: 580, type: 'ship_hull', label: 'CARGO VESSEL: KYUMA' });

    // 3. NORTH WAREHOUSE COMPLEX (Depot Alpha Zone)
    // Main warehouse building shell
    this.obstacles.push({ x: 380, y: 220, w: 220, h: 40, type: 'building' });
    this.obstacles.push({ x: 700, y: 220, w: 220, h: 40, type: 'building' });
    this.obstacles.push({ x: 380, y: 220, w: 40, h: 360, type: 'building' });
    this.obstacles.push({ x: 880, y: 220, w: 40, h: 360, type: 'building' });
    // Internal warehouse pillars
    this.obstacles.push({ x: 500, y: 360, w: 32, h: 32, type: 'pillar' });
    this.obstacles.push({ x: 760, y: 360, w: 32, h: 32, type: 'pillar' });

    // North Container Stacks
    this._addContainerStack(300, 680, 160, 60, '#cc3333');
    this._addContainerStack(520, 680, 160, 60, '#2a6f97');
    this._addContainerStack(740, 680, 160, 60, '#d97706');
    this._addContainerStack(1000, 240, 60, 240, '#059669');
    this._addContainerStack(1120, 240, 60, 240, '#dc2626');

    // 4. CENTRAL GANTRY PLAZA & CONTAINER MAZE (Plaza Bravo Zone)
    // Giant Gantry Crane Rail Pillars
    this.obstacles.push({ x: 1040, y: 760, w: 45, h: 90, type: 'crane_leg' });
    this.obstacles.push({ x: 1515, y: 760, w: 45, h: 90, type: 'crane_leg' });
    this.obstacles.push({ x: 1040, y: 1180, w: 45, h: 90, type: 'crane_leg' });
    this.obstacles.push({ x: 1515, y: 1180, w: 45, h: 90, type: 'crane_leg' });

    // Center Maze Stacks forming tactical chokepoints
    this._addContainerStack(880, 940, 140, 65, '#2563eb');
    this._addContainerStack(880, 1060, 140, 65, '#e11d48');
    this._addContainerStack(1580, 940, 140, 65, '#d97706');
    this._addContainerStack(1580, 1060, 140, 65, '#059669');

    this._addContainerStack(1150, 700, 65, 140, '#475569');
    this._addContainerStack(1385, 700, 65, 140, '#7c3aed');
    this._addContainerStack(1150, 1200, 65, 140, '#7c3aed');
    this._addContainerStack(1385, 1200, 65, 140, '#475569');

    // 5. EAST FUEL REFINERY & CHEMICAL TANKS
    this._addFuelSilo(1800, 360, 55);
    this._addFuelSilo(1980, 360, 55);
    this._addFuelSilo(2160, 360, 55);
    this._addFuelSilo(1800, 540, 55);
    this._addFuelSilo(1980, 540, 55);
    this._addFuelSilo(2160, 540, 55);

    // Pipe rack barrier
    this.obstacles.push({ x: 1740, y: 640, w: 480, h: 30, type: 'piperack' });

    // 6. SOUTH MAINTENANCE YARD & QUAY CHARLIE (Quay Charlie Zone)
    // South Depot building
    this.obstacles.push({ x: 1700, y: 1380, w: 40, h: 360, type: 'building' });
    this.obstacles.push({ x: 2200, y: 1380, w: 40, h: 360, type: 'building' });
    this.obstacles.push({ x: 1700, y: 1700, w: 220, h: 40, type: 'building' });
    this.obstacles.push({ x: 2020, y: 1700, w: 220, h: 40, type: 'building' });

    // South Truck bays & container lines
    this._addContainerStack(400, 1350, 200, 65, '#0891b2');
    this._addContainerStack(680, 1350, 200, 65, '#ea580c');
    this._addContainerStack(400, 1550, 200, 65, '#4f46e5');
    this._addContainerStack(680, 1550, 200, 65, '#16a34a');

    this._addContainerStack(1000, 1500, 65, 220, '#dc2626');
    this._addContainerStack(1150, 1500, 65, 220, '#2563eb');
    this._addContainerStack(1400, 1500, 65, 220, '#ca8a04');

    // 7. BLUE & RED HQ BARRIERS
    // Blue HQ (West) Concrete Bunkers
    this.obstacles.push({ x: 240, y: 920, w: 30, h: 160, type: 'barrier' });
    // Red HQ (East) Concrete Bunkers
    this.obstacles.push({ x: 2330, y: 920, w: 30, h: 160, type: 'barrier' });
  }

  _addContainerStack(x, y, w, h, color) {
    this.obstacles.push({
      x, y, w, h,
      type: 'container_stack',
      color: color,
      label: `CNT-${Math.floor(x % 900 + 100)}`
    });
  }

  _addFuelSilo(cx, cy, r) {
    // Treat circle as bounding box with slight inset
    const size = r * 1.7;
    this.obstacles.push({
      x: cx - size / 2,
      y: cy - size / 2,
      w: size,
      h: size,
      type: 'fuel_silo',
      radius: r
    });
  }

  _generateItemNodes() {
    // Strategic spawn points for items
    this.itemSpawnNodes = [
      // Central Plaza Surrounds
      { x: 1100, y: 920 },
      { x: 1500, y: 920 },
      { x: 1100, y: 1100 },
      { x: 1500, y: 1100 },
      { x: 1300, y: 840 },
      { x: 1300, y: 1160 },

      // North Warehouse & Depot Alpha
      { x: 480, y: 480 },
      { x: 820, y: 480 },
      { x: 650, y: 320 },
      { x: 920, y: 550 },

      // East Refinery
      { x: 1890, y: 450 },
      { x: 2070, y: 450 },
      { x: 1890, y: 610 },
      { x: 2070, y: 610 },

      // South Yard & Quay Charlie
      { x: 1820, y: 1520 },
      { x: 2100, y: 1520 },
      { x: 1950, y: 1420 },
      { x: 880, y: 1450 },
      { x: 550, y: 1450 },

      // West & East Corridors
      { x: 240, y: 500 },
      { x: 240, y: 1500 },
      { x: 2360, y: 500 },
      { x: 2360, y: 1500 }
    ];
  }

  _generateLighting() {
    this.lights = [
      // Base lights
      { x: 650, y: 480, radius: 240, color: '#00d0ff', intensity: 0.6 },
      { x: 1300, y: 1000, radius: 280, color: '#ffe600', intensity: 0.65 },
      { x: 1950, y: 1520, radius: 240, color: '#ff3355', intensity: 0.6 },

      // Crane Worklights
      { x: 1060, y: 800, radius: 180, color: '#ffb700', intensity: 0.5 },
      { x: 1530, y: 800, radius: 180, color: '#ffb700', intensity: 0.5 },
      { x: 1060, y: 1220, radius: 180, color: '#ffb700', intensity: 0.5 },
      { x: 1530, y: 1220, radius: 180, color: '#ffb700', intensity: 0.5 },

      // Depot lights
      { x: 500, y: 360, radius: 190, color: '#38bdf8', intensity: 0.4 },
      { x: 2000, y: 1450, radius: 190, color: '#f97316', intensity: 0.4 }
    ];
  }

  _renderStaticBackground() {
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.width;
    this.bgCanvas.height = this.height;
    const ctx = this.bgCanvas.getContext('2d');

    // 1. Water Ocean Base
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Concrete Pier / Dock Slab
    const M = this.waterMargin;
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(M, M, this.width - M * 2, this.height - M * 2);

    // 3. Pier Edge Concrete Curb & Hazard Stripes
    ctx.fillStyle = '#334155';
    ctx.fillRect(M, M, this.width - M * 2, 14);
    ctx.fillRect(M, this.height - M - 14, this.width - M * 2, 14);
    ctx.fillRect(M, M, 14, this.height - M * 2);
    ctx.fillRect(this.width - M - 14, M, 14, this.height - M * 2);

    // Hazard Stripes on Pier Edge
    this._drawHazardBorder(ctx, M, M, this.width - M * 2, this.height - M * 2);

    // 4. Ground Asphalt Tiles & Grids
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = M; x < this.width - M; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, M);
      ctx.lineTo(x, this.height - M);
      ctx.stroke();
    }
    for (let y = M; y < this.height - M; y += 80) {
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(this.width - M, y);
      ctx.stroke();
    }

    // 5. Gantry Crane Rails
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(1000, 720, 600, 16);
    ctx.fillRect(1000, 1260, 600, 16);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(1000, 720, 600, 16);
    ctx.strokeRect(1000, 1260, 600, 16);

    // 6. Draw Pre-rendered Static Obstacles
    this.obstacles.forEach(obs => {
      this._drawObstacle(ctx, obs);
    });
  }

  _drawHazardBorder(ctx, x, y, w, h) {
    ctx.save();
    // Yellow & Black Diagonal Hatch Pattern
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    for (let i = x; i < x + w; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, y);
      ctx.lineTo(i + 14, y + 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, y + h - 14);
      ctx.lineTo(i + 14, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawObstacle(ctx, obs) {
    ctx.save();

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(obs.x + 8, obs.y + 12, obs.w, obs.h);

    switch (obs.type) {
      case 'container_stack':
        // Corrugated shipping container
        ctx.fillStyle = obs.color || '#334155';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        // Corrugated ridges
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        if (obs.w > obs.h) {
          for (let rx = obs.x + 10; rx < obs.x + obs.w - 10; rx += 14) {
            ctx.fillRect(rx, obs.y + 4, 6, obs.h - 8);
          }
        } else {
          for (let ry = obs.y + 10; ry < obs.y + obs.h - 10; ry += 14) {
            ctx.fillRect(obs.x + 4, ry, obs.w - 8, 6);
          }
        }

        // Metal Frame Border
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        // Corner castings
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(obs.x, obs.y, 8, 8);
        ctx.fillRect(obs.x + obs.w - 8, obs.y, 8, 8);
        ctx.fillRect(obs.x, obs.y + obs.h - 8, 8, 8);
        ctx.fillRect(obs.x + obs.w - 8, obs.y + obs.h - 8, 8, 8);

        // Stenciled text
        if (obs.label && obs.w > 60 && obs.h > 40) {
          ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2);
        }
        break;

      case 'fuel_silo':
        // Spherical/Cylindrical storage silo
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.radius || obs.w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner dome shine
        const domeGrad = ctx.createRadialGradient(
          obs.x + obs.w / 2 - 12, obs.y + obs.h / 2 - 12, 4,
          obs.x + obs.w / 2, obs.y + obs.h / 2, obs.radius || obs.w / 2
        );
        domeGrad.addColorStop(0, '#94a3b8');
        domeGrad.addColorStop(0.8, '#334155');
        domeGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, (obs.radius || obs.w / 2) - 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.radius || obs.w / 2, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'ship_hull':
        // Moored cargo vessel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        // Stencil ship name
        ctx.save();
        ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label || 'CARGO SHIP', 0, 0);
        ctx.restore();
        break;

      case 'crane_leg':
        // Gantry crane steel leg
        ctx.fillStyle = '#eab308';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        // Warning beacon on top
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'building':
      case 'barrier':
      case 'piperack':
      default:
        ctx.fillStyle = '#334155';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        break;
    }

    ctx.restore();
  }

  update(dt) {
    this.ambientAnimTime += dt;
  }

  draw(ctx, camera) {
    // 1. Draw cached background layer
    if (this.bgCanvas) {
      ctx.drawImage(this.bgCanvas, 0, 0);
    }

    // 2. Animated Water Ripple Effects on borders
    const M = this.waterMargin;
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    const waveOffset = Math.sin(this.ambientAnimTime * 2.0) * 4;

    // West water ripples
    ctx.beginPath();
    ctx.moveTo(M - 18 + waveOffset, M);
    ctx.lineTo(M - 18 + waveOffset, this.height - M);
    ctx.stroke();

    // East water ripples
    ctx.beginPath();
    ctx.moveTo(this.width - M + 18 - waveOffset, M);
    ctx.lineTo(this.width - M + 18 - waveOffset, this.height - M);
    ctx.stroke();
    ctx.restore();

    // 3. Ambient Lighting & Spotlights
    if (CONFIG.VISUALS.LIGHTING_ENABLED) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < this.lights.length; i++) {
        const light = this.lights[i];
        if (camera.isVisible(light.x, light.y, light.radius)) {
          const grad = ctx.createRadialGradient(light.x, light.y, 4, light.x, light.y, light.radius);
          grad.addColorStop(0, Utils.alphaColor(light.color, light.intensity * 0.45));
          grad.addColorStop(0.5, Utils.alphaColor(light.color, light.intensity * 0.15));
          grad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  getSpawnNodes() {
    return this.itemSpawnNodes;
  }

  getObstacles() {
    return this.obstacles;
  }

  resolveCollisions(entity) {
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      Utils.resolveCircleRectCollision(entity, obs);
    }

    // Map bounds clamp
    const M = this.waterMargin + entity.radius;
    entity.x = Utils.clamp(entity.x, M, this.width - M);
    entity.y = Utils.clamp(entity.y, M, this.height - M);
  }
}

if (typeof window !== 'undefined') {
  window.IndustrialMap = IndustrialMap;
}
if (typeof globalThis !== 'undefined') {
  globalThis.IndustrialMap = IndustrialMap;
}
