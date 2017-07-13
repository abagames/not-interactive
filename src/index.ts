import * as _ from 'lodash';
import * as gcc from 'gcc';
import * as g from './g/game';

window.onload = () => g.init(update);

let p: p5;
let isInitialized = false;
let isCaptured = false;

function init() {
  isInitialized = true;
  p = g.game.p;
  g.setUpdatingCountPerFrame(10);
  gcc.setOptions({
    capturingFps: 60,
    appFps: 60,
    durationSec: 0,
    scale: 2
  });
  const pl = new g.Player();
  pl.speed = 0.2;
}

function update() {
  if (!isInitialized) {
    init();
  }
  updateFrame();
  if (!isCaptured && g.game.ticks >= 300) {
    isCaptured = true;
    g.endGame();
    gcc.end();
  }
}

function updateFrame() {
  p.fill('white');
  p.ellipse(100, 50,
    Math.sin(g.game.ticks * 0.1) * 30, Math.cos(g.game.ticks * 0.2) * 20);
  if (!isCaptured) {
    gcc.capture(g.game.screen.canvas);
  }
}
