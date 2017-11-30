import History from "./history"
import State from "./state";
import {Policy} from "./policy"

const sortBy = require('lodash').sortBy

let isVerbose: boolean = false

const Info = (message: string) => {
    if (isVerbose) {
        console.log(message)
    }
}

class QLearning {
    name: string
    state?: State
    actions: Array<object>
    alpha: number
    policy?: Policy
    history: History
    functions: {
        cost?: (state: State, action: object) => number,
        reward?: (state: State) => number,
        printer?: (state: State) => void,
        stateGenerator?: (state: State, action: object) => object
    }

    constructor(name: string, actions: Array<object>, alpha: number) {
        this.name = name
        this.actions = actions
        this.state = null
        this.alpha = alpha || 0.5
        this.policy = {}
        this.history = new History()
        this.functions = {
            cost: null,
            reward: null,
            printer: null,
            stateGenerator: null,
        }
        return this
    }

    set verbose(value: boolean) {
        isVerbose = value
    }

    setState(state: object): this {

        this.state = state instanceof State ? state : <State> new State(state)
        this.history.push(this.state, null, null)
        return this
    }

    setCost(func: (state: State) => number): this {
        if (typeof func !== 'function') {
            throw new Error('Cost must be defined as a function')
        }
        this.functions.cost = func
        return this
    }

    setReward(func: (state: State) => number): this {
        if (typeof func !== 'function') {
            throw new Error('Reward must be defined as a function')
        }
        this.functions.reward = func
        return this
    }

    setPrinter(func: (state: State) => void): this {
        if (typeof func !== 'function') {
            throw new Error('Printer must be defined as a function')
        }
        this.functions.printer = func
        return this
    }

    setStateGenerator(func: (state: State, action: object) => object): this {
        if (typeof func !== 'function') {
            throw new Error('State Generator must be defined as a function')
        }
        this.functions.stateGenerator = func
        return this
    }

    perceiveState(): this {
        this.history.push(null, this.state, -1)
        return this
    }

    start(initialState: object): this {
        this.history.clear()
        this.setState(initialState)
        return this
    }

    learn(): this {
        let last
        let current
        let rewardA
        let rewardB
        let delta
        let length = this.history.length

        if (length < 2) {
            throw new Error('Agent has not moved - cannot learn yet!')
        }

        last = this.history.items[length - 2]
        current = this.history.items[length - 1]

        if (last.action === null) {
            throw new Error('Agent should perceive the current state after its last moving')
        }

        if (current.action !== null) {
            throw new Error('Agent should update the current state after moving')
        }

        rewardA = this.functions.reward.call(this, last.state)
        rewardB = this.functions.reward.call(this, current.state)
        delta = this.alpha * (rewardB - rewardA)

        this.__updatePolicy(last.state, last.action, delta)
        return this
    }

    step(): this {
        let next
        let chosen
        let reward

        if (!this.state) {
            throw new Error('Agent must have a state assigned - use `setState()`')
        }

        next = this.__explore(this.state)
        chosen = next[0]
        reward = this.functions.reward(this.state)

        this.history.push({action: chosen.action, state: this.state})
        return this
    }

    private __explore(state: object) {

    }

    private __predict(state: State, action: object) {
        let cost = this.functions.cost(state, action)

        if (cost < 0) {
            return cost
        }

        if (this.policy.hasOwnProperty(state.hash)) {
            let act = this.policy[state.hash].filter((a) => a.action = action)
            if (act.length === 0) {
                return this.functions.cost(state, action)
            } else {
                return act[0].reward
            }
        }
    }

    private __rewardOf(state: State) {
        return this.functions.reward(state)
    }

    private __updatePolicy(state: State, action: object, sumOfRewards: number) {
        if (!this.policy.hasOwnProperty(state.hash)) {
            this.policy[state.hash] = []
            this.policy[state.hash] = this.actions.map((a) => {
                return {action: a, reward: a === action ? sumOfRewards : 0}
            })
        } else {
            this.policy[state.hash] = this.policy[state.hash].map((a) => {
                if (a.action === action) {
                    return {action: action, reward: sumOfRewards}
                } else {
                    return {action: a.action, reward: a.reward}
                }
            })
        }

        this.policy[state.hash] = sortBy(this.policy[state.hash], (s) => -s.reward)
        return this
    }
}

export default QLearning
