/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Core Game Engine, Game Loop, State Machine & Match Orchestrator
 */

const GAME_STATES = {
  MENU: 'MENU',
  DIFFICULTY_SELECT: 'DIFFICULTY_SELECT',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
  SETTINGS: 'SETTINGS',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  MATCH_END: 'MATCH_END'
};

class GameEngine {
  constructor() {
    this.state = GAME_STATES.MENU;
    this.difficulty = 'HARD'; // 'EASY' or 'HARD'

    this.canvas = null;
    this.ctx = null;
    this.virtualWidth = CONFIG.VIEWPORT.DEFAULT_WIDTH;
    this.virtualHeight = CONFIG.VIEWPORT.DEFAULT_HEIGHT;

    // Subsystems
    this.camera = null;
    this.map = null;
    this.navGrid = null;
    this.spatialGrid = null;
    this.itemSpawner = null;
    this.baseManager = null;
    this.teamBrains = {
      player: null,
      enemy: null
    };

    // Entities
    this.player = null;
    this.allies = [];
    this.enemies = [];

    // Match Metrics
    this.matchTimer = 0;
    this.matchTimeRemaining = CONFIG.GAME_TIME;
    this.blueScore = 0;
    this.redScore = 0;

    this.introTimer = CONFIG.MATCH_INTRO_TIME;
    this.outroTimer = CONFIG.MATCH_OUTRO_TIME;
    this.winnerTeam = null;

    // Loop & Performance
    this.lastFrameTime = 0;
    this.fps = 60;
    this.fpsTimer = 0;
    this.frameCount = 0;
    this.animationFrameId = null;

    // Warning sound triggers
    this.warned60s = false;
    this.warned10s = false;
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.camera = new Camera(this.virtualWidth, this.virtualHeight);
    this.map = new IndustrialMap(CONFIG.MAP.WIDTH, CONFIG.MAP.HEIGHT);
    this.navGrid = new NavigationGrid(CONFIG.MAP.WIDTH, CONFIG.MAP.HEIGHT, CONFIG.MAP.GRID_CELL_SIZE);
    window.NavGrid = this.navGrid;

    this.spatialGrid = new SpatialGrid(CONFIG.MAP.WIDTH, CONFIG.MAP.HEIGHT, 120);
    this.itemSpawner = new ItemSpawner();
    this.baseManager = new BaseManager();

    this.teamBrains.player = new TeamBrain('player');
    this.teamBrains.enemy = new TeamBrain('enemy');

    // Initialize map and pathfinding
    this.map.init();
    this.baseManager.init();
    this.itemSpawner.init(this.map.getSpawnNodes());

    // Input initialization
    Input.init(this.canvas);
    Sound.init();

    this._setupEntities();

    // Resize handler
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Start loop
    this.lastFrameTime = performance.now();
    this._loop();
  }

  _setupEntities() {
    // 1. Blue Team (Vanguard) - Spawn West Pier (x: 240, y: 1000)
    this.player = new Player(240, 1000);

    this.allies = [
      new Agent('blue_1', 'BLUE-1 (Usagi)', 'player', 240, 930, this.difficulty),
      new Agent('blue_2', 'BLUE-2 (Chishiya)', 'player', 240, 1070, this.difficulty),
      new Agent('blue_3', 'BLUE-3 (Kuina)', 'player', 200, 1000, this.difficulty)
    ];

    // 2. Red Team (Kyuma Syndicate) - Spawn East Pier (x: 2360, y: 1000)
    this.enemies = [
      new Agent('red_0', 'KYUMA [LEADER]', 'enemy', 2360, 1000, this.difficulty),
      new Agent('red_1', 'SHITARA [STRIKER]', 'enemy', 2360, 930, this.difficulty),
      new Agent('red_2', 'UTA [TACTICIAN]', 'enemy', 2360, 1070, this.difficulty),
      new Agent('red_3', 'MAKI [SCOUT]', 'enemy', 2400, 1000, this.difficulty)
    ];
  }

  setDifficulty(diffKey) {
    this.difficulty = diffKey;
    this.allies.forEach(a => a.setDifficulty(diffKey));
    this.enemies.forEach(e => e.setDifficulty(diffKey));
  }

