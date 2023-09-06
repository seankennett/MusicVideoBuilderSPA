import { License } from "./license";
import { Resolution } from "./resolution";

export interface UserDisplayLayer {
    userLayerId: number,
    resolution: Resolution,
    license: License,
    displayLayerId: string
}
