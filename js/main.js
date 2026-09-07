/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Main Application Bootstrap & UI Event Wiring
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas element not found!');
    return;
  }

  // Initialize Game Engine
  Game.init(canvas);

  // Load saved settings
  const savedSettings = Utils.storage.get('SETTINGS', {
    masterVol: 80,
    sfxVol: 85,
    musicVol: 60,
    screenShake: true,
    showFps: false,
    debugMode: false,
    difficulty: 'HARD'
  });

  Game.difficulty = savedSettings.difficulty || 'HARD';
  CONFIG.VISUALS.SCREEN_SHAKE_ENABLED = savedSettings.screenShake;
  CONFIG.DEBUG.ENABLED = savedSettings.debugMode;
  CONFIG.DEBUG.SHOW_FPS = savedSettings.showFps;

  Sound.setVolumes(
    savedSettings.masterVol / 100,
    savedSettings.sfxVol / 100,
    savedSettings.musicVol / 100
  );

  // Update Settings UI inputs
  const masterSlider = document.getElementById('setting-master-vol');
  const sfxSlider = document.getElementById('setting-sfx-vol');
  const musicSlider = document.getElementById('setting-music-vol');
  const shakeToggle = document.getElementById('setting-screenshake');
  const fpsToggle = document.getElementById('setting-fps');
  const debugToggle = document.getElementById('setting-debug');

  if (masterSlider) masterSlider.value = savedSettings.masterVol;
  if (sfxSlider) sfxSlider.value = savedSettings.sfxVol;
  if (musicSlider) musicSlider.value = savedSettings.musicVol;
  if (shakeToggle) shakeToggle.checked = savedSettings.screenShake;
  if (fpsToggle) fpsToggle.checked = savedSettings.showFps;
  if (debugToggle) debugToggle.checked = savedSettings.debugMode;

  // UI Navigation Helpers
  const showModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
    Sound.playUIClick();
  };

  const hideModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
    Sound.playUIClick();
  };

  // Main Menu Buttons
  const btnPlay = document.getElementById('btn-play');
  const btnDifficulty = document.getElementById('btn-difficulty');
  const btnHowToPlay = document.getElementById('btn-how-to-play');
  const btnSettings = document.getElementById('btn-settings');

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      document.getElementById('main-menu-container').classList.add('hidden');
      Game.startMatch(Game.difficulty);
    });
  }

  if (btnDifficulty) {
    btnDifficulty.addEventListener('click', () => {
      showModal('difficulty-modal');
      _updateDifficultyUI();
    });
  }

  if (btnHowToPlay) {
    btnHowToPlay.addEventListener('click', () => showModal('how-to-play-modal'));
  }

  if (btnSettings) {
    btnSettings.addEventListener('click', () => showModal('settings-modal'));
  }

  // Difficulty Selection
  const btnSelectEasy = document.getElementById('diff-card-easy');
  const btnSelectHard = document.getElementById('diff-card-hard');

  const _updateDifficultyUI = () => {
    if (btnSelectEasy && btnSelectHard) {
      if (Game.difficulty === 'EASY') {
        btnSelectEasy.classList.add('active-diff');
        btnSelectHard.classList.remove('active-diff');
      } else {
        btnSelectHard.classList.add('active-diff');
        btnSelectEasy.classList.remove('active-diff');
      }
    }
  };

  if (btnSelectEasy) {
    btnSelectEasy.addEventListener('click', () => {
      Game.difficulty = 'EASY';
      savedSettings.difficulty = 'EASY';
      Utils.storage.set('SETTINGS', savedSettings);
      _updateDifficultyUI();
      Sound.playUIClick();
    });
  }

  if (btnSelectHard) {
    btnSelectHard.addEventListener('click', () => {
      Game.difficulty = 'HARD';
      savedSettings.difficulty = 'HARD';
      Utils.storage.set('SETTINGS', savedSettings);
      _updateDifficultyUI();
      Sound.playUIClick();
    });
  }

  const btnCloseDiff = document.getElementById('btn-close-diff');
  if (btnCloseDiff) {
    btnCloseDiff.addEventListener('click', () => hideModal('difficulty-modal'));
  }

  // How to Play Close
  const btnCloseHowToPlay = document.getElementById('btn-close-how-to-play');
  if (btnCloseHowToPlay) {
    btnCloseHowToPlay.addEventListener('click', () => hideModal('how-to-play-modal'));
  }

  // Settings Handlers
  const btnCloseSettings = document.getElementById('btn-close-settings');
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => hideModal('settings-modal'));
  }

  if (masterSlider) {
    masterSlider.addEventListener('input', (e) => {
      savedSettings.masterVol = Number(e.target.value);
      Sound.setVolumes(savedSettings.masterVol / 100, savedSettings.sfxVol / 100, savedSettings.musicVol / 100);
      Utils.storage.set('SETTINGS', savedSettings);
    });
  }

  if (sfxSlider) {
    sfxSlider.addEventListener('input', (e) => {
      savedSettings.sfxVol = Number(e.target.value);
      Sound.setVolumes(savedSettings.masterVol / 100, savedSettings.sfxVol / 100, savedSettings.musicVol / 100);
      Utils.storage.set('SETTINGS', savedSettings);
    });
  }

  if (musicSlider) {
    musicSlider.addEventListener('input', (e) => {
      savedSettings.musicVol = Number(e.target.value);
      Sound.setVolumes(savedSettings.masterVol / 100, savedSettings.sfxVol / 100, savedSettings.musicVol / 100);
      Utils.storage.set('SETTINGS', savedSettings);
    });
  }

  if (shakeToggle) {
    shakeToggle.addEventListener('change', (e) => {
      savedSettings.screenShake = e.target.checked;
      CONFIG.VISUALS.SCREEN_SHAKE_ENABLED = e.target.checked;
      Utils.storage.set('SETTINGS', savedSettings);
    });
  }

  if (fpsToggle) {
    fpsToggle.addEventListener('change', (e) => {
      savedSettings.showFps = e.target.checked;
      CONFIG.DEBUG.SHOW_FPS = e.target.checked;
      Utils.storage.set('SETTINGS', savedSettings);
    });
  }

  if (debugToggle) {
    debugToggle.addEventListener('change', (e) => {
      savedSettings.debugMode = e.target.checked;
      CONFIG.DEBUG.ENABLED = e.target.checked;
      CONFIG.DEBUG.DRAW_GRID = e.target.checked;
      CONFIG.DEBUG.DRAW_AI_PATHS = e.target.checked;
      CONFIG.DEBUG.DRAW_UTILITY_SCORES = e.target.checked;
      Utils.storage.set('SETTINGS', savedSettings);
    });
  }

  // Pause Menu Buttons
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');
  const btnPauseSettings = document.getElementById('btn-pause-settings');
  const btnMainMenu = document.getElementById('btn-main-menu');

  if (btnResume) btnResume.addEventListener('click', () => Game.resume());
  if (btnRestart) btnRestart.addEventListener('click', () => Game.restart());
  if (btnPauseSettings) btnPauseSettings.addEventListener('click', () => showModal('settings-modal'));
  if (btnMainMenu) btnMainMenu.addEventListener('click', () => Game.goToMenu());

  // Match End Buttons
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnEndMenu = document.getElementById('btn-end-menu');

  if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => Game.restart());
  if (btnEndMenu) btnEndMenu.addEventListener('click', () => Game.goToMenu());

  // Global Debug toggle key (` or F3)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote' || e.code === 'F3') {
      CONFIG.DEBUG.ENABLED = !CONFIG.DEBUG.ENABLED;
      CONFIG.DEBUG.DRAW_GRID = CONFIG.DEBUG.ENABLED;
      CONFIG.DEBUG.DRAW_AI_PATHS = CONFIG.DEBUG.ENABLED;
      CONFIG.DEBUG.DRAW_UTILITY_SCORES = CONFIG.DEBUG.ENABLED;
      if (debugToggle) debugToggle.checked = CONFIG.DEBUG.ENABLED;
    }
  });

  // Hover sound on buttons
  document.querySelectorAll('button, .interactive-card').forEach(elem => {
    elem.addEventListener('mouseenter', () => Sound.playUIHover());
  });
});
