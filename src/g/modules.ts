import * as _ from 'lodash';
import * as g from './index';
import * as ppe from 'ppe';

class Module {
  game: g.Game;
  actor: g.Actor;
  isEnabled = true;

  constructor(actorOrGame: g.Actor | g.Game = null, public insertIndexFromLast = 0) {
    if (actorOrGame != null) {
      this.add(actorOrGame);
    }
  }

  add(actorOrGame: g.Actor | g.Game) {
    actorOrGame._addModule(this, this.insertIndexFromLast);
    if (actorOrGame instanceof g.Actor) {
      this.game = actorOrGame.game;
      this.actor = actorOrGame;
    } else {
      this.game = actorOrGame;
    }
  }
}

export class DoInterval extends Module {
  ticks: number;
  isChangedByDifficulty = false;
  from: number;
  to: number;
  isModulesOrFuncEnabled = false;

  constructor(actorOrGame: g.Actor | g.Game,
    public modulesOrFunc: Module[] | Function,
    public interval = 60,
    options: {
      from?: number, to?: number,
      isChangedByDifficulty?: boolean, isStartRandomized?: boolean
    } = {}) {
    super(actorOrGame, modulesOrFunc instanceof Function ? 0 : modulesOrFunc.length);
    this.ticks = options.isStartRandomized ? this.game.random.getInt(interval) : interval;
    this.isChangedByDifficulty = options.isChangedByDifficulty;
    if (options.from != null) {
      this.from = options.from;
      this.to = options.to;
    }
  }

  update() {
    this.ticks--;
    this.isModulesOrFuncEnabled = false;
    let itv = this.interval;
    if (this.isChangedByDifficulty) {
      itv /= this.game.getDifficulty();
    }
    if (this.ticks <= 0) {
      if (this.from == null) {
        this.isModulesOrFuncEnabled = true;
      }
      this.ticks += itv;
    } else {
      if (this.from != null) {
        const tr = this.ticks / itv;
        if (tr > this.from && tr <= this.to) {
          this.isModulesOrFuncEnabled = true;
        }
      }
    }
    if (this.modulesOrFunc instanceof Function) {
      if (this.isModulesOrFuncEnabled) {
        this.modulesOrFunc();
      }
    } else {
      _.forEach(this.modulesOrFunc, m => {
        m.isEnabled = this.isModulesOrFuncEnabled;
      });
    }
  }
}

export class DoCond extends Module {
  isModulesOrFuncEnabled = false;

  constructor(actorOrGame: g.Actor | g.Game,
    public modulesOrFunc: Module[] | Function, public cond: Function) {
    super(actorOrGame, modulesOrFunc instanceof Function ? 0 : modulesOrFunc.length);
  }

  update() {
    this.isModulesOrFuncEnabled = this.cond();
    if (this.modulesOrFunc instanceof Function) {
      if (this.isModulesOrFuncEnabled) {
        this.modulesOrFunc();
      }
    } else {
      _.forEach(this.modulesOrFunc, m => {
        m.isEnabled = this.isModulesOrFuncEnabled;
      });
    }
  }
}

export class RemoveWhenOut extends Module {
  constructor(actor: g.Actor, padding = 8,
    public paddingRight: number = null, public paddingBottom: number = null,
    public paddingLeft: number = null, public paddingTop: number = null) {
    super(actor);
    if (this.paddingRight == null) {
      this.paddingRight = padding;
    }
    if (this.paddingBottom == null) {
      this.paddingBottom = padding;
    }
    if (this.paddingLeft == null) {
      this.paddingLeft = padding;
    }
    if (this.paddingTop == null) {
      this.paddingTop = padding;
    }
  }

  update() {
    if (!g.isIn(this.actor.pos.x, -this.paddingLeft,
      this.actor.game.screen.size.x + this.paddingRight) ||
      !g.isIn(this.actor.pos.y, -this.paddingTop,
        this.actor.game.screen.size.y + this.paddingBottom)) {
      this.actor.remove();
    }
  }
}

export class RemoveWhenInAndOut extends RemoveWhenOut {
  isIn = false;
  paddingOuter = 64;

  constructor(actor: g.Actor, padding = 8,
    paddingRight: number = null, paddingBottom: number = null,
    paddingLeft: number = null, paddingTop: number = null) {
    super(actor, padding, paddingRight, paddingBottom, paddingLeft, paddingTop);
  }

  update() {
    if (this.isIn) {
      return super.update();
    }
    if (g.isIn(this.actor.pos.x, -this.paddingLeft,
      this.actor.game.screen.size.x + this.paddingRight) &&
      g.isIn(this.actor.pos.y, -this.paddingTop,
        this.actor.game.screen.size.y + this.paddingBottom)) {
      this.isIn = true;
    }
    if (!g.isIn(this.actor.pos.x, -this.paddingOuter,
      this.actor.game.screen.size.x + this.paddingOuter) ||
      !g.isIn(this.actor.pos.y, -this.paddingOuter,
        this.actor.game.screen.size.y + this.paddingOuter)) {
      this.actor.remove();
    }
  }
}

export class WrapPos extends Module {
  constructor(actor: g.Actor, public padding = 8) {
    super(actor);
  }

  update() {
    this.actor.pos.x = g.wrap(this.actor.pos.x,
      -this.padding, this.actor.game.screen.size.x + this.padding);
    this.actor.pos.y = g.wrap(this.actor.pos.y,
      -this.padding, this.actor.game.screen.size.y + this.padding);
  }
}

