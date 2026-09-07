/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * 9-Layer Multi-Stage AI Decision Engine (Utility AI, Threat Assessment & Tactical Planner)
 */

const AI_GOALS = {
  IDLE: 'IDLE',
  ATTACK_TARGET: 'ATTACK_TARGET',
  DEFEND_BASE: 'DEFEND_BASE',
  CAPTURE_BASE: 'CAPTURE_BASE',
  COLLECT_ITEM: 'COLLECT_ITEM',
  INTERCEPT_CARRIER: 'INTERCEPT_CARRIER',
  AMBUSH_PLAYER: 'AMBUSH_PLAYER',
  TACTICAL_RETREAT: 'TACTICAL_RETREAT',
  REGROUP: 'REGROUP',
  BASE_RAID: 'BASE_RAID',
  FLANK: 'FLANK'
};

class AIBrain {
  constructor(agent, difficulty = 'HARD') {
    this.agent = agent;
    this.setDifficulty(difficulty);

    // 1. Perception & Memory State
    this.memory = {
      spottedEnemies: new Map(), // id -> { entity, x, y, hp, lastSeenTime }
      spottedItems: new Map(),   // item -> { x, y, type, lastSeenTime }
      lastHeardCombat: null      // { x, y, time }
    };

    // 2. Decision State
    this.currentGoal = AI_GOALS.IDLE;
    this.currentGoalTarget = null;
    this.decisionTimer = Math.random() * 0.2; // Stagger initial decisions
    this.utilityScores = {};

    // 3. Tactical Plan
    this.tacticalRole = 'Attacker'; // Assigned by TeamBrain
    this.preferredFlankSide = Math.random() < 0.5 ? 1 : -1;
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.strafeTimer = 0;
  }

  setDifficulty(difficultyKey) {
    this.difficultyKey = difficultyKey;
    this.params = CONFIG.AI_DIFFICULTY_PRESETS[difficultyKey] || CONFIG.AI_DIFFICULTY_PRESETS.HARD;
  }

  // =========================================================================
  // LAYER 1: SENSORY PERCEPTION & FAIR MEMORY STORE
  // =========================================================================
  updatePerception(dt, game) {
    const now = game.matchTimer;
    const navGrid = game.navGrid;
    const allAgents = game.getAllAgents();

    // 1. Visual Perception (Line of Sight + Range)
    allAgents.forEach(other => {
      if (other === this.agent || !other.isAlive) return;

      const d = Utils.dist(this.agent.x, this.agent.y, other.x, other.y);

      // Vision check
      if (d <= this.params.visionRange) {
        if (navGrid.hasLineOfSight(this.agent.x, this.agent.y, other.x, other.y)) {
          if (other.team !== this.agent.team) {
            // Spotted enemy
            this.memory.spottedEnemies.set(other.id, {
              entity: other,
              x: other.x,
              y: other.y,
              vx: other.vx || 0,
              vy: other.vy || 0,
              hp: other.hp,
              scoreCarried: other.scoreCarried || 0,
              lastSeenTime: now
            });
          }
        }
      }
    });

    // 2. Memory Decay (No cheating / wallhack!)
    for (const [id, record] of this.memory.spottedEnemies.entries()) {
      if (now - record.lastSeenTime > this.params.memoryDuration) {
        this.memory.spottedEnemies.delete(id);
      }
    }

    // 3. Scan Visible Items
    const items = game.itemSpawner.getItems();
    items.forEach(item => {
      if (!item.active) return;
      const d = Utils.dist(this.agent.x, this.agent.y, item.x, item.y);
      if (d <= this.params.visionRange && navGrid.hasLineOfSight(this.agent.x, this.agent.y, item.x, item.y)) {
        this.memory.spottedItems.set(item, {
          item: item,
          x: item.x,
          y: item.y,
          typeKey: item.typeKey,
          isSuper: item.isSuper,
          lastSeenTime: now
        });
      }
    });

    // Clean inactive items from memory
    for (const [item, record] of this.memory.spottedItems.entries()) {
      if (!item.active || now - record.lastSeenTime > this.params.memoryDuration) {
        this.memory.spottedItems.delete(item);
      }
    }
  }

