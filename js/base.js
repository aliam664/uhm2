/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Industrial Capture Bases & Territory Control System
 */

class IndustrialBase {
  constructor(id, name, x, y, radius = 120) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.coreRadius = 38;

    this.owner = 'neutral'; // 'neutral', 'player' (Blue), 'enemy' (Red)
    this.captureProgress = 0; // -100 (Red) to +100 (Blue)
    this.isContested = false;

    this.blueCount = 0;
    this.redCount = 0;

    this.scoreTickTimer = 0;
    this.pulseAngle = Math.random() * Math.PI * 2;
    this.hologramHeight = 0;

    // Osmosis Base Raid Tracking
    this.raidTimer = 0;
    this.currentRaider = null;
  }

  update(dt, agents, game) {
    this.pulseAngle += dt * 2.5;

    // 1. Count units in capture zone
    this.blueCount = 0;
    this.redCount = 0;

    let coreOccupant = null;

    agents.forEach(agent => {
      if (!agent.isAlive) return;

      const d = Utils.dist(this.x, this.y, agent.x, agent.y);
      if (d <= this.radius) {
        if (agent.team === 'player') this.blueCount++;
        else if (agent.team === 'enemy') this.redCount++;

        // Check core for Osmosis raid
        if (d <= this.coreRadius) {
          coreOccupant = agent;
        }
      }
    });

    this.isContested = (this.blueCount > 0 && this.redCount > 0);

    // 2. Calculate capture speed
    const baseRate = (100 / CONFIG.BASES.CAPTURE_TIME_SOLO); // 12.5% per second solo
    let delta = 0;

    if (this.blueCount > 0 && this.redCount === 0) {
      // Pure Blue capture
      delta = baseRate * Math.sqrt(this.blueCount) * dt;
    } else if (this.redCount > 0 && this.blueCount === 0) {
      // Pure Red capture
      delta = -baseRate * Math.sqrt(this.redCount) * dt;
    } else if (this.isContested) {
      // Contested struggle
      const net = this.blueCount - this.redCount;
      delta = net * baseRate * CONFIG.BASES.CONTEST_SLOW_FACTOR * dt;
    } else if (this.blueCount === 0 && this.redCount === 0) {
      // Decay towards current owner state if left empty
      if (this.owner === 'player' && this.captureProgress < 100) {
        this.captureProgress = Math.min(100, this.captureProgress + baseRate * 0.4 * dt);
      } else if (this.owner === 'enemy' && this.captureProgress > -100) {
        this.captureProgress = Math.max(-100, this.captureProgress - baseRate * 0.4 * dt);
      }
    }

    const prevProgress = this.captureProgress;
    this.captureProgress = Utils.clamp(this.captureProgress + delta, -100, 100);

    // 3. Ownership Transitions
    if (this.captureProgress >= 100 && this.owner !== 'player') {
      this.owner = 'player';
      this.onCapture('player', game);
    } else if (this.captureProgress <= -100 && this.owner !== 'enemy') {
      this.owner = 'enemy';
      this.onCapture('enemy', game);
    } else if (this.captureProgress > -20 && this.captureProgress < 20 && this.owner !== 'neutral') {
      // Neutralized
      if (prevProgress >= 20 || prevProgress <= -20) {
        this.owner = 'neutral';
        game.broadcastNotification(`⚠️ ${this.name} has been NEUTRALIZED!`, '#ffffff');
      }
    }

    // 4. Continuous Score Generation for Owner
    if (this.owner !== 'neutral') {
      this.scoreTickTimer += dt;
      if (this.scoreTickTimer >= 1.0) {
        this.scoreTickTimer -= 1.0;
        game.addTeamScore(this.owner, CONFIG.BASES.POINTS_PER_SECOND);
      }
    }

    // 5. Osmosis Base Raid Logic
    if (coreOccupant && this.owner !== 'neutral' && coreOccupant.team !== this.owner) {
      this.currentRaider = coreOccupant;
      this.raidTimer += dt;

      if (this.raidTimer >= CONFIG.BASES.RAID_INTERACTION_TIME) {
        this.raidTimer = 0;
        this.executeRaid(coreOccupant, game);
      }
    } else {
      this.raidTimer = Math.max(0, this.raidTimer - dt * 2.0);
      this.currentRaider = null;
    }
  }

  onCapture(newOwner, game) {
    const isPlayer = newOwner === 'player';
    const teamColor = isPlayer ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR;
    const teamName = isPlayer ? 'BLUE VANGUARD' : 'RED KYUMA';

    // Bonus Points
    game.addTeamScore(newOwner, CONFIG.BASES.CAPTURE_BONUS_POINTS);

    // Visual & Sound Feedback
    Sound.playBaseCapture(isPlayer);
    Particles.emitCaptureBurst(this.x, this.y, teamColor);
    Particles.showFloatingText(this.x, this.y - 60, `+${CONFIG.BASES.CAPTURE_BONUS_POINTS} BASE CAPTURED`, teamColor, true);

    if (game.camera) {
      game.camera.addTrauma(0.3);
    }

    game.broadcastNotification(`🚩 ${teamName} captured ${this.name}! (+${CONFIG.BASES.CAPTURE_BONUS_POINTS} PTS)`, teamColor);
  }

  executeRaid(raider, game) {
    const victimTeam = this.owner;
    const drainPts = CONFIG.BASES.RAID_POINTS_DRAIN;

    game.drainTeamScore(victimTeam, drainPts);
    game.addTeamScore(raider.team, drainPts);

    raider.scoreCarried = (raider.scoreCarried || 0) + drainPts;

    Sound.playBaseAlarm();
    Particles.emitShockwave(this.x, this.y, 220, '#ffe600', 0.6);
    Particles.showFloatingText(this.x, this.y - 70, `⚡ BASE RAIDED! +${drainPts} PTS`, '#ffe600', true);

    game.broadcastNotification(`⚡ INFILTRATION! ${raider.name} drained ${drainPts} PTS from ${this.name}!`, '#ffe600');
  }

  getColor() {
    if (this.owner === 'player') return CONFIG.TEAMS.BLUE_COLOR;
    if (this.owner === 'enemy') return CONFIG.TEAMS.RED_COLOR;
    return CONFIG.TEAMS.NEUTRAL_COLOR;
  }

  draw(ctx, camera) {
    if (!camera.isVisible(this.x, this.y, this.radius * 1.5)) return;

    ctx.save();

    const baseColor = this.getColor();
    const pulseFactor = (Math.sin(this.pulseAngle) + 1) * 0.5;

    // 1. Capture Radius Boundary Circle
    ctx.strokeStyle = Utils.alphaColor(baseColor, 0.35 + pulseFactor * 0.2);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Glowing Fill Ground Zone
    const grad = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, this.radius);
    grad.addColorStop(0, Utils.alphaColor(baseColor, 0.20 + (this.isContested ? 0.15 : 0)));
    grad.addColorStop(1, Utils.alphaColor(baseColor, 0.02));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Central Platform Structure
    ctx.fillStyle = '#181e2b';
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Capture Progress Arc Ring
    const progressAngle = (this.captureProgress / 100) * Math.PI; // -PI to +PI
    ctx.lineWidth = 6;
    ctx.strokeStyle = this.captureProgress >= 0 ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.coreRadius + 6, -Math.PI / 2, -Math.PI / 2 + progressAngle, this.captureProgress < 0);
    ctx.stroke();

    // 5. Holographic Antenna Pillar
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // 6. Base Identifier Text & Status
    ctx.shadowBlur = 0;
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.id, this.x, this.y - 1);

    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = baseColor;
    ctx.fillText(this.name.toUpperCase(), this.x, this.y + this.coreRadius + 22);

    // Draw raid progress bar if currently being infiltrated
    if (this.raidTimer > 0) {
      const raidRatio = this.raidTimer / CONFIG.BASES.RAID_INTERACTION_TIME;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(this.x - 30, this.y - 30, 60, 6);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(this.x - 30, this.y - 30, 60 * raidRatio, 6);
    }

    ctx.restore();
  }
}

