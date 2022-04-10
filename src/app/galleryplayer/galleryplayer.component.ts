import { Component, Input, OnInit,  Output, EventEmitter } from '@angular/core';
import { Layer } from '../layer';
import { Observable, take, takeUntil, takeWhile, timer } from 'rxjs';

const imageWidth = 384;

@Component({
  selector: 'app-galleryplayer',
  templateUrl: './galleryplayer.component.html',
  styleUrls: ['./galleryplayer.component.scss']
})
export class GalleryplayerComponent implements OnInit {
  @Input() layer!: Layer;
  @Input() isRemove: boolean = false;
  @Output() addButtonClickEvent = new EventEmitter<Layer>();
  @Output() removeButtonClickEvent = new EventEmitter<Layer>();

  bpm: number = 135;
  leftPosition: number = 0;

  timer: Observable<number> = timer(0, 60/135*1000*4/64);

  constructor() { }
  isPlaying = false;
  ngOnInit(): void {
  }

  togglePlay = () => {
    this.isPlaying = !this.isPlaying;
    this.leftPosition = 0;
    if (this.isPlaying){
      this.timer.pipe(
        takeWhile(() => this.isPlaying)
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
