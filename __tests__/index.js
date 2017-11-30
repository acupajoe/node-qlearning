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

describe('Are assignments done correctly?', () => {
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