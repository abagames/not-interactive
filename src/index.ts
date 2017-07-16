import * as _ from 'lodash';
import * as pag from 'pag';
import * as ni from './ni/index';
import * as g from './g/index';

let game: g.Game;
let screen: g.Screen;
let random: g.Random;
let p: p5;

const addingInterval = 20;
let addingX: number;
let roadCenterY: number;
let roadWidth: number;
let roadCenterVelY: number;
let roadWidthVel: number;

window.onload = () => {
  ni.init('cartree', init, update);
}

function init(_game: g.Game) {
  game = _game;
  screen = game.screen;
  random = game.random;
  p = game.p;
  addingX = screen.size.x;
  roadCenterY = screen.size.y / 2;
  roadCenterVelY = 0;
  roadWidth = screen.size.y * 0.8;
  roadWidthVel = 0;
  scroll(screen.size.x, false);
}

function update() {
  scroll((game.getDifficulty() - 1) * 0.7 + 1);
  adjustRoad();
  if (game.ticks < 13.5 * 60 &&
    random.get() < game.getDifficulty() * game.getDifficulty() * 0.015) {
    addCar();
  }
  if (game.ticks === 60 * 14) {
    _.forEach('GOAL', (s, i) => {
      const t = new g.Text(s, 99999);
      t.pos.set(screen.size.x * 1.1, screen.size.y * (i * 0.1 + 0.3));
    });
  }
  if (game.ticks >= 10 && game.ticks < 250) {
    g.text.draw('PUT A CURSOR OR A FINGER ON THE SCREEN',
      5, 20, g.text.Align.left);
  }
  if (game.ticks >= 50 && game.ticks < 250) {
    g.text.draw('AVOID CARS AND TREES',
      5, 40, g.text.Align.left);
  }
  if (game.ticks >= 90 && game.ticks < 250) {
    g.text.draw('GAME OVER SHOULD BE SELF-REPORTED',
      5, 60, g.text.Align.left);
  }
}

function adjustRoad() {
  if (game.ticks > 60 * 13) {
    roadCenterY += (screen.size.y / 2 - roadCenterY) * 0.01;
    roadWidth += (screen.size.y * .9 - roadWidth) * 0.01;
  }
  roadCenterVelY += random.get(-0.02, 0.02);
  roadCenterY += roadCenterVelY;
  if ((roadCenterY - roadWidth / 2 < 0 && roadCenterVelY < 0) ||
    (roadCenterY + roadWidth / 2 > screen.size.y && roadCenterVelY > 0)) {
    roadCenterVelY *= -0.5;
  }
  roadWidthVel += random.get(-0.01, 0.01);
  roadWidth += roadWidthVel;
  if ((roadWidth < screen.size.y * 0.6 && roadWidthVel < 0) ||
    (roadWidth > screen.size.y * 0.9 && roadWidthVel > 0)) {
    roadWidthVel *= -0.5;
  }
}

function scroll(x: number, isAddingCar = true) {
  let leftX = x + (screen.size.x - addingX);
  while (leftX >= addingInterval) {
    const x = addingX + addingInterval * 1.2;
    addTrees(x, 0, roadCenterY - roadWidth / 2);
    addTrees(x, roadCenterY + roadWidth / 2, screen.size.y);
    addingX += addingInterval;
    leftX -= addingInterval;
  }
  game.scroll(-x);
  addingX -= x;
}

function addTrees(x: number, beginY: number, endY: number) {
  if (game.ticks >= 60 * 14) {
    return;
  }
  let y = beginY + random.get(addingInterval / 2) * random.getPm();
  endY += random.get(addingInterval / 2) * random.getPm();
  while (y < endY) {
    const t = new Tree();
    t.pos.set(x + random.get(addingInterval), y);
    y += addingInterval * random.get(0.8, 1.2);
  }
}

function addCar() {
  const c = new Car();
  c.pos.x = screen.size.x * random.get(1.1, 1.2);
  c.pos.y += roadCenterY + random.get(roadWidth * 0.4) * random.getPm();
  c.vel.x += random.get(1.0 - game.getDifficulty() * 0.5, 1.5);
  c.vel.y += random.get(-0.2, 0.2);
}

class Car extends g.Actor {
  constructor() {
    super({ hasTrail: false, destroyedEffect: 's' });
    this.type = this.collisionType = 'car';
    this.addSpritePixels(pag.generate(['xx xx', '', ''],
      { scale: 2, hue: 0.7, colorLighting: 0.1 }));
    this.addSpritePixels(pag.generate([' x x', '  xxx'],
      { scale: 2, hue: 0.2 }));
    this.collision.set(5, 5);
    new g.DestroyWhenColliding(this, 'tree');
    new g.DestroyWhenColliding(this, 'car', true);
  }
}

class Tree extends g.Actor {
  constructor() {
    super();
    this.type = this.collisionType = 'tree';
    this.addSpritePixels(pag.generate(['x', 'x', 'x'],
      { hue: 0.9, isMirrorX: false, isMirrorY: false }), 0, 4);
    this.addSpritePixels(pag.generate([' xxx', 'xxxxx', 'xxxxx', 'xxxxx', ' xxx'],
      { hue: 0.3, isMirrorY: false }), 0, -4);
    this.collision.set(10, 10);
    this.priority = 0.8;
  }
}
