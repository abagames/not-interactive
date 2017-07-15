import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as g from './game';

export const rotationNum = 16;

export interface ActorOptions {
  hasMuzzleEffect?: boolean;
  hasTrail?: boolean;
  destroyedEffect?: string;
}

export class Actor {
  pos = g.p.createVector();
  vel = g.p.createVector();
  prevPos = g.p.createVector();
  angle = 0;
  speed = 0;
  isAlive = true;
  priority = 1;
  ticks = 0;
  sprite: { pixels: pag.Pixel[][][], offset: p5.Vector }[] = [];
  type: string;
  collisionType: string;
  collision = g.p.createVector(8, 8);
  context: CanvasRenderingContext2D;
  modules: any[] = [];
  moduleNames: string[] = [];

  constructor(public options: ActorOptions = {}, public game: g.Game = g.game) {
    game.actorPool.add(this);
    this.context = game.screen.context;
    this.type = g.getClassName(this);
    new g.RemoveWhenInAndOut(this);
    this.init();
  }

  init() { }

  update() {
    if (this.options.hasMuzzleEffect && this.ticks === 0) {
      this.emitParticles(`m_${this.type}`, {}, this.game.particlePool);
    }
    if (this.options.hasTrail) {
      this.emitParticles(`t_${this.type}`, {}, this.game.particlePool);
    }
    this.prevPos.set(this.pos);
    this.pos.add(this.vel);
    this.pos.x += Math.cos(this.angle) * this.speed;
    this.pos.y += Math.sin(this.angle) * this.speed;
    if (this.sprite != null) {
      this.drawSprite();
    }
    _.forEach(this.modules, m => {
      if (m.isEnabled) {
        m.update();
      }
    });
    this.ticks++;
  }

  remove() {
    this.isAlive = false;
  }

  destroy() {
    if (this.options.destroyedEffect != null) {
      this.emitParticles(`${this.options.destroyedEffect}_${this.type}_d`,
        {},
        this.game.particlePool);
    }
    this.remove();
  }

  clearModules() {
    this.modules = [];
    this.moduleNames = [];
  }

  testCollision(type: string) {
    return _.filter<Actor>(this.game.actorPool.getByCollisionType(type), a =>
      a !== this &&
      Math.abs(this.pos.x - a.pos.x) < (this.collision.x + a.collision.x) / 2 &&
      Math.abs(this.pos.y - a.pos.y) < (this.collision.y + a.collision.y) / 2
    );
  }

  emitParticles(patternName: string, options: ppe.EmitOptions = {},
    pool: ppe.ParticlePool = null) {
    ppe.emit(patternName, this.pos.x, this.pos.y, this.angle, options, pool);
  }

  addSpritePixels(pixels: pag.Pixel[][][], offsetX = 0, offsetY = 0) {
    this.sprite.push({ pixels, offset: g.p.createVector(offsetX, offsetY) });
  }

  drawSprite(x: number = this.pos.x, y: number = this.pos.y) {
    _.forEach(this.sprite, s => {
      this.drawSpritePixels(s.pixels, x + s.offset.x, y + s.offset.y);
    });
  }

  drawSpritePixels(pixels: pag.Pixel[][][], x: number, y: number) {
    if (this.sprite.length <= 1) {
      pag.draw(this.context, pixels, x, y);
    } else {
      let a = this.angle;
      if (a < 0) {
        a = Math.PI * 2 + a % (Math.PI * 2);
      }
      const ri = Math.round(a / (Math.PI * 2 / rotationNum)) % rotationNum;
      pag.draw(this.context, pixels, x, y, ri);
    }
  }

  getModule(moduleName: string) {
    return this.modules[_.indexOf(this.moduleNames, moduleName)];
  }

  _addModule(module, insertIndexFromLast = 0) {
    const i = this.modules.length - insertIndexFromLast;
    this.modules.splice(i, 0, module);
    this.moduleNames.splice(i, 0, g.getClassName(module));
  }
}

export class Ship extends Actor {
  constructor(game: g.Game = g.game) {
    super({ hasTrail: true, destroyedEffect: 'u' }, game);
    this.type = this.collisionType = 'ship';
    this.addSpritePixels(pag.generate(['x x', ' xxx'], { hue: 0.2 }));
    this.collision.set(5, 5);
    const s = game.screen;
    this.pos.set(game.screen.size.x / 2, game.screen.size.y / 2);
    new g.DestroyWhenColliding(this, 'enemy', true);
    new g.DestroyWhenColliding(this, 'bullet', true);
  }
}

export class Enemy extends Actor {
  constructor(game: g.Game = g.game) {
    super({ hasTrail: true, destroyedEffect: 'e' }, game);
    this.type = this.collisionType = 'enemy';
    this.addSpritePixels(pag.generate([' xx', 'xxxx'], { hue: 0 }));
    new g.DestroyWhenColliding(this, 'shot', true);
  }
}

