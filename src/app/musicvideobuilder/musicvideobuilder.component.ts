import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { Clip } from '../clip';
import { VideoService } from '../video.service';
import { catchError, throwError, timer, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, Location } from '@angular/common';
import { VideoplayerComponent } from '../videoplayer/videoplayer.component';
import { Resolution } from '../resolution';
import { UserLayer } from '../userlayer';
import { guess } from 'web-audio-beat-detector';
import { VideoassetsService } from '../videoassets.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { BlockBlobClient } from '@azure/storage-blob';
import { UserlayerService } from '../userlayer.service';
import { ToastService } from '../toast.service';
import { License } from '../license';
import { Layer } from '../layer';
import { Videobuildrequest } from '../videobuildrequest';
import { Videoasset } from '../videoasset';
import { Buildstatus } from '../buildstatus';

const millisecondsInSecond = 1000;
const secondsInMinute = 60;

const timelineImageWidth = 128;
const frameTotal = 64;

const byteMultiplier = 1024;

@Component({
  selector: 'app-musicvideobuilder',
  templateUrl: './musicvideobuilder.component.html',
  styleUrls: ['./musicvideobuilder.component.scss']
})
export class MusicVideoBuilderComponent implements OnInit {
  constructor(private formBuilder: FormBuilder, private videoService: VideoService, private clipService: ClipService, private videoAssetService: VideoassetsService,
    private datePipe: DatePipe, private route: ActivatedRoute, private location: Location, private userLayerService: UserlayerService, private toastService: ToastService, private router: Router) { }

  ngOnInit(): void {
    this.videoService.getAll().subscribe((videos: Video[]) => {
      this.clipService.getAll().subscribe((clips: Clip[]) => {
        this.userLayerService.getAll().subscribe((userLayers: UserLayer[]) => {
          this.videoService.getAllAssets().subscribe((videoAssets: Videoasset[]) => {
            this.videoAssets = videoAssets;
            var id = Number(this.route.firstChild?.snapshot?.params['id']);
            var tab = Number(this.route.firstChild?.snapshot?.queryParams['tab']);;
            if (!isNaN(id) && !isNaN(tab)) {
              var video = videos.find(x => x.videoId === id);
              if (video) {
                this.editVideo({ video: video, tab: tab }, 0);
              }
            }
            this.videos = videos;
            this.clips = clips;
            this.userLayers = userLayers;
            this.pageLoading = false;
          });
        });
      });
    });
  }

  storageUrl = environment.storageUrl;

  pageLoading = true;

  @ViewChild(VideoplayerComponent) videoplayer!: VideoplayerComponent;

  videos: Video[] = [];
  clips: Clip[] = [];
  userLayers: UserLayer[] = [];
  videoAssets: Videoasset[] = [];

  Formats = Formats;
  resolutionList = [{
    displayName: 'Free (384x216)',
    userLayerStatus: Resolution.Free
  }, {
    displayName: 'HD (1920x1080)',
    userLayerStatus: Resolution.Hd
  }, {
    displayName: '4K (3840x2160)',
    userLayerStatus: Resolution.FourK
  }];

  resolutionChange = () => {
    if (this.resolutionControl.value === Resolution.Free) {
      this.licenseControl.setValue(License.Personal);
      this.licenseList = [License.Personal];
    } else {
      this.licenseList = [License.Personal, License.Standard, License.Enhanced];
    }
  }

  License = License;
  licenseList = [License.Personal]


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

