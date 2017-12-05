import State from "./state";
import {Policy} from "./policy"

const fs = require('fs')
const path = require('path')
const colors = require('colors')
const sortBy = require('lodash').sortBy
const stringify = require('circular-json').stringify

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
    history: Array<State>
    theta: Policy
    functions: {
        cost?: (state: object, action: object) => number,
        reward?: (state: object) => number,
        printer?: (state: object) => void,
        stateGenerator?: (state: object, action: object) => object
    }

    constructor(name: string, actions: Array<object>, alpha: number) {
        this.name = name
        this.actions = actions
        this.state = null
        this.alpha = alpha || 0.5
        this.policy = {}
        this.history = []
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
        this.state = state instanceof State ? state : <State> new State(state, null, null)
        this.history.push(this.state)
        return this
    }

    /**
     * [REQUIRED]
     * Sets the function for evaluating the cost of the current state
     *
     * @param {(state: object, action: Object) => number} func
     * @returns {this}
     */
    setCost(func: (state: object, action: object) => number): this {
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
     * @param {(state: object) => number} func
     * @returns {this}
     */
    setReward(func: (state: object) => number): this {
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
     * @param {(state: object) => void} func
     * @returns {this}
     */
    setPrinter(func: (state: object) => void): this {
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
    setStateGenerator(func: (state: object, action: object) => object): this {
        if (typeof func !== 'function') {
            throw new Error('State Generator must be defined as a function')
        }
        this.functions.stateGenerator = func
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

        this.history = []
        this.setState(new State(initialState, null, null))
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

        last = this.history[length - 2]
        current = this.history[length - 1]

        if (last.action === null) {
            throw new Error('Agent should perceive the current state after its last moving')
        }

        if (current.action !== null) {
            throw new Error('Agent should update the current state after moving')
        }

        rewardA = this.functions.reward(last.obj)
        rewardB = this.functions.reward(current.obj)
        delta = this.alpha * (rewardB - rewardA)

        this.__updatePolicy(last, delta)
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

        this.history.push(new State(this.state.obj, chosen.action, null))

        Log(`${this.name}`.red + ` chose action: `.green + (chosen.action instanceof String ? chosen.action : stringify(chosen.action)))

        newState = this.functions.stateGenerator(this.state.obj, chosen.action)
        this.state = newState instanceof State ? newState : <State> new State(newState)

        if (this.functions.printer) {
            this.functions.printer(this.state.obj)
        }
        return this
    }

    /**
     * Asynchronously saves an agent to the filesystem,
     * will make the directory if it does not exist
     *
     * @param {string} directory
     * @returns {Promise}
     */
    save(directory: string) {
        let dirPath = path.resolve(directory)

        return new Promise((res, rej) => {
            fs.stat(dirPath, (err, stats) => {
                if (err) {
                    fs.mkdir(dirPath, write)
                } else {
                    write()
                }
            })

            function write(err = false) {
                if (!err) {
                    fs.writeFile(path.join(dirPath, `${this.name}.agent`), stringify(this.policy))
                    res(this)
                } else {
                    rej(err)
                }
            }
        })
    }

    /**
     * Loads an agent from the filesystem specified by the agent's constructed name
     * @param {string} directory
     * @returns {this}
     */
    loadSync(directory: string) {
        let dirPath = path.resolve(directory)
        if (fs.existsSync(path.join(dirPath, `/${this.name}.agent`))) {
            let policy = fs.readFileSync(`${dirPath}/${this.name}.agent`)
            policy = JSON.parse(policy)
            this.policy = policy

            Log('Agent Loaded'.green)
            return this
        }
        return this
    }

    /**
     * Have the agent perceive its current state (to be called before and after a step)
     * @returns {this}
     */
    perceiveState(): this {
        this.history.push(new State(this.state.obj, null, null))
        return this
    }

    /**
     * Explores actions to take on states
     *
     * @param {State} state
     * @returns {any[]} Sorted (DESC) array of {action: object, reward: number}
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

        rewards = sortBy(rewards, (r) => -r.reward)
        Log("Calculated rewards of: ".yellow + stringify(rewards))
        return rewards
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
        let cost = this.functions.cost(state.obj, action)

        if (cost < 0) {
            return cost
        }

        // Have we seen this state in our policy before?
        if (this.policy.hasOwnProperty(state.hash)) {
            let act = this.policy[state.hash].filter((a) => a.action = action)
            if (act.length === 0) {
                return this.functions.cost(state.obj, action)
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
     * @param {number} sumOfRewards - value to be added
     * @returns {this}
     * @private
     */
    private __updatePolicy(state: State, sumOfRewards: number) {
        if (!this.policy.hasOwnProperty(state.hash)) {
            this.policy[state.hash] = []
            this.policy[state.hash] = this.actions.map((a) => {
                return {action: a, reward: a === state.action ? sumOfRewards : 0}
            })
        } else {
            this.policy[state.hash] = this.policy[state.hash].map((a) => {
                if (a.action === state.action) {
                    return {action: state.action, reward: sumOfRewards}
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
