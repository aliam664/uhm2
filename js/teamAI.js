/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Team Brain & Macro-Tactical Coordinator (Shared Blackboard, Formations & Roles)
 */

class TeamBrain {
  constructor(team = 'enemy') {
    this.team = team;
    this.posture = 'BALANCED'; // 'BALANCED', 'DEFENSIVE_HOLD', 'AGGRESSIVE_SIEGE', 'PINCER_AMBUSH', 'RELIC_CONTEST'
    this.roleAssignments = new Map(); // agentId -> role
    this.updateTimer = 0.5;

    // Shared tactical blackboard
    this.sharedSpottedEnemies = new Map();
    this.priorityBaseTarget = null;
    this.lastPincerTime = 0;
  }

  update(dt, teamMembers, game) {
    this.updateTimer -= dt;
    if (this.updateTimer > 0) return;
    this.updateTimer = 0.35; // Update team macro state ~3 times per second

    const aliveMembers = teamMembers.filter(m => m.isAlive && !m.isPlayer);
    if (aliveMembers.length === 0) return;

    // 1. Synchronize Shared Perception across Team Blackboard
    teamMembers.forEach(member => {
      if (member.brain && member.brain.memory) {
        for (const [id, enemyRec] of member.brain.memory.spottedEnemies.entries()) {
          this.sharedSpottedEnemies.set(id, enemyRec);
        }
      }
    });

    // Share spotted info back to teammates based on coordination level
    aliveMembers.forEach(member => {
      if (member.brain) {
        const coord = member.brain.params.teamCoordination;
        if (coord > 0.5) {
          for (const [id, enemyRec] of this.sharedSpottedEnemies.entries()) {
            if (!member.brain.memory.spottedEnemies.has(id)) {
              member.brain.memory.spottedEnemies.set(id, Object.assign({}, enemyRec));
            }
          }
        }
      }
    });

    // 2. World & Score Analysis
    const myScore = game.getTeamScore(this.team);
    const enemyScore = game.getOpposingTeamScore(this.team);
    const scoreDiff = myScore - enemyScore;
    const timeRemaining = game.matchTimeRemaining;
    const isLateGame = timeRemaining < 90;

    const bases = game.baseManager.getBases();
    const myControlledBases = bases.filter(b => b.owner === this.team);
    const enemyControlledBases = bases.filter(b => b.owner !== this.team && b.owner !== 'neutral');
    const neutralBases = bases.filter(b => b.owner === 'neutral');

    // 3. Macro Posture Selection
    const hasSuperRelic = game.itemSpawner.getItems().some(it => it.active && it.isSuper);

    if (hasSuperRelic) {
      this.posture = 'RELIC_CONTEST';
    } else if (isLateGame && scoreDiff < -150) {
      this.posture = 'AGGRESSIVE_SIEGE';
    } else if (scoreDiff > 250 && myControlledBases.length >= 2) {
      this.posture = 'DEFENSIVE_HOLD';
    } else {
      this.posture = 'BALANCED';
    }

    // 4. Dynamic Role Distribution & Tactical Formations
    this._distributeRoles(aliveMembers, myControlledBases, enemyControlledBases, neutralBases);
  }

  _distributeRoles(members, myBases, enemyBases, neutralBases) {
    const total = members.length;

    switch (this.posture) {
      case 'DEFENSIVE_HOLD':
        // 2 Defenders on owned bases, 1 Interceptor/Scout, 1 Support
        members.forEach((m, idx) => {
          let role = 'Defender';
          if (idx === 0) role = 'Interceptor';
          else if (idx === 1) role = 'Defender';
          else if (idx === 2) role = 'Defender';
          else role = 'Support';

          this._assignRole(m, role);
        });
        break;

      case 'AGGRESSIVE_SIEGE':
        // High-risk push: 2 Attackers, 1 Flanker, 1 Base Raider
        members.forEach((m, idx) => {
          let role = 'Attacker';
          if (idx === 0) role = 'Attacker';
          else if (idx === 1) role = 'Base Raider';
          else if (idx === 2) role = 'Flanker';
          else role = 'Attacker';

          this._assignRole(m, role);
        });
        break;

      case 'RELIC_CONTEST':
        // All-hands rush to secure Super Relic
        members.forEach((m, idx) => {
          this._assignRole(m, idx === 0 ? 'Collector' : 'Attacker');
        });
        break;

      case 'BALANCED':
      default:
        // Standard tactical doctrine: 1 Attacker, 1 Flanker, 1 Defender, 1 Collector/Scout
        members.forEach((m, idx) => {
          let role = 'Attacker';
          if (idx % 4 === 0) role = 'Attacker';
          else if (idx % 4 === 1) role = 'Flanker';
          else if (idx % 4 === 2) role = 'Defender';
          else role = 'Collector';

          this._assignRole(m, role);
        });
        break;
    }
  }

  _assignRole(member, role) {
    this.roleAssignments.set(member.id, role);
    if (member.brain) {
      member.brain.tacticalRole = role;
    }
  }
}

if (typeof window !== 'undefined') {
  window.TeamBrain = TeamBrain;
}
if (typeof globalThis !== 'undefined') {
  globalThis.TeamBrain = TeamBrain;
}
