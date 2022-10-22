import { Ffmpegcode } from "./ffmpegcode";
import { Imagemetadata } from "./imagemetadata";

export interface VideoAssets {
    videoName: string,
    imageUrls: Imagemetadata[],
    ffmpegCode:Ffmpegcode
}
