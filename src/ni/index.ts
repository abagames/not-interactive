import * as _ from 'lodash';
import * as pag from 'pag';
import * as gcc from 'gcc';
import * as g from '../g/index';

let isCapturing = false;
//let isCapturing = true;
let seedRandom: g.Random;
let seed: number;

let game: g.Game;
let initFunc: Function;
let updateFunc: Function;

export function init(name: string,
  _initFunc: Function, _updateFunc: Function) {
  initFunc = _initFunc;
  updateFunc = _updateFunc;
  addButton('Generate new', () => initGameWithNewSeed());
  addButton('Retry', () => initGame());
  addBr();
  addBr();
  gcc.setOptions({
    capturingFps: 60,
    appFps: 60,
    durationSec: 0,
    scale: 1,
    quality: 10,
    downloadFileName: `${name}.gif`
  });
  g.init();
  seedRandom = new g.Random();
  if (isCapturing) {
    g.setUpdatingCountPerFrame(10);
  }
  initGameWithNewSeed();
}

function addButton(text: string, onclick: Function) {
  const button = document.createElement('button');
  button.textContent = text;
  (<any>button.onclick) = onclick;
  document.body.appendChild(button);
}

function addBr() {
  const br = document.createElement('br');
  document.body.appendChild(br);
}

function initGameWithNewSeed() {
  seed = seedRandom.getToMaxInt();
  initGame();
}

function initGame() {
  if (game != null) {
    game.remove();
  }
  game = new g.Game(250, 125, initFunc, update);
  const screen = game.screen;
  screen.canvas.style.width = `${screen.size.x * 2}px`;
  screen.canvas.style.height = `${screen.size.y * 2}px`;
  g.beginGames(seed);
}

function update() {
  updateFunc();
  if (isCapturing) {
    gcc.capture(g.game.screen.canvas);
    if (g.game.ticks >= 60 * 15) {
      isCapturing = false;
      game.remove();
      gcc.end();
    }
  }
}
