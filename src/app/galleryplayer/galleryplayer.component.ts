import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Collection } from '../collection';
import { BehaviorSubject, switchMap, takeWhile, timer } from 'rxjs';
import { Clip } from '../clip';
import { environment } from 'src/environments/environment';
import { Displaylayer } from '../displaylayer';
import { Layer } from '../layer';
import { Clipdisplaylayer } from '../clipdisplaylayer';

const imageWidth = 384;
const secondsInMinute = 60;
const millisecondsInSecond = 1000;
const frameTotal = 64;
const framesPerSecond = 1 / 24;
const defaultBeatLength = 4;
const defaultStartingBeat = 1;

@Component({
  selector: 'app-galleryplayer',
  templateUrl: './galleryplayer.component.html',
  styleUrls: ['./galleryplayer.component.scss']
})
export class GalleryplayerComponent implements OnInit, OnChanges {
  @Input() collection!: Collection;
  @Input() clip!: Clip;
  @Input() collections!: Collection[];
  @Output() editButtonClickCollectionEvent = new EventEmitter<Collection>();
  @Output() addButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() editButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() removeButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() cloneButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() removeButtonClickCollectionEvent = new EventEmitter<Collection>();

  @Input() bpm!: number;
  @Input() isPlaying: boolean = false;
  @Input() loading: boolean = false;

  @Input() showAdd: boolean = true;
  @Input() showEdit: boolean = false;
  @Input() showRemove: boolean = false;
  @Input() showClone: boolean = false;

  leftPosition: number = 0;

  localBpm = new BehaviorSubject(135);
  localIsPlaying = false;

  progress = 0;

  storageUrl = environment.storageUrl;

  constructor() { }

  get playerTitle() {
    return this.collection?.collectionName ?? this.clip?.clipName ?? '';
  }

  private get skipFrames() {
    return ((this.clip?.startingBeat ?? defaultStartingBeat) - 1) * frameTotal / 4;
  }

  private get endLeftPosition() {
    // frame number will run from 0 to 63 so need the extra minus 1
    return -((this.clip.beatLength * frameTotal / 4) - 1 + this.skipFrames) * imageWidth;
  }

  get collectionLayers() {
    return this.collection?.displayLayers.find(d => d.isCollectionDefault)?.layers
  }

  get displayLayers() {
    return this.collections?.flatMap(x => x.displayLayers).filter(d => this.clip.clipDisplayLayers.some(c => c.displayLayerId === d.displayLayerId))
  }

  get sideOptionNumber() {
    var groupedCollection = this.collection?.displayLayers.reduce((g: { [id: number]: Displaylayer[] }, o: Displaylayer) => {
      g[o.numberOfSides] = g[o.numberOfSides] || [];
      g[o.numberOfSides].push(o);
      return g;
    }, {}) ?? {};
    return Object.keys(groupedCollection).length;
  }

  get colourOptionNumber() {
    return this.collectionLayers?.filter(l => !l.isOverlay).length;
  }

  get directionOptionNumber() {
    var groupedCollection = this.collection?.displayLayers.filter(x => !x.direction.isTransition).reduce((g: { [id: number]: Displaylayer[] }, o: Displaylayer) => {
      g[o.direction.directionId] = g[o.direction.directionId] || [];
      g[o.direction.directionId].push(o);
      return g;
    }, {}) ?? {};
    return Object.keys(groupedCollection).length;
  }

  get directionTransitionOptionNumber() {
    var groupedCollection = this.collection?.displayLayers.filter(x => x.direction.isTransition).reduce((g: { [id: number]: Displaylayer[] }, o: Displaylayer) => {
      g[o.direction.directionId] = g[o.direction.directionId] || [];
      g[o.direction.directionId].push(o);
      return g;
    }, {}) ?? {};
    return Object.keys(groupedCollection).length;
  }

