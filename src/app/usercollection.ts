import { License } from "./license";
import { Resolution } from "./resolution";

export interface UserCollection {
    userCollectionId: number,
    resolution: Resolution,
    license: License,
    collectionId: string
}