class BaseManager {
  constructor() {
    this.bases = [];
  }

  init() {
    this.bases = [
      new IndustrialBase('A', 'Depot Alpha', 650, 480, CONFIG.BASES.CAPTURE_RADIUS),
      new IndustrialBase('B', 'Plaza Bravo', 1300, 1000, CONFIG.BASES.CAPTURE_RADIUS),
      new IndustrialBase('C', 'Quay Charlie', 1950, 1520, CONFIG.BASES.CAPTURE_RADIUS)
    ];
  }

  update(dt, agents, game) {
    for (let i = 0; i < this.bases.length; i++) {
      this.bases[i].update(dt, agents, game);
    }
  }

  draw(ctx, camera) {
    for (let i = 0; i < this.bases.length; i++) {
      this.bases[i].draw(ctx, camera);
    }
  }

  getBases() {
    return this.bases;
  }

  getBaseById(id) {
    return this.bases.find(b => b.id === id);
  }

  getControlledCount(team) {
    return this.bases.filter(b => b.owner === team).length;
  }
}

if (typeof window !== 'undefined') {
  window.IndustrialBase = IndustrialBase;
  window.BaseManager = BaseManager;
}
if (typeof globalThis !== 'undefined') {
  globalThis.IndustrialBase = IndustrialBase;
  globalThis.BaseManager = BaseManager;
}
