import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';

import { Actor, Text, rotationNum } from './actor';
import Random from './random';
import * as text from './text';
import * as debug from './debug';
import * as util from './util';
export { Random, text, debug };
export * from './util';
export * from './actor';
export * from './modules';

declare const require: any;
export const p5 = require('p5');
export let p: p5;
export let games: Game[] = [];
export let game: Game;
let seedRandom: Random;
let updatingCountPerFrame = 1;
let isDebugEnabled = false;

export function init() {
  pag.setDefaultOptions({
    isMirrorY: true,
    rotationNum,
    scale: 3
  });
  //limitColors();
  new p5((_p: p5) => {
    p = _p;
    p.setup = () => {
      p.createCanvas(0, 0);
      text.init();
      seedRandom = new Random();
    };
    p.draw = update;
  });
}

function limitColors() {
  pag.setDefaultOptions({
    isLimitingColors: true
  });
  ppe.setOptions({
    isLimitingColors: true
  });
}

export function enableDebug(_onSeedChangedFunc = null) {
  //onSeedChangedFunc = _onSeedChangedFunc;
  debug.initSeedUi(this.setSeeds);
  debug.enableShowingErrors();
  isDebugEnabled = true;
}

export function setUpdatingCountPerFrame(c: number) {
  updatingCountPerFrame = c;
}

export function beginGames(seed: number = null) {
  if (seed == null) {
    seed = seedRandom.getInt(9999999);
  }
  setSeeds(seed);
  _.forEach(games, g => {
    g.beginGame(seed);
  });
}

function setSeeds(seed: number) {
  pag.setSeed(seed);
  ppe.setSeed(seed);
  ppe.reset();
}

function update() {
  _.times(updatingCountPerFrame, i => {
    _.forEach(games, g => {
      g.update();
    });
  });
}

export class Game {
  p: p5;
  actorPool = new ActorPool();
  particlePool: ppe.ParticlePool;
  screen: Screen;
  ticks = 0;
  random: Random;
  modules = [];

  constructor(width: number, height: number,
    public initFunc: Function = null, public updateFunc: Function = null) {
    this.random = new Random();
    new p5((_p: p5) => {
      this.p = _p;
      _p.setup = () => {
        this.screen = new Screen(_p, width, height);
        this.particlePool = new ppe.ParticlePool(this.screen.canvas);
      };
    });
    if (games.length <= 0) {
      game = this;
    }
    games.push(this);
  }

  clearModules() {
    this.modules = [];
  }

  _addModule(module, insertIndexFromLast = 0) {
    this.modules.splice(this.modules.length - insertIndexFromLast, 0, module);
  }

  getDifficulty() {
    return util.getDifficulty(this);
  }

  beginGame(seed: number) {
    this.clearGameStatus();
    this.random.setSeed(seed);
    if (this.initFunc != null) {
      this.initFunc(this);
    }
  }

  remove() {
    _.remove(games, g => g === this);
    this.p.draw = null;
    this.screen.remove();
  }

  clearGameStatus() {
    this.clearModules();
    this.actorPool.clear();
    this.particlePool.clear();
    this.ticks = 0;
  }

  update() {
    this.screen.clear();
    _.forEach(this.modules, m => {
      if (m.isEnabled) {
        m.update();
      }
    });
    this.actorPool.updateLowerZero();
    ppe.update();
    this.actorPool.update();
    if (this.updateFunc != null) {
      this.updateFunc();
    }
    this.ticks++;
  }

  scroll(x: number, y: number = 0) {
    _.forEach(this.actorPool.actors, a => {
      a.pos.x += x;
      a.pos.x += y;
    });
    _.forEach(this.particlePool.getParticles(), p => {
      p.pos.x += x;
      p.pos.y += y;
    });
  }
}

export class ActorPool {
  actors: Actor[] = [];

  add(actor) {
    this.actors.push(actor);
  }

  clear() {
    this.actors = [];
  }

  updateLowerZero() {
    _.sortBy(this.actors, 'priority');
    this.updateSorted(true);
  }

  update() {
    this.updateSorted();
  }

  updateSorted(isLowerZero = false) {
    for (let i = 0; i < this.actors.length;) {
      const a = this.actors[i];
      if (isLowerZero && a.priority >= 0) {
        return;
      }
      if (!isLowerZero && a.priority < 0) {
        i++;
        continue;
      }
      if (a.isAlive !== false) {
        a.update();
      }
      if (a.isAlive === false) {
        this.actors.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  get(type: string = null) {
    return type == null ? this.actors :
      _.filter<Actor>(this.actors, a => a.type === type);
  }

  getByModuleName(moduleName: string) {
    return _.filter<Actor>(this.actors, a => _.indexOf(a.moduleNames, moduleName) >= 0);
  }

  getByCollisionType(collisionType: string) {
    return _.filter<Actor>(this.actors, a => a.collisionType == collisionType);
  }
}

export class Screen {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  size: p5.Vector;

  constructor(public p: p5,
    width: number, height: number) {
    this.size = p.createVector(width, height);
    const pCanvas = this.p.createCanvas(width, height);
    this.canvas = pCanvas.canvas;
    this.context = this.canvas.getContext('2d');
    this.p.noStroke();
    this.p.noSmooth();
  }

  clear() {
    this.p.background(0);
  }

  remove() {
    document.body.removeChild(this.canvas);
  }
}
