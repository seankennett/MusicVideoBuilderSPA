import { UserLayer } from "./userlayer"

export interface Clip {
    clipId: number,
    clipName: string,
    userLayers: Array<UserLayer>
    dateUpdated: Date,
    backgroundColour: string
}
