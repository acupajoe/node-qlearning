# Q-Learning in node.js

[![Build Status](https://travis-ci.org/acupajoe/node-qlearning.svg?branch=master)](https://travis-ci.org/acupajoe/node-qlearning)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

-----------

> **DISCLAIMER**: This library is still a **WORK IN PROGRESS**

Interested in doing reinforcement learning in node.js? Me too.

This is an experimental library to provide an interface for working with Q-Learning inside your node
application.

```javascript
import QL from 'node-qlearning'

const initialState = {x: 0, y: 0}
const learningRate = 0.35
const actions = ['forward', 'backwards', 'left', 'right']

const agent = new QL('name', actions, learningRate)

// What is the cost of moving to the specified `state` and taking `action`
agent.setCost((state, action) => {})
// What is the reward for `state`
agent.setReward((state) => {})
// Generate the next state given `state` and taking `action`
agent.setStateGenerator((state, action) => {})

// Let's get going!
agent.start(initialState)
```



This is essentially a rewrite of the open-source library [q-exp](https://github.com/starcolon/q-exp) by [starcolon](https://github.com/starcolon) but to be more comprehensible (imo)