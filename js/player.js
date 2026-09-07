/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Player Entity Controller (WASD, Mouse Aim, Dash, EMP Ability & Osmosis Synergy)
 */

class Player {
  constructor(x, y) {
    this.isPlayer = true;
    this.id = 'player';
    this.name = 'ARISU [YOU]';
    this.team = 'player'; // 'player' (Blue)

    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.radius = CONFIG.PLAYER.RADIUS;

    // Health, Shield & Stamina
    this.maxHp = CONFIG.PLAYER.MAX_HP;
    this.hp = this.maxHp;
    this.maxShield = CONFIG.PLAYER.MAX_SHIELD;
    this.shield = this.maxShield;
    this.maxStamina = CONFIG.PLAYER.MAX_STAMINA;
    this.stamina = this.maxStamina;

    // Timers
    this.lastDamageTime = 999;
    this.attackCooldownTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashTimer = 0;
    this.abilityCooldownTimer = 0;
    this.invulnerableTimer = 0;
    this.speedBoostTimer = 0;
    this.speedBoostFactor = 0;
    this.slowTimer = 0;
    this.slowFactor = 1.0;

    // State Flags
    this.isAlive = true;
    this.respawnTimer = 0;
    this.isSprinting = false;
    this.isDashing = false;
    this.isSynergyLinked = false;

    // Match Stats
    this.kills = 0;
    this.deaths = 0;
    this.itemsCollected = 0;
    this.damageDealt = 0;
    this.basesCaptured = 0;
    this.scoreCarried = 0;

    this.dashDirX = 0;
    this.dashDirY = 0;
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
    this.stamina = this.maxStamina;
    this.isAlive = true;
    this.respawnTimer = 0;
    this.invulnerableTimer = CONFIG.PLAYER.SPAWN_INVULNERABLE_TIME;
    this.lastDamageTime = 999;
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
    this.isDashing = false;
    this.isSprinting = false;
  }

  update(dt, input, mouseWorldPos, map, combat, game) {
    if (!this.isAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.reset(this.spawnX, this.spawnY);
        Particles.emitShockwave(this.x, this.y, 80, CONFIG.TEAMS.BLUE_COLOR, 0.4);
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

    // Shield Regeneration out of combat
    if (this.lastDamageTime >= CONFIG.PLAYER.SHIELD_REGEN_DELAY && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + CONFIG.PLAYER.SHIELD_REGEN_RATE * dt);
    }

    // Stamina Regeneration
    if (!this.isSprinting && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + CONFIG.PLAYER.STAMINA_REGEN_RATE * dt);
    }

    // 2. Mouse Aiming
    if (mouseWorldPos) {
      this.angle = Utils.angle(this.x, this.y, mouseWorldPos.x, mouseWorldPos.y);
    }

    // 3. Movement & Sprinting
    const move = input.getMovementVector();
    this.isSprinting = input.isActionActive('SPRINT') && (move.x !== 0 || move.y !== 0) && this.stamina > 5;

    let targetSpeed = CONFIG.PLAYER.BASE_SPEED;
    if (this.isSprinting) {
      targetSpeed *= CONFIG.PLAYER.SPRINT_MULTIPLIER;
      this.stamina = Math.max(0, this.stamina - CONFIG.PLAYER.SPRINT_STAMINA_COST * dt);
      Particles.emit(this.x, this.y, 0, 0, 5, 0, CONFIG.TEAMS.BLUE_COLOR, 0.12, 'smoke');
    }

    if (this.speedBoostFactor > 0) targetSpeed *= (1 + this.speedBoostFactor);
    if (this.slowFactor < 1.0) targetSpeed *= this.slowFactor;
    if (this.isSynergyLinked) targetSpeed *= (1 + CONFIG.PLAYER.SYNERGY_SPEED_BUFF);

