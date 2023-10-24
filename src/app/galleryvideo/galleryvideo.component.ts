import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Clip } from '../clip';
import { Formats } from '../formats';
import { Video } from '../video';
import { Videoclip } from '../videoclip';
import { Collection } from '../collection';

const framesPerBeat = 16;
@Component({
  selector: 'app-galleryvideo',
  templateUrl: './galleryvideo.component.html',
  styleUrls: ['./galleryvideo.component.scss']
})
export class GalleryvideoComponent implements OnInit {

  @Input() video!: Video
  @Input() isBuilding = false
  @Input() clips!: Clip[]
  @Input() collections!: Collection[]
  @Input() loading = false;
  @Input() showEdit = true;
  @Input() showRemove = false;

  @Output() buttonClickEvent = new EventEmitter<{video: Video, tab: number}>();

  imageWidth = 192;
  imageHeight = 108;
  Formats = Formats;
  
  constructor() { }

  ngOnInit(): void {
  }

  buttonClick = (tab: number) => {
    this.buttonClickEvent.emit({video: this.video, tab: tab});
  }

  getClipIndex = (isTop: boolean, isLeft: boolean) => {
    var index = 0;
    if (isTop === false){
      index = Math.floor(this.video.videoClips.length / 2)
    }

    if (isLeft === false){
      index = index + Math.floor(this.video.videoClips.length / 4)
    }
    
    return index;
  }

  getContainerLeft = (isLeft: boolean) => {
    return isLeft === false ? this.imageWidth : 0;
  }

  getContainerTop = (isTop: boolean) =>{
    return isTop === false ? this.imageHeight: 0;
  }

  getClipLeft = (clip: Clip) => {
    return -(clip.startingBeat - 1) * framesPerBeat * this.imageWidth
  }

  getClip = (videoClip: Videoclip) =>{
    return this.clips.find(x => x.clipId === videoClip.clipId) ?? <Clip>{};
  }

}
