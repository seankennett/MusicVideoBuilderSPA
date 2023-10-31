import { Clipdisplaylayer } from "./clipdisplaylayer"

export interface Clip {
    clipId: number,
    clipName: string,
    clipDisplayLayers: Array<Clipdisplaylayer>
    dateUpdated: Date,
    backgroundColour: string | null,
    endBackgroundColour: string | null,
    beatLength: number,
    startingBeat: number
}
