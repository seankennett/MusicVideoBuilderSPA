import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { Clip } from '../clip';
import { VideoService } from '../video.service';
import { catchError, throwError, timer, takeWhile } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, Location } from '@angular/common';
import { VideoplayerComponent } from '../videoplayer/videoplayer.component';
import { Userlayerstatus } from '../userlayerstatus';
import { UserLayer } from '../userlayer';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { guess } from 'web-audio-beat-detector';
import { VideoassetsService } from '../videoassets.service';
import { VideoAssets } from '../videoassets';
import { ActivatedRoute } from '@angular/router';
import { NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';

const beatsPerLayer = 4;
const millisecondsInSecond = 1000;
const secondsInMinute = 60;

const imageWidth = 384;
const imageHeight = 216;
const frameTotal = 64;

@Component({
  selector: 'app-musicvideobuilder',
  templateUrl: './musicvideobuilder.component.html',
  styleUrls: ['./musicvideobuilder.component.scss']
})
export class MusicVideoBuilderComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private videoService: VideoService, private clipService: ClipService, private videoAssetService: VideoassetsService,
    private datePipe: DatePipe, private route: ActivatedRoute, private location: Location) { }

  ngOnInit(): void {
    this.videoService.getAll().pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((videos: Video[]) => {
      this.clipService.getAll().pipe(
        catchError((error: HttpErrorResponse) => {
          alert('Something went wrong on the server, try again!');
          return throwError(() => new Error('Something went wrong on the server, try again!'));
        })
      ).subscribe((clips: Clip[]) => {
        var id = Number(this.route.firstChild?.snapshot?.params['id']);
        var tab = Number(this.route.firstChild?.snapshot?.queryParams['tab']);;
        if (!isNaN(id) && !isNaN(tab)) {
          var video = videos.find(x => x.videoId === id);
          if (video) {
            this.editVideo({ video: video, tab: tab }, 0);
          }
        }
        this.videos = videos;
        this.clips = clips
      });
    });
  }

  @ViewChild(VideoplayerComponent) videoplayer!: VideoplayerComponent;

  videos: Video[] = [];
  clips: Clip[] = [];
  Formats = Formats;
  formatList: Formats[] = [
    Formats.mp4,
    Formats.api,
    Formats.mov
  ]

  videoId: number = 0;
  setVideoId = (videoId: number, tabId: number | null) => {
    this.videoId = videoId;
    if (videoId === 0 || tabId === null) {
      this.location.replaceState('/musicVideoBuilder/');
    } else {
      this.setTabId(tabId);
    }
  }

  timelineEditorStart = 1;
  timelineEditorEnd = 2;

  timelineEditorStartFinal = 1;
  get timelineEditorStartFinalIndex() {
    return this.timelineEditorStartFinal - 1;
  }
  timelineEditorEndFinal = 2;
  get timelineEditorEndFinalIndex() {
    return this.timelineEditorEndFinal - 1;
  }

  timelineEndChange = (event: any) => {
    if (this.timelineEditorEnd <= this.timelineEditorStart) {
      event.preventDefault();
      this.timelineEditorEnd = this.timelineEditorStart + 1;
    }

    this.timelineEditorEndFinal = this.timelineEditorEnd;
    if (this.isInvalidSelection(this.clipsPerBlock)) {
      this.clipsPerBlock = 1;
    }
  }

  timelineStartChange = (event: any) => {
    if (this.timelineEditorStart >= this.timelineEditorEnd) {
      event.preventDefault();
      this.timelineEditorStart = this.timelineEditorEnd - 1;
    }

    this.timelineEditorStartFinal = this.timelineEditorStart;
    if (this.isInvalidSelection(this.clipsPerBlock)) {
      this.clipsPerBlock = 1;
    }
  }

  setTimelineStart = (start: number) => {
    this.timelineEditorStart = start;
    this.timelineEditorStartFinal = start;
  }

  setTimelineEnd = (end: number) => {
    this.timelineEditorEnd = end;
    this.timelineEditorEndFinal = end;
  }

  setQuickTimelineSelection = (index: number) => {
    this.setTimelineStart(index + 1);
    this.setTimelineEnd(index + 1 + this.clipsPerBlock);
    this.clipsPerBlock = 1;
  }

  isInvalidSelection = (clipsPerBlock: number) => {
    return this.timelineEditorEndFinalIndex !== this.clipsFormArray.length && (this.timelineEditorEndFinal - this.timelineEditorStartFinal) % clipsPerBlock !== 0;
  }

  getAlertText = (clipsPerBlock: number) => {
    return ' This timeline selection does not have a multiple of ' + clipsPerBlock + ' clips in it or timeline selection end is not at the end.  You will not be able to use setting ' + clipsPerBlock + ' clips per block.';
  }

  showBlock = (index: number) => {
    if (index < this.timelineEditorStartFinalIndex || index >= this.timelineEditorEndFinalIndex) {
      return false;
    }

    return index % this.clipsPerBlock === this.timelineEditorStartFinalIndex % this.clipsPerBlock;
  }

  videoNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]);
  bpmControl = this.formBuilder.control(null, [Validators.required, Validators.max(250), Validators.min(90)]);
  videoDelayMillisecondsControl = this.formBuilder.control(null, [Validators.max(2147483647), Validators.pattern("[0-9]+")]);
  formatControl = this.formBuilder.control(1, [Validators.required]);

  clipsFormArray = this.formBuilder.array([], [Validators.required, Validators.maxLength(32767)]);


  videoForm = this.formBuilder.group({
    videoNameControl: this.videoNameControl,
    bpmControl: this.bpmControl,
    formatControl: this.formatControl,
    videoDelayMillisecondsControl: this.videoDelayMillisecondsControl,
    clipsFormArray: this.clipsFormArray
  })

  clipsPerBlock = 1;

  showEditor = false;
  showClipPicker = false;
  saving = false;
  activeTabId = 1;
  selectedClipIndex = 0;

  isPlaying = false;

  setTabId = (activeTabId: number) => {
    this.location.replaceState('/musicVideoBuilder/' + this.videoId + '?tab=' + activeTabId);
    this.activeTabId = activeTabId;
  }

  navChange = (navEvent: NgbNavChangeEvent) => {
    this.location.replaceState('/musicVideoBuilder/' + this.videoId + '?tab=' + navEvent.nextId);
  }

  disableTimelineTab = () => {
    return !this.bpmControl.valid || !this.videoDelayMillisecondsControl.valid || this.generatingZip
  }

  editorLoading = false;
  unchangedVideo: Video = <Video>{};

  editVideo = (videoRoute: { video: Video, tab: number }, delay: number) => {
    this.editorLoading = true;
    // PLEASE WORK OUT HOW TO DO THIS PROPERLY!
    timer(delay).subscribe(() => {
      this.toggleEditor();
      this.setVideoId(videoRoute.video.videoId, videoRoute.tab);
      this.videoNameControl.setValue(videoRoute.video.videoName);
      this.bpmControl.setValue(videoRoute.video.bpm);
      this.formatControl.setValue(videoRoute.video.format);
      this.videoDelayMillisecondsControl.setValue(videoRoute.video.videoDelayMilliseconds);

      if (videoRoute.video.clips.length > 32) {
        this.clipsPerBlock = 16;
      }
      else if (videoRoute.video.clips.length > 8) {
        this.clipsPerBlock = 4;
      }

      this.setTimelineEnd(videoRoute.video.clips.length + 1);

      videoRoute.video.clips.forEach(cl => {
        var clip = this.clips.find(clip => clip.clipId === cl.clipId);
        if (clip) {
          this.clipsFormArray.push(this.formBuilder.control(clip));
        }
      });

      this.unchangedVideo = { ...this.editorVideo };

      this.editorLoading = false;
    });
  }

  noVideoEditorChanges = () => {
    return JSON.stringify(this.editorVideo) === JSON.stringify(this.unchangedVideo);
  }

  get editorVideo(): Video {
    return <Video>{
      bpm: this.bpmControl.value,
      format: this.formatControl.value,
      videoDelayMilliseconds: this.videoDelayMillisecondsControl.value,
      videoId: this.videoId,
      videoName: this.videoNameControl.value,
      clips: this.clipsFormArray.controls.map((control) => {
        return control.value;
      })
    };
  }

  get layersToBuy(): UserLayer[] {
    var layers = this.editorVideo.clips.flatMap(c => c.userLayers).filter(l => l.userLayerStatus === Userlayerstatus.Saved);
    return [...new Map(layers.map(item => [item.userLayerId, item])).values()]
  }

  get hasAllLayers(): boolean {
    return this.layersToBuy.length === 0;
  }

  onSubmit = () => {
    this.saving = true;
    this.stop();

    this.videoService.post(this.editorVideo).pipe(
      catchError((error: HttpErrorResponse) => {
        this.saving = false;
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe(video => {
      this.saving = false;
      if (this.videoId === 0) {
        this.videos.push(video);
        this.setVideoId(video.videoId, this.activeTabId);
        this.unchangedVideo = { ...this.editorVideo };
      } else {
        let index = this.videos.findIndex(vid => vid.videoId === this.videoId);
        this.videos[index] = video;
        this.unchangedVideo = { ...this.editorVideo };
      }
    });
  }

  toggleEditor = () => {
    this.setVideoId(0, null);
    this.videoNameControl.reset();
    this.bpmControl.reset();
    this.formatControl.setValue(1);
    this.clipsPerBlock = 1;
    this.videoDelayMillisecondsControl.reset();
    this.clipsFormArray.clear();
    this.setTimelineStart(1);
    this.setTimelineEnd(2);
    this.stop();
    this.setSelectedClipIndex(0);
    this.guessedBpm = null;
    this.guessedVideoDelay = null;

    this.activeTabId = 1;
    this.showClipPicker = false;
    this.showEditor = !this.showEditor;
  }

  toggleClipPicker = () => {
    this.stop();
    this.showClipPicker = !this.showClipPicker;
  }

  setSelectedClipIndex = (index: number) => {
    this.stop();
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

  noVideoEditorChangesTooltip = () => {
    return this.noVideoEditorChanges() ? '' : 'You have unsaved changes';
  }


  moveBack = (index: number) => {
    this.stop();
    for (var i = index; i < index + this.clipsPerBlock; i++) {
      var clipControl = this.clipsFormArray.controls[i];
      this.clipsFormArray.controls[i] = this.clipsFormArray.controls[i - this.clipsPerBlock];
      this.clipsFormArray.controls[i - this.clipsPerBlock] = clipControl;
      if (i === this.selectedClipIndex) {
        this.setSelectedClipIndex(i - this.clipsPerBlock);
      }
    }
  }

  moveForward = (index: number) => {
    this.stop();
    for (var i = index; i < index + this.clipsPerBlock; i++) {
      var clipControl = this.clipsFormArray.controls[i];
      this.clipsFormArray.controls[i] = this.clipsFormArray.controls[i + this.clipsPerBlock];
      this.clipsFormArray.controls[i + this.clipsPerBlock] = clipControl;
      if (i === this.selectedClipIndex) {
        this.setSelectedClipIndex(i + this.clipsPerBlock);
      }
    }
  }

  addClipPickerClip = (clip: Clip) => {
    var isTimelineAtEnd = this.timelineEditorEndFinalIndex === this.clipsFormArray.length;
    this.showClipPicker = false;
    this.clipsFormArray.push(this.formBuilder.control(clip));
    if (isTimelineAtEnd === true) {
      this.setTimelineEnd(this.clipsFormArray.length + 1)
    }
  }

  copyClip = (index: number) => {
    var isTimelineAtEnd = this.timelineEditorEndFinalIndex === this.clipsFormArray.length;
    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.clipsFormArray.length) {
      endOfBlockIndex = this.clipsFormArray.length;
    }

    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      var clipControl = this.clipsFormArray.controls[i];
      this.clipsFormArray.insert(endOfBlockIndex, this.formBuilder.control(clipControl.value));
    }

    this.stop();

    if (isTimelineAtEnd === true) {
      this.setTimelineEnd(this.clipsFormArray.length + 1)
    }
  }

  removeClip = (index: number) => {
    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.clipsFormArray.length) {
      endOfBlockIndex = this.clipsFormArray.length;
    }

    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      if (i === this.selectedClipIndex) {
        this.setSelectedClipIndex(0);
      } else if (i < this.selectedClipIndex) {
        this.setSelectedClipIndex(this.selectedClipIndex - 1);
      }
      this.clipsFormArray.removeAt(i);
    }

    this.stop();

    if (this.clipsFormArray.length === 0) {
      this.setTimelineEnd(2);
      this.setTimelineStart(1);
    } else {
      if (this.timelineEditorEndFinalIndex > this.clipsFormArray.length) {
        this.setTimelineEnd(this.clipsFormArray.length + 1);
      }

      if (this.timelineEditorStartFinalIndex >= this.clipsFormArray.length) {
        this.setTimelineStart(this.clipsFormArray.length);
      }
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
    var clipDurationMilliseconds = this._clipDurationSeconds * millisecondsInSecond;
    var videoDelay = (this.videoDelayMillisecondsControl.value ?? 0);
    var startTimeMilliseconds = videoDelay + index * clipDurationMilliseconds;
    var startDate = new Date(0, 0, 0);
    startDate.setMilliseconds(startTimeMilliseconds);

    var endTimeMilliseconds = startTimeMilliseconds + this.clipsPerBlock * clipDurationMilliseconds;
    var endDate = new Date(0, 0, 0);
    endDate.setMilliseconds(endTimeMilliseconds);

    if (index + this.clipsPerBlock > this.clipsFormArray.length) {
      var videoDurationMilliseconds = this._videoDurationSeconds * millisecondsInSecond + (this.videoDelayMillisecondsControl.value ?? 0);
      var endVideoDate = new Date(0, 0, 0);
      endVideoDate.setMilliseconds(videoDurationMilliseconds);
      endDate = endVideoDate;
    }

    return [startDate, endDate];
  }

  displayTimeLineTimeRangeFromClipIndex = (index: number) => {
    if (this.bpmControl.valid) {
      var dates = this.calculateTimeRangeFromClipIndex(index);
      return this.datePipe.transform(dates[0], 'HH:mm:ss.SSS') + ' to ' + this.datePipe.transform(dates[1], 'HH:mm:ss.SSS');
    }

    return '';
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

  getProgress = (index: number, playingClipIndex: number, percentageOfPlayingClipDuration: number) => {
    if (index + this.clipsPerBlock <= playingClipIndex) {
      return 100;
    } else if (playingClipIndex >= index && playingClipIndex < index + this.clipsPerBlock) {
      var clipsPastIndex = playingClipIndex - index;
      var clipsInBlock = this.clipsPerBlock
      if (index + this.clipsPerBlock > this.clipsFormArray.length) {
        clipsInBlock = this.clipsFormArray.length - index;
      }
      var weigthedPercentage = percentageOfPlayingClipDuration / clipsInBlock;

      return (clipsPastIndex / clipsInBlock + weigthedPercentage) * 100;
    }

    return 0;
  }

  private get _clipDurationSeconds() {
    return secondsInMinute / this.bpmControl.value * beatsPerLayer;
  }

  private get _videoDurationSeconds() {
    return this.clipsFormArray.length * this._clipDurationSeconds;
  }

  get playingClipIndex() {
    if (this.videoplayer) {
      return this.videoplayer.playingClipIndex;
    }

    return 0;
  }

  get percentageOfPlayingClipDuration() {
    if (this.videoplayer) {
      return this.videoplayer.percentageOfPlayingClipDuration;
    }

    return 0;
  }

  stop = () => {
    if (this.videoplayer) {
      this.videoplayer.stop();
    }
  }

  file: File | null = null;

  guessedBpm: number | null = null;
  guessedVideoDelay: number | null = null;
  guessingBpm = false;

  onFileUpload = (event: any) => {
    this.guessedBpm = null;
    this.guessedVideoDelay = null;
    this.stop();
    const files = (event.target as HTMLInputElement).files;

    if (files && files.length === 1) {
      this.includeAudioFile = true;
      this.videoplayer.audioPlayer.src = URL.createObjectURL(files[0]);
      this.file = files[0];
      this.guessingBpm = true;
      this.file.arrayBuffer().then(arrayBuffer => {
        const audioContext = new AudioContext();
        audioContext.decodeAudioData(arrayBuffer).then(audioBuffer => {
          guess(audioBuffer).then(({ bpm, offset }) => {
            this.guessingBpm = false;
            this.guessedBpm = { bpm, offset }.bpm;
            this.guessedVideoDelay = Math.round({ bpm, offset }.offset * millisecondsInSecond);
          })
            .catch((err) => {
              this.guessingBpm = false;
            });
        });
      });
    } else {
      this.videoplayer.audioPlayer = new Audio();
      this.file = null;
      this.includeAudioFile = false;
    }
  }

  includeCodeFiles = true;
  includeImageFiles = true;
  includeAudioFile = false;

  generatingZip = false;
  isGettingCode = false;
  isDownloadingZip = false;
  zipProgress = 0;
  freeDownload = async () => {

    this.generatingZip = true;
    this.isGettingCode = true;
    // call server to get ffmpeg code and send back asset ids (this should be accurate in memeory but better to have proper validation)
    this.videoAssetService.get(this.videoId, true, this.includeAudioFile ? this.file?.name : undefined, this.includeCodeFiles, this.includeImageFiles).pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        this.generatingZip = false;
        this.isGettingCode = false;
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((videoAssets: VideoAssets) => {
      var zip = new JSZip();
      if (this.includeAudioFile && this.file?.name) {
        zip.file(this.file.name, this.file)
      }

      if (this.includeCodeFiles === true) {
        zip.file('filter.txt', videoAssets.ffmpegCode.filterComplexScript);
        zip.file('command.txt', videoAssets.ffmpegCode.command);
      }

      var that = this;
      var imagePromises: any[] = [];
      if (this.includeImageFiles === true) {
        videoAssets.imageUrls.forEach((imageUrl) => {
          var folder = zip.folder(imageUrl.layerId);
          var imagePromise = new Promise((resolve) => {
            var spriteImage = new Image();
            spriteImage.crossOrigin = '*';
            spriteImage.onload = () => {
              var blobPromises = [];
              for (var i = 0; i < frameTotal; i++) {
                var blobPromise = new Promise((blobResolve) => {
                  var canvas = document.createElement("canvas");
                  var canvasContext = canvas.getContext("2d");

                  canvas.width = imageWidth;
                  canvas.height = imageHeight;

                  canvasContext?.drawImage(spriteImage, i * imageWidth, 0, imageWidth, imageHeight, 0, 0, imageWidth, imageHeight);

                  // stupid closures (i was always 63) without this
                  function toBlob(i: number) {
                    canvas.toBlob(blob => {
                      if (folder && blob) {
                        folder.file(i + '.png', blob);
                      }
                      that.zipProgress += 100 / videoAssets.imageUrls.length / frameTotal;
                      that.isGettingCode = false;
                      blobResolve("");
                    });
                  }

                  toBlob(i);
                });
                blobPromises.push(blobPromise);
              }

              Promise.all(blobPromises).then(x => resolve(""));
            }
            spriteImage.src = imageUrl.url;
          });
          imagePromises.push(imagePromise);
        });
      }

      Promise.all(imagePromises).then(async x => {
        this.isDownloadingZip = true;
        await zip.generateAsync({ type: "blob" }).then(function (content) {
          // see FileSaver.js
          saveAs(content, videoAssets.videoName + ".zip");
          that.generatingZip = false;
          that.isDownloadingZip = false;
          that.zipProgress = 0;
        });
      });
    });
  }

  download = () => {
    alert('purchased download ' + this.videoId);
  }

  buyMissingLayers = () => {
    alert('buy missing layers ' + this.videoId);
  }
}
