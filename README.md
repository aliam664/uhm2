# DOCKLANDS: PROTOCOL OSMOSIS
### A Tactical Cyber-Industrial HTML5 Canvas Browser Game

Inspired by the intense tactical arena mechanics of **Osmosis / King of Clubs** from *Alice in Borderland*, **DOCKLANDS: PROTOCOL OSMOSIS** is a standalone, browser-based tactical arena game built in pure HTML5, CSS3, and JavaScript with **zero external dependencies, zero CDNs, and zero network requests**.

---

## 🎮 Core Game Concept & Lore

You play as **Arisu**, leading the **Blue Vanguard** team against **Kyuma's Red Syndicate** in a sprawling, high-stakes industrial dockland arena. Teams compete in a timed match to capture strategic logistics terminals, raid enemy command cores, gather high-value data drives, and engage in real-time tactical combat.

### Key Gameplay Mechanics:
1. **Industrial Base Capture & Territory Control:**
   - 3 Strategic Terminals: **Base Alpha** (North Logistics Depot), **Base Bravo** (Central Gantry Crane Plaza), and **Base Charlie** (South Quay Tank Yard).
   - Capture speed scales with numerical superiority inside the capture perimeter.
   - Holding bases generates continuous team score (**+10 PTS/sec** per base) plus an instant capture bonus (**+250 PTS**).
2. **Osmosis Base Raiding (Infiltration):**
   - Entering the inner core terminal of an enemy-held base drains **200 PTS** directly from the opposing team into yours!
3. **Osmosis Team Synergy Link:**
   - Staying within proximity of living teammates forms an electric **Synergy Beam**, granting **+15% Movement Speed** and **25% Damage Reduction** to all linked squad members.
4. **Dynamic Item Spawns & Super Relic Event:**
   - Periodic drops: *Data Chips (+80 PTS)*, *Server Cores (+220 PTS)*, *Nanite Medkits (+45 HP)*, *Shield Batteries (+45 Shield)*, *Overdrive Injectors (+40% Speed)*, and *EMP Packs*.
   - At halftime (50% match duration), the **King of Clubs Super Relic** spawns at Central Plaza Bravo with a map-wide alert, granting **+650 PTS** to the squad that secures it.
5. **Real-time Tactical Arena Combat:**
   - Tactical Plasma Blaster with ballistic physics, hit registration, knockback, and shield absorption.
   - Evasive Dash / Dodge Roll with invulnerability frames.
   - Area EMP Shockwave Ability that damages, knocks back, and slows hostiles.

---

## 🧠 Dual Difficulty & Multi-Layer AI Architecture

The game features two distinct difficulty settings that fundamentally alter the decision-making intelligence of the AI rather than just applying superficial stat buffs.

### 1. EASY Mode (Casual & Training)
- **Reaction Time:** ~350ms reaction latency.
- **Decision Rate:** Re-evaluates every 350ms.
- **Ballistics:** Straightforward line-of-sight shooting with generous aim error (~20° jitter). Does not lead moving targets.
- **Tactical Memory:** Short memory span (2.5s) of enemy sightings.
- **Team Coordination:** Low coordination (individualistic bots; does not execute synchronized pincer ambushes).
- **Goal Selection:** Naive nearest-target utility weighting.

### 2. HARD Mode (Kyuma Mastermind AI)
The HARD AI is built on a modular **9-Layer Decision & Planning Pipeline**:

1. **Layer 1: Sensory Perception & Fair Sight:**
   - Raycasted Line-of-Sight against static shipping containers and buildings (no wallhacks/cheating).
   - Dynamic hearing radius triggered by weapon discharges, alarms, and explosions.
   - 7.5s decaying spatial memory store.
2. **Layer 2: World State Analysis:**
   - Tracks base ownership ratio, score differential, remaining match time, and team health averages.
