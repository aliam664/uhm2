/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Input System (Keyboard, Mouse, Rebinding & Screen-to-World Translation)
 */

class InputManager {
  constructor() {
    this.keys = {};
    this.justPressedKeys = {};
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      leftDown: false,
      rightDown: false,
      leftJustPressed: false,
      rightJustPressed: false
    };

    this.bindings = {
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
    };

    this.canvas = null;
    this._initialized = false;
  }

  init(canvas) {
    if (this._initialized) return;
    this.canvas = canvas;

    // Load custom keybindings if available
    const savedBindings = Utils.storage.get('KEYBINDINGS', null);
    if (savedBindings) {
      this.bindings = Object.assign({}, this.bindings, savedBindings);
    }

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.justPressedKeys[e.code] = true;
      }
      this.keys[e.code] = true;

      // Prevent default scrolling for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Resume sound on user interaction
      if (window.Sound) Sound.resume();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.justPressedKeys[e.code] = false;
    });

    // Mouse Listeners
    window.addEventListener('mousemove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    window.addEventListener('mousedown', (e) => {
      if (window.Sound) Sound.resume();
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.mouse.leftJustPressed = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.mouse.rightJustPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = false;
      } else if (e.button === 2) {
        this.mouse.rightDown = false;
      }
    });

    // Prevent context menu on game canvas
    if (this.canvas) {
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    window.addEventListener('blur', () => {
      this.reset();
    });

    this._initialized = true;
  }

  updateWorldCoordinates(camera) {
    if (!camera) return;
    const worldPos = camera.screenToWorld(this.mouse.x, this.mouse.y);
    this.mouse.worldX = worldPos.x;
    this.mouse.worldY = worldPos.y;
  }

  endFrame() {
    this.justPressedKeys = {};
    this.mouse.leftJustPressed = false;
    this.mouse.rightJustPressed = false;
  }

  reset() {
    this.keys = {};
    this.justPressedKeys = {};
    this.mouse.leftDown = false;
    this.mouse.rightDown = false;
    this.mouse.leftJustPressed = false;
    this.mouse.rightJustPressed = false;
  }

  isActionActive(action) {
    const codes = this.bindings[action];
    if (!codes) return false;
    return codes.some(code => !!this.keys[code]);
  }

  isActionJustPressed(action) {
    const codes = this.bindings[action];
    if (!codes) return false;
    return codes.some(code => !!this.justPressedKeys[code]);
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.isActionActive('MOVE_UP')) dy -= 1;
    if (this.isActionActive('MOVE_DOWN')) dy += 1;
    if (this.isActionActive('MOVE_LEFT')) dx -= 1;
    if (this.isActionActive('MOVE_RIGHT')) dx += 1;

    return Utils.normalize(dx, dy);
  }

  rebindKey(action, keyCode) {
    if (this.bindings[action]) {
      this.bindings[action] = [keyCode];
      Utils.storage.set('KEYBINDINGS', this.bindings);
    }
  }
}

const Input = new InputManager();

if (typeof window !== 'undefined') {
  window.InputManager = InputManager;
  window.Input = Input;
}
if (typeof globalThis !== 'undefined') {
  globalThis.InputManager = InputManager;
  globalThis.Input = Input;
}
