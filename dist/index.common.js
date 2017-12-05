'use strict';

var stringify$1 = require('circular-json').stringify;
var State = /** @class */ (function () {
    function State(obj, action, reward) {
        this.obj = obj;
        this.action = action;
        this.reward = reward;
    }
    Object.defineProperty(State.prototype, "hash", {
        get: function () {
            return stringify$1(this.obj);
        },
        enumerable: true,
        configurable: true
    });
    return State;
}());

var fs = require('fs');
var path = require('path');
var colors = require('colors');
var sortBy = require('lodash').sortBy;
var stringify = require('circular-json').stringify;
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
        this.history = [];
        this.functions = {
            cost: null,
            reward: null,
            printer: null,
            stateGenerator: null,
        };
        return this;
    }
    /**
     * Needs to be called after state functions are set, binds the context wherein
     * those functions are called.
     *
     * @param {Object} context
     * @returns {this}
     */
    QLearning.prototype.bind = function (context) {
        if (this.functions.cost) {
            this.functions.cost.bind(context);
        }
        if (this.functions.reward) {
            this.functions.reward.bind(context);
        }
        if (this.functions.printer) {
            this.functions.printer.bind(context);
        }
        if (this.functions.stateGenerator) {
            this.functions.stateGenerator.bind(context);
        }
        return this;
    };
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
        this.state = state instanceof State ? state : new State(state, null, null);
        this.history.push(this.state);
        return this;
    };
    /**
     * [REQUIRED]
     * Sets the function for evaluating the cost of the current state
     *
     * @param {(state: object, action: Object) => number} func
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
     * @param {(state: object) => number} func
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
     * @param {(state: object) => void} func
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
        this.history = [];
        this.setState(new State(initialState, null, null));
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
        last = this.history[length - 2];
        current = this.history[length - 1];
        if (last.action === null) {
            throw new Error('Agent should perceive the current state after its last moving');
        }
        if (current.action !== null) {
            throw new Error('Agent should update the current state after moving');
        }
        rewardA = this.functions.reward(last.obj);
        rewardB = this.functions.reward(current.obj);
        delta = this.alpha * (rewardB - rewardA);
        this.__updatePolicy(last, delta);
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
        this.history.push(new State(this.state.obj, chosen.action, null));
        Log(("" + this.name).red + " chose action: ".green + (chosen.action instanceof String ? chosen.action : stringify(chosen.action)));
        newState = this.functions.stateGenerator(this.state.obj, chosen.action);
        this.state = newState instanceof State ? newState : new State(newState);
        if (this.functions.printer) {
            this.functions.printer(this.state.obj);
        }
        return this;
    };
    /**
     * Asynchronously saves an agent to the filesystem,
     * will make the directory if it does not exist
     *
     * @param {string} directory
     * @returns {Promise}
     */
    QLearning.prototype.save = function (directory) {
        var dirPath = path.resolve(directory);
        return new Promise(function (res, rej) {
            fs.stat(dirPath, function (err, stats) {
                if (err) {
                    fs.mkdir(dirPath, write);
                }
                else {
                    write();
                }
            });
            function write(err) {
                if (err === void 0) { err = false; }
                if (!err) {
                    fs.writeFile(path.join(dirPath, this.name + ".agent"), stringify(this.policy));
                    res(this);
                }
                else {
                    rej(err);
                }
            }
        });
    };
    /**
     * Loads an agent from the filesystem specified by the agent's constructed name
     * @param {string} directory
     * @returns {this}
     */
    QLearning.prototype.loadSync = function (directory) {
        var dirPath = path.resolve(directory);
        if (fs.existsSync(path.join(dirPath, "/" + this.name + ".agent"))) {
            var policy = fs.readFileSync(dirPath + "/" + this.name + ".agent");
            policy = JSON.parse(policy);
            this.policy = policy;
            Log('Agent Loaded'.green);
            return this;
        }
        return this;
    };
    /**
     * Have the agent perceive its current state (to be called before and after a step)
     * @returns {this}
     */
    QLearning.prototype.perceiveState = function () {
        this.history.push(new State(this.state.obj, null, null));
        return this;
    };
    /**
     * Explores actions to take on states
     *
     * @param {State} state
     * @returns {any[]} Sorted (DESC) array of {action: object, reward: number}
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
        rewards = sortBy(rewards, function (r) { return -r.reward; });
        Log("Calculated rewards of: ".yellow + stringify(rewards));
        return rewards;
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
        var cost = this.functions.cost(state.obj, action);
        if (cost < 0) {
            return cost;
        }
        // Have we seen this state in our policy before?
        if (this.policy.hasOwnProperty(state.hash)) {
            var act = this.policy[state.hash].filter(function (a) { return a.action = action; });
            if (act.length === 0) {
                return this.functions.cost(state.obj, action);
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
     * @param {number} sumOfRewards - value to be added
     * @returns {this}
     * @private
     */
    QLearning.prototype.__updatePolicy = function (state, sumOfRewards) {
        if (!this.policy.hasOwnProperty(state.hash)) {
            this.policy[state.hash] = [];
            this.policy[state.hash] = this.actions.map(function (a) {
                return { action: a, reward: a === state.action ? sumOfRewards : 0 };
            });
        }
        else {
            this.policy[state.hash] = this.policy[state.hash].map(function (a) {
                if (a.action === state.action) {
                    return { action: state.action, reward: sumOfRewards };
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
