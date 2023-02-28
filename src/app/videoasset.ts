import { Buildstatus } from "./buildstatus";

export interface Videoasset {
    videoId:number,
    dateCreated:Date,
    downloadLink:string,
    buildStatus:Buildstatus
}