  // =========================================================================
  // LAYER 2 & 3: WORLD STATE & THREAT ASSESSMENT
  // =========================================================================
  assessThreats(game) {
    let localEnemyPower = 0;
    let localAllyPower = this.agent.hp + (this.agent.shield * 0.8);
    let nearestThreat = null;
    let nearestDist = Infinity;

    const myPos = { x: this.agent.x, y: this.agent.y };

    // Assess known enemies
    for (const [id, enemyRecord] of this.memory.spottedEnemies.entries()) {
      if (!enemyRecord.entity.isAlive) continue;

      const d = Utils.dist(myPos.x, myPos.y, enemyRecord.x, enemyRecord.y);
      if (d < 500) {
        localEnemyPower += enemyRecord.hp + (enemyRecord.entity.shield || 0);
        if (d < nearestDist) {
          nearestDist = d;
          nearestThreat = enemyRecord;
        }
      }
    }

    // Assess nearby allies
    const allies = game.getTeamMembers(this.agent.team);
    allies.forEach(ally => {
      if (ally !== this.agent && ally.isAlive) {
        const d = Utils.dist(myPos.x, myPos.y, ally.x, ally.y);
        if (d < 450) {
          localAllyPower += ally.hp + (ally.shield || 0);
        }
      }
    });

    return {
      nearestThreat,
      nearestDist,
      localEnemyPower,
      localAllyPower,
      isOutnumbered: localEnemyPower > localAllyPower * 1.35,
      isCriticalHp: (this.agent.hp / this.agent.maxHp) <= this.params.retreatHpThreshold
    };
  }

