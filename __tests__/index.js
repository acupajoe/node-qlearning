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
    let state1 = 'hello'
    let state2 = [{test: 'a more complicated object'}]
    q.setState(state1)
    expect(q.state).not.toEqual(q.setState(state2).state)
  })

  it('hashes state correctly', () => {
    let state1 = [{test: 'a more complicated object'}]
    q.setState(state1)
    let hash1 = q.state.hash
    let state2 = 'hello'
    q.setState(state2)
    expect(q.setState(state1).state.hash).toEqual(hash1)
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