/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Autonomous AI Agent Entity (Enemy & Ally Combatants)
 */

class Agent {
  constructor(id, name, team, x, y, difficulty = 'HARD') {
    this.isPlayer = false;
    this.id = id;
    this.name = name;
    this.team = team; // 'player' (Blue) or 'enemy' (Red)

    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.radius = CONFIG.PLAYER.RADIUS;

    // Attributes
    this.maxHp = CONFIG.PLAYER.MAX_HP;
    this.hp = this.maxHp;
    this.maxShield = CONFIG.PLAYER.MAX_SHIELD;
    this.shield = this.maxShield;

    // Timers
    this.lastDamageTime = 999;
    this.attackCooldownTimer = Math.random() * 0.3;
    this.dashCooldownTimer = 0;
    this.dashTimer = 0;
    this.abilityCooldownTimer = Math.random() * 4.0;
    this.invulnerableTimer = 0;
    this.speedBoostTimer = 0;
    this.speedBoostFactor = 0;
    this.slowTimer = 0;
    this.slowFactor = 1.0;

    // State
    this.isAlive = true;
    this.respawnTimer = 0;
    this.isDashing = false;
    this.isSynergyLinked = false;

    // Navigation & Pathfinding
    this.currentPath = [];
    this.pathIndex = 0;
    this.repathTimer = 0;
    this.lastTargetPos = { x: 0, y: 0 };

    // Stats
    this.kills = 0;
    this.deaths = 0;
    this.itemsCollected = 0;
    this.damageDealt = 0;
    this.basesCaptured = 0;
    this.scoreCarried = 0;

    // Brain
    this.brain = new AIBrain(this, difficulty);
  }

  setDifficulty(diff) {
    if (this.brain) {
      this.brain.setDifficulty(diff);
    }
  }

  reset(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.shield = this.maxShield;
    this.isAlive = true;
    this.respawnTimer = 0;
    this.invulnerableTimer = CONFIG.PLAYER.SPAWN_INVULNERABLE_TIME;
    this.currentPath = [];
    this.pathIndex = 0;
  }

  isInvulnerable() {
    return this.invulnerableTimer > 0 || this.dashTimer > 0;
  }

  heal(amount) {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return Math.round(this.hp - prev);
  }

  addShield(amount) {
    const prev = this.shield;
    this.shield = Math.min(this.maxShield, this.shield + amount);
    return Math.round(this.shield - prev);
  }

  applySpeedBoost(duration, boost) {
    this.speedBoostTimer = duration;
    this.speedBoostFactor = boost;
  }

  applySlow(duration, factor) {
    this.slowTimer = duration;
    this.slowFactor = factor;
  }

  die() {
    this.isAlive = false;
    this.respawnTimer = CONFIG.PLAYER.RESPAWN_TIME;
    this.deaths++;
    this.currentPath = [];
  }

  update(dt, map, navGrid, combat, game) {
    if (!this.isAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.reset(this.spawnX, this.spawnY);
        Particles.emitShockwave(this.x, this.y, 80, this.team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR, 0.4);
      }
      return;
    }