export class MoveSin extends Module {
  prop;
  angleProp;

  constructor
    (actor: g.Actor, prop: string,
    public amplitude = 48, public speed = 0.1, startAngle = 0) {
    super(actor);
    this.prop = getPropValue(actor, prop);
    this.angleProp = getPropValue(actor, `movSin.angle.${prop}`, true);
    this.angleProp.value[this.angleProp.name] = startAngle;
  }

  update() {
    const pa = this.angleProp.value[this.angleProp.name];
    this.angleProp.value[this.angleProp.name] += this.speed;
    this.prop.value[this.prop.name] +=
      (Math.sin(this.angleProp.value[this.angleProp.name]) - Math.sin(pa)) * this.amplitude;
  }
}

export class MoveRoundTrip extends Module {
  prop;
  center: number;
  vel: number;

  constructor
    (actor: g.Actor, prop: string,
    public width = 48, public speed = 1, startVel = 1) {
    super(actor);
    this.prop = getPropValue(actor, prop);
    this.center = this.prop.value[this.prop.name];
    this.vel = startVel;
  }

  update() {
    this.prop.value[this.prop.name] += this.vel * this.speed;
    if ((this.vel > 0 && this.prop.value[this.prop.name] > this.center + this.width) ||
      (this.vel < 0 && this.prop.value[this.prop.name] < this.center - this.width)) {
      this.vel *= -1;
      this.prop.value[this.prop.name] += this.vel * this.speed * 2;
    }
  }
}

export class MoveTo extends Module {
  targetPos = g.p.createVector();

  constructor
    (actor: g.Actor, public ratio = 0.1) {
    super(actor);
  }

  update() {
    this.actor.pos.x += (this.targetPos.x - this.actor.pos.x) * this.ratio;
    this.actor.pos.y += (this.targetPos.y - this.actor.pos.y) * this.ratio;
  }
}

export class AbsorbPos extends Module {
  absorbingTicks = 0;

  constructor(actor: g.Actor, public type: string = 'player', public dist = 32) {
    super(actor);
  }

  update() {
    const absorbingTos = this.actor.game.actorPool.get(this.type);
    if (absorbingTos.length > 0) {
      const to = absorbingTos[0];
      if (this.absorbingTicks > 0) {
        const r = this.absorbingTicks * 0.01;
        this.actor.pos.x += (to.pos.x - this.actor.pos.x) * r;
        this.actor.pos.y += (to.pos.y - this.actor.pos.y) * r;
        this.absorbingTicks++;
      } else if (this.actor.pos.dist(to.pos) < this.dist) {
        this.absorbingTicks = 1;
      }
    }
  }
}

export class DestroyWhenColliding extends Module {
  constructor(actor: g.Actor,
    public type: string,
    public isDestroyingOther = false) {
    super(actor);
  }

  update() {
    const as = this.actor.testCollision(this.type);
    if (as.length > 0) {
      this.actor.destroy();
      if (this.isDestroyingOther) {
        _.forEach(as, a => {
          a.destroy();
        });
      }
    }
  }
}

export class LimitInstances {
  constructor(actor: g.Actor, count = 1) {
    if (actor.game.actorPool.get(actor.type).length > count) {
      actor.remove();
    }
  }
}

export class HaveGravity extends Module {
  velocity = 0.01;

  constructor(actor: g.Actor, public mass = 0.1) {
    super(actor);
  }

  update() {
    _.forEach(this.actor.game.actorPool.getByModuleName('HaveGravity'), a => {
      if (a === this.actor) {
        return;
      }
      const r = g.wrap(a.pos.dist(this.actor.pos), 1, 999) * 0.1;
      const v = (a.getModule('HaveGravity').mass * this.mass) / r / r /
        this.mass * this.velocity;
      const an = g.Vector.getAngle(this.actor.pos, a.pos);
      g.Vector.addAngle(this.actor.vel, an, v);
    });
  }
}

export class CollideToWall extends Module {
  velRatio = 1;
  isDestroying = false;

  constructor(actor: g.Actor, options: { velRatio?: number, isDestroying?: boolean } = {}) {
    super(actor);
    if (options.velRatio != null) {
      this.velRatio = options.velRatio;
    }
    if (options.isDestroying != null) {
      this.isDestroying = options.isDestroying;
    }
  }

  update() {
    let collisionInfo: any = { dist: 999 };
    _.forEach(this.actor.testCollision('wall'), (w: g.Wall) => {
      const ci = w.getCollisionInfo(this.actor);
      if (ci.dist < collisionInfo.dist) {
        collisionInfo = ci;
      }
    });
    if (collisionInfo.wall == null) {
      return;
    }
    collisionInfo.wall.adjustPos(this.actor, collisionInfo.angle);
    if (collisionInfo.angle === 0 || collisionInfo.angle === 2) {
      this.actor.vel.x *= -1;
    }
    if (collisionInfo.angle === 1 || collisionInfo.angle === 3) {
      this.actor.vel.y *= -1;
    }
    if (this.isDestroying) {
      collisionInfo.wall.destroy();
    }
  }
}

function getPropValue(obj, prop: string, isAdding = false) {
  let value = obj;
  let name;
  const ps = prop.split('.');
  _.forEach(ps, (p, i) => {
    if (i < ps.length - 1) {
      if (isAdding && !value.hasOwnProperty(p)) {
        value[p] = {};
      }
      value = value[p];
    } else {
      name = p;
    }
  });
  return { value, name };
}
