import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Formats } from '../formats';
import { Video } from '../video';

const imageWidth = 192;
const byteSize = 256;
@Component({
  selector: 'app-galleryvideo',
  templateUrl: './galleryvideo.component.html',
  styleUrls: ['./galleryvideo.component.scss']
})
export class GalleryvideoComponent implements OnInit {

  @Input() video!: Video
  @Input() loading = false;
  @Input() displayEdit = true;

  @Output() buttonClickEvent = new EventEmitter<Video>();

  Formats = Formats;
  constructor() { }

  ngOnInit(): void {
  }

  buttonClick = () => {
    this.buttonClickEvent.emit(this.video);
  }

  getClipIndex = (isTop: boolean, isLeft: boolean) => {
    var index = 0;
    if (isTop === false){
      index = Math.floor(this.video.clips.length / 2)
    }

    if (isLeft === false){
      index = index + Math.floor(this.video.clips.length / 4)
    }
    
    return index;
  }

  getClipLeft = (isLeft: boolean) => {
    return isLeft === false ? imageWidth : 0;
  }

  getClipZIndex = (i: number, isLeft: boolean) => {
    return isLeft === false ? i + byteSize : i;
  }

}