    // 4. Dodge Dash Action
    if (input.isActionJustPressed('DODGE') && this.dashCooldownTimer <= 0 && this.stamina >= CONFIG.PLAYER.DASH_STAMINA_COST) {
      this.isDashing = true;
      this.dashTimer = CONFIG.PLAYER.DASH_DURATION;
      this.dashCooldownTimer = CONFIG.PLAYER.DASH_COOLDOWN;
      this.stamina -= CONFIG.PLAYER.DASH_STAMINA_COST;

      this.dashDirX = move.x !== 0 || move.y !== 0 ? move.x : Math.cos(this.angle);
      this.dashDirY = move.x !== 0 || move.y !== 0 ? move.y : Math.sin(this.angle);

      Sound.playDash();
      Particles.emitDashTrail(this.x, this.y, CONFIG.TEAMS.BLUE_COLOR);
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.vx = this.dashDirX * CONFIG.PLAYER.DASH_SPEED;
      this.vy = this.dashDirY * CONFIG.PLAYER.DASH_SPEED;

      Particles.emit(this.x, this.y, 0, 0, 8, 0, '#ffffff', 0.15, 'smoke');

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      // Normal acceleration
      this.vx = Utils.approach(this.vx, move.x * targetSpeed, 1800 * dt);
      this.vy = Utils.approach(this.vy, move.y * targetSpeed, 1800 * dt);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Obstacle & boundary collision
    if (map) {
      map.resolveCollisions(this);
    }

    // 5. Weapon Firing
    if (input.mouse.leftDown && this.attackCooldownTimer <= 0) {
      this.attackCooldownTimer = CONFIG.PLAYER.ATTACK_COOLDOWN;
      const barrelOffset = 24;
      const fireX = this.x + Math.cos(this.angle) * barrelOffset;
      const fireY = this.y + Math.sin(this.angle) * barrelOffset;

      combat.spawnProjectile(
        fireX, fireY,
        mouseWorldPos.x, mouseWorldPos.y,
        CONFIG.PLAYER.PROJECTILE_SPEED,
        CONFIG.PLAYER.ATTACK_DAMAGE,
        CONFIG.PLAYER.PROJECTILE_RANGE,
        'player',
        this,
        CONFIG.TEAMS.BLUE_COLOR
      );
    }

    // 6. Tactical EMP Shockwave Ability
    if (input.isActionJustPressed('ABILITY') && this.abilityCooldownTimer <= 0) {
      this.abilityCooldownTimer = CONFIG.PLAYER.ABILITY_COOLDOWN;
      combat.executeAreaShockwave(
        this,
        CONFIG.PLAYER.ABILITY_RADIUS,
        CONFIG.PLAYER.ABILITY_DAMAGE,
        CONFIG.PLAYER.ABILITY_KNOCKBACK,
        game
      );
    }
  }

  draw(ctx, camera) {
    if (!this.isAlive) return;
    if (!camera.isVisible(this.x, this.y, 60)) return;

    ctx.save();

    // Invulnerability Flashing
    if (this.isInvulnerable() && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // 1. Osmosis Team Synergy Aura Ring
    if (this.isSynergyLinked) {
      ctx.strokeStyle = '#00f7ff';
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
      ctx.strokeStyle = Utils.alphaColor('#00e5ff', 0.4 + shieldRatio * 0.4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Player Body & Armor
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

    // Armor Plates (Blue Accent)
    ctx.fillStyle = CONFIG.TEAMS.BLUE_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Tactical Helmet / Visor
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, 0, 7, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Weapon Barrel
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, -4, 18, 8);
    ctx.fillStyle = '#00d0ff';
    ctx.fillRect(22, -3, 6, 6);

    ctx.restore();

    // 4. Overhead Player Indicator & Health Bar
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#00d0ff';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', this.x, this.y - this.radius - 16);

    // Mini Health/Shield Bar
    const barW = 36;
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.radius - 12;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = hpRatio > 0.4 ? '#00ff88' : '#ff3355';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.Player = Player;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Player = Player;
}
