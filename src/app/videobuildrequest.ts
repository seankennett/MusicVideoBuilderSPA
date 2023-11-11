import { License } from "./license";
import { Resolution } from "./resolution";

export interface Videobuildrequest {
    resolution: Resolution,
    license: License, 
    buildId: string
}
