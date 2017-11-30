type Item = { state: object, action: object, reward: number }
let items: Array<Item> = []

export default class History {

    get items() {
        return items
    }

    get length(): number {
        return items.length
    }

    push(state?: object, action?: object, reward?: number) {
        this.items.push({state: state, action: action, reward: reward})
    }

    clear(): void {
        items = []
    }
}