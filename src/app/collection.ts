import { Collectiontypes } from "./collectiontypes";
import { Displaylayer } from "./displaylayer";

export interface Collection {
    collectionId: string
    collectionName: string
    collectionType: Collectiontypes
    authorObjectId: string
    dateCreated: Date
    displayLayers: Displaylayer[]
    userCount: number
}