    // 1. Timers & Regenerations
    this.lastDamageTime += dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.abilityCooldownTimer > 0) this.abilityCooldownTimer -= dt;

    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) this.speedBoostFactor = 0;
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1.0;
    }

    if (this.lastDamageTime >= CONFIG.PLAYER.SHIELD_REGEN_DELAY && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + CONFIG.PLAYER.SHIELD_REGEN_RATE * dt);
    }

    // 2. AI Brain Layer Update
    this.brain.update(dt, game);

    // 3. Movement & Navigation Execution
    this._executeMovement(dt, navGrid, map);

    // 4. Combat Actions & Ballistics
    this._executeCombat(dt, combat, game);
  }

  _executeMovement(dt, navGrid, map) {
    const goalTarget = this.brain.currentGoalTarget;
    let targetX = this.x;
    let targetY = this.y;

    if (goalTarget) {
      targetX = goalTarget.x;
      targetY = goalTarget.y;
    }

    // Repath calculation
    this.repathTimer -= dt;
    const targetMoved = Utils.distSq(targetX, targetY, this.lastTargetPos.x, this.lastTargetPos.y) > 60 * 60;

    if ((this.repathTimer <= 0 || targetMoved) && navGrid) {
      this.repathTimer = 0.5 + Math.random() * 0.2;
      this.lastTargetPos = { x: targetX, y: targetY };
      this.currentPath = navGrid.findPath(this.x, this.y, targetX, targetY, this.brain.params.flankingTendency > 0.5);
      this.pathIndex = 0;
    }

    // Calculate move direction along path waypoints
    let moveDirX = 0;
    let moveDirY = 0;

    if (this.currentPath && this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      const wp = this.currentPath[this.pathIndex];
      const d = Utils.dist(this.x, this.y, wp.x, wp.y);

      if (d < 35) {
        this.pathIndex++;
      } else {
        const dir = Utils.normalize(wp.x - this.x, wp.y - this.y);
        moveDirX = dir.x;
        moveDirY = dir.y;
      }
    }

    // Tactical strafing & kiting when attacking
    if (this.brain.currentGoal === AI_GOALS.ATTACK_TARGET && goalTarget) {
      const d = Utils.dist(this.x, this.y, goalTarget.x, goalTarget.y);
      const idealRange = 280;

      if (d < idealRange * 0.7) {
        // Back off
        const away = Utils.normalize(this.x - goalTarget.x, this.y - goalTarget.y);
        moveDirX = away.x;
        moveDirY = away.y;
      } else if (d <= idealRange * 1.3) {
        // Circle strafe
        const perpX = -(goalTarget.y - this.y);
        const perpY = (goalTarget.x - this.x);
        const pNorm = Utils.normalize(perpX, perpY);
        moveDirX = pNorm.x * this.brain.strafeDir;
        moveDirY = pNorm.y * this.brain.strafeDir;
      }
    }

    // Speed modifiers
    let speed = CONFIG.PLAYER.BASE_SPEED * this.brain.params.speedMultiplier;
    if (this.speedBoostFactor > 0) speed *= (1 + this.speedBoostFactor);
    if (this.slowFactor < 1.0) speed *= this.slowFactor;
    if (this.isSynergyLinked) speed *= (1 + CONFIG.PLAYER.SYNERGY_SPEED_BUFF);

    // Apply movement
    this.vx = Utils.approach(this.vx, moveDirX * speed, 1500 * dt);
    this.vy = Utils.approach(this.vy, moveDirY * speed, 1500 * dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (map) {
      map.resolveCollisions(this);
    }
  }

  _executeCombat(dt, combat, game) {
    // Face movement direction or target
    if (this.brain.currentGoalTarget && this.brain.currentGoal === AI_GOALS.ATTACK_TARGET) {
      const aim = this.brain.getAimPosition(this.brain.currentGoalTarget);
      if (aim) {
        this.angle = Utils.angle(this.x, this.y, aim.x, aim.y);

        // Firing weapon
        const d = Utils.dist(this.x, this.y, this.brain.currentGoalTarget.x, this.brain.currentGoalTarget.y);
        if (d <= CONFIG.PLAYER.PROJECTILE_RANGE && this.attackCooldownTimer <= 0) {
          if (game.navGrid.hasLineOfSight(this.x, this.y, aim.x, aim.y)) {
            this.attackCooldownTimer = CONFIG.PLAYER.ATTACK_COOLDOWN * 1.1;

            const barrelOffset = 22;
            const fireX = this.x + Math.cos(this.angle) * barrelOffset;
            const fireY = this.y + Math.sin(this.angle) * barrelOffset;

            combat.spawnProjectile(
              fireX, fireY,
              aim.x, aim.y,
              CONFIG.PLAYER.PROJECTILE_SPEED,
              CONFIG.PLAYER.ATTACK_DAMAGE * this.brain.params.damageMultiplier,
              CONFIG.PLAYER.PROJECTILE_RANGE,
              this.team,
              this,
              this.team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR
            );
          }
        }
      }
    } else if (Math.hypot(this.vx, this.vy) > 10) {
      this.angle = Math.atan2(this.vy, this.vx);
    }

    // Dodge Reaction
    if (this.dashCooldownTimer <= 0 && this.brain.shouldDodge(combat.projectiles)) {
      this.dashCooldownTimer = CONFIG.PLAYER.DASH_COOLDOWN * 1.4;
      this.dashTimer = CONFIG.PLAYER.DASH_DURATION;

      // Dodge sideways relative to current angle
      const dodgeAngle = this.angle + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
      this.vx = Math.cos(dodgeAngle) * CONFIG.PLAYER.DASH_SPEED;
      this.vy = Math.sin(dodgeAngle) * CONFIG.PLAYER.DASH_SPEED;

      Sound.playDash();
      Particles.emitDashTrail(this.x, this.y, this.team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR);
    }

    // EMP Shockwave Ability Reaction
    if (this.abilityCooldownTimer <= 0) {
      const enemiesNearby = game.getAllAgents().filter(a => a.team !== this.team && a.isAlive && Utils.dist(this.x, this.y, a.x, a.y) < CONFIG.PLAYER.ABILITY_RADIUS);
      if (enemiesNearby.length >= 2 || (enemiesNearby.length >= 1 && this.hp < 40)) {
        this.abilityCooldownTimer = CONFIG.PLAYER.ABILITY_COOLDOWN * 1.2;
        combat.executeAreaShockwave(
          this,
          CONFIG.PLAYER.ABILITY_RADIUS,
          CONFIG.PLAYER.ABILITY_DAMAGE,
          CONFIG.PLAYER.ABILITY_KNOCKBACK,
          game
        );
      }
    }
  }

  draw(ctx, camera) {
    if (!this.isAlive) return;
    if (!camera.isVisible(this.x, this.y, 60)) return;

    ctx.save();

    const teamColor = this.team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR;

    // Invulnerability Flashing
    if (this.isInvulnerable() && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // 1. Synergy Link Ring
    if (this.isSynergyLinked) {
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Shield Bubble
    if (this.shield > 0) {
      const shieldRatio = this.shield / this.maxShield;
      ctx.strokeStyle = Utils.alphaColor(this.team === 'player' ? '#00e5ff' : '#ff77aa', 0.4 + shieldRatio * 0.4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Agent Body & Armor
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(2, 4, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Base Torso
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Armor Plates
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, 0, 6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Weapon Barrel
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, -3, 16, 6);
    ctx.fillStyle = teamColor;
    ctx.fillRect(20, -2, 5, 4);

    ctx.restore();

    // 4. Overhead Name & Role Indicator
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = teamColor;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name}`, this.x, this.y - this.radius - 16);

    // Mini Health/Shield Bar
    const barW = 34;
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.radius - 12;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = hpRatio > 0.4 ? (this.team === 'player' ? '#00ff88' : '#ff4444') : '#ff0033';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // 5. DEBUG VISUALS (If Debug Mode Active)
    if (CONFIG.DEBUG.ENABLED) {
      if (CONFIG.DEBUG.DRAW_AI_PATHS && this.currentPath.length > 0) {
        ctx.strokeStyle = Utils.alphaColor(teamColor, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        for (let i = this.pathIndex; i < this.currentPath.length; i++) {
          ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
        }
        ctx.stroke();
      }

      if (CONFIG.DEBUG.DRAW_UTILITY_SCORES) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`[${this.brain.currentGoal}] ${this.brain.tacticalRole}`, this.x, this.y + this.radius + 14);
      }
    }

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.Agent = Agent;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Agent = Agent;
}
