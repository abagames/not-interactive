import * as _ from 'lodash';
import * as pag from 'pag';
import * as ni from './ni/index';
import * as g from './g/index';

let game: g.Game;
let screen: g.Screen;
let random: g.Random;
let p: p5;

window.onload = () => {
  ni.init('', init, update);
}

function init(_game: g.Game) {
  game = _game;
  screen = game.screen;
  random = game.random;
  p = game.p;
}

function update() {
}
