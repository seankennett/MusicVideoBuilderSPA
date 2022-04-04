export interface Layer {
    userLayerStatusId: number | null,
    layerName: string,
    layerId: string,
    layerTypeId: number, // change to enum
    dateUpdated: Date
}
