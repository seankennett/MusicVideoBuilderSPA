import { Clip } from "./clip";
import { Formats } from "./formats";
import { Videoclip } from "./videoclip";

export interface Video {
    videoId: number,
    videoName: string,
    videoClips: Array<Videoclip>,
    bpm: number,
    format: Formats,
    videoDelayMilliseconds: number
}
