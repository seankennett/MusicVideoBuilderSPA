import { Collectiondisplaylayer } from "./collectiondisplaylayer";
import { Collectiontypes } from "./collectiontypes";
import { Displaylayer } from "./displaylayer";

export interface Collection {
    collectionId: string
    collectionName: string
    collectionType: Collectiontypes
    collectionDisplayLayer: Collectiondisplaylayer
    authorObjectId: string
    dateCreated: Date
    displayLayers: Displaylayer[]
    userCount: number
}
