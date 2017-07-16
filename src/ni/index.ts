import * as _ from 'lodash';
import * as pag from 'pag';
import * as gcc from 'gcc';
import * as g from '../g/index';

let isCapturing: boolean;
let seedRandom: g.Random;
let seed: number;
let messageElement: HTMLElement;

let game: g.Game;
let initFunc: Function;
let updateFunc: Function;
let gifDuration: number;
const updatingCountPerFrameInCreating = 10;

export function init(name: string,
  _initFunc: Function, _updateFunc: Function,
  _gifDuration = 60 * 15) {
  initFunc = _initFunc;
  updateFunc = _updateFunc;
  gifDuration = _gifDuration;
  addButton('New game', () => initGameWithNewSeed());
  addButton('Retry game', () => initGame());
  addButton('Create gif', () => createGif());
  messageElement = addElement('span');
  addElement('br');
  addElement('br');
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
    g.setUpdatingCountPerFrame(updatingCountPerFrameInCreating);
  }
  initGameWithNewSeed();
}

function addButton(text: string, onclick: Function) {
  const button = document.createElement('button');
  button.textContent = text;
  (<any>button.onclick) = onclick;
  document.body.appendChild(button);
}

function addElement(name: string) {
  const e = document.createElement(name);
  document.body.appendChild(e);
  return e;
}

function initGame() {
  messageElement.textContent = '';
  if (game != null) {
    game.remove();
  }
  game = new g.Game(250, 125, initFunc, update);
  const screen = game.screen;
  screen.canvas.style.width = `${screen.size.x * 2}px`;
  screen.canvas.style.height = `${screen.size.y * 2}px`;
  g.beginGames(seed);
  disableCapturing();
}

function initGameWithNewSeed() {
  seed = seedRandom.getToMaxInt();
  initGame();
}

function createGif() {
  initGame();
  enableCapturing();
}

function enableCapturing() {
  isCapturing = true;
  g.setUpdatingCountPerFrame(10);
}

function disableCapturing() {
  isCapturing = false;
  g.setUpdatingCountPerFrame(1);
}

function update() {
  updateFunc();
  if (isCapturing) {
    if (g.game.ticks === gifDuration - 1) {
      messageElement.textContent = 'creating...';
    }
    gcc.capture(g.game.screen.canvas);
    if (g.game.ticks >= gifDuration) {
      isCapturing = false;
      game.remove();
      game = null;
      gcc.end();
      messageElement.textContent = 'downloaded';
    }
  }
}
