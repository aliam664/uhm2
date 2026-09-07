/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Combat System, Projectile Ballistics, Damage Resolution & Killfeed
 */

class Projectile {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.PLAYER.PROJECTILE_RADIUS;
    this.damage = CONFIG.PLAYER.ATTACK_DAMAGE;
    this.team = 'player'; // 'player' or 'enemy'
    this.owner = null;
    this.distanceTraveled = 0;
    this.maxRange = CONFIG.PLAYER.PROJECTILE_RANGE;
    this.color = CONFIG.TEAMS.BLUE_COLOR;
    this.trailTimer = 0;
  }

  reset(x, y, targetX, targetY, speed, damage, range, team, owner, color) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.maxRange = range;
    this.team = team;
    this.owner = owner;
    this.color = color || (team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR);
    this.distanceTraveled = 0;
    this.trailTimer = 0;

    const dir = Utils.normalize(targetX - x, targetY - y);
    this.vx = dir.x * speed;
    this.vy = dir.y * speed;
  }

  update(dt, navGrid) {
    if (!this.active) return false;

    const stepDist = Math.hypot(this.vx, this.vy) * dt;
    this.distanceTraveled += stepDist;

    if (this.distanceTraveled >= this.maxRange) {
      this.active = false;
      return false;
    }

    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    // Obstacle Collision
    if (navGrid && !navGrid.hasLineOfSight(this.x, this.y, nextX, nextY)) {
      this.active = false;
      Particles.emitHitSparks(this.x, this.y, 6, '#ffaa00');
      return false;
    }

    this.x = nextX;
    this.y = nextY;

    // Bullet trail particles
    this.trailTimer += dt;
    if (this.trailTimer >= 0.04) {
      this.trailTimer = 0;
      Particles.emit(this.x, this.y, -this.vx * 0.05, -this.vy * 0.05, 4, 0, this.color, 0.15, 'smoke', 0.9);
    }

    return true;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    // Glowing projectile core
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer plasma energy
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

class CombatEngine {
  constructor() {
    this.projectiles = [];
    this.maxProjectiles = CONFIG.VISUALS.MAX_PROJECTILES;

    for (let i = 0; i < this.maxProjectiles; i++) {
      this.projectiles.push(new Projectile());
    }
  }

  spawnProjectile(x, y, targetX, targetY, speed, damage, range, team, owner, color) {
    for (let i = 0; i < this.projectiles.length; i++) {
      if (!this.projectiles[i].active) {
        this.projectiles[i].reset(x, y, targetX, targetY, speed, damage, range, team, owner, color);
        Sound.playShoot(team === 'player');
        return this.projectiles[i];
      }
    }
    return null;
  }

  applyDamage(target, rawDamage, attacker, game, isCritical = false) {
    if (!target.isAlive || target.isInvulnerable()) return 0;

    // Osmosis Team Synergy Damage Reduction
    let finalDamage = rawDamage;
    if (target.isSynergyLinked) {
      finalDamage *= (1.0 - CONFIG.PLAYER.SYNERGY_DEFENSE_BUFF);
    }

    // Shield Absorption Logic
    let damageToHp = 0;
    let hadShield = target.shield > 0;

    if (target.shield > 0) {
      if (target.shield >= finalDamage) {
        target.shield -= finalDamage;
        damageToHp = 0;
      } else {
        damageToHp = finalDamage - target.shield;
        target.shield = 0;
      }
    } else {
      damageToHp = finalDamage;
    }

    target.hp -= damageToHp;
    target.lastDamageTime = 0; // Resets shield regen timer

    // Feedback
    Sound.playHit(hadShield && target.shield > 0);

    const hitColor = target.team === 'player' ? '#ff3355' : (isCritical ? '#ffe600' : '#ffffff');
    const displayDmg = Math.round(finalDamage);
    Particles.showFloatingText(target.x, target.y - 25, `${displayDmg}${isCritical ? '!' : ''}`, hitColor, isCritical);
    Particles.emitHitSparks(target.x, target.y, 8, hadShield ? '#00e5ff' : '#ff5533');

    // Stats Tracking
    if (attacker) {
      attacker.damageDealt = (attacker.damageDealt || 0) + finalDamage;
    }

    // Knockback
    if (attacker) {
      const kbDir = Utils.normalize(target.x - attacker.x, target.y - attacker.y);
      target.vx += kbDir.x * 120;
      target.vy += kbDir.y * 120;
    }

    // Camera shake for player involvement
    if (target.isPlayer || (attacker && attacker.isPlayer)) {
      if (game && game.camera) {
        game.camera.addTrauma(isCritical ? 0.25 : 0.12);
        if (isCritical) game.camera.triggerHitStop(0.04);
      }
    }

    // Death Handling
    if (target.hp <= 0) {
      target.hp = 0;
      this.handleDeath(target, attacker, game);
    }

    return finalDamage;
  }

  handleDeath(victim, killer, game) {
    victim.die();
    Sound.playElimination();

    // Spawn massive disintegration explosion
    const victimColor = victim.team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR;
    Particles.emitExplosion(victim.x, victim.y, 70, victimColor);

    if (killer) {
      killer.kills = (killer.kills || 0) + 1;
      const killPts = CONFIG.SCORING.KILL_SCORE;
      game.addTeamScore(killer.team, killPts);
      killer.scoreCarried = (killer.scoreCarried || 0) + killPts;

      // Broadcast kill event
      const killerColor = killer.team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR;
      game.broadcastKill(killer.name, victim.name, killer.team);
      Particles.showFloatingText(killer.x, killer.y - 40, `+${killPts} ELIMINATION`, killerColor, true);

      if (game.camera && (victim.isPlayer || killer.isPlayer)) {
        game.camera.addTrauma(0.4);
        game.camera.triggerHitStop(0.06);
      }
    }
  }

  executeAreaShockwave(source, radius, damage, knockbackForce, game) {
    Sound.playAbilityShockwave();
    Particles.emitShockwave(source.x, source.y, radius, source.team === 'player' ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR, 0.5);

    if (game && game.camera) {
      game.camera.addTrauma(0.35);
    }

    const agents = game.getAllAgents();
    agents.forEach(agent => {
      if (!agent.isAlive || agent.team === source.team) return;

      const d = Utils.dist(source.x, source.y, agent.x, agent.y);
      if (d <= radius + agent.radius) {
        // Shockwave impact
        const dir = Utils.normalize(agent.x - source.x, agent.y - source.y);
        agent.vx += dir.x * knockbackForce;
        agent.vy += dir.y * knockbackForce;

        // Apply slow
        agent.applySlow(CONFIG.PLAYER.ABILITY_SLOW_DURATION, CONFIG.PLAYER.ABILITY_SLOW_FACTOR);

        this.applyDamage(agent, damage, source, game, true);
      }
    });
  }

  update(dt, agents, navGrid, game) {
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (!proj.active) continue;

      if (!proj.update(dt, navGrid)) continue;

      // Check collision with enemy agents
      for (let a = 0; a < agents.length; a++) {
        const agent = agents[a];
        if (!agent.isAlive || agent.team === proj.team) continue;

        if (Utils.circleIntersect(proj.x, proj.y, proj.radius, agent.x, agent.y, agent.radius)) {
          proj.active = false;

          // Critical hit chance (15% or Osmosis head-on bonus)
          const isCrit = Math.random() < 0.18;
          const dmg = isCrit ? proj.damage * 1.5 : proj.damage;

          this.applyDamage(agent, dmg, proj.owner, game, isCrit);
          break;
        }
      }
    }
  }

  draw(ctx, camera) {
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (proj.active && (!camera || camera.isVisible(proj.x, proj.y, proj.radius * 3))) {
        proj.draw(ctx);
      }
    }
  }

  clear() {
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].active = false;
    }
  }
}

const Combat = new CombatEngine();

if (typeof window !== 'undefined') {
  window.Projectile = Projectile;
  window.CombatEngine = CombatEngine;
  window.Combat = Combat;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Projectile = Projectile;
  globalThis.CombatEngine = CombatEngine;
  globalThis.Combat = Combat;
}
