let settings = require('./settings')

class Food {
  constructor () {
    this.x = Math.floor(Math.random() * settings.width)
    this.y = Math.floor(Math.random() * settings.height)
    this.area = settings.food.area

    this.color = [124, 252, 0]
  }

  reset () {
    this.x = Math.floor(Math.random() * settings.width)
    this.y = Math.floor(Math.random() * settings.height)
  }

  update () {}
}

export default Food