export class Shot extends Actor {
  constructor(actor, speed = 2, angle = null) {
    super({ hasTrail: true, hasMuzzleEffect: true }, actor.game);
    this.type = this.collisionType = 'shot';
    this.addSpritePixels(pag.generate(['xxx'], { hue: 0.4 }));
    this.pos.set(actor.pos);
    this.angle = angle == null ? actor.angle : angle;
    this.speed = speed;
    this.priority = 0.3;
    new g.DestroyWhenColliding(this, 'wall');
  }
}

export class Bullet extends Actor {
  constructor(actor, speed = 2, angle = null) {
    super({ hasTrail: true, hasMuzzleEffect: true }, actor.game);
    this.type = this.collisionType = 'bullet';
    this.addSpritePixels(pag.generate(['xxxx'], { hue: 0.1 }));
    this.pos.set(actor.pos);
    this.angle = angle == null ? actor.angle : angle;
    this.speed = speed;
    new g.DestroyWhenColliding(this, 'wall');
  }
}

export class Item extends Actor {
  constructor
    (pos: p5.Vector, vel: p5.Vector = null, public gravity: p5.Vector = null,
    game: g.Game = g.game) {
    super({ hasTrail: true, destroyedEffect: 's' }, game);
    this.type = this.collisionType = 'item';
    this.addSpritePixels(pag.generate([' o', 'ox'], { isMirrorX: true, hue: 0.25 }));
    this.pos.set(pos);
    if (vel != null) {
      this.vel = vel;
    }
    this.priority = 0.6;
    this.collision.set(10, 10);
  }

  update() {
    super.update();
    this.vel.add(this.gravity);
    this.vel.mult(0.99);
  }

  destroy() {
    super.destroy();
  }
}

export class Wall extends Actor {
  constructor(pos: p5.Vector, width = 8, height = 8, hue = 0.7, seed: number = null,
    game: g.Game = g.game) {
    super({}, game);
    const pw = Math.round(width / 4);
    const ph = Math.round(height / 4);
    const pt = [_.times(pw, () => 'o').join('')].concat(
      _.times(ph - 1, () => ['o'].concat(_.times(pw - 1, () => 'x')).join(''))
    );
    this.addSpritePixels(pag.generate(pt, { isMirrorX: true, hue, seed }));
    this.type = this.collisionType = 'wall';
    this.pos.set(pos);
    this.priority = 0.2;
    this.collision.set(width, height);
  }

  getCollisionInfo(actor) {
    let angle: number;
    const wa = Math.atan2(this.collision.y, this.collision.x);
    const a = g.Vector.getAngle(this.pos, actor.prevPos);
    if (a > Math.PI - wa || a <= -Math.PI + wa) {
      angle = 2;
    } else if (a > wa) {
      angle = 1;
    } else if (a > -wa) {
      angle = 0;
    } else {
      angle = 3;
    }
    return { wall: this, angle, dist: this.pos.dist(actor.prevPos) };
  }

  adjustPos(actor, angle: number) {
    switch (angle) {
      case 0:
        actor.pos.x = this.pos.x + (this.collision.x + actor.collision.x) / 2;
        break;
      case 1:
        actor.pos.y = this.pos.y + (this.collision.y + actor.collision.y) / 2;
        break;
      case 2:
        actor.pos.x = this.pos.x - (this.collision.x + actor.collision.x) / 2;
        break;
      case 3:
        actor.pos.y = this.pos.y - (this.collision.y + actor.collision.y) / 2;
        break;
    }
    return angle;
  }
}

export class Star extends Actor {
  color;

  constructor(minSpeedY = 0.5, maxSpeedY = 1.5, minSpeedX = 0, maxSpeedX = 0,
    game: g.Game = g.game) {
    super({}, game);
    this.pos.set(game.p.random(game.screen.size.x), game.p.random(game.screen.size.y));
    this.vel.set(game.p.random(minSpeedX, maxSpeedX), game.p.random(minSpeedY, maxSpeedY));
    this.clearModules();
    new g.WrapPos(this);
    const colorStrings = ['00', '7f', 'ff'];
    this.color = '#' + _.times(3, () => colorStrings[Math.floor(game.p.random(3))]).join('');
    this.priority = -1;
  }

  update() {
    super.update();
    this.game.p.fill(this.color);
    this.game.p.rect(Math.floor(this.pos.x), Math.floor(this.pos.y), 1, 1);
  }
}

export class Panel extends Actor {
  constructor(x, y, game: g.Game = g.game) {
    super({}, game);
    const pagOptions: any = { isMirrorX: true, value: 0.5, rotationNum: 1 };
    pagOptions.colorLighting = 0;
    this.addSpritePixels(pag.generate(['ooo', 'oxx', 'oxx'], pagOptions));
    this.pos.set(x, y);
    new g.WrapPos(this);
    this.priority = -1;
  }
}

export class Text extends Actor {
  constructor
    (public str: string, public duration = 30,
    public align: g.text.Align = null, game: g.Game = g.game) {
    super({}, game);
  }

  update() {
    super.update();
    this.vel.mult(0.9);
    g.text.draw(this.str, this.pos.x, this.pos.y, this.align, this.game);
    if (this.ticks >= this.duration) {
      this.remove();
    }
  }
}