import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Layer } from '../layer';
import { BehaviorSubject, Observable, switchMap, take, takeUntil, takeWhile, timer } from 'rxjs';
import { Clip } from '../clip';

const imageWidth = 384;
const secondsInMinute = 60;
const millisecondsInSecond = 1000;
const beatsPerLayer = 4;
const frameTotal = 64;

@Component({
  selector: 'app-galleryplayer',
  templateUrl: './galleryplayer.component.html',
  styleUrls: ['./galleryplayer.component.scss']
})
export class GalleryplayerComponent implements OnInit, OnChanges {
  @Input() layer!: Layer;
  @Input() clip!: Clip;
  @Output() addButtonClickEvent = new EventEmitter<Layer>();
  @Output() editButtonClickEvent = new EventEmitter<Clip>();

  @Input() bpm!: number;
  @Input() isPlaying: boolean = false;

  @Input() disableFunction: (layer: Layer) => boolean = (layer) => { return false}
  @Input() disableTooltipFunction: (layer: Layer) => string = (layer) => {return ''}

  @Input() showAdd: boolean = true;
  @Input() showEdit: boolean = false;
  @Input() showRemove: boolean = false;

  leftPosition: number = 0;

  localBpm = new BehaviorSubject(135);
  localIsPlaying = false;

  constructor() { }

  get playerTitle(){
    return this.layer?.layerName ?? this.clip?.clipName ?? '';
  }

  ngOnInit(): void {
    if (this.isPlaying === true) {
      this.togglePlay();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bpm']) {
      this.localBpm.next(this.bpm);
    } else if (changes['isPlaying'] && changes['isPlaying'].currentValue !== this.localIsPlaying) {
      this.togglePlay();
    }
  }

  togglePlay = () => {
    this.localIsPlaying = !this.localIsPlaying;
    this.leftPosition = 0;
    if (this.localIsPlaying) {
      this.localBpm.pipe(
        switchMap(val => timer(0, secondsInMinute / val * millisecondsInSecond * beatsPerLayer / frameTotal)),
        takeWhile(() => this.localIsPlaying)
      ).subscribe(frameNumber => {
        this.leftPosition = -(frameNumber % frameTotal) * imageWidth;
      });
    }
  }

  addButtonClick = () => {
    this.addButtonClickEvent.emit(this.layer);
  }

  removeButtonClick = () => {
    
  }

  editButtonClick = () => {
    this.editButtonClickEvent.emit(this.clip);
  }
}
