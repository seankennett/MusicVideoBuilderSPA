import { Layer } from "./layer"

export interface Clip {
    clipId: number,
    clipName: string,
    layers: Array<Layer>
    dateUpdated: Date,
    backgroundColour: string,
    beatLength: number,
    startingBeat: number
}
