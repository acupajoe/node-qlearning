'use strict';

var items = [];
var History = /** @class */ (function () {
    function History() {
    }
    Object.defineProperty(History.prototype, "items", {
        get: function () {
            return items;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(History.prototype, "length", {
        get: function () {
            return items.length;
        },
        enumerable: true,
        configurable: true
    });
    History.prototype.push = function (state, action, reward) {
        this.items.push({ state: state, action: action, reward: reward });
    };
    History.prototype.clear = function () {
        items = [];
    };
    return History;
}());

var State = /** @class */ (function () {
    function State(input) {
        this.state = input;
    }
    Object.defineProperty(State.prototype, "hash", {
        get: function () {
            return JSON.stringify(this.state);
        },
        enumerable: true,
        configurable: true
    });
    return State;
}());

var fs = require('fs');
var colors = require('colors');
var sortBy = require('lodash').sortBy;
var isVerbose = false;
var Log = function (message) {
    if (isVerbose) {
        console.log(message);
    }
};
var QLearning = /** @class */ (function () {
    function QLearning(name, actions, alpha) {
        this.name = name;
        this.actions = actions;
        this.state = null;
        this.alpha = alpha || 0.5;
        this.policy = {};
        this.history = new History();
        this.functions = {
            cost: null,
            reward: null,
            printer: null,
            stateGenerator: null,
        };
        return this;
    }
    Object.defineProperty(QLearning.prototype, "verbose", {
        set: function (value) {
            isVerbose = value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sets the current state of the agent
     *
     * @param {Object} state
     * @returns {this}
     */
    QLearning.prototype.setState = function (state) {
        this.state = state instanceof State ? state : new State(state);
        this.history.push(this.state, null, null);
        return this;
    };
    /**
     * [REQUIRED]
     * Sets the function for evaluating the cost of the current state
     *
     * @param {(state: State, action: Object) => number} func
     * @returns {this}
     */
    QLearning.prototype.setCost = function (func) {
        if (typeof func !== 'function') {
            throw new Error('Cost must be defined as a function');
        }
        this.functions.cost = func;
        return this;
    };
    /**
     * [REQUIRED]
     * Sets the function for evaluating the reward of an arbitrary state
     *
     * @param {(state: State) => number} func
     * @returns {this}
     */
    QLearning.prototype.setReward = function (func) {
        if (typeof func !== 'function') {
            throw new Error('Reward must be defined as a function');
        }
        this.functions.reward = func;
        return this;
    };
    /**
     * [OPTIONAL]
     * Printing function that is called after each step
     *
     * @param {(state: State) => void} func
     * @returns {this}
     */
    QLearning.prototype.setPrinter = function (func) {
        if (typeof func !== 'function') {
            throw new Error('Printer must be defined as a function');
        }
        this.functions.printer = func;
        return this;
    };
    /**
     * [REQUIRED]
     * Sets the function for generating a new state given the current state and performing
     * an action
     *
     * @param {(state: State, action: Object) => Object} func
     * @returns {this}
     */
    QLearning.prototype.setStateGenerator = function (func) {
        if (typeof func !== 'function') {
            throw new Error('State Generator must be defined as a function');
        }
        this.functions.stateGenerator = func;
        return this;
    };
    /**
     * @returns {this}
     */
    QLearning.prototype.perceiveState = function () {
        this.history.push(null, this.state, null);
        return this;
    };
    /**
     * [Required]
     * Begins the QLearning Process
     * Must be called after state functions are set.
     *
     * @param {Object} initialState
     * @returns {this}
     */
    QLearning.prototype.start = function (initialState) {
        if (!this.functions.cost) {
            throw new Error('Cost function must be defined before calling `start`');
        }
        if (!this.functions.stateGenerator) {
            throw new Error('State Generation function must be defined before calling `start`');
        }
        if (!this.functions.reward) {
            throw new Error('Reward function must be defined before calling `start`');
        }
        this.history.clear();
        this.setState(initialState);
        return this;
    };
    /**
     * Learns from the most recent step -> produces new state
     * Should be called after `step()` and a subsequent call to
     * `setState(state)` or `perceiveState()`
     *
     * @returns {this}
     */
    QLearning.prototype.learn = function () {
        var last;
        var current;
        var rewardA;
        var rewardB;
        var delta;
        var length = this.history.length;
        if (length < 2) {
            throw new Error('Agent has not moved - cannot learn yet!');
        }
        last = this.history.items[length - 2];
        current = this.history.items[length - 1];
        if (last.action === null) {
            throw new Error('Agent should perceive the current state after its last moving');
        }
        if (current.action !== null) {
            throw new Error('Agent should update the current state after moving');
        }
        rewardA = this.functions.reward.call(this, last.state);
        rewardB = this.functions.reward.call(this, current.state);
        delta = this.alpha * (rewardB - rewardA);
        this.__updatePolicy(last.state, last.action, delta);
        return this;
    };
    /**
     * Choose the next `best` action (GREEDY)
     * @returns {this}
     */
    QLearning.prototype.step = function () {
        Log('Begin Step'.green);
        var next;
        var chosen;
        var newState;
        if (!this.state) {
            throw new Error('Agent must have a state assigned - use `setState()`');
        }
        next = this.__explore(this.state);
        chosen = next[0];
        this.history.push(this.state, chosen.action, null);
        Log(("" + this.name).red + " chose action: ".green + chosen.action);
        newState = this.functions.stateGenerator(this.state, chosen.action);
        this.state = newState instanceof State ? newState : new State(newState);
        if (this.functions.printer) {
            this.functions.printer(this.state);
        }
        return this;
    };
    /**
     *
     * @param {string} path
     */
    QLearning.prototype.save = function (path) {
        fs.writeFileSync(path + "/" + this.name + ".agent", JSON.stringify(this.policy));
        return this;
    };
    /**
     *
     * @param {string} path
     * @param {string} name
     * @returns {QLearning}
     */
    QLearning.prototype.saveAs = function (path, name) {
        fs.writeFileSync(path + "/" + name + ".agent", JSON.stringify(this.policy));
        return this;
    };
    /**
     *
     * @param {string} path
     * @returns {this}
     */
    QLearning.prototype.load = function (path) {
        if (fs.existsSync(path + "/" + this.name + ".agent")) {
            var policy = fs.readFileSync(path + "/" + this.name + ".agent");
            policy = JSON.parse(policy);
            this.policy = policy;
            Log('Agent Loaded'.green);
            return this;
        }
        return this;
    };
    /**
     * Explores actions to take on states
     *
     * @param {State} state
     * @returns {any[]} Sorted (DESC) array of {action: object, reward: number}s
     * @private
     */
    QLearning.prototype.__explore = function (state) {
        var _this = this;
        var rewards = this.actions.map(function (a) {
            var q = _this.__predict(state, a);
            // Apply noise if reward prediction is inconclusive
            if (q === 0) {
                q += Math.random();
            }
            return { action: a, reward: q };
        });
        return sortBy(rewards, function (r) { return -r.reward; });
    };
    /**
     * Predicts the reward we would receive given a state
     * and performing an action on it.
     *
     * @param {State} state
     * @param {Object} action
     * @returns {number} Reward of action
     * @private
     */
    QLearning.prototype.__predict = function (state, action) {
        var cost = this.functions.cost(state, action);
        if (cost < 0) {
            return cost;
        }
        // Have we seen this state in our policy before?
        if (this.policy.hasOwnProperty(state.hash)) {
            var act = this.policy[state.hash].filter(function (a) { return a.action = action; });
            if (act.length === 0) {
                return this.functions.cost(state, action);
            }
            else {
                return act[0].reward;
            }
        }
        else {
            // Estimate a cost from the generalized model
            if (this.theta) {
                Log('Retrieving policy from generation'.yellow);
                var actionIndex = this.actions.lastIndexOf(action);
                // let _state = [1].concat(state.state)
                // let _cost = this.theta[actionIndex].reduce((_c, thetaI, i) => _c + thetaI + _state[i], 0)
                return cost;
            }
            // We know nothing
            return cost;
        }
    };
    /**
     * Update policy for a state from the previous observation
     *
     * @param {State} state
     * @param {Object} action
     * @param {number} sumOfRewards - value to be added
     * @returns {this}
     * @private
     */
    QLearning.prototype.__updatePolicy = function (state, action, sumOfRewards) {
        if (!this.policy.hasOwnProperty(state.hash)) {
            this.policy[state.hash] = [];
            this.policy[state.hash] = this.actions.map(function (a) {
                return { action: a, reward: a === action ? sumOfRewards : 0 };
            });
        }
        else {
            this.policy[state.hash] = this.policy[state.hash].map(function (a) {
                if (a.action === action) {
                    return { action: action, reward: sumOfRewards };
                }
                else {
                    return { action: a.action, reward: a.reward };
                }
            });
        }
        this.policy[state.hash] = sortBy(this.policy[state.hash], function (s) { return -s.reward; });
        return this;
    };
    return QLearning;
}());

module.exports = QLearning;
