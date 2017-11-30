import QL, { State } from '../dist/index'

let name = 'test'
let actions = [0, 1]
let alpha = 0.3
let q = new QL(name, actions, alpha)

describe('Is an instance initialized correctly?', () => {

  it('assigns name correctly', () => {
    expect(q.name).toBe(name)
  })

  it('assigns actions correctly', () => {
    expect(q.actions).toBe(actions)
  })

  it('assigns alpha correctly', () => {
    expect(q.alpha).toBe(alpha)
  })

  it('assigns policy to be empty', () => {
    expect(q.policy).toEqual({})
  })

  it('assigns history to be empty', () => {
    expect(q.history.length).toBe(0)
  })

  it('assigns functions to null', () => {
    expect(q.functions).toEqual({cost: null, reward: null, printer: null, stateGenerator: null})
  })
})

describe('Are states consistent?', () => {
  it('sets state correctly', () => {
    let state
    state = 'hello'
    q.setState(state)
    expect(q.state).toEqual(new State(state))

    state = [{test: 'a more complicated object'}]
    q.setState(state)
    expect(q.state).toEqual(new State(state))
  })

  it('hashes state correctly', () => {
    let state
    state = 'hello'
    q.setState(state)
    expect(q.state.hash).toEqual(new State(state).hash)

    state = [{test: 'a more complicated object'}]
    q.setState(state)
    expect(q.state.hash).toEqual(new State(state).hash)
  })
})

describe('Are state functions bound and called?', () => {
  it('binds arrow functions', () => {
    let cost = (state, action) => {}
    let stateGenerator = (state, action) => {}
    let printer = (state) => {}
    let reward = (state) => {}
    q.setStateGenerator(stateGenerator)
    q.setCost(cost)
    q.setReward(reward)
    q.setPrinter(printer)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
  })

  it('binds anonymous functions', () => {
    let cost = function (state, action) {}
    let stateGenerator = function (state, action) {}
    let printer = function (state) {}
    let reward = function (state) {}
    q.setStateGenerator(stateGenerator)
    q.setCost(cost)
    q.setReward(reward)
    q.setPrinter(printer)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
    expect(q.functions.stateGenerator).toEqual(stateGenerator)
  })

  it('rejects binding of non-functions to state functions', () => {
    let nonFunction = 0
    expect(() => q.setStateGenerator(nonFunction)).toThrow()
    expect(() => q.setCost(nonFunction)).toThrow()
    expect(() => q.setReward(nonFunction)).toThrow()
    expect(() => q.setPrinter(nonFunction)).toThrow()
  })
})