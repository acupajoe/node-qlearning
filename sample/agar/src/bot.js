import _ from 'lodash'
import QLearning from '../../../dist/index'
import { distance } from './utils'

const actions = [
  /* {key: 'nothing', move: {x: 0, y: 0}}, */
  {key: 'move-north', move: {x: 0, y: 1}},
  {key: 'move-south', move: {x: 0, y: -1}},
  {key: 'move-east', move: {x: 1, y: 0}},
  {key: 'move-west', move: {x: -1, y: 0}},
  {key: 'move-north-east', move: {x: 1, y: 1}},
  {key: 'move-north-west', move: {x: -1, y: 1}},
  {key: 'move-south-east', move: {x: 1, y: -1}},
  {key: 'move-south-west', move: {x: -1, y: -1}}
]
let settings = require('./settings')

class Bot {
  constructor (index) {
    this.index = index
    this.hasStarted = false
    this.x = Math.floor(Math.random() * settings.width)
    this.y = Math.floor(Math.random() * settings.height)
    this.area = settings.area.min
  }

  init () {
    this.agent = new QLearning(`player-agent-${this.index}`, actions, 0.35)
      .setCost((state, action) => {
        // console.log(`What's the cost of ${action.key}?`)
        return Bot.calculateReward(state, action)
      })
      .setReward(state => {
        return Bot.calculateReward(state)
      })
      .setStateGenerator((fromState, givenAction) => {
        let state = Bot.generateState(fromState, givenAction)
        this.x = state.me.x
        this.y = state.me.y
        this.area = state.me.area
        return state
      }).bind(this)

    this.agent.verbose = true
  }

  update (state) {
    if (!this.hasStarted) {
      this.agent.start(state)
      this.hasStarted = true
    }

    this.agent.perceiveState()
      .step()
      .perceiveState()
      .learn()
  }

  static generateState (fromState, givenAction) {
    // console.log(`Given ${givenAction.key}, what state is produced?`)
    let toState = _.clone(fromState)
    toState.me.x += givenAction.move.x
    toState.me.y += givenAction.move.y

    toState.me.x = toState.me.x > settings.width ? settings.width : toState.me.x < 0 ? toState.me.x = 0 : toState.me.x
    toState.me.y = toState.me.y > settings.height ? settings.height : toState.me.y < 0 ? toState.me.y = 0 : toState.me.y

    let nx = toState.me.x + givenAction.move.x
    let ny = toState.me.y + givenAction.move.y

    if (toState.me.area > settings.area.max) {
      toState.me.area = settings.area.max
    }

    toState.me.area = toState.me.area * settings.size.decrease

    for (let food of toState.food) {
      let d = distance(nx, ny, food.x, food.y)
      let r1 = Math.sqrt(toState.me.area / Math.PI)
      let r2 = Math.sqrt(food.area / Math.PI)

      if (d < (r1 + r2) / 2 && toState.me.area > food.area * settings.size.relative) {
        toState.area += food.area
        food.reset()
      }
    }

    for (let bot of toState.bots) {
      if (bot.name === toState.me.name) continue
      let d = distance(nx, ny, bot.x, bot.y)
      let r1 = Math.sqrt(toState.me.area / Math.PI)
      let r2 = Math.sqrt(bot.area / Math.PI)

      // We have consumed another bot
      if (d < (r1 + r2) / 2 && toState.me.area > bot.area * settings.size.relative) {
        toState.area += bot.area
        toState.bots = toState.bots.filter(b => b.name !== bot.name)
      }
    }

    return toState
  }

  static calculateReward (state, action = false) {
    // console.log(`What's the reward of ${action.key}?`)
    let x = action ? state.me.x + action.move.x : state.me.x
    let y = action ? state.me.y + action.move.y : state.me.y
    let reward = settings.reward.tick

    for (let food of state.food) {
      let d = distance(x, y, food.x, food.y)
      let r1 = Math.sqrt(state.me.area / Math.PI)
      let r2 = Math.sqrt(food.area / Math.PI)

      if (d < ((r1 + r2) / 2) + settings.vision.food && state.me.area > food.area * settings.size.relative) {
        reward += settings.reward.eatFood
      }
    }

    for (let bot of state.bots) {
      if (bot.index === this.index) continue
      let d = distance(x, y, bot.x, bot.y)
      let r1 = Math.sqrt(state.me.area / Math.PI)
      let r2 = Math.sqrt(bot.area / Math.PI)

      if (d < ((r1 + r2) / 2) + settings.vision.player) {
        if (state.me.area > bot.area * settings.size.relative) {
          reward += settings.reward.consumePlayer
        } else {
          reward += settings.reward.die
        }
      }
    }
    return reward
  }
}

export default Bot
