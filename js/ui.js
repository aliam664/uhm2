/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Modern Cyber-Industrial UI, HUD, Minimap with Radar Sweep & Modals
 */

class UIManager {
  constructor() {
    this.notifications = [];
    this.killfeed = [];
    this.maxFeedItems = 5;
    this.centerBanner = null; // { text, subtext, color, timer, duration }

    this.radarAngle = 0;
  }

  init() {
    this.notifications = [];
    this.killfeed = [];
    this.centerBanner = null;
  }

  showBanner(text, subtext = '', color = '#00d0ff', duration = 2.5) {
    this.centerBanner = {
      text,
      subtext,
      color,
      timer: duration,
      duration
    };
  }

  addNotification(text, color = '#ffffff') {
    this.notifications.unshift({
      text,
      color,
      life: 4.5,
      maxLife: 4.5
    });
    if (this.notifications.length > 5) this.notifications.pop();
  }

  addKillfeed(killer, victim, team) {
    const isBlue = team === 'player';
    this.killfeed.unshift({
      killer,
      victim,
      killerColor: isBlue ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR,
      victimColor: isBlue ? CONFIG.TEAMS.RED_COLOR : CONFIG.TEAMS.BLUE_COLOR,
      life: 5.0,
      maxLife: 5.0
    });
    if (this.killfeed.length > this.maxFeedItems) this.killfeed.pop();
  }

