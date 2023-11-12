import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { Clip } from '../clip';
import { VideoService } from '../video.service';
import { catchError, throwError, timer } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, Location } from '@angular/common';
import { VideoplayerComponent } from '../videoplayer/videoplayer.component';
import { Resolution } from '../resolution';
import { UserCollection } from '../usercollection';
import { guess } from 'web-audio-beat-detector';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { BlockBlobClient } from '@azure/storage-blob';
import { UserCollectionService } from '../usercollection.service';
import { ToastService } from '../toast.service';
import { License } from '../license';
import { Videobuildrequest } from '../videobuildrequest';
import { Buildasset } from '../buildasset';
import { Buildstatus } from '../buildstatus';
import { StripeCardElementOptions, StripeElementsOptions } from '@stripe/stripe-js';
import { StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { BuildsService } from '../builds.service';
import { CollectionService } from '../collection.service';
import { Collection } from '../collection';
import { Videoclip } from '../videoclip';
import { AudiofileService } from '../audiofile.service';
import { AudiomodalComponent } from '../audiomodal/audiomodal.component';
import { ClipinfoComponent } from '../clipinfo/clipinfo.component';
import { SubscriptionService } from '../subscription.service';
import { Subscriptionproduct } from '../subscriptionproduct';
import { Subscriptionproducts } from '../subscriptionproducts';
import { ConfirmationmodalComponent } from '../confirmationmodal/confirmationmodal.component';

const millisecondsInSecond = 1000;
const secondsInMinute = 60;

const frameTotal = 64;
const byteMultiplier = 1024;

@Component({
  selector: 'app-musicvideobuilder',
  templateUrl: './musicvideobuilder.component.html',
  styleUrls: ['./musicvideobuilder.component.scss']
})
export class MusicVideoBuilderComponent implements OnInit {
  constructor(private formBuilder: FormBuilder, private videoService: VideoService, private clipService: ClipService, private buildService: BuildsService, private collectionService: CollectionService,
    private datePipe: DatePipe, private route: ActivatedRoute, private location: Location, private userCollectionService: UserCollectionService, private toastService: ToastService, private router: Router,
    private stripeService: StripeService, public audioFileService: AudiofileService, private modalService: NgbModal, private subscriptionService: SubscriptionService) { }

  ngOnInit(): void {
    this.videoService.getAll().subscribe((videos: Video[]) => {
      this.clipService.getAll().subscribe((clips: Clip[]) => {
        this.collectionService.getAll().subscribe((collections: Collection[]) => {
          this.userCollectionService.getAll().subscribe((userCollections: UserCollection[]) => {
            this.buildService.getAll().subscribe((buildAssets: Buildasset[]) => {
              this.subscriptionService.get(true).subscribe((subscriptionProduct: Subscriptionproduct | null) => {
                this.subscriptionProduct = subscriptionProduct;
                this.buildAssets = buildAssets;
                var id = Number(this.route.firstChild?.snapshot?.params['id']);
                var tab = Number(this.route.firstChild?.snapshot?.queryParams['tab']);
                if (!isNaN(id) && !isNaN(tab)) {
                  var video = videos.find(x => x.videoId === id);
                  if (video) {
                    this.editVideo({ video: video, tab: tab }, 0);
                  }
                }
                this.videos = videos;
                this.clips = clips;
                this.collections = collections;
                this.userCollections = userCollections;

                this.pageLoading = false;
              });
            });
          });
        });
      });
    });
  }

  storageUrl = environment.storageUrl;
  timelineImageWidth = 128;
  timelineImageHeight = 72;
  pageLoading = true;

  @ViewChild(VideoplayerComponent) videoplayer!: VideoplayerComponent;
  @ViewChild('audioFile') set content(content: ElementRef) {
    if (content?.nativeElement?.files.length === 0 && this.audioFileService.file) {
      console.log('file exists');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(this.audioFileService.file);
      content.nativeElement.files = dataTransfer.files;
    }
  }

  videos: Video[] = [];
  clips: Clip[] = [];
  userCollections: UserCollection[] = [];
  buildAssets: Buildasset[] = [];
  collections: Collection[] = [];
  subscriptionProduct: Subscriptionproduct | null = null;

  Formats = Formats;
  resolutionList = [{
    displayName: 'Free (384x216)',
    resolution: Resolution.Free
  }, {
    displayName: 'HD (1920x1080)',
    resolution: Resolution.Hd
  }, {
    displayName: '4K (3840x2160)',
    resolution: Resolution.FourK
  }];

  resolutionChange = () => {
    if (this.resolutionControl.value === Resolution.Free) {
      this.licenseControl.setValue(License.Personal);
      this.licenseList = [License.Personal];
    } else {
      this.licenseList = [License.Personal, License.Standard, License.Enhanced];
    }
  }

  get canLicense() {
    return this.editorVideoClipsFull.some(e => e.clipDisplayLayers != null);
  }

  License = License;
  licenseList = [License.Personal]


  formatList: Formats[] = [
    Formats.mp4,
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

  get isBuilding() {
    return this.buildAssets.some(ba => ba.videoId === this.videoId && (ba.buildStatus === Buildstatus.BuildingPending || ba.buildStatus === Buildstatus.PaymentChargePending));
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
    this.setTimelineEnd(this.videoClipsFormArray.length + 1 < index + 1 + this.clipsPerBlock ? this.videoClipsFormArray.length + 1 : index + 1 + this.clipsPerBlock);
    this.clipsPerBlock = 1;
  }

  zoomOut = () => {
    this.setTimelineStart(1);
    this.setTimelineEnd(this.videoClipsFormArray.length + 1);
    this.clipsPerBlock = this.clipsPerBlock === 1 ? 4 : 16;
  }

  isInvalidSelection = (clipsPerBlock: number) => {
    return this.timelineEditorEndFinalIndex !== this.videoClipsFormArray.length && (this.timelineEditorEndFinal - this.timelineEditorStartFinal) % clipsPerBlock !== 0;
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

  showClipInfo = (clip: Clip) => {
    let modal = this.modalService.open(ClipinfoComponent, { size: 'xl' });
    modal.componentInstance.clip = clip;
  }

  videoNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9_-]+")]);
  bpmControl = this.formBuilder.control(null, [Validators.required, Validators.max(250), Validators.min(90)]);
  videoDelayMillisecondsControl = this.formBuilder.control(null, [Validators.max(2147483647), Validators.pattern("[0-9]+")]);
  formatControl = this.formBuilder.control(1, [Validators.required]);

  videoClipsFormArray = this.formBuilder.array([], [Validators.required, Validators.maxLength(32767)]);


  videoForm = this.formBuilder.group({
    videoNameControl: this.videoNameControl,
    bpmControl: this.bpmControl,
    formatControl: this.formatControl,
    videoDelayMillisecondsControl: this.videoDelayMillisecondsControl,
    videoClipsFormArray: this.videoClipsFormArray
  }, { validators: videoLengthValidator(() => this.clips) })

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
  selectedClipEditIndex = 0;
  isAdding = false;

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

      if (videoRoute.video.videoClips.length > 32) {
        this.clipsPerBlock = 16;
      }
      else if (videoRoute.video.videoClips.length > 8) {
        this.clipsPerBlock = 4;
      }

      this.setTimelineEnd(videoRoute.video.videoClips.length + 1);

      videoRoute.video.videoClips.forEach(vc => {
        this.videoClipsFormArray.push(this.formBuilder.control(vc));
      });

      this.unchangedVideo = { ...this.editorVideo };

      this.editorLoading = false;
    });
  }

  noVideoEditorChanges = () => {
    return JSON.stringify(this.editorVideo) === JSON.stringify(this.unchangedVideo);
  }

  get unableToSave() {
    return !this.videoForm.valid || this.saving || this.isWaitingForCreate || this.noVideoEditorChanges();
  }

  get editorVideo(): Video {
    return <Video>{
      bpm: this.bpmControl.value,
      format: this.formatControl.value,
      videoDelayMilliseconds: this.videoDelayMillisecondsControl.value,
      videoId: this.videoId,
      videoName: this.videoNameControl.value,
      videoClips: this.videoClipsFormArray.controls.map((control) => {
        return control.value;
      })
    };
  }

  get editorVideoClipsFull(): Clip[] {
    return this.editorVideo.videoClips.map(vc => this.clips.find(c => c.clipId == vc.clipId) ?? <Clip>{});
  }

  get videoCollections(): Collection[] {
    var allVideoDisplayLayerIds = this.editorVideoClipsFull.filter(c => c.clipDisplayLayers != null).flatMap(c => c.clipDisplayLayers).map(c => c.displayLayerId).filter((value, index, self) => self.indexOf(value) === index);
    return this.collections.filter(c => c.displayLayers.some(d => allVideoDisplayLayerIds.includes(d.displayLayerId)));
  }

  private get licensedUserCollections(): UserCollection[] {
    return this.userCollections.filter(u => u.resolution == this.resolutionControl.value && u.license == this.licenseControl.value);
  }

  get licensedCollections(): Collection[] {
    return this.videoCollections.filter(v => this.licensedUserCollections.some(l => l.collectionId === v.collectionId));
  }

  private get unlicensedCollections(): Collection[] {
    return this.videoCollections.filter(v => !this.licensedUserCollections.some(l => l.collectionId === v.collectionId));
  }

  getCollectionLicenseCost = (videoCollection: Collection) => {
    return this.licensedCollections.some(l => l.collectionId === videoCollection.collectionId) ? 0 : this.collectionLicenseCost
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

  exitEditor = () => {
    if (this.unableToSave === false) {
      this.modalService.open(ConfirmationmodalComponent, { centered: true }).result.then(
        (succes) => {
          this.toggleEditor();
        });
    } else {
      this.toggleEditor();
    }
  }

  toggleEditor = () => {
    this.setVideoId(0, null);
    this.videoNameControl.reset();
    this.bpmControl.reset();
    this.formatControl.setValue(1);
    this.clipsPerBlock = 1;
    this.videoDelayMillisecondsControl.reset();
    this.videoClipsFormArray.clear();
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

  toggleClipPicker = (index: number) => {
    this.stop();
    this.showClipPicker = !this.showClipPicker;
    this.selectedClipEditIndex = index;
    this.isAdding = this.selectedClipEditIndex === this.videoClipsFormArray.length;
  }

  toggleAddClipPicker = (index: number) => {
    this.toggleClipPicker(index + 1);
    this.isAdding = true;
  }

  setSelectedClipIndex = (index: number) => {
    this.stop();
    this.selectedClipIndex = index;
  }

  canAddVideo = () => {
    return this.clips && this.clips.length > 0 && this.videos.length < 2;
  }

  canAddVideoTooltip = () => {
    if (this.canAddVideo()) {
      return '';
    }

    return 'You must have a minimum of one clip and a maximum of 2 videos';
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
      var videoClipControl = this.videoClipsFormArray.controls[i];
      this.videoClipsFormArray.controls[i] = this.videoClipsFormArray.controls[i - this.clipsPerBlock];
      this.videoClipsFormArray.controls[i - this.clipsPerBlock] = videoClipControl;
      if (i === this.selectedClipIndex) {
        this.setSelectedClipIndex(i - this.clipsPerBlock);
      }
    }
  }

  moveForward = (index: number) => {
    this.stop();
    for (var i = index; i < index + this.clipsPerBlock; i++) {
      var videoClipControl = this.videoClipsFormArray.controls[i];
      this.videoClipsFormArray.controls[i] = this.videoClipsFormArray.controls[i + this.clipsPerBlock];
      this.videoClipsFormArray.controls[i + this.clipsPerBlock] = videoClipControl;
      if (i === this.selectedClipIndex) {
        this.setSelectedClipIndex(i + this.clipsPerBlock);
      }
    }
  }

  addClipPickerClip = (clip: Clip) => {
    var videoClip = <Videoclip>{
      clipId: clip.clipId
    }
    this.showClipPicker = false;
    var isTimelineAtEnd = this.timelineEditorEndFinalIndex === this.videoClipsFormArray.length;
    if (this.selectedClipEditIndex === this.videoClipsFormArray.length) {
      this.videoClipsFormArray.push(this.formBuilder.control(videoClip));
    } else if (this.isAdding === true) {
      var newControl = this.formBuilder.control(videoClip);
      this.videoClipsFormArray.insert(this.selectedClipEditIndex, newControl);
    } else {
      var existingControl = this.videoClipsFormArray.controls[this.selectedClipEditIndex];
      existingControl.patchValue(videoClip);
    }

    if (isTimelineAtEnd === true) {
      this.setTimelineEnd(this.videoClipsFormArray.length + 1)
    }
  }

  copyClip = (index: number, isAddToEnd: boolean) => {
    var isTimelineAtEnd = this.timelineEditorEndFinalIndex === this.videoClipsFormArray.length;
    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.videoClipsFormArray.length) {
      endOfBlockIndex = this.videoClipsFormArray.length;
    }

    var insertIndex = endOfBlockIndex;
    if (isAddToEnd === true) {
      insertIndex = this.videoClipsFormArray.length;
    }

    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      var videoClipControl = this.videoClipsFormArray.controls[i];
      this.videoClipsFormArray.insert(insertIndex, this.formBuilder.control(videoClipControl.value));
    }

    this.stop();

    if (isTimelineAtEnd === true) {
      this.setTimelineEnd(this.videoClipsFormArray.length + 1)
    }
  }

  removeClip = (index: number) => {
    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.videoClipsFormArray.length) {
      endOfBlockIndex = this.videoClipsFormArray.length;
    }

    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      if (i === this.selectedClipIndex) {
        this.setSelectedClipIndex(0);
      } else if (i < this.selectedClipIndex) {
        this.setSelectedClipIndex(this.selectedClipIndex - 1);
      }
      this.videoClipsFormArray.removeAt(i);
    }

    this.stop();

    if (this.videoClipsFormArray.length === 0) {
      this.setTimelineEnd(2);
      this.setTimelineStart(1);
    } else {
      if (this.timelineEditorEndFinalIndex > this.videoClipsFormArray.length) {
        this.setTimelineEnd(this.videoClipsFormArray.length + 1);
      }

      if (this.timelineEditorStartFinalIndex >= this.videoClipsFormArray.length) {
        this.setTimelineStart(this.videoClipsFormArray.length);
      }
    }
  }

  get displayLayers() {
    return this.collections.flatMap(c => c.displayLayers).filter(d => this.clips.filter(c => c.clipDisplayLayers).flatMap(c => c.clipDisplayLayers).some(cd => cd.displayLayerId === d.displayLayerId));
  }

  getClip = (videoClip: Videoclip) => {
    return this.clips.find(c => c.clipId === videoClip.clipId) ?? <Clip>{};
  }

  getLeft = (clip: Clip) => {
    return -(clip.startingBeat - 1) * frameTotal / 4 * this.timelineImageWidth;
  }

  calculateClipNumber = (index: number) => {
    var start = index + 1;
    if (this.clipsPerBlock > 1) {
      var end = index + this.clipsPerBlock;
      if (end >= this.videoClipsFormArray.length) {
        if (end - this.videoClipsFormArray.length === this.clipsPerBlock - 1) {
          return start;
        }
        end = this.videoClipsFormArray.length;
      }
      return start + ' - ' + end;
    }
    return start;
  }

  calculateBeatRangeFromClipIndex = (index: number) => {
    if (this.videoClipsFormArray.controls.length === 0) {
      return '';
    }

    var beatLengthToIndex = this.videoClipsFormArray.controls.slice(0, index).map(c => {
      var videoClip = c.value as Videoclip
      return this.clips.find(c => c.clipId == videoClip.clipId)?.beatLength ?? 0;
    });

    var beatsBefore = beatLengthToIndex.reduce((accumulator, current) => accumulator + current, 0);
    var beatStart = beatsBefore + 1;

    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.videoClipsFormArray.length) {
      endOfBlockIndex = this.videoClipsFormArray.length;
    }

    var beatEnd = beatsBefore;
    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      var videoClip = this.videoClipsFormArray.controls[i].value as Videoclip
      beatEnd += this.clips.find(c => c.clipId === videoClip.clipId)?.beatLength ?? 0;
    }

    return beatStart + ' to ' + beatEnd;
  }

  calculateTimeRangeFromClipIndex = (index: number) => {
    var videoDelay = (this.videoDelayMillisecondsControl.value ?? 0);

    var beatTimeMilliseconds = secondsInMinute * millisecondsInSecond / this.bpmControl.value;
    var timesToIndex = this.videoClipsFormArray.controls.slice(0, index).map(c => {
      var videoClip = c.value as Videoclip
      return (this.clips.find(c => c.clipId == videoClip.clipId)?.beatLength ?? 0) * beatTimeMilliseconds;
    });
    var startTimeMilliseconds = videoDelay + timesToIndex.reduce((accumulator, current) => accumulator + current, 0);
    var startDate = new Date(0, 0, 0);
    startDate.setMilliseconds(startTimeMilliseconds);

    var endOfBlockIndex = index + this.clipsPerBlock;
    if (endOfBlockIndex > this.videoClipsFormArray.length) {
      endOfBlockIndex = this.videoClipsFormArray.length;
    }

    var endTimeMilliseconds = startTimeMilliseconds;
    for (var i = endOfBlockIndex - 1; i >= index; i--) {
      var videoClip = this.videoClipsFormArray.controls[i].value as Videoclip
      endTimeMilliseconds += (this.clips.find(c => c.clipId === videoClip.clipId)?.beatLength ?? 0) * beatTimeMilliseconds;
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
      var videoClipControl = this.videoClipsFormArray.controls[i];
      if (videoClipControl !== undefined) {
        clipNameArray.push(this.getClip(videoClipControl.value).clipName);
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
      if (index + this.clipsPerBlock > this.videoClipsFormArray.length) {
        clipsInBlock = this.videoClipsFormArray.length - index;
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
        this.audioFileService.file = uploadedFiles[0];
        this.guessingBpm = true;
        this.audioFileService.file.arrayBuffer().then(arrayBuffer => {
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
        this.audioFileService.file = null;
        event.target.value = null;
      }
    } else {
      this.audioFileService.file = null;
      event.target.value = null;
    }
  }

  isWaitingForCreate = false;
  isUploadingAudio = false;

  createFreeVideo = () => {
    var resolution = this.resolutionControl.value;
    var license = this.licenseControl.value;
    var buildId = (<any>crypto).randomUUID();
    let videoBuildRequest: Videobuildrequest = { resolution, buildId, license };

    if (this.audioFileService.file !== null) {
      this.uploadAudio(videoBuildRequest, this.freeVideoSuccessCallback);
    } else {
      this.modalService.open(AudiomodalComponent, { centered: true }).closed.subscribe(x => {
        this.uploadAudio(videoBuildRequest, this.freeVideoSuccessCallback);
      });
    }
  }

  private uploadAudio = (videoBuildRequest: Videobuildrequest, successAction: (videoBuildRequest: Videobuildrequest) => void) => {
    this.isWaitingForCreate = true;
    if (this.audioFileService.file?.name) {
      this.isUploadingAudio = true;
      this.buildService.createAudioBlobUri(this.videoId, videoBuildRequest)
        .pipe(catchError((error: HttpErrorResponse) => {
          this.isWaitingForCreate = false;
          this.isUploadingAudio = false;
          return throwError(() => new Error());
        }))
        .subscribe(blockBlobSasUrl => {
          var blockBlobClient = new BlockBlobClient(blockBlobSasUrl);
          if (this.audioFileService.file) {
            blockBlobClient.uploadData(this.audioFileService.file).then(uploadResponse => {
              this.buildService.validateAudioBlob(this.videoId, videoBuildRequest)
                .pipe(catchError((error: HttpErrorResponse) => {
                  this.isWaitingForCreate = false;
                  this.isUploadingAudio = false;
                  return throwError(() => new Error());
                }))
                .subscribe(() => {
                  successAction(videoBuildRequest);
                });
            }).catch(error => {
              this.toastService.show('Problem uploading audio file to storage.', this.router.url);
              this.isWaitingForCreate = false;
              this.isUploadingAudio = false;
            });
          } else {
            this.toastService.show('Problem uploading audio file to storage.', this.router.url);
          }
        });
    } else {
      successAction(videoBuildRequest);
    }
  }

  private freeVideoSuccessCallback = (videoBuildRequest: Videobuildrequest) => {
    this.buildService.create(this.videoId, videoBuildRequest)
      .pipe(catchError((error: HttpErrorResponse) => {
        this.isWaitingForCreate = false;
        return throwError(() => new Error());
      }))
      .subscribe(() => {
        this.router.navigateByUrl('/confirmation?resolution=' + videoBuildRequest.resolution);
      });
  }

  paymentBuildId: string = ''

  createPaymentIntent = () => {
    this.isWaitingForCreate = true;
    var buildId = (<any>crypto).randomUUID();
    var resolution = this.resolutionControl.value;
    var license = this.licenseControl.value;
    this.buildService.checkout(this.videoId, { buildId, license, resolution, cost: this.total })
      .pipe(catchError((error: HttpErrorResponse) => {
        this.isWaitingForCreate = false;
        return throwError(() => new Error());
      }))
      .subscribe(clientSecret => {
        this.isWaitingForCreate = false;
        this.elementOptions.clientSecret = clientSecret;
        this.paymentBuildId = buildId;
        this.setTabId(4);
      });
  }

  displayResolution = (resolution: Resolution) => {
    return this.resolutionList.find(r => r.resolution === resolution)?.displayName
  }

  get buildCost() {
    if (this.subscriptionProduct
      && (this.subscriptionProduct.productId === Subscriptionproducts.Builder || this.subscriptionProduct.productId === Subscriptionproducts.LicenseBuilder)) {
      return 0;
    }

    return (this.resolutionControl.value - 1) * 5;
  }

  get collectionLicenseCost() {
    var collectionResolutionCost = 0;
    switch (this.resolutionControl.value) {
      case Resolution.Hd:
        collectionResolutionCost = 25;
        break;
      case Resolution.FourK:
        collectionResolutionCost = 50;
        break;
    }

    return collectionResolutionCost * this.licenseFactor(this.licenseControl.value);
  }

  get collectionLicensesCost() {
    if (this.subscriptionProduct
      && (this.subscriptionProduct.productId === Subscriptionproducts.License || this.subscriptionProduct.productId === Subscriptionproducts.LicenseBuilder)) {
      return 0;
    }

    return this.collectionLicenseCost * this.unlicensedCollections.length;
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

    return this.buildCost + this.collectionLicensesCost;
  }

  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        fontFamily: 'arial,sans-serif',
        fontSize: '1rem'
      },
    }
  };

  @ViewChild(StripePaymentElementComponent)
  paymentElement!: StripePaymentElementComponent;

  elementOptions: StripeElementsOptions = {
    locale: 'en',
    appearance: {
      variables: {
        fontSizeBase: '1rem',
        fontSizeSm: '1rem',
        fontFamily: 'arial,sans-serif',
        spacingGridRow: '1rem'
      }
    }
  };

  pay = () => {
    let videoBuildRequest: Videobuildrequest = {
      resolution: this.resolutionControl.value,
      buildId: this.paymentBuildId,
      license: this.licenseControl.value
    };
    if (this.audioFileService.file !== null) {
      this.uploadAudio(videoBuildRequest, this.payVideoSuccessCallback);
    } else {
      this.modalService.open(AudiomodalComponent, { centered: true }).closed.subscribe(x => {
        this.uploadAudio(videoBuildRequest, this.payVideoSuccessCallback);
      });
    }
  }

  private payVideoSuccessCallback = (videoBuildRequest: Videobuildrequest) => {
    this.stripeService.confirmPayment({
      elements: this.paymentElement.elements,
      confirmParams: {
        return_url: environment.host + '/confirmation?resolution=' + videoBuildRequest.resolution
      },
      redirect: 'if_required'
    }).subscribe(result => {
      if (result.error) {
        this.toastService.show(result.error?.message ?? 'Error in payment', this.router.url);
        this.isWaitingForCreate = false;
        this.isUploadingAudio = false;
      } else {
        this.router.navigateByUrl('/confirmation?resolution=' + videoBuildRequest.resolution);
      }
    });
  }

  invalidCardDetails = true
  cardChange = (event: any) => {
    if (event.complete) {
      this.invalidCardDetails = false;
    } else if (event.error) {
      this.invalidCardDetails = true;
    }
  }
}

const maximumVideoLengthMinutes = 15
export function videoLengthValidator(getClips: (() => Clip[])): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    var formGroup = control as FormGroup;
    var bpmControl = formGroup.get('bpmControl');
    if (!bpmControl || bpmControl.invalid) {
      return { noBpm: true };
    }

    var videoClipsFormArray = formGroup.get('videoClipsFormArray') as FormArray;
    if (!videoClipsFormArray || videoClipsFormArray.invalid) {
      return { noClips: true };
    }

    var totalAllowedBeats = maximumVideoLengthMinutes * bpmControl.value;
    if (totalAllowedBeats < videoClipsFormArray.controls.map(vc => getClips().find(c => c.clipId === vc.value.clipId)?.beatLength ?? 0).reduce((a, c) => a + c, 0)) {
      return { videoTooLong: maximumVideoLengthMinutes }
    }

    return null;
  }
}
