import { License } from "./license";
import { Resolution } from "./resolution";

export interface UserLayer {
    userLayerId: number,
    resolution: Resolution,
    license: License,
    layerId: string,
    layerName: string
}
