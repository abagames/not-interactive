import * as _ from 'lodash';
import * as pag from 'pag';
import * as ni from '../ni/index';
import * as g from '../g/index';

let game: g.Game;
let screen: g.Screen;
let random: g.Random;
let p: p5;

window.onload = () => {
  ni.init('reflas', init, update);
}

function init(_game: g.Game) {
  game = _game;
  screen = game.screen;
  random = game.random;
  p = game.p;
  new Turret();
  let x = 0;
  while (x < screen.size.x) {
    x = addWalls(x, null, 5);
  }
  x = 0;
  while (x < screen.size.x) {
    x = addWalls(x, null, screen.size.y - 5);
  }
  let y = 0;
  while (y < screen.size.y) {
    y = addWalls(y, 5, null);
  }
  y = 0;
  while (y < screen.size.y) {
    y = addWalls(y, screen.size.x - 5, null);
  }
}

function addWalls(v, x, y) {
  const w = random.get(40, 80);
  if (x == null) {
    new Wall(p.createVector(v + w / 2, y), w, 10);
  } else {
    new Wall(p.createVector(x, v + w / 2), 10, w);
  }
  return v + w + 40;
}

function update() {
  showMessage('PUT A CURSOR OR A FINGER ON THE SCREEN', 20, 10);
  showMessage('AVOID LASERS', 40, 50);
  showMessage('GAME OVER SHOULD BE SELF-REPORTED', 60, 90);
}

function showMessage
  (message: string, y: number, from: number, to: number = 250) {
  if (game.ticks >= from && game.ticks < to) {
    g.text.draw(message, 20, y, g.text.Align.left);
  }
}

class Turret extends g.Actor {
  firingTicks = -30;
  firingCount = 0;

  constructor() {
    super({ destroyedEffect: 'e' });
    this.addSpritePixels(pag.generate([' x', 'xx'], { isMirrorX: true }));
    this.addSpritePixels(pag.generate(['    xx']));
    this.pos.set(screen.size.x / 2, screen.size.y / 2);
    this.angle = random.get(p.TWO_PI);
  }

  update() {
    super.update();
    if (game.ticks > 60 * 13) {
      if (game.ticks % 2 == 0) {
        this.angle += game.getDifficulty() * 0.5;
      }
      new Laser(this.angle);
      if (game.ticks > 60 * 14) {
        this.destroy();
      }
      return;
    }
    this.firingTicks++;
    if (this.firingTicks >= 0) {
      if (this.firingTicks % Math.floor(5 / game.getDifficulty() + 1) === 0) {
        new Laser(this.angle);
        this.firingCount++;
      }
      if (this.firingCount > 2 && random.get() < 0.08 * game.getDifficulty()) {
        this.firingTicks = -Math.floor(random.getInt(5, 15) / Math.sqrt(game.getDifficulty()));
        this.firingCount = 0;
      }
    } else {
      this.angle += game.getDifficulty() * 0.2;
    }
  }
}

class Laser extends g.Actor {
  constructor(angle) {
    super();
    this.addSpritePixels(pag.generate(['xxx'], { isMirrorY: false }));
    this.pos.set(screen.size.x / 2, screen.size.y / 2);
    g.Vector.addAngle(this.vel, angle, game.getDifficulty() * 2);
    this.collision.set(12);
    new g.CollideToWall(this);
  }

  update() {
    this.angle = g.Vector.getAngle(this.vel);
    super.update();
  }
}

class Wall extends g.Wall {
  update() {
    super.update();
    if (game.ticks > 60 * 14) {
      this.options.destroyedEffect = 'e';
      this.destroy();
    }
  }
}
