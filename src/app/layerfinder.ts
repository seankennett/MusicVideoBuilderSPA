import { Layer } from "./layer";

export interface LayerFinder extends Layer {
    tags: string[],
    userLayerStatusId: number | null,
}