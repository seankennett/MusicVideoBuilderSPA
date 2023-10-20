import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Clip } from '../clip';
import { Formats } from '../formats';
import { Video } from '../video';
import { Displaylayer } from '../displaylayer';
import { Clipdisplaylayer } from '../clipdisplaylayer';
import { Layer } from '../layer';
import { Videoclip } from '../videoclip';

const imageWidth = 192;
const byteSize = 256;
const framesPerBeat = 16;
@Component({
  selector: 'app-galleryvideo',
  templateUrl: './galleryvideo.component.html',
  styleUrls: ['./galleryvideo.component.scss']
})
export class GalleryvideoComponent implements OnInit {

  @Input() video!: Video
  @Input() clips!: Clip[]
  @Input() displayLayers!: Displaylayer[]
  @Input() loading = false;
  @Input() showEdit = true;
  @Input() showRemove = false;

  @Output() buttonClickEvent = new EventEmitter<{video: Video, tab: number}>();

  Formats = Formats;
  storageUrl = environment.storageUrl;
  
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
    return isLeft === false ? imageWidth : 0;
  }

  getClipLeft = (clip: Clip, clipDisplayLayer: Clipdisplaylayer) => {
    var leftPosition = -(clip.startingBeat - 1) * framesPerBeat * imageWidth
    if (clipDisplayLayer.reverse === true){
      // minus one as we start on frame 0 going to frame 63
      return leftPosition - ((clip.beatLength) * framesPerBeat - 1) * imageWidth
    }

    return leftPosition;
  }

  getClipZIndex = (i: number, isLeft: boolean) => {
    return isLeft === false ? i + byteSize : i;
  }

  // nicked form galleryplayer
  toColourMatrix = (hexCode: string) => {
    var rgbArray = hexCode?.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    return rgbArray[0] / 255 + " 0 0 0 0    0 " + rgbArray[1] / 255 + " 0 0 0    0 0 " + rgbArray[2] / 255 + " 0 0    0 0 0 1 0";
  }

  // modified form galleryplayer
  getLayers = (clipDisplayLayer: Clipdisplaylayer) => {
    return this.displayLayers.find(x => x.displayLayerId === clipDisplayLayer.displayLayerId)?.layers;
  }

  // modified form galleryplayer
  getColour = (layer: Layer, clip: Clip) => {
    return clip.clipDisplayLayers.flatMap(x => x.layerClipDisplayLayers).find(x => x.layerId === layer.layerId)?.colour ?? "";
  }

  getClip = (videoClip: Videoclip) =>{
    return this.clips.find(x => x.clipId === videoClip.clipId) ?? <Clip>{};
  }

}
