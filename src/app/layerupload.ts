import { Layertypes } from "./collectiontypes"

export interface Layerupload {
    layerName: string,
    layerType: Layertypes,
    tags: Array<string>,
    layerId: string | undefined
}
