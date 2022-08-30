import { Layertypes } from "./layertypes";
import { Userlayerstatus } from "./userlayerstatus";

export interface Layer {
    userLayerStatus: Userlayerstatus | null,
    layerName: string,
    layerId: string,
    layerType: Layertypes, // change to enum
    dateUpdated: Date
}