  // =========================================================================
  // LAYER 4 & 5: UTILITY GOAL SELECTION & STRATEGIC SCORING
  // =========================================================================
  evaluateGoals(threats, game) {
    const scores = {};
    const myPos = { x: this.agent.x, y: this.agent.y };
    const myHpRatio = this.agent.hp / this.agent.maxHp;

    const myTeamScore = game.getTeamScore(this.agent.team);
    const enemyTeamScore = game.getOpposingTeamScore(this.agent.team);
    const scoreDiff = myTeamScore - enemyTeamScore; // Positive = leading, Negative = trailing
    const timeRatio = game.matchTimeRemaining / CONFIG.GAME_TIME;

    // --- 1. TACTICAL RETREAT UTILITY ---
    if (threats.isCriticalHp || (threats.isOutnumbered && threats.nearestDist < 300)) {
      scores[AI_GOALS.TACTICAL_RETREAT] = 85 + (1.0 - myHpRatio) * 35;
    } else {
      scores[AI_GOALS.TACTICAL_RETREAT] = 5;
    }

    // --- 2. ATTACK ENEMY UTILITY ---
    if (threats.nearestThreat && threats.nearestThreat.entity.isAlive) {
      let atkScore = 55;
      if (!threats.isOutnumbered) atkScore += 20;
      if (threats.nearestThreat.hp < 40) atkScore += 25; // Finish off weak enemy
      if (this.tacticalRole === 'Attacker' || this.tacticalRole === 'Flanker') atkScore += 15;
      if (scoreDiff < -200) atkScore += 15; // Trailing: aggressive combat
      scores[AI_GOALS.ATTACK_TARGET] = atkScore;
    } else {
      scores[AI_GOALS.ATTACK_TARGET] = 0;
    }

    // --- 3. BASE CAPTURE UTILITY ---
    const bases = game.baseManager.getBases();
    let bestCaptureBase = null;
    let bestCaptureScore = 0;

    bases.forEach(base => {
      if (base.owner !== this.agent.team) {
        const d = Utils.dist(myPos.x, myPos.y, base.x, base.y);
        let u = 60 + (1.0 - d / 2000) * 30;

        // Extra urgency if trailing in score
        if (scoreDiff < 0) u += 25;
        // High value central base
        if (base.id === 'B') u += 15;
        // Assigned role bonus
        if (this.tacticalRole === 'Attacker' || this.tacticalRole === 'Base Raider') u += 20;

        if (u > bestCaptureScore) {
          bestCaptureScore = u;
          bestCaptureBase = base;
        }
      }
    });
    scores[AI_GOALS.CAPTURE_BASE] = bestCaptureScore;

    // --- 4. BASE DEFENSE UTILITY ---
    let bestDefendBase = null;
    let bestDefendScore = 0;

    bases.forEach(base => {
      if (base.owner === this.agent.team) {
        let u = 40;
        // If enemy is currently in base or base is losing capture progress
        if (base.isContested || (this.agent.team === 'enemy' && base.captureProgress > -90) || (this.agent.team === 'player' && base.captureProgress < 90)) {
          u += 45;
        }
        // Turtle strategy if leading
        if (this.params.adaptToScoreDifference && scoreDiff > 200) {
          u += 30 * this.params.baseDefenseWeight;
        }
        if (this.tacticalRole === 'Defender') u += 25;

        const d = Utils.dist(myPos.x, myPos.y, base.x, base.y);
        u += (1.0 - d / 2000) * 15;

        if (u > bestDefendScore) {
          bestDefendScore = u;
          bestDefendBase = base;
        }
      }
    });
    scores[AI_GOALS.DEFEND_BASE] = bestDefendScore;

    // --- 5. COLLECT ITEM UTILITY ---
    let bestItem = null;
    let bestItemScore = 0;

    for (const [item, record] of this.memory.spottedItems.entries()) {
      if (!item.active) continue;
      const d = Utils.dist(myPos.x, myPos.y, item.x, item.y);
      let u = 40;

      if (record.isSuper) {
        u = 95; // Super Relic is top tier priority!
      } else if (record.typeKey === 'MEDKIT' && myHpRatio < 0.6) {
        u = 80 + (1.0 - myHpRatio) * 30;
      } else if (record.typeKey === 'SHIELD' && this.agent.shield < 20) {
        u = 65;
      } else if (record.typeKey === 'SCORE_LARGE') {
        u = 55;
      }

      u += (1.0 - Math.min(1.0, d / 1200)) * 20;

      if (u > bestItemScore) {
        bestItemScore = u;
        bestItem = item;
      }
    }
    scores[AI_GOALS.COLLECT_ITEM] = bestItemScore;

    // --- 6. BASE SNEAK RAID UTILITY (Osmosis Infiltration) ---
    let bestRaidBase = null;
    let bestRaidScore = 0;

    if (this.params.baseRaidTendency > 0.4) {
      bases.forEach(base => {
        if (base.owner !== this.agent.team && base.owner !== 'neutral') {
          // Check if base has no defenders
          const isGuarded = (this.agent.team === 'enemy' ? base.blueCount > 0 : base.redCount > 0);
          if (!isGuarded) {
            let u = 50 + this.params.baseRaidTendency * 30;
            if (scoreDiff < -150) u += 25; // Desperate comeback raid
            if (u > bestRaidScore) {
              bestRaidScore = u;
              bestRaidBase = base;
            }
          }
        }
      });
    }
    scores[AI_GOALS.BASE_RAID] = bestRaidScore;

    // --- 7. REGROUP (Osmosis Synergy Formation) ---
    const allies = game.getTeamMembers(this.agent.team).filter(a => a !== this.agent && a.isAlive);
    let regroupScore = 0;
    let closestAlly = null;

    if (allies.length > 0) {
      let minAllyDist = Infinity;
      allies.forEach(a => {
        const d = Utils.dist(myPos.x, myPos.y, a.x, a.y);
        if (d < minAllyDist) {
          minAllyDist = d;
          closestAlly = a;
        }
      });

      if (minAllyDist > 300) {
        regroupScore = 30 + (this.params.teamCoordination * 30);
      }
    }
    scores[AI_GOALS.REGROUP] = regroupScore;

    this.utilityScores = scores;

    // Select Highest Scoring Goal
    let highestGoal = AI_GOALS.IDLE;
    let maxVal = -1;

    for (const [goal, val] of Object.entries(scores)) {
      if (val > maxVal) {
        maxVal = val;
        highestGoal = goal;
      }
    }

    this.currentGoal = highestGoal;

    // Assign Corresponding Target
    switch (highestGoal) {
      case AI_GOALS.ATTACK_TARGET:
        this.currentGoalTarget = threats.nearestThreat ? threats.nearestThreat.entity : null;
        break;
      case AI_GOALS.CAPTURE_BASE:
        this.currentGoalTarget = bestCaptureBase;
        break;
      case AI_GOALS.DEFEND_BASE:
        this.currentGoalTarget = bestDefendBase;
        break;
      case AI_GOALS.COLLECT_ITEM:
        this.currentGoalTarget = bestItem;
        break;
      case AI_GOALS.BASE_RAID:
        this.currentGoalTarget = bestRaidBase;
        break;
      case AI_GOALS.REGROUP:
        this.currentGoalTarget = closestAlly;
        break;
      case AI_GOALS.TACTICAL_RETREAT:
        // Retreat toward friendly home base or closest healthy ally
        this.currentGoalTarget = {
          x: this.agent.team === 'player' ? 240 : 2360,
          y: 1000
        };
        break;
      default:
        this.currentGoalTarget = null;
    }
  }

