import * as _ from 'lodash';
import * as pag from 'pag';
import * as ni from '../ni/index';
import * as g from '../g/index';

let game: g.Game;
let screen: g.Screen;
let random: g.Random;
let p: p5;
let answerWho: Who;
let answerTicks: number;

window.onload = () => {
  ni.init('findwho', init, update, 60 * 12);
}

function init(_game: g.Game) {
  game = _game;
  screen = game.screen;
  random = game.random;
  p = game.p;
  answerWho = new Who();
  answerWho.clearModules();
  answerWho.pos.x = -999;
  answerWho.vel.x = 0;
  answerTicks = random.getInt(60 * 5, 60 * 9);
}

function update() {
  if (game.ticks > 100 && game.ticks < 9 * 60 &&
    random.get() < 0.07 * game.getDifficulty()) {
    new Who();
  }
  if (game.ticks === answerTicks) {
    answerWho.setPosVel();
    new g.RemoveWhenInAndOut(answerWho);
  }
  if (game.ticks > 10 && game.ticks < 100) {
    g.text.draw('FIND', 5, 70, g.text.Align.left);
    answerWho.pos.set(50, 70);
  }
  if (game.ticks === 100) {
    answerWho.pos.set(-999, 0);
  }
}

const colorPattern = ['red', 'green', 'blue', 'cyan', 'magenta', 'white'];
class Who extends g.Actor {
  colors: string[];
  legTicks = 0;
  legTicksSpeed: number;
  armAngle: number;
  legAngle: number;
  bodySize: p5.Vector;

  constructor() {
    super();
    this.setForm();
    this.setPosVel();
  }

  setForm() {
    this.colors = _.times(4, () => random.select(colorPattern));
    this.legTicksSpeed = random.get(0.05, 0.2);
    this.bodySize = p.createVector(random.get(5, 15), random.get(10, 30));
    this.armAngle = random.get(0.5, 1.2);
    this.legAngle = random.get(0.8, 1.5);
  }

  setPosVel() {
    const way = random.getPm();
    this.pos.y = random.get
      (this.bodySize.y * 2, screen.size.y - this.bodySize.y * 2);
    this.pos.x = way < 0 ? screen.size.x * 1.1 : -screen.size.x * 0.1;
    this.vel.x = this.legTicksSpeed * this.legAngle * this.bodySize.y;
    this.vel.x = p.constrain(this.vel.x, 3, 8);
    this.vel.x *= way;
  }

  update() {
    super.update();
    this.draw();
  }

  draw() {
    p.fill(this.colors[0]);
    p.rect(this.pos.x - this.bodySize.x / 2, this.pos.y - this.bodySize.y,
      this.bodySize.x, this.bodySize.y * 0.2);
    p.fill('yellow');
    p.rect(this.pos.x - this.bodySize.x / 2, this.pos.y - this.bodySize.y * 0.8,
      this.bodySize.x, this.bodySize.y * 0.3);
    this.legTicks += this.legTicksSpeed;
    const aa = Math.sin(this.legTicks) * this.armAngle;
    const la = Math.sin(this.legTicks) * this.legAngle;
    this.drawArmLeg(this.pos.x, this.pos.y - this.bodySize.y * 0.2,
      this.bodySize.x * 0.4, this.bodySize.y * 0.7, aa, this.colors[2]);
    this.drawArmLeg(this.pos.x, this.pos.y + this.bodySize.y * 0.3,
      this.bodySize.x * 0.5, this.bodySize.y, -la, this.colors[3]);
    p.fill(this.colors[1]);
    p.rect(this.pos.x - this.bodySize.x / 2, this.pos.y - this.bodySize.y / 2,
      this.bodySize.x, this.bodySize.y);
    this.drawArmLeg(this.pos.x, this.pos.y + this.bodySize.y * 0.3,
      this.bodySize.x * 0.5, this.bodySize.y, la, this.colors[3]);
    this.drawArmLeg(this.pos.x, this.pos.y - this.bodySize.y * 0.2,
      this.bodySize.x * 0.4, this.bodySize.y * 0.7, -aa, this.colors[2]);
  }

  drawArmLeg(x, y, w, h, a, c) {
    p.fill(c);
    p.push();
    p.translate(x, y);
    p.rotate(a);
    p.rect(-w / 2, -w / 2, w, h);
    p.pop();
  }
}