  ngOnInit(): void {
    if (this.isPlaying === true) {
      this.togglePlay();
    }

    this.leftPosition = -(this.skipFrames * imageWidth);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bpm']) {
      this.localBpm.next(this.bpm);
    } else if (changes['isPlaying'] && changes['isPlaying'].currentValue !== this.localIsPlaying) {
      this.togglePlay();
    }

    if (((changes['clip'] && changes['clip'].previousValue && changes['clip'].currentValue && changes['clip'].previousValue.startingBeat !== changes['clip'].currentValue.startingBeat) ||
    (changes['startingBeat'] && changes['startingBeat'].previousValue && changes['startingBeat'].currentValue && changes['startingBeat'].previousValue !== changes['startingBeat'].currentValue)) && this.isPlaying === false) {
      this.leftPosition = -(this.skipFrames * imageWidth);
    }
  }

  togglePlay = () => {
    this.localIsPlaying = !this.localIsPlaying;
    this.leftPosition = -(this.skipFrames * imageWidth);
    this.progress = 0;
    if (this.localIsPlaying) {
      var startTime = Date.now();
      this.localBpm.pipe(
        switchMap(() => timer(0, framesPerSecond * millisecondsInSecond)),
        takeWhile(() => this.localIsPlaying)
      ).subscribe(() => {
        var newTime = Date.now();
        var currentTime = (newTime - startTime) / millisecondsInSecond;

        var numberOfBeats = this.clip?.beatLength ?? defaultBeatLength;
        var layerDuration = secondsInMinute / this.localBpm.value * numberOfBeats;
        var currentTimeInLayer = currentTime % layerDuration;

        var percentageOfLayerDuration = currentTimeInLayer / layerDuration;

        // as it starts on a frame it runs from frame 0 to frame 63
        var numberOfFrames = (numberOfBeats * frameTotal / 4) - 1;

        var frameInLayerNumber = Math.round((numberOfFrames) * percentageOfLayerDuration) + this.skipFrames;

        this.leftPosition = -(frameInLayerNumber) * imageWidth;
        this.progress = percentageOfLayerDuration * 100;
      });
    }
  }

  getLeftPosition = (isReverse: boolean) =>{
    if (isReverse === true){
      return this.endLeftPosition - this.leftPosition;
    }
    
    return this.leftPosition;
  }

  toColourMatrix = (hexCode: string) => {
    var rgbArray = hexCode?.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    return rgbArray[0] / 255 + " 0 0 0 0    0 " + rgbArray[1] / 255 + " 0 0 0    0 0 " + rgbArray[2] / 255 + " 0 0    0 0 0 1 0";
  }

  getLayers = (clipDisplayLayer: Clipdisplaylayer) => {
    var layers = <Layer[]>JSON.parse(JSON.stringify(this.displayLayers.find(x => x.displayLayerId === clipDisplayLayer.displayLayerId)?.layers))
    clipDisplayLayer.layerClipDisplayLayers.forEach(l => {
      var matchedLayer = layers?.find(d => d.layerId === l.layerId);
      if (matchedLayer) {
        matchedLayer.defaultColour = l.colourOverride;
      }
    });
    return layers;
  }

  getColour = (layer: Layer) => {
    var overrideLayer = this.clip.clipDisplayLayers.flatMap(x => x.layerClipDisplayLayers).find(x => x.layerId === layer.layerId);
    if (overrideLayer) {
      return overrideLayer.colourOverride
    }

    return layer.defaultColour;
  }

  addButtonClick = () => {
    this.addButtonClickClipEvent.emit(this.clip);
  }

  removeButtonClick = () => {
    this.removeButtonClickClipEvent.emit(this.clip);
    this.removeButtonClickCollectionEvent.emit(this.collection);
  }

  editButtonClick = () => {
    this.editButtonClickClipEvent.emit(this.clip);
    this.editButtonClickCollectionEvent.emit(this.collection);
  }

  cloneButtonClick = () => {
    this.cloneButtonClickClipEvent.emit(this.clip);
  }
}
