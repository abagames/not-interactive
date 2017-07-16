import * as _ from 'lodash';
import * as pag from 'pag';
import * as ni from '../ni/index';
import * as g from '../g/index';

let game: g.Game;
let screen: g.Screen;
let random: g.Random;
let p: p5;

window.onload = () => {
  ni.init('redoil', init, update);
}

function init(_game: g.Game) {
  game = _game;
  screen = game.screen;
  random = game.random;
  p = game.p;
  new Wall(0, true);
  new Wall(screen.size.y - 10);
}

function update() {
  if (game.ticks < 60 * 13.8 && random.get() < game.getDifficulty() * 0.1) {
    new Oil();
  }
  if (game.ticks >= 10 && game.ticks < 250) {
    g.text.draw('PUT A CURSOR OR A FINGER ON THE SCREEN',
      5, 20, g.text.Align.left);
  }
  if (game.ticks >= 50 && game.ticks < 250) {
    g.text.draw('AVOID RED OILS',
      5, 40, g.text.Align.left);
  }
  if (game.ticks >= 90 && game.ticks < 250) {
    g.text.draw('GAME OVER SHOULD BE SELF-REPORTED',
      5, 60, g.text.Align.left);
  }
}

class Oil extends g.Actor {
  radius = 5;
  radiusVel = 0;

  constructor() {
    super({ destroyedEffect: 's' });
    this.type = this.collisionType = 'oil';
    this.pos.x = random.get(screen.size.x);
    this.radiusVel = random.get(0.1, 0.15 * game.getDifficulty());
    this.vel.y = 0.3 * game.getDifficulty();
  }

  update() {
    super.update();
    if (this.pos.y - this.radius > 10) {
      this.vel.y += 0.2 * game.getDifficulty();
      this.vel.y *= 0.98;
      if (this.pos.y + this.radius > screen.size.y - 10) {
        this.destroy();
      }
    } else {
      this.radius += this.radiusVel;
    }
    p.fill('red');
    p.ellipse(this.pos.x, this.pos.y,
      this.radius * 2, this.radius * 2);
  }
}

class Wall extends g.Actor {
  baseY: number;

  constructor(y, public isFalling = false) {
    super();
    this.pos.y = this.baseY = y;
  }

  update() {
    super.update();
    if (this.isFalling) {
      if (game.ticks > 60 * 12) {
        if (game.ticks > 60 * 14) {
          this.vel.y += 0.5;
        } else {
          const w = (game.ticks - 60 * 12) * 0.03;
          this.pos.y = this.baseY + random.get(w) * random.getPm();
        }
      }
    }
    p.fill('red');
    p.rect(0, this.pos.y, screen.size.x, 10);
  }
}
