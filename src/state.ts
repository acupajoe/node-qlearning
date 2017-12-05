const stringify = require('circular-json').stringify

export default class State {
    obj?: object
    action?: object
    reward?: number

    constructor(obj?: object, action? : object, reward?: number) {
        this.obj = obj
        this.action = action
        this.reward = reward
    }

    get hash(): string {
        return stringify(this.obj)
    }
}