import { Direction } from "./direction"
import { Layer } from "./layer"

export interface Displaylayer {
    displayLayerId:string
    direction: Direction
    numberOfSides:number
    linkedPreviousDisplayLayerId:string
    dateCreated:Date
    layers:Layer[]
}