  get isBuilding(){
    return this.videoAssets.some(va => va.videoId === this.videoId && (va.buildStatus === Buildstatus.BuildingPending || va.buildStatus === Buildstatus.PaymentChargePending));
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
  }, { validators: videoLengthValidator })

  resolutionControl = this.formBuilder.control(Resolution.Free, [Validators.required]);
  licenseControl = this.formBuilder.control(License.Personal, [Validators.required]);
  builderForm = this.formBuilder.group({
    resolutionControl: this.resolutionControl,
    licenseControl: this.licenseControl
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
    return !this.bpmControl.valid || !this.videoDelayMillisecondsControl.valid || this.isWaitingForCreate
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

  get unlicensedLayers(): Layer[] {
    return this.getUnlicensedLayers(this.editorVideo, this.resolutionControl.value, this.licenseControl.value);
  }

  getUnlicensedLayers = (video: Video, resolution: Resolution, license: License) => {
    var licensedLayers = this.userLayers.filter(u => u.resolution == resolution && u.license == license);
    var unlicensedLayers = video.clips.filter(c => c.layers != null).flatMap(c => c.layers).filter(l => !licensedLayers.some(ll => ll.layerId === l.layerId));
    return [...new Map(unlicensedLayers.map(item => [item.layerId, item])).values()]
  }

  saveVideo = () => {
    this.saving = true;
    this.stop();

    this.videoService.post(this.editorVideo).pipe(
      catchError((error: HttpErrorResponse) => {
        this.saving = false;
        return throwError(() => new Error());
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
    this.file = null;
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

  calculateLeft = (startingBeat: number) => {
    return -(startingBeat - 1) * frameTotal / 4 * timelineImageWidth;
  }

  calculateBeatRangeFromClipIndex = (index: number) => {
    if (this.clipsFormArray.controls.length === 0) {
      return '';
    }

    var beatsBefore = this.clipsFormArray.controls.slice(0, index).map(c => (c.value as Clip).beatLength).reduce((accumulator, current) => accumulator + current, 0);
    var beatStart = beatsBefore + 1;

    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.clipsFormArray.length) {
      endOfBlockIndex = this.clipsFormArray.length;
    }

    var beatEnd = beatsBefore;
    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      beatEnd += (this.clipsFormArray.controls[i].value as Clip).beatLength;
    }

    return beatStart + ' to ' + beatEnd;
  }

  calculateTimeRangeFromClipIndex = (index: number) => {
    var videoDelay = (this.videoDelayMillisecondsControl.value ?? 0);

    var beatTimeMilliseconds = secondsInMinute * millisecondsInSecond / this.bpmControl.value;
    var startTimeMilliseconds = videoDelay + this.clipsFormArray.controls.slice(0, index).map(c => beatTimeMilliseconds * (c.value as Clip).beatLength).reduce((accumulator, current) => accumulator + current, 0);
    var startDate = new Date(0, 0, 0);
    startDate.setMilliseconds(startTimeMilliseconds);

    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.clipsFormArray.length) {
      endOfBlockIndex = this.clipsFormArray.length;
    }

    var endTimeMilliseconds = startTimeMilliseconds;
    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      endTimeMilliseconds += (this.clipsFormArray.controls[i].value as Clip).beatLength * beatTimeMilliseconds;
    }

    var endDate = new Date(0, 0, 0);
    endDate.setMilliseconds(endTimeMilliseconds);

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

  maximumAudioFileSizeMB = 40

  onFileUpload = (event: any) => {
    this.guessedBpm = null;
    this.guessedVideoDelay = null;
    this.stop();
    const uploadedFiles = (event.target as HTMLInputElement).files;

    if (uploadedFiles && uploadedFiles.length === 1) {
      if ((Math.round((uploadedFiles[0].size / byteMultiplier / byteMultiplier) * 100 + Number.EPSILON) / 100) < this.maximumAudioFileSizeMB && uploadedFiles[0].name.endsWith('.mp3')) {
        this.file = uploadedFiles[0];
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
      }
      else {
        this.toastService.show('Invalid audio file.  It must be an mp3 and under 40MB.', this.router.url);
        this.file = null;
        event.target.value = null;
      }
    } else {
      this.file = null;
      event.target.value = null;
    }
  }

  isWaitingForCreate = false;
  isUploadingAudio = false;

  checkout = () => {
    var resolution = this.resolutionControl.value;
    var license = this.licenseControl.value;
    var buildId = (<any>crypto).randomUUID();
    if (resolution === Resolution.Free) {
      let videoBuildRequest: Videobuildrequest = { resolution, buildId };
      this.isWaitingForCreate = true;
      if (this.file?.name) {
        this.isUploadingAudio = true;
        this.videoAssetService.createAudioBlobUri(this.videoId, videoBuildRequest)
          .pipe(catchError((error: HttpErrorResponse) => {
            this.isWaitingForCreate = false;
            this.isUploadingAudio = false;
            return throwError(() => new Error());
          }))
          .subscribe(blockBlobSasUrl => {
            var blockBlobClient = new BlockBlobClient(blockBlobSasUrl);
            if (this.file) {
              blockBlobClient.uploadData(this.file).then(uploadResponse => {
                this.videoAssetService.create(this.videoId, videoBuildRequest)
                  .pipe(catchError((error: HttpErrorResponse) => {
                    this.isWaitingForCreate = false;
                    this.isUploadingAudio = false;
                    return throwError(() => new Error());
                  }))
                  .subscribe(videoAsset => {
                    this.videoAssets.push(videoAsset);
                    this.unchangedVideo = { ...this.editorVideo };
                    this.isWaitingForCreate = false;
                    this.isUploadingAudio = false;
                  });
              }).catch(error => {
                this.toastService.show('Problem uploading audio file to storage.', this.router.url);
                this.isWaitingForCreate = false;
                this.isUploadingAudio = false;
              });
            }
          });
      } else {
        this.videoAssetService.create(this.videoId, videoBuildRequest)
          .pipe(catchError((error: HttpErrorResponse) => {
            this.isWaitingForCreate = false;
            return throwError(() => new Error());
          }))
          .subscribe(videoAsset => {
            this.videoAssets.push(videoAsset);
            this.isWaitingForCreate = false;
          });
      }
    }

  }

  get buildCost() {
    return (this.resolutionControl.value - 1) * 5;
  }

  get layerLicenseCost() {
    var layerResolutionCost = 0;
    switch (this.resolutionControl.value) {
      case Resolution.Hd:
        layerResolutionCost = 25;
        break;
      case Resolution.FourK:
        layerResolutionCost = 50;
        break;
    }

    return layerResolutionCost * this.licenseFactor(this.licenseControl.value);
  }

  get layerLicensesCost() {
    return this.layerLicenseCost * this.unlicensedLayers.length;
  }

  licenseFactor = (license: License) => {
    switch (license) {
      case License.Standard:
        return 1;
      case License.Enhanced:
        return 3;
      default:
        return 0;
    }
  }

  get total() {
    if (this.resolutionControl.value === Resolution.Free) {
      return 0;
    }

    return this.buildCost + this.layerLicensesCost;
  }

  buyMissingLayers = (resolution: Resolution) => {
    //this.buyUserLayers(this.missingLayers, resolution);
  }

  buyUserLayers = (userLayers: UserLayer[], resolution: Resolution) => {
    // var userLayerUpdates = [];
    // for (var i = 0; i < userLayers.length; i++) {
    //   var missingUserLayer = userLayers[i];
    //   missingUserLayer.userLayerStatus = resolution;
    //   userLayerUpdates.push(this.userLayerService.put(missingUserLayer));
    // }

    // forkJoin(userLayerUpdates).subscribe(userLayers => {
    //   window.location.reload();
    // })
  }
}

const maximumVideoLengthMinutes = 15
export function videoLengthValidator(formGroup: FormGroup): ValidationErrors | null {
  var bpmControl = formGroup.get('bpmControl');
  if (!bpmControl || bpmControl.invalid) {
    return { noBpm: true };
  }

  var clipsFormArray = formGroup.get('clipsFormArray') as FormArray;
  if (!clipsFormArray || clipsFormArray.invalid) {
    return { noClips: true };
  }

  var totalAllowedBeats = maximumVideoLengthMinutes * bpmControl.value;
  if (totalAllowedBeats < clipsFormArray.controls.map(c => c.value.beatLength as number).reduce((a, c) => a + c, 0)) {
    return { videoTooLong: maximumVideoLengthMinutes }
  }

  return null;
}
