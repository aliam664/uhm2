/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Dynamic Tactical Items & Collectibles System
 */

class Item {
  constructor(x, y, typeKey) {
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    this.type = CONFIG.ITEMS.TYPES[typeKey];
    this.radius = 16;
    this.active = true;
    this.life = CONFIG.ITEMS.LIFETIME;
    this.maxLife = CONFIG.ITEMS.LIFETIME;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.isSuper = !!this.type.isSuper;
  }

  update(dt) {
    if (!this.active) return false;

    this.floatTimer += dt * 3.0;

    if (!this.isSuper) {
      this.life -= dt;
      if (this.life <= 0) {
        this.active = false;
        return false;
      }
    }

    return true;
  }

  onCollect(collector, game) {
    if (!this.active) return false;
    this.active = false;

    const isPlayerTeam = collector.team === 'player';
    const teamColor = isPlayerTeam ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR;

    // Apply Item Effects
    switch (this.typeKey) {
      case 'SCORE_SMALL':
      case 'SCORE_LARGE':
      case 'SUPER_RELIC':
        const pts = this.type.score;
        game.addTeamScore(collector.team, pts);
        collector.itemsCollected = (collector.itemsCollected || 0) + 1;
        collector.scoreCarried = (collector.scoreCarried || 0) + pts;
        Particles.showFloatingText(this.x, this.y - 20, `+${pts} PTS`, this.type.color, this.isSuper);
        if (this.isSuper) {
          game.broadcastNotification(`👑 ${collector.name} secured the KING OF CLUBS RELIC! (+${pts} PTS)`, this.type.color);
        }
        break;

      case 'MEDKIT':
        const healAmt = collector.heal(this.type.heal);
        Particles.showFloatingText(this.x, this.y - 20, `+${healAmt} HP`, '#00ff88');
        break;

      case 'SHIELD':
        const shieldAmt = collector.addShield(this.type.shield);
        Particles.showFloatingText(this.x, this.y - 20, `+${shieldAmt} SHIELD`, '#00e5ff');
        break;

      case 'SPEED':
        collector.applySpeedBoost(this.type.duration, this.type.speedBoost);
        Particles.showFloatingText(this.x, this.y - 20, 'OVERDRIVE!', '#f700ff');
        break;

      case 'EMP_PACK':
        collector.abilityCooldownTimer = 0;
        Particles.showFloatingText(this.x, this.y - 20, 'ABILITY READY!', '#7b00ff');
        Particles.emitShockwave(this.x, this.y, 100, '#7b00ff', 0.3);
        break;
    }

    // Audio & Visual Effects
    Sound.playItemPickup(this.isSuper);
    Particles.emitHitSparks(this.x, this.y, 14, this.type.color);

    return true;
  }

  draw(ctx) {
    if (!this.active) return;

    const bobOffset = Math.sin(this.floatTimer) * 5;
    const drawY = this.y + bobOffset;

    ctx.save();

    // Ground Beacon Shadow / Glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.radius * 1.8);
    gradient.addColorStop(0, Utils.alphaColor(this.type.color, 0.45));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y + 4, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Super Relic Light Pillar
    if (this.isSuper) {
      const pillarGrad = ctx.createLinearGradient(this.x, drawY, this.x, drawY - 240);
      pillarGrad.addColorStop(0, Utils.alphaColor(this.type.color, 0.35));
      pillarGrad.addColorStop(1, 'rgba(255,230,0,0)');
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(this.x - 14, drawY - 240, 28, 240);
    }

    // Holographic Rotating Ring
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const ringW = this.radius * 1.2 * Math.cos(this.floatTimer);
    if (ctx.ellipse) {
      ctx.ellipse(this.x, drawY, Math.max(2, Math.abs(ringW)), this.radius * 1.2, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(this.x, drawY, this.radius * 1.2, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Center Item Orb
    ctx.fillStyle = '#111822';
    ctx.beginPath();
    ctx.arc(this.x, drawY, this.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Icon / Symbol inside
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, this.x, drawY);

    // Life warning flash
    if (!this.isSuper && this.life < 8.0) {
      if (Math.floor(this.life * 5) % 2 === 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, drawY, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

class ItemSpawner {
  constructor() {
    this.items = [];
    this.spawnTimer = 4.0;
    this.superRelicSpawned = false;
    this.spawnNodes = [];
  }

  init(mapNodes) {
    this.items = [];
    this.superRelicSpawned = false;
    this.spawnTimer = 3.0;
    this.spawnNodes = mapNodes || [];
  }

  update(dt, matchTimeRemaining, game) {
    // Update existing items
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (!this.items[i].update(dt)) {
        this.items.splice(i, 1);
      }
    }

    // Dynamic Item Wave Spawning
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = CONFIG.ITEMS.SPAWN_INTERVAL;
      if (this.items.length < CONFIG.ITEMS.MAX_ITEMS_ON_MAP) {
        this._spawnRandomItem();
      }
    }

    // Mid-match Super Relic Event (Half-time King of Clubs relic)
    const matchProgress = 1.0 - (matchTimeRemaining / CONFIG.GAME_TIME);
    if (matchProgress >= 0.50 && !this.superRelicSpawned) {
      this.superRelicSpawned = true;
      this._spawnSuperRelic(game);
    }
  }

  _spawnRandomItem() {
    if (this.spawnNodes.length === 0) return;

    // Pick an unoccupied node
    const candidateNodes = this.spawnNodes.filter(node => {
      return !this.items.some(it => Utils.distSq(it.x, it.y, node.x, node.y) < 60 * 60);
    });

    if (candidateNodes.length === 0) return;

    const node = Utils.randomChoice(candidateNodes);
    const itemRoll = Math.random();
    let typeKey = 'SCORE_SMALL';

    if (itemRoll < 0.35) typeKey = 'SCORE_SMALL';
    else if (itemRoll < 0.55) typeKey = 'MEDKIT';
    else if (itemRoll < 0.72) typeKey = 'SHIELD';
    else if (itemRoll < 0.88) typeKey = 'SCORE_LARGE';
    else if (itemRoll < 0.94) typeKey = 'SPEED';
    else typeKey = 'EMP_PACK';

    this.items.push(new Item(node.x, node.y, typeKey));
  }

  _spawnSuperRelic(game) {
    // Spawns in center plaza (Bravo Zone)
    const centerX = CONFIG.MAP.WIDTH / 2;
    const centerY = CONFIG.MAP.HEIGHT / 2 + 30;

    const relic = new Item(centerX, centerY, 'SUPER_RELIC');
    this.items.push(relic);

    Sound.playBaseAlarm();
    Particles.emitShockwave(centerX, centerY, 300, '#ffe600', 0.8);
    game.broadcastNotification('👑 EVENT: The KING OF CLUBS RELIC has appeared at Central Plaza!', '#ffe600');
  }

  checkCollection(agents, game) {
    for (let a = 0; a < agents.length; a++) {
      const agent = agents[a];
      if (!agent.isAlive) continue;

      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (item.active && Utils.distSq(agent.x, agent.y, item.x, item.y) <= (agent.radius + item.radius) * (agent.radius + item.radius)) {
          item.onCollect(agent, game);
          this.items.splice(i, 1);
        }
      }
    }
  }

  draw(ctx, camera) {
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      if (camera.isVisible(it.x, it.y, it.radius * 2)) {
        it.draw(ctx);
      }
    }
  }

  getItems() {
    return this.items;
  }
}

if (typeof window !== 'undefined') {
  window.Item = Item;
  window.ItemSpawner = ItemSpawner;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Item = Item;
  globalThis.ItemSpawner = ItemSpawner;
}
