import { Layertypes } from "./layertypes";

export interface Layer {
    layerName: string,
    layerId: string,
    layerType: Layertypes, // change to enum
    dateUpdated: Date
}
