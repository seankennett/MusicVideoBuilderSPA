import { Component, Input, OnInit } from '@angular/core';
import { Collection } from '../collection';
import { Clip } from '../clip';
import { Clipdisplaylayer } from '../clipdisplaylayer';
import { environment } from 'src/environments/environment';
import { Layer } from '../layer';
import { Fadetypes } from '../fadetypes';

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

  private static id: number = 0;
  uniqueComponentId: number = 0;

  storageUrl = environment.storageUrl;
  fadeOut = Fadetypes.Out;

  constructor() { }

  ngOnInit(): void {
    this.uniqueComponentId = ++DisplayComponent.id;
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

  private get maxLeftPosition() {
    // frame number will run from 0 to 63 so need the extra minus 1
    return (frameTotal - 1) * this.width;
  }

  private get leftPositionPercent() {
    return Math.abs((this.leftPosition) / this.maxLeftPosition)
  }

  getLeftPosition = (clipDisplayLayer: Clipdisplaylayer) => {
    var reverse = clipDisplayLayer.reverse;
    if (clipDisplayLayer.flipHorizontal === true) {
      reverse = !reverse;
    }

    if (reverse === true) {
      return this.endLeftPosition - this.leftPosition;
    }

    return this.leftPosition;
  }

  getLayerFadeOpacity = (isOverlay: boolean, clipDisplayLayer: Clipdisplaylayer) => {
    if (clipDisplayLayer.colour === null && clipDisplayLayer.fadeType !== null && isOverlay === true) {
      return 1 - this.getBackgroundFadeOpacity(clipDisplayLayer.fadeType);
    }
    return 1;
  }

  getBackgroundFadeOpacity = (fadeType: Fadetypes | null) => {
    if (fadeType) {
      if (fadeType === Fadetypes.In) {
        return 1 - this.leftPositionPercent;
      } else if (fadeType === Fadetypes.Out) {
        return this.leftPositionPercent;
      }
    }

    return 0;
  }

  toColourMatrix = (layer: Layer, clipdisplaylayer: Clipdisplaylayer | null) => {   
    var hexCode;
    if (clipdisplaylayer !== null) {
      hexCode = this.getColour(layer);
    } else{
      hexCode = this.getDefaultColour(layer.layerId);
    }

    var startRgbArray: number[] = hexCode?.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    var endRgbArray: number[] = hexCode?.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];

    // if clipdisplaylayer is foreground it can't have colour but can have fadetype meaning we have to go to black due to screen blending
    if (clipdisplaylayer?.fadeType !== null && clipdisplaylayer?.colour === null) {
      if (clipdisplaylayer?.fadeType === Fadetypes.In){
        startRgbArray = [0,0,0];
      }else if (clipdisplaylayer?.fadeType === Fadetypes.Out){
        endRgbArray = [0,0,0];
      }
    }

    var matchingEndColour = clipdisplaylayer?.layerClipDisplayLayers.find(l => l.layerId === layer.layerId && l.endColour !== null);
    if (matchingEndColour){
      endRgbArray = matchingEndColour.endColour?.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    }

    var r = this.calculateColour(startRgbArray, endRgbArray, 0);
    var g = this.calculateColour(startRgbArray, endRgbArray, 1);
    var b = this.calculateColour(startRgbArray, endRgbArray, 2);

    if (layer.layerId === "339f9a95-16fa-42c0-9279-3b21f6065074" && this.leftPositionPercent > 0.95){
      console.log(r);
      console.log(g);
      console.log(b);
    }

    return r + " 0 0 0 0    0 " + g + " 0 0 0    0 0 " + b + " 0 0    0 0 0 1 0";
  }

  private calculateColour = (startRgbArray: number[], endRgbArray: number[], index: number) => {
    return startRgbArray[index] * (1 - this.leftPositionPercent) / 255 + endRgbArray[index] * this.leftPositionPercent / 255;
  }

  getLayers = (clipDisplayLayer: Clipdisplaylayer) => {
    return this.displayLayers.find(x => x.displayLayerId === clipDisplayLayer.displayLayerId)?.layers;
  }

  getColour = (layer: Layer) => {
    return this.clip.clipDisplayLayers.flatMap(x => x.layerClipDisplayLayers).find(x => x.layerId === layer.layerId)?.colour ?? "";
  }

  getDefaultColour = (layerId: string) => {
    return this.collection.collectionDisplayLayer.layerCollectionDisplayLayers.find(l => l.layerId === layerId)?.colour ?? "";
  }

  scale = (clipDisplayLayer: Clipdisplaylayer) => {
    return "scale(" + (clipDisplayLayer.flipHorizontal === true ? "-1" : "1") + "," + (clipDisplayLayer.flipVertical === true ? "-1" : "1") + ")";
  }
}
