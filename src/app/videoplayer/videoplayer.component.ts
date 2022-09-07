import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { takeWhile, timer } from 'rxjs';
import { Video } from '../video';

const millisecondsInSecond = 1000;
const framesPerSecond = 1 / 24;
const secondsInMinute = 60;
const beatsPerLayer = 4;
const frameTotal = 64;
const imageWidth = 384;
@Component({
  selector: 'app-videoplayer',
  templateUrl: './videoplayer.component.html',
  styleUrls: ['./videoplayer.component.scss']
})
export class VideoplayerComponent implements OnInit {

  @Input() selectedClipIndex = 0;
  
  audioPlayer = new Audio();
  get hasAudioFile() {
    return this.audioPlayer.src?.length > 0;
  }
  @Input() video!: Video;

  get clipDurationSeconds(){
    return secondsInMinute / this.video.bpm * beatsPerLayer;
  };

  get videoDurationSeconds(){
    return this.video.clips.length * this.clipDurationSeconds;
  }

  private _currentTimeSeconds = 0;

  get percentageOfPlayingClipDuration() {
    var currentTimeInClip = this._currentTimeSeconds % this.clipDurationSeconds;
    return currentTimeInClip / this.clipDurationSeconds;
  }

  get leftPosition() {
    var frameInClipNumber = Math.round(frameTotal * this.percentageOfPlayingClipDuration);
    if (frameInClipNumber >= frameTotal) {
      frameInClipNumber = frameTotal - 1;
    }

    return -(frameInClipNumber) * imageWidth;
  }

  get playingClipIndex() {
    if (this._currentTimeSeconds > 0) {
      return Math.floor(this.video.clips.length * this._currentTimeSeconds / this.videoDurationSeconds);
    }

    return this.selectedClipIndex
  }

  get progress() {
    if (this._currentTimeSeconds > 0) {
      return this._currentTimeSeconds / this.videoDurationSeconds * 100;
    }

    return this.selectedClipIndex / this.video.clips.length * 100
  }

  get displayEndOfVideoTime() {
    return this.datePipe.transform(this.endOfVideoDate, 'HH:mm:ss.SSS');
  }

  get displayCurrentTime() {
    var currentTime = this.videoDurationSeconds * millisecondsInSecond * this.progress / 100 + (this.video.videoDelayMilliseconds ?? 0);
    var currentDate = new Date(0, 0, 0);
    currentDate.setMilliseconds(currentTime);

    return this.datePipe.transform(currentDate, 'HH:mm:ss.SSS');
  }

  get endOfVideoDate() {
    var videoDurationMilliseconds = this.videoDurationSeconds * millisecondsInSecond + (this.video.videoDelayMilliseconds ?? 0);
    var endVideoDate = new Date(0, 0, 0);
    endVideoDate.setMilliseconds(videoDurationMilliseconds);
    return endVideoDate;
  }

  @Output() setSelectedIndexEvent = new EventEmitter<number>();

  constructor(private datePipe: DatePipe) { }

  ngOnInit(): void {
  }

  isPlaying = false;

  togglePlay = () => {
    if (!this.isPlaying) {
      var startTime = Date.now() - this.selectedClipIndex * this.clipDurationSeconds * millisecondsInSecond;
      if (this.hasAudioFile) {
        this.audioPlayer.currentTime = this.selectedClipIndex * this.clipDurationSeconds + (this.video.videoDelayMilliseconds ?? 0) / millisecondsInSecond;
        this.audioPlayer.play();
      }

      this.isPlaying = true;
      timer(0, framesPerSecond * millisecondsInSecond).pipe(
        takeWhile(() => this.isPlaying)
      ).subscribe(() => {
        var _currentTimeSeconds = 0;
        if (this.hasAudioFile) {
          _currentTimeSeconds = this.audioPlayer.currentTime - (this.video.videoDelayMilliseconds ?? 0) / millisecondsInSecond;
        } else {
          var newTime = Date.now();
          _currentTimeSeconds = (newTime - startTime) / millisecondsInSecond;
        }

        if (_currentTimeSeconds >= this.videoDurationSeconds) {
          this.stop();
        } else {
          this._currentTimeSeconds = _currentTimeSeconds;
        }
      });
    } else {
      this.stop();
    }
  }

  stop = () => {
    this._currentTimeSeconds = 0;
    this.isPlaying = false;
    if (this.hasAudioFile) {
      this.audioPlayer.pause();
    }
  }

  setSelectedClipIndex = (index: number) =>{
    this.setSelectedIndexEvent.emit(index);
  }

  onFileUpload = (event: any) => {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.audioPlayer.src = URL.createObjectURL(files[0]);
    }
  }

}
