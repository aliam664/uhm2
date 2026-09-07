/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Global Game Configuration & Balancing Settings
 */

const CONFIG = {
  VERSION: '1.0.0',
  
  // Game Duration (in seconds)
  GAME_TIME: 300, // 5 minutes standard competitive match
  MATCH_INTRO_TIME: 3.5, // 3, 2, 1, GO sequence
  MATCH_OUTRO_TIME: 4.0, // Post-match cinematic freeze/zoom
  
  // Virtual Canvas Dimensions (Responsive rendering preserves aspect/scales)
  VIEWPORT: {
    DEFAULT_WIDTH: 1920,
    DEFAULT_HEIGHT: 1080,
    MIN_ZOOM: 0.75,
    MAX_ZOOM: 1.25,
    BASE_ZOOM: 1.0,
    SPRINT_ZOOM: 0.92
  },

  // Arena World Map Settings (Industrial Docklands)
  MAP: {
    WIDTH: 2600,
    HEIGHT: 2000,
    GRID_CELL_SIZE: 40, // 65 x 50 navigation grid
    WATER_MARGIN: 80,
    AMBIENT_LIGHT: '#111622',
    FOG_OF_WAR_ENABLED: true,
    FOG_REVEAL_RADIUS: 420
  },

  // Player Attributes
  PLAYER: {
    RADIUS: 22,
    MAX_HP: 100,
    MAX_SHIELD: 60,
    SHIELD_REGEN_DELAY: 3.5, // Seconds without taking damage
    SHIELD_REGEN_RATE: 18,   // Shield points per second
    MAX_STAMINA: 100,
    STAMINA_REGEN_RATE: 28,  // Stamina per second
    BASE_SPEED: 250,         // Pixels per second
    SPRINT_MULTIPLIER: 1.45, // Speed during sprint
    SPRINT_STAMINA_COST: 22, // Stamina drained per second
    
    // Combat: Tactical Plasma Blaster
    ATTACK_COOLDOWN: 0.28,   // Seconds between shots
    ATTACK_DAMAGE: 24,       // Base damage per hit
    PROJECTILE_SPEED: 820,   // Velocity of projectiles
    PROJECTILE_RANGE: 540,   // Max travel distance
    PROJECTILE_RADIUS: 5,
    
    // Dodge / Dash Roll
    DASH_SPEED: 640,
    DASH_DURATION: 0.22,
    DASH_COOLDOWN: 1.4,
    DASH_STAMINA_COST: 32,
    DASH_INVULNERABLE_TIME: 0.20,
    
    // Tactical EMP / Shockwave Ability
    ABILITY_COOLDOWN: 10.0,
    ABILITY_RADIUS: 200,
    ABILITY_DAMAGE: 35,
    ABILITY_KNOCKBACK: 450,
    ABILITY_SLOW_DURATION: 2.2, // Slows enemies caught in blast
    ABILITY_SLOW_FACTOR: 0.45,
    
    // Osmosis Team Synergy
    SYNERGY_RADIUS: 140,     // Proximity to allies for synergy link
    SYNERGY_SPEED_BUFF: 0.15,
    SYNERGY_DEFENSE_BUFF: 0.25, // 25% damage reduction when linked
    
    // Respawn
    RESPAWN_TIME: 6.0,
    SPAWN_INVULNERABLE_TIME: 3.0
  },

  // Team Comp
  TEAMS: {
    PLAYER_TEAM_NAME: 'VANGUARD (BLUE)',
    ENEMY_TEAM_NAME: 'KYUMA SYNDICATE (RED)',
    MEMBERS_PER_TEAM: 4, // 1 Player + 3 Ally Bots vs 4 Enemy Bots
    BLUE_COLOR: '#00d0ff',
    BLUE_ACCENT: '#0077ff',
    RED_COLOR: '#ff3355',
    RED_ACCENT: '#ff0033',
    NEUTRAL_COLOR: '#a0aab8'
  },

  // AI Preset Settings for EASY and HARD
  AI_DIFFICULTY_PRESETS: {
    EASY: {
      label: 'EASY',
      description: 'Standard AI with moderate reaction time and basic tactical awareness. Great for learning mechanics.',
      reactionTime: 0.35,          // 350ms reaction latency
      decisionInterval: 0.35,      // Decision evaluation rate
      aimErrorRadians: 0.35,       // ~20 degrees aim jitter
      leadTarget: false,           // Does not lead shots based on velocity
      visionRange: 420,
      hearingRange: 500,
      memoryDuration: 2.5,         // Memory fades quickly
      flankingTendency: 0.1,
      retreatHpThreshold: 0.20,    // Only retreats at critical HP
      dodgeLikelihood: 0.20,
      teamCoordination: 0.25,
      baseDefenseWeight: 0.40,
      baseRaidTendency: 0.15,
      adaptToScoreDifference: false,
      pincerAttacks: false,
      speedMultiplier: 0.90,
      damageMultiplier: 0.85
    },
    HARD: {
      label: 'HARD',
      description: 'Mastermind AI inspired by Kyuma. Deep tactical assessment, dynamic team roles, predictive aiming, flanking, pincer ambushes, and adaptive endgame strategies.',
      reactionTime: 0.08,          // 80ms fast reflex
      decisionInterval: 0.12,      // Fast dynamic replanning (120ms)
      aimErrorRadians: 0.04,       // High precision (~2.3 degrees)
      leadTarget: true,            // Predictive ballistics
      visionRange: 680,
      hearingRange: 950,
      memoryDuration: 7.5,         // Long-term tactical memory
      flankingTendency: 0.85,      // Actively uses side paths
      retreatHpThreshold: 0.38,    // Strategic tactical retreat before dying
      dodgeLikelihood: 0.78,       // Dodges incoming fire
      teamCoordination: 0.95,      // Team Brain shared blackboard
      baseDefenseWeight: 0.90,     // Prioritizes holding lead
      baseRaidTendency: 0.80,      // Sneak-raids vulnerable enemy bases
      adaptToScoreDifference: true,// Switches posture (Turtle vs Aggressive Push)
      pincerAttacks: true,         // Synchronized two-pronged assaults
      speedMultiplier: 1.0,
      damageMultiplier: 1.0
    }
  },

  // Industrial Base System
  BASES: {
    COUNT: 3, // Alpha (North Warehouse), Bravo (Central Gantry), Charlie (South Quay)
    CAPTURE_RADIUS: 120,
    CAPTURE_TIME_SOLO: 8.0, // Seconds required for 1 unit to capture from neutral
    CONTEST_SLOW_FACTOR: 0.3,
    POINTS_PER_SECOND: 10,  // Continuous score generation per base held
    CAPTURE_BONUS_POINTS: 250, // Instant score reward on capture
    RAID_POINTS_DRAIN: 200,    // Points stolen during enemy Base Raid
    RAID_INTERACTION_TIME: 3.5 // Seconds needed in enemy base core to complete raid
  },

  // Dynamic Spawning Items
  ITEMS: {
    SPAWN_INTERVAL: 10.0,      // Spawn new item wave every 10 seconds
    MAX_ITEMS_ON_MAP: 12,
    LIFETIME: 40.0,            // Items despawn after 40s if uncollected
    TYPES: {
      SCORE_SMALL: { id: 'SCORE_SMALL', name: 'Data Chip', score: 80, color: '#ffb700', icon: '💾' },
      SCORE_LARGE: { id: 'SCORE_LARGE', name: 'Server Core', score: 220, color: '#ff8800', icon: '🔋' },
      MEDKIT: { id: 'MEDKIT', name: 'Nanite Medkit', heal: 45, color: '#00ff88', icon: '➕' },
      SHIELD: { id: 'SHIELD', name: 'Shield Cell', shield: 45, color: '#00e5ff', icon: '🛡️' },
      SPEED: { id: 'SPEED', name: 'Overdrive Injector', duration: 8.0, speedBoost: 0.40, color: '#f700ff', icon: '⚡' },
      EMP_PACK: { id: 'EMP_PACK', name: 'EMP Battery', abilityReset: true, color: '#7b00ff', icon: '💥' },
      SUPER_RELIC: { id: 'SUPER_RELIC', name: 'King of Clubs Relic', score: 650, color: '#ffe600', icon: '👑', isSuper: true }
    }
  },

  // Match Scoring Rules
  SCORING: {
    KILL_SCORE: 120,
    ASSIST_SCORE: 50,
    BASE_CAPTURE_SCORE: 250,
    BASE_HOLD_RATE: 10, // points/sec
    WIN_SCORE_THRESHOLD: 3000 // If either team reaches this, instant victory
  },

  // Visuals & Effects
  VISUALS: {
    MAX_PARTICLES: 450,
    MAX_FLOATING_TEXTS: 40,
    MAX_PROJECTILES: 80,
    PARTICLES_ENABLED: true,
    LIGHTING_ENABLED: true,
    SCREEN_SHAKE_ENABLED: true,
    BLOOM_ENABLED: true,
    DYNAMIC_WEATHER: true, // Rain drops & dockland mist
    TRAIL_LENGTH: 6
  },

  // Audio Settings (Web Audio API Defaults)
  AUDIO: {
    MASTER_VOLUME: 0.8,
    SFX_VOLUME: 0.85,
    MUSIC_VOLUME: 0.60
  },

  // Key Bindings
  CONTROLS: {
    MOVE_UP: ['KeyW', 'ArrowUp'],
    MOVE_DOWN: ['KeyS', 'ArrowDown'],
    MOVE_LEFT: ['KeyA', 'ArrowLeft'],
    MOVE_RIGHT: ['KeyD', 'ArrowRight'],
    SPRINT: ['ShiftLeft', 'ShiftRight'],
    DODGE: ['Space', 'KeyC'],
    ABILITY: ['KeyQ', 'KeyF'],
    INTERACT: ['KeyE'],
    RELOAD_ACTION: ['KeyR'],
    PAUSE: ['Escape']
  },

  // Developer Debug Mode
  DEBUG: {
    ENABLED: false, // Set to true or toggle via Settings / ` key
    SHOW_FPS: true,
    DRAW_GRID: false,
    DRAW_VISION_CONES: false,
    DRAW_AI_PATHS: false,
    DRAW_UTILITY_SCORES: false,
    DRAW_HITBOXES: false,
    LOG_AI_DECISIONS: false
  }
};

// Export to window / globalThis
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
if (typeof globalThis !== 'undefined') {
  globalThis.CONFIG = CONFIG;
}