  startMatch(difficulty = 'HARD') {
    this.setDifficulty(difficulty);
    this._setupEntities();

    this.matchTimer = 0;
    this.matchTimeRemaining = CONFIG.GAME_TIME;
    this.blueScore = 0;
    this.redScore = 0;
    this.winnerTeam = null;

    this.introTimer = CONFIG.MATCH_INTRO_TIME;
    this.outroTimer = CONFIG.MATCH_OUTRO_TIME;
    this.warned60s = false;
    this.warned10s = false;

    this.baseManager.init();
    this.itemSpawner.init(this.map.getSpawnNodes());
    Combat.clear();
    Particles.clear();
    UI.init();

    this.state = GAME_STATES.INTRO;
    Sound.startMusic();
    Sound.setTensionMode(false);

    UI.showBanner('TACTICAL PROTOCOL: OSMOSIS', 'TAKE BASES • COLLECT DATA • SECURE PORT', CONFIG.TEAMS.BLUE_COLOR, 3.0);
  }

  pause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      const pauseModal = document.getElementById('pause-modal');
      if (pauseModal) pauseModal.classList.remove('hidden');
    }
  }

  resume() {
    if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      const pauseModal = document.getElementById('pause-modal');
      if (pauseModal) pauseModal.classList.add('hidden');
    }
  }

  restart() {
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.add('hidden');
    const endModal = document.getElementById('match-end-modal');
    if (endModal) endModal.classList.add('hidden');
    this.startMatch(this.difficulty);
  }

  goToMenu() {
    this.state = GAME_STATES.MENU;
    Sound.stopMusic();
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.add('hidden');
    const endModal = document.getElementById('match-end-modal');
    if (endModal) endModal.classList.add('hidden');
    const menuContainer = document.getElementById('main-menu-container');
    if (menuContainer) menuContainer.classList.remove('hidden');
  }

  handleResize() {
    if (!this.canvas) return;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    this.canvas.width = this.virtualWidth;
    this.canvas.height = this.virtualHeight;

    this.camera.resize(this.virtualWidth, this.virtualHeight);
  }

  getAllAgents() {
    return [this.player, ...this.allies, ...this.enemies];
  }

  getTeamMembers(team) {
    if (team === 'player') return [this.player, ...this.allies];
    return this.enemies;
  }

  getTeamScore(team) {
    return team === 'player' ? this.blueScore : this.redScore;
  }

  getOpposingTeamScore(team) {
    return team === 'player' ? this.redScore : this.blueScore;
  }

  addTeamScore(team, pts) {
    if (team === 'player') this.blueScore += pts;
    else this.redScore += pts;
  }

  drainTeamScore(team, pts) {
    if (team === 'player') this.blueScore = Math.max(0, this.blueScore - pts);
    else this.redScore = Math.max(0, this.redScore - pts);
  }

  broadcastKill(killer, victim, team) {
    UI.addKillfeed(killer, victim, team);
  }

  broadcastNotification(text, color) {
    UI.addNotification(text, color);
  }

  // =========================================================================
  // MAIN GAME UPDATE CYCLE
  // =========================================================================
  update(dt) {
    // Check Pause input
    if (Input.isActionJustPressed('PAUSE')) {
      if (this.state === GAME_STATES.PLAYING) this.pause();
      else if (this.state === GAME_STATES.PAUSED) this.resume();
    }

    if (this.state === GAME_STATES.PAUSED) {
      Input.endFrame();
      return;
    }

    // Process Intro State
    if (this.state === GAME_STATES.INTRO) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) {
        this.state = GAME_STATES.PLAYING;
        Sound.playCountdownTick(true);
        UI.showBanner('MISSION START - ENGAGE!', 'TERRITORY CONTROL ACTIVE', '#00ff88', 1.8);
      }
    }

    // Process Match End State
    if (this.state === GAME_STATES.MATCH_END) {
      this.outroTimer -= dt;
      this.camera.targetZoom = 0.8;
      this.camera.update(dt);
      Particles.update(dt);
      UI.update(dt);
      Input.endFrame();
      return;
    }

    if (this.state !== GAME_STATES.PLAYING && this.state !== GAME_STATES.INTRO) {
      // Menu background ambient update
      this.map.update(dt);
      Particles.update(dt);
      Input.endFrame();
      return;
    }

    // 1. Match Time Progression
    this.matchTimer += dt;
    this.matchTimeRemaining = Math.max(0, this.matchTimeRemaining - dt);

    // Dynamic Tension / Warnings
    if (this.matchTimeRemaining <= 60 && !this.warned60s) {
      this.warned60s = true;
      Sound.setTensionMode(true);
      Sound.playBaseAlarm();
      UI.showBanner('⚠️ FINAL 60 SECONDS!', 'HIGH URGENCY - MAXIMUM SCORE VALUE', '#ff3355', 3.0);
    }

    if (this.matchTimeRemaining <= 10 && !this.warned10s) {
      this.warned10s = true;
      Sound.playCountdownTick(false);
    }

    // Check Match Finish Conditions
    if (this.matchTimeRemaining <= 0 || this.blueScore >= CONFIG.SCORING.WIN_SCORE_THRESHOLD || this.redScore >= CONFIG.SCORING.WIN_SCORE_THRESHOLD) {
      this._finishMatch();
      return;
    }

    // 2. Update Input Screen-to-World coords
    Input.updateWorldCoordinates(this.camera);

    // 3. Update Map & Environment
    this.map.update(dt);
    this.navGrid.decayDanger(dt);

    // 4. Update Spatial Partitioning
    this.spatialGrid.clear();
    const allAgents = this.getAllAgents();
    allAgents.forEach(a => {
      if (a.isAlive) this.spatialGrid.insert(a);
    });

    // 5. Update Osmosis Team Synergy Links
    this._updateTeamSynergy();

    // 6. Update Entities
    if (this.player) {
      this.player.update(dt, Input, Input.mouse, this.map, Combat, this);
    }

    this.allies.forEach(a => a.update(dt, this.map, this.navGrid, Combat, this));
    this.enemies.forEach(e => e.update(dt, this.map, this.navGrid, Combat, this));

    // 7. Update Team AI Brains (Macro Coordinators)
    this.teamBrains.player.update(dt, [this.player, ...this.allies], this);
    this.teamBrains.enemy.update(dt, this.enemies, this);

    // 8. Update Bases & Territory
    this.baseManager.update(dt, allAgents, this);

    // 9. Update Items & Spawns
    this.itemSpawner.update(dt, this.matchTimeRemaining, this);
    this.itemSpawner.checkCollection(allAgents, this);

    // 10. Update Combat Ballistics
    Combat.update(dt, allAgents, this.navGrid, this);

    // 11. Update Particles & Visuals
    Particles.update(dt);

    // 12. Update UI & Radar
    UI.update(dt);

    // 13. Camera Follow Player
    if (this.player && this.player.isAlive) {
      this.camera.update(dt, this.player, Input.mouse);
    } else {
      this.camera.update(dt, { x: 1300, y: 1000 }, null);
    }

    Input.endFrame();
  }

  _updateTeamSynergy() {
    const checkTeam = (members) => {
      members.forEach(m => m.isSynergyLinked = false);
      for (let i = 0; i < members.length; i++) {
        const m1 = members[i];
        if (!m1.isAlive) continue;

        for (let j = i + 1; j < members.length; j++) {
          const m2 = members[j];
          if (!m2.isAlive) continue;

          if (Utils.distSq(m1.x, m1.y, m2.x, m2.y) <= CONFIG.PLAYER.SYNERGY_RADIUS * CONFIG.PLAYER.SYNERGY_RADIUS) {
            m1.isSynergyLinked = true;
            m2.isSynergyLinked = true;
          }
        }
      }
    };

    checkTeam([this.player, ...this.allies]);
    checkTeam(this.enemies);
  }

  _finishMatch() {
    this.state = GAME_STATES.MATCH_END;
    Sound.stopMusic();

    this.winnerTeam = this.blueScore >= this.redScore ? 'player' : 'enemy';
    const isWin = this.winnerTeam === 'player';

    if (isWin) {
      Sound.playBaseCapture(true);
      UI.showBanner('VICTORY!', 'PORT PROTOCOL OSMOSIS SECURED', CONFIG.TEAMS.BLUE_COLOR, 5.0);
    } else {
      Sound.playBaseAlarm();
      UI.showBanner('DEFEAT!', 'KYUMA SYNDICATE DOMINANCE', CONFIG.TEAMS.RED_COLOR, 5.0);
    }

    setTimeout(() => {
      this._showMatchEndModal();
    }, 2000);
  }

  _showMatchEndModal() {
    const modal = document.getElementById('match-end-modal');
    if (!modal) return;

    const isWin = this.winnerTeam === 'player';
    const title = document.getElementById('match-end-title');
    const subtitle = document.getElementById('match-end-subtitle');
    const blueScoreElem = document.getElementById('end-blue-score');
    const redScoreElem = document.getElementById('end-red-score');
    const statsTable = document.getElementById('end-stats-body');

    if (title) {
      title.innerText = isWin ? 'VICTORY' : 'DEFEAT';
      title.className = isWin ? 'text-cyan glow-cyan' : 'text-crimson glow-crimson';
    }

    if (subtitle) {
      subtitle.innerText = isWin ? 'BLUE VANGUARD DOMINATED THE DOCKLANDS' : 'KYUMA SYNDICATE OUTMANEUVERED YOUR TEAM';
    }

    if (blueScoreElem) blueScoreElem.innerText = Utils.formatScore(this.blueScore);
    if (redScoreElem) redScoreElem.innerText = Utils.formatScore(this.redScore);

    // Build stats breakdown
    if (statsTable) {
      const allAgents = this.getAllAgents();
      let html = '';
      allAgents.forEach(a => {
        const isPlayerTeam = a.team === 'player';
        html += `
          <tr class="${a.isPlayer ? 'player-row' : ''}">
            <td style="color: ${isPlayerTeam ? CONFIG.TEAMS.BLUE_COLOR : CONFIG.TEAMS.RED_COLOR}; font-weight: bold;">
              ${a.name}
            </td>
            <td>${a.kills}</td>
            <td>${a.deaths}</td>
            <td>${Math.round(a.damageDealt)}</td>
            <td>${a.itemsCollected}</td>
            <td style="color: #ffe600; font-weight: bold;">+${a.scoreCarried}</td>
          </tr>
        `;
      });
      statsTable.innerHTML = html;
    }

    modal.classList.remove('hidden');
  }

  // =========================================================================
  // MAIN RENDER PASS
  // =========================================================================
  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    // 1. World Rendering with Camera Transform
    this.camera.applyTransform(ctx);

    // Map & Background
    this.map.draw(ctx, this.camera);

    // Industrial Bases
    this.baseManager.draw(ctx, this.camera);

    // Collectible Items
    this.itemSpawner.draw(ctx, this.camera);

    // Osmosis Synergy Electrical Arcs
    this._drawSynergyLinks(ctx);

    // Agents & Player
    this.allies.forEach(a => a.draw(ctx, this.camera));
    this.enemies.forEach(e => e.draw(ctx, this.camera));
    if (this.player) this.player.draw(ctx, this.camera);

    // Combat Projectiles
    Combat.draw(ctx, this.camera);

    // Particles & Floating Numbers
    Particles.draw(ctx, this.camera);

    // Debug Overlay
    if (CONFIG.DEBUG.ENABLED) {
      this.navGrid.drawDebug(ctx);
    }

    this.camera.restoreTransform(ctx);

    // 2. Screen Space HUD & UI
    UI.draw(ctx, this, this.virtualWidth, this.virtualHeight);

    // 3. FPS & Performance Counter
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.SHOW_FPS) {
      ctx.save();
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`FPS: ${this.fps} | DIFF: ${this.difficulty}`, 24, 24);
      ctx.restore();
    }
  }

  _drawSynergyLinks(ctx) {
    const drawTeamLinks = (members, color) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      for (let i = 0; i < members.length; i++) {
        const m1 = members[i];
        if (!m1.isAlive) continue;

        for (let j = i + 1; j < members.length; j++) {
          const m2 = members[j];
          if (!m2.isAlive) continue;

          const d = Utils.dist(m1.x, m1.y, m2.x, m2.y);
          if (d <= CONFIG.PLAYER.SYNERGY_RADIUS) {
            ctx.beginPath();
            ctx.moveTo(m1.x, m1.y);
            // Jagged electric spark midpoint
            const midX = (m1.x + m2.x) / 2 + (Math.random() - 0.5) * 8;
            const midY = (m1.y + m2.y) / 2 + (Math.random() - 0.5) * 8;
            ctx.lineTo(midX, midY);
            ctx.lineTo(m2.x, m2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    };

    drawTeamLinks([this.player, ...this.allies], CONFIG.TEAMS.BLUE_COLOR);
    drawTeamLinks(this.enemies, CONFIG.TEAMS.RED_COLOR);
  }

  _loop() {
    const now = performance.now();
    let dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Cap delta time to prevent spiraling after tab switch
    if (dt > 0.1) dt = 0.1;

    // FPS Counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(() => this._loop());
  }
}

const Game = new GameEngine();

if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
  window.Game = Game;
}
if (typeof globalThis !== 'undefined') {
  globalThis.GameEngine = GameEngine;
  globalThis.Game = Game;
}
