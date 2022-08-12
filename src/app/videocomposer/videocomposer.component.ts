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

@Component({
  selector: 'app-videocomposer',
  templateUrl: './videocomposer.component.html',
  styleUrls: ['./videocomposer.component.scss']
})
export class VideoComposerComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private videoService: VideoService, private clipService: ClipService) { }

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
  //layersFormArray = this.formBuilder.array([], [Validators.required])

  videoForm = this.formBuilder.group({
    videoNameControl: this.videoNameControl,
    bpmControl: this.bpmControl,
    formatControl: this.formatControl,
    videoDelayMillisecondsControl: this.videoDelayMillisecondsControl
    //layersFormArray: this.layersFormArray
  })

  showEditor = false;
  saving = false;

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

  canAddVideo = () => {
    return this.clips && this.clips.length > 0;
  }

  canAddVideoTooltip = () => {
    if (this.canAddVideo()) {
      return 'You must have a minimum of one clip';
    }

    return '';
  }

  onFileUpload = (event: any) => {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.audioPlayer.src = URL.createObjectURL(files[0]);

    }
  }
}
