import { Buildstatus } from "./buildstatus";
import { Formats } from "./formats";
import { License } from "./license";
import { Resolution } from "./resolution";

export interface Buildasset {
    videoId:number | null,
    dateCreated:Date,
    downloadLink:string,
    videoName:string,
    format:Formats,
    buildStatus:Buildstatus,
    license:License,
    resolution:Resolution
}
