import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { Clip } from '../clip';
import { VideoService } from '../video.service';
import { timer } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { VideoplayerComponent } from '../videoplayer/videoplayer.component';
import { Resolution } from '../resolution';
import { guess } from 'web-audio-beat-detector';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { ToastService } from '../toast.service';
import { CollectionService } from '../collection.service';
import { Collection } from '../collection';
import { Videoclip } from '../videoclip';
import { AudiofileService } from '../audiofile.service';
import { AudiomodalComponent } from '../audiomodal/audiomodal.component';
import { ClipinfoComponent } from '../clipinfo/clipinfo.component';
import { ConfirmationmodalComponent } from '../confirmationmodal/confirmationmodal.component';
import { ResolutionmodalComponent } from '../resolutionmodal/resolutionmodal.component';
import * as JSZip from 'jszip';
import * as saveAs from 'file-saver';
import { FfmpegService } from '../ffmpeg.service';
import { Layer } from '../layer';

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
  constructor(private formBuilder: UntypedFormBuilder, private videoService: VideoService, private clipService: ClipService, private collectionService: CollectionService, private ffmpegService: FfmpegService,
    private datePipe: DatePipe, private route: ActivatedRoute, private location: Location, private toastService: ToastService, private router: Router, public audioFileService: AudiofileService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.collectionService.getAll().subscribe((collections: Collection[]) => {
      var videos = this.videoService.getAll();
      var clips = this.clipService.getAll();
      var id = Number(this.route.firstChild?.snapshot?.params['id']);
      var tab = Number(this.route.snapshot.queryParamMap.get('tab'));
      var index = Number(this.route.snapshot.queryParamMap.get('index'));
      var replace = this.route.snapshot.queryParamMap.get('replace') === 'true';
      var clipId = Number(this.route.snapshot.queryParamMap.get('clipId'));
      if (!isNaN(id) && !isNaN(tab)) {
        var video = videos.find(x => x.videoId === id);
        if (video) {
          this.editVideoInternal({ video: video, tab: tab }, index, clipId, replace);
        }
      }
      this.videos = videos;
      this.clips = clips;
      this.collections = collections;

      this.pageLoading = false;
    });
  }

  storageUrl = environment.storageUrl;
  timelineImageWidth = 128;
  timelineImageHeight = 72;
  pageLoading = true;

  @ViewChild(VideoplayerComponent) videoplayer!: VideoplayerComponent;
  @ViewChild('audioFile') set content(content: ElementRef) {
    if (content?.nativeElement?.files.length === 0 && this.audioFileService.file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(this.audioFileService.file);
      content.nativeElement.files = dataTransfer.files;
    }
  }

  videos: Video[] = [];
  clips: Clip[] = [];
  collections: Collection[] = [];

  Formats = Formats;
  resolutionList = [{
    displayName: 'Test (384x216)',
    resolution: Resolution.Free
  }, {
    displayName: 'HD (1920x1080)',
    resolution: Resolution.Hd
  }, {
    displayName: '4K (3840x2160)',
    resolution: Resolution.FourK
  }];

  get canLicense() {
    return this.editorVideoClipsFull.some(e => e.clipDisplayLayers != null);
  }

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

  showResolutions = () => {
    this.modalService.open(ResolutionmodalComponent, { size: 'xl' });
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
  })

  resolutionControl = this.formBuilder.control(Resolution.Free, [Validators.required]);
  builderForm = this.formBuilder.group({
    resolutionControl: this.resolutionControl
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
      this.editVideoInternal(videoRoute, null, null, null);
      this.editorLoading = false;
    });
  }

  private editVideoInternal = (videoRoute: { video: Video, tab: number }, cloneIndex: number | null, cloneClipId: number | null, replace: boolean | null) => {
    this.toggleEditor();
    this.setVideoId(videoRoute.video.videoId, videoRoute.tab);
    this.videoNameControl.setValue(videoRoute.video.videoName);
    this.bpmControl.setValue(videoRoute.video.bpm);
    this.formatControl.setValue(videoRoute.video.format);
    this.videoDelayMillisecondsControl.setValue(videoRoute.video.videoDelayMilliseconds);

    videoRoute.video.videoClips.forEach(vc => {
      this.videoClipsFormArray.push(this.formBuilder.control(vc));
    });

    this.unchangedVideo = { ...this.editorVideo };

    if (cloneIndex && cloneClipId) {
      this.addClipPickerClipInternal(cloneClipId, cloneIndex, replace === false);
    }

    if (this.videoClipsFormArray.length > 32) {
      this.clipsPerBlock = 16;
    }
    else if (this.videoClipsFormArray.length > 8) {
      this.clipsPerBlock = 4;
    }

    this.setTimelineEnd(this.videoClipsFormArray.length + 1);
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
    var allVideoDisplayLayerIds = this.editorVideoClipsFull.filter(c => c.clipDisplayLayers != null).flatMap(c => c.clipDisplayLayers).map(c => c.displayLayerId);
    return this.collections.filter(c => c.displayLayers.some(d => allVideoDisplayLayerIds.includes(d.displayLayerId)));
  }

  saveVideo = () => {
    this.saving = true;
    this.stop();

    var video = this.videoService.post(this.editorVideo)
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
  }

  exitEditor = () => {
    if (this.unableToSave === false) {
      this.modalService.open(ConfirmationmodalComponent, { centered: true }).result.then(
        (succes) => {
          this.toggleEditor();
        },
        (fail) => {
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
    return this.clips && this.clips.length > 0;
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
    var isTimelineAtEnd = this.timelineEditorEndFinalIndex === this.videoClipsFormArray.length;
    this.addClipPickerClipInternal(clip.clipId, this.selectedClipEditIndex, this.isAdding);
    if (isTimelineAtEnd === true) {
      this.setTimelineEnd(this.videoClipsFormArray.length + 1)
    }
  }

  addClipPickerClipInternal = (clipId: number, selectedClipEditIndex: number, isAdding: boolean) => {
    var videoClip = <Videoclip>{
      clipId: clipId
    }
    this.showClipPicker = false;
    if (selectedClipEditIndex === this.videoClipsFormArray.length) {
      this.videoClipsFormArray.push(this.formBuilder.control(videoClip));
    } else if (isAdding === true) {
      var newControl = this.formBuilder.control(videoClip);
      this.videoClipsFormArray.insert(selectedClipEditIndex, newControl);
    } else {
      var existingControl = this.videoClipsFormArray.controls[selectedClipEditIndex];
      existingControl.patchValue(videoClip);
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

  editClip = (videoClip: Videoclip) => {
    this.router.navigateByUrl('/clipBuilder/' + videoClip.clipId + '?return=' + encodeURI(window.location.pathname + window.location.search));
  }

  editClipAsClone = (videoClip: Videoclip, index: number) => {
    this.router.navigateByUrl('/clipBuilder/?return=' + encodeURI(window.location.pathname + window.location.search) + '&cloneId=' + videoClip.clipId + '&index=' + index + '&replace=true');
  }

  addNewClip = () => {
    this.router.navigateByUrl('/clipBuilder/?return=' + encodeURI(window.location.pathname + window.location.search) + '&index=' + this.selectedClipEditIndex + '&replace=' + !this.isAdding);
  }

  get videoDisplayLayers() {
    return this.collections.flatMap(c => c.displayLayers).filter(d => this.clips.filter(c => c.clipDisplayLayers && this.editorVideo.videoClips.some(vc => vc.clipId === c.clipId)).flatMap(c => c.clipDisplayLayers).some(cd => cd.displayLayerId === d.displayLayerId));
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

  displayResolution = (resolution: Resolution) => {
    return this.resolutionList.find(r => r.resolution === resolution)?.displayName
  }

  createFreeVideo = () => {
    if (this.audioFileService.file !== null) {
      this.createZip();
    } else {
      this.modalService.open(AudiomodalComponent, { centered: true }).closed.subscribe(x => {
        this.createZip();
      });
    }
  }

  downloadAudio = () => {
    saveAs(this.audioFileService.file as Blob, 'audio.mp3');
  }

  layerLink = (layer: Layer, resolution: Resolution) =>{
    return `${environment.storageUrl}/${layer.layerId}/${this.ffmpegService.resolutionToBlobPrefix(resolution)}/${layer.layerId}.zip`;
  }

  private createZip = async () => {
    this.isWaitingForCreate = true;
    var zip = new JSZip();
    var resolution = this.resolutionControl.value;
    var uniqueEditorVideoClipsFull = Object.values<Clip>(this.editorVideoClipsFull.reduce((acc, obj) => ({ ...acc, [obj.clipId]: obj }), {}));
    var ffmpegCodes = this.ffmpegService.generateCodes(this.editorVideo, uniqueEditorVideoClipsFull, resolution, this.audioFileService.file !== null, this.videoDisplayLayers);
    zip.file('ffmpegCodes.txt', ffmpegCodes.ffmpegCodes);
    zip.file(`${this.ffmpegService.AllFramesVideoName}.txt`, ffmpegCodes.concatFileCode);
    var that = this;
    await zip.generateAsync({ type: "blob" }).then(function (content) {
      // see FileSaver.js
      saveAs(content, that.editorVideo.videoName + ".zip");
      that.isWaitingForCreate = false;
    });
  }
}