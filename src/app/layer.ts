import { Layertypes } from "./layertypes";

export interface Layer {
    userLayerStatusId: number | null,
    layerName: string,
    layerId: string,
    layerType: Layertypes, // change to enum
    dateUpdated: Date
}
