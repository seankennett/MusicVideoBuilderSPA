import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { Clip } from '../clip';
import { VideoService } from '../video.service';
import { UserLayer } from '../userlayer';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';

const beatsPerLayer = 4;
const millisecondsInMinute = 60000;

@Component({
  selector: 'app-videocomposer',
  templateUrl: './videocomposer.component.html',
  styleUrls: ['./videocomposer.component.scss']
})
export class VideoComposerComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private videoService: VideoService, private clipService: ClipService, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.videoService.getAll().pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((videos: Video[]) => {
      this.videos = videos
    });

    this.clipService.getAll().pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((clips: Clip[]) => {
      this.clips = clips
    });

    var self = this;
    this.audioPlayer.oncanplaythrough = function () {
      console.log(self.audioPlayer.duration);
    }
  }


  videos: Video[] = [];
  clips: Clip[] = [];
  Formats = Formats;
  formatList: Formats[] = [
    Formats.mp4,
    Formats.api,
    Formats.mov
  ]

  audioPlayer: HTMLAudioElement = new Audio();

  videoId: number = 0;

  videoNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]);
  bpmControl = this.formBuilder.control(null, [Validators.required, Validators.max(250), Validators.min(90)]);
  videoDelayMillisecondsControl = this.formBuilder.control(null, [Validators.max(2147483647), Validators.pattern("[0-9]+")]);
  formatControl = this.formBuilder.control(1, [Validators.required]);
  audioFileNameControl = this.formBuilder.control('', [Validators.pattern("([A-z0-9- \(\)]+(\.mp3))"), Validators.maxLength(50)]);
  clipsPerBlockControl = this.formBuilder.control(1);
  clipsFormArray = this.formBuilder.array([], [Validators.required]);


  videoForm = this.formBuilder.group({
    videoNameControl: this.videoNameControl,
    bpmControl: this.bpmControl,
    formatControl: this.formatControl,
    videoDelayMillisecondsControl: this.videoDelayMillisecondsControl,
    audioFileNameControl: this.audioFileNameControl,
    clipsFormArray: this.clipsFormArray,
    clipsPerBlockControl: this.clipsPerBlockControl
  })

  get clipsPerBlock() {
    return this.clipsPerBlockControl.value as number;
  }

  showEditor = false;
  showClipPicker = false;
  saving = false;
  activeTabId = 1;
  selectedClipIndex = 0;

  editVideo = (video: Video) => {
    console.log(video);
  }

  onSubmit = () => {
    this.saving = true;

    let video = <Video>{
      bpm: 90,
      format: Formats.mp4,
      videoId: 0,
      videoName: 'first',
      audioFileName: 'heavensAbove.mp3',
      videoDelayMilliseconds: 500,
      clips: [<Clip>{
        clipId: 10,
        clipName: 'abc',
        userLayers: [<UserLayer>{ layerName: 'something' }]
      },
      <Clip>{
        clipId: 11,
        clipName: 'def',
        userLayers: [<UserLayer>{ layerName: 'something' }]
      }
      ]
    };
    this.videoService.post(video).pipe(
      catchError((error: HttpErrorResponse) => {
        this.saving = false;
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe(video => {
      this.saving = false;
      if (this.videoId === 0) {
        this.videos.push(video);
      } else {
        let index = this.videos.findIndex(vid => vid.videoId === this.videoId);
        this.videos[index] = video;
      }
      this.toggleEditor();
    });
  }

  toggleEditor = () => {
    this.videoId = 0;
    this.videoNameControl.reset();
    // this.layersFormArray.clear();
    // this.isAddingLayer = false;
    this.showEditor = !this.showEditor;
  }

  toggleClipPicker = () => {
    this.showClipPicker = !this.showClipPicker;
  }

  setSelectedClipIndex = (index: number) => {
    this.selectedClipIndex = index;
  }

  canAddVideo = () => {
    return this.clips && this.clips.length > 0;
  }

  canAddVideoTooltip = () => {
    if (this.canAddVideo()) {
      return '';
    }

    return 'You must have a minimum of one clip';
  }

  bpmInvalidTooltip = () => {
    return !this.bpmControl.valid ? 'You must set bpm as a minimum to see timeline' : '';
  }

  onFileUpload = (event: any) => {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.audioPlayer.src = URL.createObjectURL(files[0]);
      this.audioFileNameControl.setValue(files[0].name);
    }
  }

  moveBack = (index: number) => {
    for (var i = index; i < index + this.clipsPerBlock; i++) {
      var clipControl = this.clipsFormArray.controls[i];
      if (clipControl !== undefined) {
        this.clipsFormArray.controls[i] = this.clipsFormArray.controls[i - this.clipsPerBlock];
        this.clipsFormArray.controls[i - this.clipsPerBlock] = clipControl;
      }
    }
  }

  moveForward = (index: number) => {
    for (var i = index; i < index + this.clipsPerBlock; i++) {
      var clipControl = this.clipsFormArray.controls[i];
      if (clipControl !== undefined) {
        this.clipsFormArray.controls[i] = this.clipsFormArray.controls[i + this.clipsPerBlock];
        this.clipsFormArray.controls[i + this.clipsPerBlock] = clipControl;
      }
    }
  }

  addClipPickerClip = (clip: Clip) => {
    this.toggleClipPicker();
    this.clipsFormArray.push(this.formBuilder.control(clip));
  }

  copyClip = (index: number) => {
    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.clipsFormArray.length) {
      endOfBlockIndex = this.clipsFormArray.length;
    }

    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      var clipControl = this.clipsFormArray.controls[i];
      this.clipsFormArray.insert(endOfBlockIndex, this.formBuilder.control(clipControl.value));
    }
  }

  removeClip = (index: number) => {
    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.clipsFormArray.length) {
      endOfBlockIndex = this.clipsFormArray.length;
    }

    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      this.clipsFormArray.removeAt(i);
    }
  }

  calculateBeatRangeFromClipIndex = (index: number) => {
    var beatStart = index * beatsPerLayer + 1;
    var beatEnd = index * beatsPerLayer + this.clipsPerBlock * beatsPerLayer;
    if (index + this.clipsPerBlock > this.clipsFormArray.length) {
      beatEnd = this.clipsFormArray.length * beatsPerLayer;
    }

    return beatStart + ' to ' + beatEnd;

  }

  calculateTimeRangeFromClipIndex = (index: number) => {
    var layerDuration = millisecondsInMinute / this.bpmControl.value * beatsPerLayer;
    var startTimeMilliseconds = (this.videoDelayMillisecondsControl.value ?? 0) + index * layerDuration;
    var startDate = new Date(0, 0, 0);
    startDate.setMilliseconds(startTimeMilliseconds);

    var endTimeMilliseconds = startTimeMilliseconds + this.clipsPerBlock * layerDuration;
    if (index + this.clipsPerBlock > this.clipsFormArray.length) {
      endTimeMilliseconds = this.clipsFormArray.length * layerDuration;
    }
    var endDate = new Date(0, 0, 0);
    endDate.setMilliseconds(endTimeMilliseconds);

    return this.datePipe.transform(startDate, 'HH:mm:ss.SSS') + ' to ' + this.datePipe.transform(endDate, 'HH:mm:ss.SSS');
  }

  calculateClipNameFromClipIndex = (index: number) => {
    var clipNameArray = [];
    for (var i = index; i < index + this.clipsPerBlock; i++) {
      var clipControl = this.clipsFormArray.controls[i];
      if (clipControl !== undefined) {
        clipNameArray.push(clipControl.value.clipName);
      }
    }

    return clipNameArray.join(", ");
  }

  getProgress = (index: number) => {
    if (index + this.clipsPerBlock <= this.selectedClipIndex){
      return 100;
    } else if (this.selectedClipIndex >= index && this.selectedClipIndex < index + this.clipsPerBlock){
        var remainderSelected = this.selectedClipIndex % this.clipsPerBlock;
        var clipNumberLeftInblock = this.clipsPerBlock
        if (index + this.clipsPerBlock > this.clipsFormArray.length){
          clipNumberLeftInblock = this.clipsFormArray.length - index;
        }
        return remainderSelected / clipNumberLeftInblock * 100;
    }

    return 0;
  }
}
