'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _food = require('./food');

var _food2 = _interopRequireDefault(_food);

var _bot = require('./bot');

var _bot2 = _interopRequireDefault(_bot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let settings = require('./settings');

class Game {
  init() {
    this.food = [];
    this.bots = [];
    this.iterations = 0;
    this.highestFitness = 0;

    for (let i = 0; i < settings.food.amount; i++) {
      this.food.push(new _food2.default());
    }

    for (let j = 0; j < settings.bots; j++) {
      let bot = new _bot2.default(j);
      bot.init();
      this.bots.push(bot);
    }
  }

  get state() {
    return {
      food: this.food.map(f => {
        return { x: f.x, y: f.y };
      }),
      bots: this.bots.map(b => {
        return { index: b.index, x: b.x, y: b.y, area: b.area };
      }),
      me: null
    };
  }

  update() {
    for (let bot of this.bots) {
      try {
        let currentState = this.state;
        currentState.me = { index: bot.index, x: bot.x, y: bot.y, area: bot.area };
        bot.update(currentState);
      } catch (e) {
        console.error(e);
        process.exit(0);
      }
    }
  }

}

exports.default = new Game();