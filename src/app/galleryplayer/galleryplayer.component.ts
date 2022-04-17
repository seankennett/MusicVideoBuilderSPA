import { Component, Input, OnInit,  Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Layer } from '../layer';
import { BehaviorSubject, Observable, switchMap, take, takeUntil, takeWhile, timer } from 'rxjs';

const imageWidth = 384;

@Component({
  selector: 'app-galleryplayer',
  templateUrl: './galleryplayer.component.html',
  styleUrls: ['./galleryplayer.component.scss']
})
export class GalleryplayerComponent implements OnInit, OnChanges {
  @Input() layer!: Layer;
  @Input() isRemove: boolean = false;
  @Output() addButtonClickEvent = new EventEmitter<Layer>();
  @Output() removeButtonClickEvent = new EventEmitter<Layer>();

  @Input() bpm!: number;
  @Input() isPlaying: boolean = false;

  leftPosition: number = 0;

  localBpm = new BehaviorSubject(135);
  localIsPlaying = false;

  constructor() { }
  

  ngOnInit(): void {
    if (this.isPlaying === true){
      this.togglePlay();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bpm']){
      this.localBpm.next(this.bpm);
    } else if (changes['isPlaying'] && changes['isPlaying'].currentValue !== this.localIsPlaying){
      this.togglePlay();
    }
  }

  togglePlay = () => {
    this.localIsPlaying = !this.localIsPlaying;
    this.leftPosition = 0;
    if (this.localIsPlaying){
      this.localBpm.pipe(
        switchMap(val => timer(0, 60/val*1000*4/64)),
        takeWhile(() => this.localIsPlaying)
      ).subscribe(frameNumber => {
        this.leftPosition = -(frameNumber % 64) * imageWidth;
      });
    }
  }

  addButtonClick = () => {
    this.addButtonClickEvent.emit(this.layer);
  }

  removeButtonClick = () => {
    this.removeButtonClickEvent.emit(this.layer);
  }
}
