import { Clip } from "./clip";
import { Formats } from "./formats";

export interface Video {
    videoId: number,
    videoName: string,
    clips: Array<Clip>,
    bpm: number,
    format: Formats,
    audioFileName: string,
    videoDelayMilliseconds: number
}
