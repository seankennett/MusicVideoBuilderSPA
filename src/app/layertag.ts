import { Layer } from "./layer";
import { Tag } from "./tag";

export interface LayerTag extends Tag {
    layers: Layer[]
}
