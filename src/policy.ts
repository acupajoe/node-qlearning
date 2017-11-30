export interface IPolicy {
    action?: object
    reward?: number
}

export interface Policy {
    [name: string]: Array<IPolicy>
}