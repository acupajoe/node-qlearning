import History from "./history"
import State from "./state";
import {Policy} from "./policy"

const fs = require('fs')
const colors = require('colors')
const sortBy = require('lodash').sortBy

let isVerbose: boolean = false

const Log = (message: string) => {
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
    theta: Policy
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

    /**
     * Needs to be called after state functions are set, binds the context wherein
     * those functions are called.
     *
     * @param {Object} context
     * @returns {this}
     */
    bind(context: object): this {
        if (this.functions.cost) {
            this.functions.cost.bind(context)
        }
        if (this.functions.reward) {
            this.functions.reward.bind(context)
        }
        if (this.functions.printer) {
            this.functions.printer.bind(context)
        }
        if (this.functions.stateGenerator) {
            this.functions.stateGenerator.bind(context)
        }
        return this;
    }

    set verbose(value: boolean) {
        isVerbose = value
    }

    /**
     * Sets the current state of the agent
     *
     * @param {Object} state
     * @returns {this}
     */
    setState(state: object): this {
        this.state = state instanceof State ? state : <State> new State(state)
        this.history.push(this.state, null, null)
        return this
    }

    /**
     * [REQUIRED]
     * Sets the function for evaluating the cost of the current state
     *
     * @param {(state: State, action: Object) => number} func
     * @returns {this}
     */
    setCost(func: (state: State, action: object) => number): this {
        if (typeof func !== 'function') {
            throw new Error('Cost must be defined as a function')
        }
        this.functions.cost = func
        return this
    }

    /**
     * [REQUIRED]
     * Sets the function for evaluating the reward of an arbitrary state
     *
     * @param {(state: State) => number} func
     * @returns {this}
     */
    setReward(func: (state: State) => number): this {
        if (typeof func !== 'function') {
            throw new Error('Reward must be defined as a function')
        }
        this.functions.reward = func
        return this
    }

    /**
     * [OPTIONAL]
     * Printing function that is called after each step
     *
     * @param {(state: State) => void} func
     * @returns {this}
     */
    setPrinter(func: (state: State) => void): this {
        if (typeof func !== 'function') {
            throw new Error('Printer must be defined as a function')
        }
        this.functions.printer = func
        return this
    }

    /**
     * [REQUIRED]
     * Sets the function for generating a new state given the current state and performing
     * an action
     *
     * @param {(state: State, action: Object) => Object} func
     * @returns {this}
     */
    setStateGenerator(func: (state: State, action: object) => object): this {
        if (typeof func !== 'function') {
            throw new Error('State Generator must be defined as a function')
        }
        this.functions.stateGenerator = func
        return this
    }

    /**
     * @returns {this}
     */
    perceiveState(): this {
        this.history.push(null, this.state, null)
        return this
    }

    /**
     * [Required]
     * Begins the QLearning Process
     * Must be called after state functions are set.
     *
     * @param {Object} initialState
     * @returns {this}
     */
    start(initialState: object): this {
        if (!this.functions.cost) {
            throw new Error('Cost function must be defined before calling `start`')
        }
        if (!this.functions.stateGenerator) {
            throw new Error('State Generation function must be defined before calling `start`')
        }
        if (!this.functions.reward) {
            throw new Error('Reward function must be defined before calling `start`')
        }

        this.history.clear()
        this.setState(initialState)
        return this
    }

    /**
     * Learns from the most recent step -> produces new state
     * Should be called after `step()` and a subsequent call to
     * `setState(state)` or `perceiveState()`
     *
     * @returns {this}
     */
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

    /**
     * Choose the next `best` action (GREEDY)
     * @returns {this}
     */
    step(): this {
        Log('Begin Step'.green)
        let next
        let chosen
        let newState

        if (!this.state) {
            throw new Error('Agent must have a state assigned - use `setState()`')
        }

        next = this.__explore(this.state)
        chosen = next[0]

        this.history.push(this.state, chosen.action, null)

        Log(`${this.name}`.red + ` chose action: `.green + chosen.action)

        newState = this.functions.stateGenerator(this.state, chosen.action)
        this.state = newState instanceof State ? newState : <State> new State(newState)

        if (this.functions.printer) {
            this.functions.printer(this.state)
        }

        return this
    }

    /**
     *
     * @param {string} path
     */
    save(path: string) {
        fs.writeFileSync(`${path}/${this.name}.agent`, JSON.stringify(this.policy))
        return this
    }

    /**
     *
     * @param {string} path
     * @param {string} name
     * @returns {QLearning}
     */
    saveAs(path: string, name: string) {
        fs.writeFileSync(`${path}/${name}.agent`, JSON.stringify(this.policy))
        return this
    }

    /**
     *
     * @param {string} path
     * @returns {this}
     */
    load(path: string) {
        if (fs.existsSync(`${path}/${this.name}.agent`)) {
            let policy = fs.readFileSync(`${path}/${this.name}.agent`)
            policy = JSON.parse(policy)
            this.policy = policy

            Log('Agent Loaded'.green)
            return this
        }
        return this
    }

    /**
     * Explores actions to take on states
     *
     * @param {State} state
     * @returns {any[]} Sorted (DESC) array of {action: object, reward: number}s
     * @private
     */
    private __explore(state: State) {
        let rewards = this.actions.map(a => {
            let q = this.__predict(state, a)

            // Apply noise if reward prediction is inconclusive
            if (q === 0) {
                q += Math.random()
            }

            return {action: a, reward: q}
        })

        return sortBy(rewards, (r) => -r.reward)
    }

    /**
     * Predicts the reward we would receive given a state
     * and performing an action on it.
     *
     * @param {State} state
     * @param {Object} action
     * @returns {number} Reward of action
     * @private
     */
    private __predict(state: State, action: object): number {
        let cost = this.functions.cost(state, action)

        if (cost < 0) {
            return cost
        }

        // Have we seen this state in our policy before?
        if (this.policy.hasOwnProperty(state.hash)) {
            let act = this.policy[state.hash].filter((a) => a.action = action)
            if (act.length === 0) {
                return this.functions.cost(state, action)
            } else {
                return act[0].reward
            }
        } else {
            // Estimate a cost from the generalized model
            if (this.theta) {
                Log('Retrieving policy from generation'.yellow)

                let actionIndex = this.actions.lastIndexOf(action)
                // let _state = [1].concat(state.state)
                // let _cost = this.theta[actionIndex].reduce((_c, thetaI, i) => _c + thetaI + _state[i], 0)

                return cost
            }

            // We know nothing
            return cost
        }
    }

    /**
     * Update policy for a state from the previous observation
     *
     * @param {State} state
     * @param {Object} action
     * @param {number} sumOfRewards - value to be added
     * @returns {this}
     * @private
     */
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
