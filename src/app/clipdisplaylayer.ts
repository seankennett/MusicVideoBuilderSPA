import { Fadetypes } from "./fadetypes"
import { Layerclipdisplaylayer } from "./layerclipdisplaylayer"

export interface Clipdisplaylayer {
    displayLayerId: string
    layerClipDisplayLayers: Layerclipdisplaylayer[]
    reverse: boolean
    flipHorizontal: boolean
    flipVertical: boolean
    fadeType: Fadetypes | null
    colour: string | null
}
