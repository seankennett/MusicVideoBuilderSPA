import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { takeWhile, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Video } from '../video';
import { Displaylayer } from '../displaylayer';
import { Clipdisplaylayer } from '../clipdisplaylayer';
import { Layer } from '../layer';
import { Clip } from '../clip';

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
  @Input() displayLayers!: Displaylayer[]
  @Input() file: File | null = null;

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
      if (this.hasAudioFile === false && this.file !== null){
          this.audioPlayer.src = URL.createObjectURL(this.file);
      }else if (this.hasAudioFile === true && this.file === null){
        this.audioPlayer = new Audio();
      }

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

   // nicked form galleryplayer
   toColourMatrix = (hexCode: string) => {
    var rgbArray = hexCode?.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    return rgbArray[0] / 255 + " 0 0 0 0    0 " + rgbArray[1] / 255 + " 0 0 0    0 0 " + rgbArray[2] / 255 + " 0 0    0 0 0 1 0";
  }

  // modified form galleryplayer
  getLayers = (clipDisplayLayer: Clipdisplaylayer) => {
    var layers = this.displayLayers.find(x => x.displayLayerId === clipDisplayLayer.displayLayerId)?.layers;
    clipDisplayLayer.layerClipDisplayLayers.forEach(l => {
      var matchedLayer = layers?.find(d => d.layerId === l.layerId);
      if (matchedLayer) {
        matchedLayer.defaultColour = l.colourOverride;
      }
    });
    return layers;
  }

  // modified form galleryplayer
  getColour = (layer: Layer, clip: Clip) => {
    var overrideLayer = clip.clipDisplayLayers.flatMap(x => x.layerClipDisplayLayers).find(x => x.layerId === layer.layerId);
    if (overrideLayer) {
      return overrideLayer.colourOverride
    }

    return layer.defaultColour;
  }
}
