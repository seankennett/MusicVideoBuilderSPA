import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { takeWhile, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
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

  storageUrl = environment.storageUrl;
  
  audioPlayer = new Audio();
  get hasAudioFile() {
    return this.audioPlayer.src?.length > 0;
  }

  @Input() video!: Video;

  get videoDurationSeconds() {
    return this.video.clips.map(c => c.beatLength * secondsInMinute / this.video.bpm).reduce((a, c) => a + c, 0);
  }

  private _currentTimeSeconds = 0;

  get percentageOfPlayingClipDuration() {
    if (this._currentTimeSeconds > 0) {
      var timeBeforeCurrentClip = 0;
      if (this.playingClipIndex > 0) {
        timeBeforeCurrentClip = this.video.clips.slice(0, this.playingClipIndex).map(c => c.beatLength * secondsInMinute / this.video.bpm).reduce((a, c) => a + c, 0)
      }
      var currentTimeInClip = this._currentTimeSeconds - timeBeforeCurrentClip;

      return currentTimeInClip / (this.video.clips[this.playingClipIndex].beatLength * secondsInMinute / this.video.bpm);
    }
    return 0;
  }

  get leftPosition() {
    var clip = this.video.clips[this.playingClipIndex];
    var frameInClipNumber = Math.round(clip.beatLength * frameTotal / 4 * this.percentageOfPlayingClipDuration) + (this.video.clips[this.playingClipIndex].startingBeat - 1) * frameTotal / 4;
    if (frameInClipNumber >= frameTotal) {
      frameInClipNumber = frameTotal - 1;
    }

    return -(frameInClipNumber) * imageWidth;
  }

  get playingClipIndex() {
    if (this._currentTimeSeconds > 0) {
      var endOfClipTimeSeconds = 0;
      for (var i = 0; i < this.video.clips.length; i++) {
        endOfClipTimeSeconds += this.video.clips[i].beatLength * secondsInMinute / this.video.bpm;
        if (this._currentTimeSeconds < endOfClipTimeSeconds) {
          return i;
        }
      }
    }

    return this.selectedClipIndex
  }

  get progress() {
    if (this._currentTimeSeconds > 0) {
      return this._currentTimeSeconds / this.videoDurationSeconds * 100;
    }

    if (this.selectedClipIndex > 0) {
      var selectedIndexClipStartTimeSeconds = this.video.clips.slice(0, this.selectedClipIndex).map(c => c.beatLength * secondsInMinute / this.video.bpm).reduce((a, c) => a + c, 0);
      return selectedIndexClipStartTimeSeconds / this.videoDurationSeconds * 100
    }
    else {
      return 0;
    }
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
      var selectedClipTimeSeconds = this.video.clips.slice(0, this.selectedClipIndex).map(c => c.beatLength * secondsInMinute / this.video.bpm).reduce((a, c) => a + c, 0);
      var startTime = Date.now() - selectedClipTimeSeconds * millisecondsInSecond;
      if (this.hasAudioFile) {
        this.audioPlayer.currentTime = selectedClipTimeSeconds + (this.video.videoDelayMilliseconds ?? 0) / millisecondsInSecond;
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

  setSelectedClipIndex = (index: number) => {
    this.setSelectedIndexEvent.emit(index);
  }
}