  // =========================================================================
  // MAIN DECISION CYCLE UPDATE
  // =========================================================================
  update(dt, game) {
    if (!this.agent.isAlive) return;

    this.strafeTimer += dt;
    if (this.strafeTimer >= 1.2) {
      this.strafeTimer = 0;
      this.strafeDir *= -1;
    }

    // Step 1: Update Sensory Perception
    this.updatePerception(dt, game);

    // Step 2 & 3: Periodic Re-evaluation (120ms for Hard, 350ms for Easy)
    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = this.params.decisionInterval;

      const threats = this.assessThreats(game);
      this.evaluateGoals(threats, game);
    }
  }

  // =========================================================================
  // COMBAT & BALLISTIC PREDICTION (HARD vs EASY)
  // =========================================================================
  getAimPosition(target) {
    if (!target) return null;

    let aimX = target.x;
    let aimY = target.y;

    // Predictive Ballistic Lead (Hard AI)
    if (this.params.leadTarget && (target.vx || target.vy)) {
      const dist = Utils.dist(this.agent.x, this.agent.y, target.x, target.y);
      const timeToHit = dist / CONFIG.PLAYER.PROJECTILE_SPEED;
      aimX += (target.vx || 0) * timeToHit * 0.85;
      aimY += (target.vy || 0) * timeToHit * 0.85;
    }

    // Aim Jitter / Error
    if (this.params.aimErrorRadians > 0) {
      const angleOffset = (Math.random() - 0.5) * 2 * this.params.aimErrorRadians;
      const d = Utils.dist(this.agent.x, this.agent.y, aimX, aimY);
      const curAngle = Utils.angle(this.agent.x, this.agent.y, aimX, aimY);
      aimX = this.agent.x + Math.cos(curAngle + angleOffset) * d;
      aimY = this.agent.y + Math.sin(curAngle + angleOffset) * d;
    }

    return { x: aimX, y: aimY };
  }

  shouldDodge(incomingProjectiles) {
    if (Math.random() > this.params.dodgeLikelihood) return false;

    for (let i = 0; i < incomingProjectiles.length; i++) {
      const proj = incomingProjectiles[i];
      if (!proj.active || proj.team === this.agent.team) continue;

      const d = Utils.dist(this.agent.x, this.agent.y, proj.x, proj.y);
      if (d < 90) {
        return true;
      }
    }
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.AI_GOALS = AI_GOALS;
  window.AIBrain = AIBrain;
}
if (typeof globalThis !== 'undefined') {
  globalThis.AI_GOALS = AI_GOALS;
  globalThis.AIBrain = AIBrain;
}