3. **Layer 3: Threat Assessment:**
   - Computes local combat power ratio ($\frac{\sum \text{Enemy HP/DPS}}{\sum \text{Ally HP/DPS}}$). Evaluates retreat vectors when outnumbered or at critical health ($<38\%$ HP).
4. **Layer 4: Utility Goal Selection:**
   - Computes real-time utility scores (0–100) across 10 distinct tactical objectives:
     - `ATTACK_TARGET`: High when target is isolated or low HP.
     - `DEFEND_BASE`: Urgency scales with score lead and base contest status.
     - `CAPTURE_BASE`: Urgency scales with score deficit.
     - `COLLECT_ITEM`: Urgency scales with need (e.g., Medkit if injured, Relic when spawned).
     - `BASE_RAID`: Triggers stealth infiltration when enemy bases are left unguarded.
     - `REGROUP`: High when separated from squad formations.
     - `TACTICAL_RETREAT`: High when health is low and danger is imminent.
5. **Layer 5: Tactical Planning:**
   - Dynamically selects direct, flanking, or pincer approach vectors.
6. **Layer 6: Movement Planning (A* Navigation):**
   - High-performance A* search on a 65×50 grid with diagonal movement, danger-map avoidance, and string-pulling path smoothing.
7. **Layer 7: Combat Decisions & Ballistics:**
   - Predictive ballistic aiming: leads moving targets using target velocity vectors ($T = \frac{\text{dist}}{V_{\text{proj}}}$).
   - Tactical circle-strafing and kiting at optimal weapon range (~280px).
   - Reactive dodge rolls when incoming projectiles are detected within 90px.
   - EMP Shockwave ability triggers when 2+ hostiles cluster in range.
8. **Layer 8: Team Coordination (Team Brain Blackboard):**
   - Shared tactical blackboard synchronizes spotted enemy positions across the squad.
   - Dynamic macro role assignment: `Attacker`, `Defender`, `Scout`, `Collector`, `Flanker`, `Support`.
   - Dynamic macro posture switching:
     - `BALANCED`: Standard split doctrine.
     - `DEFENSIVE_HOLD`: Turtles with 3 defenders when defending a lead.
     - `AGGRESSIVE_SIEGE`: High-risk all-out assault when trailing late game.
     - `RELIC_CONTEST`: Rallies the squad to contest the King of Clubs Relic.
9. **Layer 9: Dynamic Replanning:**
   - Instantly interrupts current movement waypoints when ambushed or under surprise crossfire.

---

## 🏗️ Project Structure

```
uhm2/
├── index.html          # Main HTML5 entry point & self-contained UI modals
├── README.md           # Comprehensive documentation & guide
├── css/
│   └── style.css       # Dark cyber-industrial glassmorphism styling & animations
└── js/
    ├── config.js       # Game constants, balancing parameters, and difficulty presets
    ├── utils.js        # Vector math, spatial hashing, object pools, and storage helpers
    ├── audio.js        # 100% Web Audio API procedural sound engine & synthwave BGM
    ├── input.js        # Keyboard, mouse aim, keybindings, and coordinate translation
    ├── camera.js       # Smooth follow, dynamic zoom, and trauma screen shake engine
    ├── particles.js    # Pooled particle emitters, ambient weather, and floating numbers
    ├── pathfinding.js  # Fast A* pathfinder with MinHeap, danger weighting & path smoothing
    ├── combat.js       # Ballistics, projectile pooling, knockback, damage & killfeed
    ├── items.js        # Dynamic collectible spawner and King of Clubs relic event
    ├── base.js         # Territory capture logic, score generation, and base raiding
    ├── map.js          # Procedural industrial docklands generator & canvas renderer
    ├── player.js       # Player controller with WASD, sprint, dash & EMP ability
    ├── enemy.js        # Autonomous agent entity for AI teammates and opponents
    ├── aiBrain.js      # 9-layer Multi-Stage AI Decision Engine
    ├── teamAI.js       # Team Brain macro blackboard & dynamic role distributor
    ├── ui.js           # Cyberpunk HUD, real-time radar minimap with Fog of War
    ├── game.js         # Main game loop, state machine, and match orchestrator
    └── main.js         # DOM initialization, settings sync, and menu event handlers
```

