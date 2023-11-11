import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Collection } from '../collection';
import { BehaviorSubject, switchMap, takeWhile, timer } from 'rxjs';
import { Clip } from '../clip';
import { Displaylayer } from '../displaylayer';
import { Video } from '../video';
import { Layercollectiondisplaylayer } from '../layercollectiondisplaylayer';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClipinfoComponent } from '../clipinfo/clipinfo.component';
import { TransitioninfoComponent } from '../transitioninfo/transitioninfo.component';

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
  @Input() dependentVideos!: Video[];
  @Output() editButtonClickCollectionEvent = new EventEmitter<Collection>();
  @Output() addButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() editButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() removeButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() cloneButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() removeButtonClickCollectionEvent = new EventEmitter<Collection>();
  @Output() cancelButtonClickEvent = new EventEmitter();

  @Input() bpm!: number;
  @Input() isPlaying: boolean = false;
  @Input() loading: boolean = false;

  @Input() showAdd: boolean = true;
  @Input() showEdit: boolean = false;
  @Input() showRemove: boolean = false;
  @Input() showCancel: boolean = false;
  @Input() showClone: boolean = false;
  @Input() showEditColour: boolean = false;
  @Input() showClipInfoButton: boolean = true;

  layerCollectionEditableDisplayLayers: Layercollectiondisplaylayer[] = [];

  leftPosition: number = 0;

  localBpm = new BehaviorSubject(135);
  localIsPlaying = false;

  progress = 0;

  constructor(private modalService: NgbModal) { }

  get playerTitle() {
    return this.collection?.collectionName ?? this.clip?.clipName ?? '';
  }

  private get skipFrames() {
    return ((this.clip?.startingBeat ?? defaultStartingBeat) - 1) * frameTotal / 4;
  }

  get collectionLayers() {
    return this.collection?.displayLayers.find(d => d.displayLayerId === this.collection.collectionDisplayLayer.displayLayerId)?.layers
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
    if (this.collection){
    this.layerCollectionEditableDisplayLayers = this.collection.collectionDisplayLayer.layerCollectionDisplayLayers.filter(l => 
      this.collectionLayers?.some(c => c.isOverlay === false && l.layerId === c.layerId))
      .map(l => <Layercollectiondisplaylayer>{ colour: '#' + l.colour, layerId: l.layerId});
    }
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

  updateDefaultColorLayer = (layer: Layercollectiondisplaylayer) => {
    var layercollectiondisplaylayer = this.collection.collectionDisplayLayer.layerCollectionDisplayLayers.find(l => l.layerId === layer.layerId);
    if (layercollectiondisplaylayer){
      layercollectiondisplaylayer.colour = layer.colour.substring(1);
    }
  }

  addButtonClick = () => {
    this.addButtonClickClipEvent.emit(this.clip);
  }

  showClipInfo = () => {
    let modal = this.modalService.open(ClipinfoComponent, { size: 'xl'});
    modal.componentInstance.clip = this.clip;
  }

  showTransitions = () =>{
    this.modalService.open(TransitioninfoComponent);
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

  cancelButtonClick = () =>{
    this.cancelButtonClickEvent.emit();
  }
}
