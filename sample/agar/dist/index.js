'use strict';

var _game = require('./game');

var _game2 = _interopRequireDefault(_game);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_game2.default.init();
for (let i = 0; i < 25; i++) {
  _game2.default.update();
}