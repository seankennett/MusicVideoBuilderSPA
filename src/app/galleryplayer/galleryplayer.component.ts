import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Layer } from '../layer';
import { BehaviorSubject, switchMap, takeWhile, timer } from 'rxjs';
import { Clip } from '../clip';
import { environment } from 'src/environments/environment';

const imageWidth = 384;
const secondsInMinute = 60;
const millisecondsInSecond = 1000;
const beatsPerLayer = 4;
const frameTotal = 64;
const framesPerSecond = 1 / 24;

@Component({
  selector: 'app-galleryplayer',
  templateUrl: './galleryplayer.component.html',
  styleUrls: ['./galleryplayer.component.scss']
})
export class GalleryplayerComponent implements OnInit, OnChanges {
  @Input() layer!: Layer;
  @Input() clip!: Clip;
  @Output() addButtonClickLayerEvent = new EventEmitter<Layer>();
  @Output() addButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() editButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() removeButtonClickClipEvent = new EventEmitter<Clip>();
  @Output() removeButtonClickLayerEvent = new EventEmitter<Layer>();

  @Input() bpm!: number;
  @Input() isPlaying: boolean = false;

  @Input() disableFunction: (layer: Layer) => boolean = (layer) => { return false }
  @Input() disableTooltipFunction: (layer: Layer) => string = (layer) => { return '' }

  @Input() showAdd: boolean = true;
  @Input() showEdit: boolean = false;
  @Input() showRemove: boolean = false;

  leftPosition: number = 0;

  localBpm = new BehaviorSubject(135);
  localIsPlaying = false;

  progress = 0;
  
  storageUrl = environment.storageUrl;

  constructor() { }

  get playerTitle() {
    return this.layer?.layerName ?? this.clip?.clipName ?? '';
  }

  private get skipFrames() {
    return ((this.clip?.startingBeat ?? 1) - 1) * frameTotal / 4;
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

    if (changes['clip'] && changes['clip'].previousValue && changes['clip'].currentValue && changes['clip'].previousValue.startingBeat !== changes['clip'].currentValue.startingBeat && this.isPlaying === false) {
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

        var numberOfBeats = this.clip?.beatLength ?? beatsPerLayer;
        var layerDuration = secondsInMinute / this.localBpm.value * numberOfBeats;
        var currentTimeInLayer = currentTime % layerDuration;

        var percentageOfLayerDuration = currentTimeInLayer / layerDuration;

        var numberOfFrames = numberOfBeats * frameTotal / 4

        var frameInLayerNumber = Math.round((numberOfFrames) * percentageOfLayerDuration) + this.skipFrames;
        if (frameInLayerNumber >= frameTotal) {
          frameInLayerNumber = frameTotal - 1;
        }

        this.leftPosition = -(frameInLayerNumber) * imageWidth;
        this.progress = percentageOfLayerDuration * 100;
      });
    }
  }

  addButtonClick = () => {
    this.addButtonClickLayerEvent.emit(this.layer);
    this.addButtonClickClipEvent.emit(this.clip);
  }

  removeButtonClick = () => {
    this.removeButtonClickClipEvent.emit(this.clip);
    this.removeButtonClickLayerEvent.emit(this.layer);
  }

  editButtonClick = () => {
    this.editButtonClickClipEvent.emit(this.clip);
  }
}
