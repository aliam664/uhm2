/**
 * DOCKLANDS: PROTOCOL OSMOSIS
 * Pooled High-Performance Particle Engine & Floating Combat Text
 */

class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 2;
    this.startSize = 2;
    this.endSize = 0;
    this.color = '#ffffff';
    this.alpha = 1.0;
    this.life = 0;
    this.maxLife = 1.0;
    this.drag = 0.96;
    this.gravity = 0;
    this.type = 'spark'; // 'spark', 'smoke', 'ring', 'glow', 'line'
    this.radius = 0;
    this.maxRadius = 0;
    this.angle = 0;
    this.spin = 0;
  }

  reset(x, y, vx, vy, size, endSize, color, maxLife, type = 'spark', drag = 0.96, gravity = 0) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.startSize = size;
    this.endSize = endSize;
    this.color = color;
    this.alpha = 1.0;
    this.life = 0;
    this.maxLife = maxLife;
    this.drag = drag;
    this.gravity = gravity;
    this.type = type;
    this.radius = size;
    this.maxRadius = endSize;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 4;
  }

  update(dt) {
    if (!this.active) return false;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.active = false;
      return false;
    }

    const progress = this.life / this.maxLife;
    this.alpha = 1.0 - progress;

    if (this.type === 'ring') {
      this.radius = Utils.lerp(this.startSize, this.maxRadius, progress);
    } else {
      this.size = Utils.lerp(this.startSize, this.endSize, progress);
      this.vx *= Math.pow(this.drag, dt * 60);
      this.vy *= Math.pow(this.drag, dt * 60);
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.angle += this.spin * dt;
    }

    return true;
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.type === 'ring') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, (1.0 - this.life / this.maxLife) * 4);
      ctx.stroke();
    } else if (this.type === 'smoke') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'line') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
      ctx.stroke();
    } else {
      // Default spark/glow
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class FloatingText {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.color = '#ffffff';
    this.life = 0;
    this.maxLife = 0.8;
    this.vy = -50;
    this.scale = 1.0;
    this.isCritical = false;
  }

  reset(x, y, text, color = '#ffffff', isCritical = false, maxLife = 0.8) {
    this.active = true;
    this.x = x + (Math.random() - 0.5) * 20;
    this.y = y;
    this.text = text;
    this.color = color;
    this.isCritical = isCritical;
    this.life = 0;
    this.maxLife = maxLife;
    this.vy = isCritical ? -75 : -50;
    this.scale = isCritical ? 1.4 : 1.0;
  }

  update(dt) {
    if (!this.active) return false;
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.active = false;
      return false;
    }

    this.y += this.vy * dt;
    this.vy *= Math.pow(0.92, dt * 60);

    const progress = this.life / this.maxLife;
    if (progress < 0.2) {
      this.scale = Utils.lerp(0.5, this.isCritical ? 1.4 : 1.0, progress / 0.2);
    }

    return true;
  }

  draw(ctx) {
    if (!this.active) return;
    const progress = this.life / this.maxLife;
    const alpha = 1.0 - Math.pow(progress, 2);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${this.isCritical ? 'bold 18px' : 'bold 14px'} "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow outline
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(this.text, this.x, this.y);

    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);

    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.maxParticles = CONFIG.VISUALS.MAX_PARTICLES;
    this.maxFloatingTexts = CONFIG.VISUALS.MAX_FLOATING_TEXTS;

    // Ambient Rain/Fog particles
    this.ambientParticles = [];
    this._initAmbientParticles();

    // Pre-allocate pools
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(new Particle());
    }
    for (let i = 0; i < this.maxFloatingTexts; i++) {
      this.floatingTexts.push(new FloatingText());
    }
  }

  _initAmbientParticles() {
    for (let i = 0; i < 90; i++) {
      this.ambientParticles.push({
        x: Math.random() * CONFIG.MAP.WIDTH,
        y: Math.random() * CONFIG.MAP.HEIGHT,
        speed: 400 + Math.random() * 300,
        length: 12 + Math.random() * 10,
        alpha: 0.15 + Math.random() * 0.25
      });
    }
  }

  emit(x, y, vx, vy, size, endSize, color, maxLife, type = 'spark', drag = 0.96, gravity = 0) {
    if (!CONFIG.VISUALS.PARTICLES_ENABLED) return null;
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        this.particles[i].reset(x, y, vx, vy, size, endSize, color, maxLife, type, drag, gravity);
        return this.particles[i];
      }
    }
    return null;
  }

  emitHitSparks(x, y, count = 8, color = '#ffcc00') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2.5 + Math.random() * 2.5;
      const life = 0.15 + Math.random() * 0.25;
      this.emit(x, y, vx, vy, size, 0.5, color, life, 'line', 0.88, 50);
    }
  }

  emitDashTrail(x, y, color = '#00d0ff') {
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * 16;
      const offsetY = (Math.random() - 0.5) * 16;
      this.emit(x + offsetX, y + offsetY, 0, 0, 10, 0, color, 0.25, 'smoke', 0.95);
    }
  }

  emitShockwave(x, y, maxRadius = 180, color = '#00d0ff', duration = 0.45) {
    this.emit(x, y, 0, 0, 10, maxRadius, color, duration, 'ring');
    // Secondary inner ring
    this.emit(x, y, 0, 0, 5, maxRadius * 0.7, '#ffffff', duration * 0.8, 'ring');

    // Scatter sparks
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = 180 + Math.random() * 140;
      this.emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 3, 0.5, color, 0.35, 'spark', 0.92);
    }
  }

  emitExplosion(x, y, radius = 60, color = '#ff5500') {
    this.emit(x, y, 0, 0, 5, radius * 1.5, color, 0.4, 'ring');

    // Smoke
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius * 0.5);
      const speed = 40 + Math.random() * 70;
      this.emit(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        8 + Math.random() * 10,
        2,
        '#444a55',
        0.5 + Math.random() * 0.3,
        'smoke',
        0.92
      );
    }

    // Fire sparks
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 200;
      this.emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 3, 0.5, '#ffcc22', 0.35, 'spark', 0.90);
    }
  }

  emitCaptureBurst(x, y, color = '#00d0ff') {
    this.emit(x, y, 0, 0, 10, 150, color, 0.6, 'ring');
    this.emit(x, y, 0, 0, 20, 180, '#ffffff', 0.7, 'ring');

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 160 + Math.random() * 100;
      this.emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 4, 1, color, 0.55, 'line', 0.94);
    }
  }

  showFloatingText(x, y, text, color = '#ffffff', isCritical = false) {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      if (!this.floatingTexts[i].active) {
        this.floatingTexts[i].reset(x, y, text, color, isCritical);
        return;
      }
    }
  }

  update(dt) {
    // Update Particles
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        this.particles[i].update(dt);
      }
    }

    // Update Floating Texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      if (this.floatingTexts[i].active) {
        this.floatingTexts[i].update(dt);
      }
    }

    // Update Ambient Weather Particles
    if (CONFIG.VISUALS.DYNAMIC_WEATHER) {
      for (let i = 0; i < this.ambientParticles.length; i++) {
        const p = this.ambientParticles[i];
        p.y += p.speed * dt;
        p.x -= p.speed * 0.3 * dt; // Slanted rain

        if (p.y > CONFIG.MAP.HEIGHT) {
          p.y = -20;
          p.x = Math.random() * (CONFIG.MAP.WIDTH + 500);
        }
        if (p.x < 0) {
          p.x = CONFIG.MAP.WIDTH + 100;
        }
      }
    }
  }

  draw(ctx, camera) {
    // Draw Active Particles (culling with camera)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.active && (!camera || camera.isVisible(p.x, p.y, p.radius || p.size))) {
        p.draw(ctx);
      }
    }

    // Draw Floating Numbers
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (ft.active && (!camera || camera.isVisible(ft.x, ft.y, 40))) {
        ft.draw(ctx);
      }
    }

    // Draw Ambient Rain
    if (CONFIG.VISUALS.DYNAMIC_WEATHER && camera) {
      ctx.save();
      ctx.strokeStyle = 'rgba(180, 210, 240, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < this.ambientParticles.length; i++) {
        const p = this.ambientParticles[i];
        if (camera.isVisible(p.x, p.y, 50)) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.length * 0.3, p.y + p.length);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  clear() {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false;
    }
    for (let i = 0; i < this.floatingTexts.length; i++) {
      this.floatingTexts[i].active = false;
    }
  }
}

const Particles = new ParticleSystem();

if (typeof window !== 'undefined') {
  window.Particle = Particle;
  window.FloatingText = FloatingText;
  window.ParticleSystem = ParticleSystem;
  window.Particles = Particles;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Particle = Particle;
  globalThis.FloatingText = FloatingText;
  globalThis.ParticleSystem = ParticleSystem;
  globalThis.Particles = Particles;
}
