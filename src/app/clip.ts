import { Clipdisplaylayer } from "./clipdisplaylayer"

export interface Clip {
    clipId: number,
    clipName: string,
    clipDisplayLayers: Array<Clipdisplaylayer>
    dateUpdated: Date,
    backgroundColour: string,
    beatLength: number,
    startingBeat: number
}
