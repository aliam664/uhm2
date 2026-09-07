/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * 2D Tactical Camera with Dynamic Zoom, Trauma Screen Shake, and Hit-Stop
 */

class Camera {
  constructor(viewportWidth = 1920, viewportHeight = 1080) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.x = 1300;
    this.y = 1000;
    this.targetX = 1300;
    this.targetY = 1000;

    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.zoomSpeed = 3.5;

    this.smoothFactor = 8.0; // Lerp responsiveness
    this.mouseLeadFactor = 0.18; // Tactical pan toward cursor

    // Screen Shake (Trauma Model)
    this.trauma = 0;
    this.traumaDecay = 1.6;
    this.maxShakeOffset = 24;
    this.maxShakeAngle = 0.035; // radians
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeAngle = 0;

    // Hit Stop (Micro-pause on impactful hits)
    this.hitStopDuration = 0;

    // Boundaries
    this.bounds = {
      minX: 0,
      minY: 0,
      maxX: CONFIG.MAP.WIDTH,
      maxY: CONFIG.MAP.HEIGHT
    };
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  addTrauma(amount) {
    if (!CONFIG.VISUALS.SCREEN_SHAKE_ENABLED) return;
    this.trauma = Utils.clamp(this.trauma + amount, 0, 1.0);
  }

  triggerHitStop(seconds = 0.04) {
    this.hitStopDuration = Math.max(this.hitStopDuration, seconds);
  }

  isHitStopped() {
    return this.hitStopDuration > 0;
  }

  update(dt, followTarget = null, mouseWorldPos = null) {
    // Process Hit Stop
    if (this.hitStopDuration > 0) {
      this.hitStopDuration -= dt;
      if (this.hitStopDuration < 0) this.hitStopDuration = 0;
    }

    if (followTarget) {
      let targetX = followTarget.x;
      let targetY = followTarget.y;

      // Mouse lead offset
      if (mouseWorldPos) {
        const dx = mouseWorldPos.x - followTarget.x;
        const dy = mouseWorldPos.y - followTarget.y;
        targetX += dx * this.mouseLeadFactor;
        targetY += dy * this.mouseLeadFactor;
      }

      this.targetX = targetX;
      this.targetY = targetY;

      // Dynamic zoom based on sprinting
      if (followTarget.isSprinting) {
        this.targetZoom = CONFIG.VIEWPORT.SPRINT_ZOOM;
      } else {
        this.targetZoom = CONFIG.VIEWPORT.BASE_ZOOM;
      }
    }

    // Smooth Lerp Position
    const lerpT = 1.0 - Math.exp(-this.smoothFactor * dt);
    this.x = Utils.lerp(this.x, this.targetX, lerpT);
    this.y = Utils.lerp(this.y, this.targetY, lerpT);

    // Smooth Lerp Zoom
    this.zoom = Utils.lerp(this.zoom, this.targetZoom, this.zoomSpeed * dt);

    // Clamp inside world bounds
    const halfViewW = (this.viewportWidth / (2 * this.zoom));
    const halfViewH = (this.viewportHeight / (2 * this.zoom));
    this.x = Utils.clamp(this.x, halfViewW, this.bounds.maxX - halfViewW);
    this.y = Utils.clamp(this.y, halfViewH, this.bounds.maxY - halfViewH);

    // Update Trauma Shake
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
      const shake = this.trauma * this.trauma; // Quadratic falloff
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
      this.shakeAngle = (Math.random() * 2 - 1) * this.maxShakeAngle * shake;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeAngle = 0;
    }
  }

  applyTransform(ctx) {
    ctx.save();
    ctx.translate(this.viewportWidth / 2 + this.shakeOffsetX, this.viewportHeight / 2 + this.shakeOffsetY);
    if (this.shakeAngle !== 0) {
      ctx.rotate(this.shakeAngle);
    }
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  restoreTransform(ctx) {
    ctx.restore();
  }

  screenToWorld(screenX, screenY) {
    const centeredX = screenX - (this.viewportWidth / 2 + this.shakeOffsetX);
    const centeredY = screenY - (this.viewportHeight / 2 + this.shakeOffsetY);
    return {
      x: this.x + centeredX / this.zoom,
      y: this.y + centeredY / this.zoom
    };
  }

  worldToScreen(worldX, worldY) {
    const centeredX = (worldX - this.x) * this.zoom;
    const centeredY = (worldY - this.y) * this.zoom;
    return {
      x: centeredX + this.viewportWidth / 2 + this.shakeOffsetX,
      y: centeredY + this.viewportHeight / 2 + this.shakeOffsetY
    };
  }

  isVisible(worldX, worldY, radius = 50) {
    const margin = radius + 60;
    const halfW = (this.viewportWidth / 2) / this.zoom + margin;
    const halfH = (this.viewportHeight / 2) / this.zoom + margin;
    return (
      worldX >= this.x - halfW &&
      worldX <= this.x + halfW &&
      worldY >= this.y - halfH &&
      worldY <= this.y + halfH
    );
  }
}

if (typeof window !== 'undefined') {
  window.Camera = Camera;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Camera = Camera;
}
