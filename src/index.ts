import * as _ from 'lodash';
import * as gcc from 'gcc';
import * as g from './g/game';

window.onload = () => g.init(update);

let p: p5;
let isInitialized = false;
let isCapturing = false;

function init() {
  isInitialized = true;
  p = g.game.p;
  if (isCapturing) {
    gcc.setOptions({
      capturingFps: 60,
      appFps: 60,
      durationSec: 0,
      scale: 2,
      quality: 1
    });
    g.setUpdatingCountPerFrame(10);
  }
  const pl = new g.Ship();
  pl.speed = 0.33;
}

function update() {
  if (!isInitialized) {
    init();
  }
  updateFrame();
  if (isCapturing && g.game.ticks >= 300) {
    isCapturing = false;
    g.endGame();
    gcc.end();
  }
}

function updateFrame() {
  if (!isCapturing) {
    gcc.capture(g.game.screen.canvas);
  }
}
