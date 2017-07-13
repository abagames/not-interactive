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
let updateFunc: Function;
let updatingCountPerFrame = 1;
let isDebugEnabled = false;

export function init(_updateFunc: Function, isCreatingDefaultGame = true) {
  updateFunc = _updateFunc;
  pag.setDefaultOptions({
    isMirrorY: true,
    rotationNum,
    scale: 2
  });
  //limitColors();
  new p5((_p: p5) => {
    p = _p;
    p.setup = () => {
      p.createCanvas(0, 0);
      text.init();
      seedRandom = new Random();
      if (isCreatingDefaultGame) {
        game = new Game();
      }
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

export function endGame() {
  _.forEach(games, g => {
    g.endGame();
  });
  p.draw = null;
}

export function beginGame() {
  clearGameStatus();
  const seed = seedRandom.getInt(9999999);
  _.forEach(games, g => {
    g.beginGame(seed);
  });
}

function clearGameStatus() {
  ppe.clear();
}

function update() {
  _.times(updatingCountPerFrame, i => {
    _.forEach(games, g => {
      g.update();
    });
    updateFunc();
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

  constructor(width = 250, height = 125) {
    this.random = new Random();
    new p5((_p: p5) => {
      this.p = _p;
      _p.setup = () => {
        this.screen = new Screen(_p, width, height);
        this.particlePool = new ppe.ParticlePool(this.screen.canvas);
      };
    });
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

  endGame() {
    this.p.draw = null;
  }

  setSeeds(seed: number) {
    pag.setSeed(seed);
    ppe.setSeed(seed);
    ppe.reset();
  }

  beginGame(seed: number) {
    this.clearGameStatus();
    this.random.setSeed(seed);
  }

  clearGameStatus() {
    this.clearModules();
    this.actorPool.clear();
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
    this.ticks++;
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
}