---

## 🔊 100% Offline Audio Synthesizer (Web Audio API)

No audio files or external mp3s are required. All sound effects and background music are procedurally synthesized in real time via the **Web Audio API**:
- **Plasma Blaster:** Frequency-swept sawtooth wave with lowpass filtering.
- **Shield Deflection:** Resonant metallic sine tone.
- **Impact Thuds:** Filtered bandpass noise burst combined with sub-bass punch.
- **EMP Shockwave:** Sub-bass sweep and resonant filter cutoff drop.
- **Base Capture Fanfare:** Multi-oscillator harmonic chord progression.
- **Dynamic Synthwave BGM:** Procedural rolling 16th bassline, four-on-the-floor kick, offbeat hi-hat, and atmospheric synth pad chords with tempo acceleration during the final 60 seconds.

---

## ⚡ Performance & Optimization

- **Target Framerate:** Solid 60 FPS on standard hardware.
- **Object Pooling:** Dedicated pre-allocated pools for particles, floating combat numbers, and projectiles.
- **Spatial Grid Partitioning:** Fast $O(1)$ spatial queries for proximity checks and collision resolution.
- **Optimized A* Pathfinding:** Binary MinHeap implementation with string-pulling line-of-sight smoothing.
- **Scheduled AI Updates:** Sensory perception updates are decoupled from frame renders (120ms intervals) to conserve CPU cycles.
- **Viewport Culling:** Offscreen map elements, particles, and bases are automatically culled during render passes.

---

## 🚀 How to Run (100% Offline)

### Method 1: Direct File Opening
Simply double-click `index.html` or open it in any modern web browser (Chrome, Firefox, Safari, Edge, Opera, Brave). No internet connection is needed.

### Method 2: Local Web Server (Optional)
If running via a local server:
```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .
```
Then open `http://localhost:8080` in your browser.

---

## ⚙️ Customization & Game Balancing (`config.js`)

All core game parameters can be customized in `js/config.js`:
- `GAME_TIME`: Match duration in seconds (default `300`).
- `PLAYER.MAX_HP`, `PLAYER.MAX_SHIELD`, `PLAYER.BASE_SPEED`, `PLAYER.ATTACK_DAMAGE`.
- `BASES.CAPTURE_TIME_SOLO`, `BASES.POINTS_PER_SECOND`, `BASES.CAPTURE_BONUS_POINTS`.
- `ITEMS.SPAWN_INTERVAL`, `ITEMS.TYPES`.
- `AI_DIFFICULTY_PRESETS.EASY` & `AI_DIFFICULTY_PRESETS.HARD` (reaction times, aim error, retreat thresholds, flanking chance).

### 🛠️ Developer Debug Mode
- Press the backtick key (`` ` ``) or **F3** during a match, or toggle **Developer Debug Mode** in the Settings menu.
- Displays live FPS, A* navigation grid cells, danger cost overlays, AI path lines, and real-time utility goal evaluations.

---

## 🎯 Default Controls

| Action | Key / Input |
|---|---|
| **Move Up / Down / Left / Right** | `W` / `S` / `A` / `D` or Arrow Keys |
| **Aim & Turn** | Mouse Cursor |
| **Fire Plasma Blaster** | Left Mouse Button |
| **Tactical Dash / Dodge Roll** | `Spacebar` / Right Mouse Button |
| **Sprint** | `Shift` (Consumes Stamina) |
| **EMP Shockwave Ability** | `Q` or `F` |
| **Pause Game** | `Escape` |
| **Toggle Debug Overlay** | `` ` `` (Backtick) or `F3` |

---

*Enjoy **DOCKLANDS: PROTOCOL OSMOSIS**!*