  update(dt) {
    this.radarAngle += dt * 3.0;

    // Update notifications
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].life -= dt;
      if (this.notifications[i].life <= 0) {
        this.notifications.splice(i, 1);
      }
    }

    // Update killfeed
    for (let i = this.killfeed.length - 1; i >= 0; i--) {
      this.killfeed[i].life -= dt;
      if (this.killfeed[i].life <= 0) {
        this.killfeed.splice(i, 1);
      }
    }

    // Update Center Banner
    if (this.centerBanner) {
      this.centerBanner.timer -= dt;
      if (this.centerBanner.timer <= 0) {
        this.centerBanner = null;
      }
    }
  }

  draw(ctx, game, viewportWidth, viewportHeight) {
    if (game.state !== 'PLAYING' && game.state !== 'INTRO' && game.state !== 'MATCH_END') return;

    ctx.save();

    // 1. TOP SCORE & MATCH STATUS BAR
    this._drawTopBar(ctx, game, viewportWidth);

    // 2. BOTTOM LEFT PLAYER HUD
    this._drawPlayerHUD(ctx, game.player, viewportHeight);

    // 3. BOTTOM RIGHT TACTICAL MINIMAP
    this._drawMinimap(ctx, game, viewportWidth, viewportHeight);

    // 4. TOP LEFT NOTIFICATION & KILLFEED
    this._drawFeed(ctx, viewportWidth);

    // 5. CENTER BANNER / COUNTDOWN
    this._drawCenterBanner(ctx, game, viewportWidth, viewportHeight);

    // 6. FINAL 10 SECONDS COUNTDOWN
    if (game.matchTimeRemaining <= 10 && game.matchTimeRemaining > 0 && game.state === 'PLAYING') {
      this._drawFinalCountdown(ctx, game.matchTimeRemaining, viewportWidth, viewportHeight);
    }

    ctx.restore();
  }

  _drawTopBar(ctx, game, w) {
    const barW = Math.min(700, w * 0.6);
    const barH = 50;
    const barX = (w - barW) / 2;
    const barY = 16;

    // Background Panel
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(barX, barY, barW, barH, 8);
    } else {
      ctx.rect(barX, barY, barW, barH);
    }
    ctx.fill();
    ctx.stroke();

    // Blue Team Score (Left)
    const blueScore = game.blueScore;
    const redScore = game.redScore;
    const total = Math.max(1, blueScore + redScore);
    const blueRatio = blueScore / total;

    ctx.fillStyle = CONFIG.TEAMS.BLUE_COLOR;
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${blueScore}`, barX + 24, barY + 33);

    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(0, 208, 255, 0.7)';
    ctx.fillText('BLUE VANGUARD', barX + 24, barY + 16);

    // Red Team Score (Right)
    ctx.fillStyle = CONFIG.TEAMS.RED_COLOR;
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${redScore}`, barX + barW - 24, barY + 33);

    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 51, 85, 0.7)';
    ctx.fillText('RED KYUMA', barX + barW - 24, barY + 16);

    // Center Match Timer
    const isWarning = game.matchTimeRemaining <= 60;
    const timeText = Utils.formatTime(game.matchTimeRemaining);

    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isWarning ? (Math.floor(Date.now() / 300) % 2 === 0 ? '#ff3355' : '#ffffff') : '#ffffff';
    ctx.fillText(timeText, barX + barW / 2, barY + 34);

    // Bases Status Dots (Under Score Bar)
    const bases = game.baseManager.getBases();
    const baseGap = 36;
    const baseXStart = barX + barW / 2 - ((bases.length - 1) * baseGap) / 2;

    bases.forEach((b, idx) => {
      const bx = baseXStart + idx * baseGap;
      const by = barY + barH + 14;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.arc(bx, by, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = b.getColor();
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.id, bx, by);
    });
  }

  _drawPlayerHUD(ctx, player, h) {
    if (!player) return;

    const hudW = 280;
    const hudH = 130;
    const hudX = 24;
    const hudY = h - hudH - 24;

    // Glassmorphic Panel
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(0, 208, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    } else {
      ctx.rect(hudX, hudY, hudW, hudH);
    }
    ctx.fill();
    ctx.stroke();

    // Health Bar
    const hpRatio = player.hp / player.maxHp;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(hudX + 16, hudY + 24, 170, 12);
    ctx.fillStyle = hpRatio > 0.4 ? '#00ff88' : '#ff3355';
    ctx.fillRect(hudX + 16, hudY + 24, 170 * hpRatio, 12);

    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.round(player.hp)} / ${player.maxHp}`, hudX + 16, hudY + 18);

    // Shield Bar
    const shieldRatio = player.shield / player.maxShield;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(hudX + 16, hudY + 54, 170, 8);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(hudX + 16, hudY + 54, 170 * shieldRatio, 8);

    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`SHIELD: ${Math.round(player.shield)} / ${player.maxShield}`, hudX + 16, hudY + 48);

    // Stamina Bar
    const staRatio = player.stamina / player.maxStamina;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(hudX + 16, hudY + 80, 170, 8);
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(hudX + 16, hudY + 80, 170 * staRatio, 8);

    ctx.fillStyle = '#ffe600';
    ctx.fillText(`STAMINA: ${Math.round(player.stamina)}%`, hudX + 16, hudY + 74);

    // Active EMP Ability Dial (Right Side)
    const cdRatio = player.abilityCooldownTimer <= 0 ? 1 : (1.0 - player.abilityCooldownTimer / CONFIG.PLAYER.ABILITY_COOLDOWN);
    const dialX = hudX + 230;
    const dialY = hudY + 65;
    const dialR = 26;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(dialX, dialY, dialR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = player.abilityCooldownTimer <= 0 ? '#7b00ff' : '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(dialX, dialY, dialR, -Math.PI / 2, -Math.PI / 2 + cdRatio * Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.abilityCooldownTimer <= 0 ? 'EMP [Q]' : `${Math.ceil(player.abilityCooldownTimer)}s`, dialX, dialY);

    // Osmosis Synergy Status
    if (player.isSynergyLinked) {
      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
      ctx.fillText('🔗 OSMOSIS LINK ACTIVE', hudX + 90, hudY + 110);
    }
  }

  _drawMinimap(ctx, game, w, h) {
    const mmW = 220;
    const mmH = 170;
    const mmX = w - mmW - 24;
    const mmY = h - mmH - 24;

    ctx.save();

    // Map container
    ctx.fillStyle = 'rgba(10, 16, 29, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(mmX, mmY, mmW, mmH, 8);
    } else {
      ctx.rect(mmX, mmY, mmW, mmH);
    }
    ctx.fill();
    ctx.stroke();
    ctx.clip();

    const scaleX = mmW / CONFIG.MAP.WIDTH;
    const scaleY = mmH / CONFIG.MAP.HEIGHT;

    // Draw Obstacles
    ctx.fillStyle = '#1e293b';
    const obstacles = game.map.getObstacles();
    obstacles.forEach(obs => {
      ctx.fillRect(mmX + obs.x * scaleX, mmY + obs.y * scaleY, obs.w * scaleX, obs.h * scaleY);
    });

    // Draw Bases
    const bases = game.baseManager.getBases();
    bases.forEach(b => {
      const bx = mmX + b.x * scaleX;
      const by = mmY + b.y * scaleY;
      ctx.fillStyle = b.getColor();
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw Items
    const items = game.itemSpawner.getItems();
    items.forEach(it => {
      if (!it.active) return;
      const ix = mmX + it.x * scaleX;
      const iy = mmY + it.y * scaleY;
      ctx.fillStyle = it.type.color;
      ctx.beginPath();
      ctx.arc(ix, iy, it.isSuper ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Radar Sweep Line
    ctx.strokeStyle = 'rgba(0, 208, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const radarCenterX = mmX + mmW / 2;
    const radarCenterY = mmY + mmH / 2;
    ctx.moveTo(radarCenterX, radarCenterY);
    ctx.lineTo(radarCenterX + Math.cos(this.radarAngle) * 140, radarCenterY + Math.sin(this.radarAngle) * 140);
    ctx.stroke();

    // Draw Agents (Allies always visible, Enemies only visible if in vision / line of sight!)
    const allAgents = game.getAllAgents();
    allAgents.forEach(agent => {
      if (!agent.isAlive) return;

      const ax = mmX + agent.x * scaleX;
      const ay = mmY + agent.y * scaleY;

      if (agent.team === 'player') {
        ctx.fillStyle = agent.isPlayer ? '#ffffff' : CONFIG.TEAMS.BLUE_COLOR;
        ctx.beginPath();
        ctx.arc(ax, ay, agent.isPlayer ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Fog of War: only draw if spotted or close to player
        const distToPlayer = Utils.dist(agent.x, agent.y, game.player.x, game.player.y);
        const isSpotted = distToPlayer < CONFIG.MAP.FOG_REVEAL_RADIUS && game.navGrid.hasLineOfSight(game.player.x, game.player.y, agent.x, agent.y);

        if (isSpotted || !CONFIG.MAP.FOG_OF_WAR_ENABLED) {
          ctx.fillStyle = CONFIG.TEAMS.RED_COLOR;
          ctx.beginPath();
          ctx.arc(ax, ay, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    ctx.restore();
  }

  _drawFeed(ctx, w) {
    const feedX = 24;
    let feedY = 32;

    ctx.save();
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';

    // Killfeed
    this.killfeed.forEach(item => {
      const alpha = Utils.clamp(item.life / item.maxLife, 0, 1);
      ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.75})`;
      ctx.fillRect(feedX, feedY - 14, 260, 22);

      ctx.fillStyle = Utils.alphaColor(item.killerColor, alpha);
      ctx.fillText(item.killer, feedX + 10, feedY);

      ctx.fillStyle = Utils.alphaColor('#ffffff', alpha * 0.7);
      ctx.fillText('⚡', feedX + 120, feedY);

      ctx.fillStyle = Utils.alphaColor(item.victimColor, alpha);
      ctx.fillText(item.victim, feedX + 145, feedY);

      feedY += 26;
    });

    // Objective Notifications
    feedY += 10;
    this.notifications.forEach(note => {
      const alpha = Utils.clamp(note.life / note.maxLife, 0, 1);
      ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.8})`;
      ctx.fillRect(feedX, feedY - 14, 340, 22);

      ctx.fillStyle = Utils.alphaColor(note.color, alpha);
      ctx.fillText(note.text, feedX + 10, feedY);

      feedY += 26;
    });

    ctx.restore();
  }

  _drawCenterBanner(ctx, game, w, h) {
    if (!this.centerBanner) return;

    const b = this.centerBanner;
    const alpha = Utils.clamp(b.timer / b.duration, 0, 1);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = Utils.alphaColor(b.color, alpha);
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 16;
    ctx.fillText(b.text, w / 2, h / 2 - 40);

    if (b.subtext) {
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = Utils.alphaColor('#ffffff', alpha);
      ctx.shadowBlur = 0;
      ctx.fillText(b.subtext, w / 2, h / 2);
    }

    ctx.restore();
  }

  _drawFinalCountdown(ctx, remaining, w, h) {
    const sec = Math.ceil(remaining);
    const progress = remaining % 1;
    const scale = 1.0 + (1.0 - progress) * 0.4;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(72 * scale)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 51, 85, 0.85)';
    ctx.shadowColor = '#ff3355';
    ctx.shadowBlur = 20;
    ctx.fillText(`${sec}`, w / 2, h / 2 - 120);
    ctx.restore();
  }
}

const UI = new UIManager();

if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
  window.UI = UI;
}
if (typeof globalThis !== 'undefined') {
  globalThis.UIManager = UIManager;
  globalThis.UI = UI;
}
