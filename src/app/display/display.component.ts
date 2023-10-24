import { Component, Input, OnInit } from '@angular/core';
import { Collection } from '../collection';
import { Clip } from '../clip';
import { Clipdisplaylayer } from '../clipdisplaylayer';
import { environment } from 'src/environments/environment';
import { Layer } from '../layer';

const frameTotal = 64;
const defaultStartingBeat = 1;

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit {

  @Input() collection!: Collection;
  @Input() clip!: Clip;
  @Input() collections!: Collection[];
  @Input() leftPosition!: number;
  @Input() height: number = 216;
  @Input() width: number = 384;

  storageUrl = environment.storageUrl;
  
  constructor() { }

  ngOnInit(): void {
  }

  get collectionLayers() {
    return this.collection?.displayLayers.find(d => d.displayLayerId === this.collection.collectionDisplayLayer.displayLayerId)?.layers
  }

  get displayLayers() {
    return this.collections?.flatMap(x => x.displayLayers).filter(d => this.clip.clipDisplayLayers.some(c => c.displayLayerId === d.displayLayerId))
  }

  private get skipFrames() {
    return ((this.clip?.startingBeat ?? defaultStartingBeat) - 1) * frameTotal / 4;
  }

  private get endLeftPosition() {
    // frame number will run from 0 to 63 so need the extra minus 1
    return -((this.clip.beatLength * frameTotal / 4) - 1 + this.skipFrames) * this.width;
  }

  getLeftPosition = (clipDisplayLayer: Clipdisplaylayer) =>{
    var reverse = clipDisplayLayer.reverse;
    if (clipDisplayLayer.flipHorizontal === true){
      reverse = !reverse;
    }

    if (reverse === true){
      return this.endLeftPosition - this.leftPosition;
    }
    
    return this.leftPosition;
  }

  toColourMatrix = (hexCode: string) => {
    var rgbArray = hexCode?.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    return rgbArray[0] / 255 + " 0 0 0 0    0 " + rgbArray[1] / 255 + " 0 0 0    0 0 " + rgbArray[2] / 255 + " 0 0    0 0 0 1 0";
  }

  getLayers = (clipDisplayLayer: Clipdisplaylayer) => {
    return this.displayLayers.find(x => x.displayLayerId === clipDisplayLayer.displayLayerId)?.layers;
  }

  getColour = (layer: Layer) => {
    return this.clip.clipDisplayLayers.flatMap(x => x.layerClipDisplayLayers).find(x => x.layerId === layer.layerId)?.colour ?? "";
  }

  getDefaultColour = (layerId: string) =>{
    return this.collection.collectionDisplayLayer.layerCollectionDisplayLayers.find(l => l.layerId === layerId)?.colour ?? "";
  }

  scale = (clipDisplayLayer: Clipdisplaylayer) =>{
    return "scale(" + (clipDisplayLayer.flipHorizontal === true ? "-1" : "1") + "," + (clipDisplayLayer.flipVertical === true ? "-1" : "1") + ")";
  }
}
