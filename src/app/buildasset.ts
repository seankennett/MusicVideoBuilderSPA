import { Buildstatus } from "./buildstatus";
import { Formats } from "./formats";

export interface Buildasset {
    videoId:number,
    dateCreated:Date,
    downloadLink:string,
    videoName:string,
    format:Formats,
    buildStatus:Buildstatus
}
