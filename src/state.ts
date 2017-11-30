export default class State {
    state: object

    constructor(input: object) {
        this.state = input
    }

    get hash(): string {
        return JSON.stringify(this.state)
    }
}