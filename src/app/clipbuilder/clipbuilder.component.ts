import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Clip } from '../clip';
import { ClipService } from '../clip.service';
import { CollectionService } from '../collection.service';
import { Collection } from '../collection';
import { Displaylayer } from '../displaylayer';
import { Collectiontypes } from '../collectiontypes';
import { Direction } from '../direction';
import { Clipdisplaylayer } from '../clipdisplaylayer';
import { Layerclipdisplaylayer } from '../layerclipdisplaylayer';
import { Fadetypes } from '../fadetypes';
import { Clipbuildereditorstates } from '../clipbuildereditorstates';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClipinfoComponent } from '../clipinfo/clipinfo.component';
import { ConfirmationmodalComponent } from '../confirmationmodal/confirmationmodal.component';

const beatsPerLayer = 4;

@Component({
  selector: 'app-clipbuilder',
  templateUrl: './clipbuilder.component.html',
  styleUrls: ['./clipbuilder.component.scss']
})
export class ClipBuilderComponent implements OnInit {

  constructor(private formBuilder: UntypedFormBuilder, private collectionService: CollectionService, private clipService: ClipService, private route: ActivatedRoute,
    private location: Location, private modalService: NgbModal, private router: Router) { }

  ngOnInit(): void {
    this.clipService.getAll().subscribe((clips: Clip[]) => {
      this.collectionService.getAll().subscribe((collections: Collection[]) => {
        this.clips = clips;
        this.collections = collections
        var idObj = this.route.firstChild?.snapshot?.params['id'];
        if (idObj && idObj !== '') {
          var id = Number(idObj);
          var clip = clips.find(x => x.clipId === id);
          if (clip) {
            this.editClip(clip);
          }
        } else {
          var cloneIdObj = this.route.snapshot.queryParamMap.get('cloneId');
          if (cloneIdObj) {
            var cloneId = Number(cloneIdObj);
            var clip = clips.find(x => x.clipId === cloneId);
            if (clip) {
              this.cloneClip(clip);
            }
          } else {
            var returnUrlObj = this.route.snapshot.queryParamMap.get('return');
            if (returnUrlObj){
              this.addNewClip();
            }
          }
        }
        this.pageLoading = false;
      });
    });
  }

  pageLoading = true;
  editorState: Clipbuildereditorstates = Clipbuildereditorstates.BackgroundColourOrBackgroundSelectCollection

  clips: Clip[] = [];
  collections: Collection[] = [];
  clipId: number = 0;

  maximumCollections = 5;

  setClipId = (clipId: number) => {
    this.clipId = clipId;
    if (clipId === 0) {
      this.location.replaceState('/clipBuilder/' + window.location.search);
    } else {
      this.location.replaceState('/clipBuilder/' + clipId + window.location.search);
    }
  }

  FadeTypes = Fadetypes
  fadeTypeList: Fadetypes[] = [
    Fadetypes.In,
    Fadetypes.Out
  ]

  Clipbuildereditorstates = Clipbuildereditorstates

  setFadeColourControl = (fadeTypeControl: AbstractControl | null, colourControl: AbstractControl | null, enableLayerColourTransitionControl: AbstractControl | null) => {
    if (this.selectedCollection?.collectionType === Collectiontypes.Background && colourControl && fadeTypeControl) {
      if (fadeTypeControl.value === null) {
        colourControl.setValue(null);
      } else if (colourControl.value === null) {
        colourControl.setValue('#000000');
      }
    }

    if (fadeTypeControl) {
      if (fadeTypeControl.value !== null && enableLayerColourTransitionControl) {
        enableLayerColourTransitionControl.setValue(false);
      }
      this.getLayerClipDisplayLayersFormGroups(this.clipDisplayLayersFormArray.controls[this.clipDisplayLayersFormArrayIndex]).forEach(l => {
        l.get('endColourControl')?.setValue(null);
      });
    }
  }

  enableLayerColourTransitionsChange = (enableLayerColourTransitionControl: AbstractControl | null) => {
    if (enableLayerColourTransitionControl) {
      this.getLayerClipDisplayLayersFormGroups(this.clipDisplayLayersFormArray.controls[this.clipDisplayLayersFormArrayIndex]).forEach(l => {
        var colour = enableLayerColourTransitionControl.value === true ? l.get('colourControl')?.value : null;
        l.get('endColourControl')?.setValue(colour);
      });
    }
  }

  Collectiontypes = Collectiontypes;

  selectedCollection: Collection | null = null

  get selectedCollectionDisplayLayerMap() {
    //MAKE THIS BETTER 
    var topLevelDisplayLayers = this.selectedCollection?.displayLayers.filter(d => d.linkedPreviousDisplayLayerId && !this.selectedCollection?.displayLayers.some(x => x.linkedPreviousDisplayLayerId === d.displayLayerId));
    var output: Array<Array<string>> = [];
    topLevelDisplayLayers?.forEach(t => {
      var displayLayers: Array<string> = [];
      this.buildDisplayLayerMap(displayLayers, t);
      output.push(displayLayers);
    });

    return output;
  }

  buildDisplayLayerMap = (output: Array<string>, currentDisplayLayer: Displaylayer) => {
    if (!currentDisplayLayer.linkedPreviousDisplayLayerId) {
      output.push(currentDisplayLayer.displayLayerId)
    } else {
      var nextDisplayLayer = this.selectedCollection?.displayLayers.find(d => d.displayLayerId === currentDisplayLayer.linkedPreviousDisplayLayerId);
      if (nextDisplayLayer) {
        this.buildDisplayLayerMap(output, nextDisplayLayer);
        output.push(currentDisplayLayer.displayLayerId);
      }
    }
  }

  get selectedCollectionDirectionOptions() {
    var allDirections = this.selectedCollection?.displayLayers.map(d => d.direction) ?? [];
    return Object.values<Direction>(allDirections.reduce((acc, obj) => ({ ...acc, [obj.directionId]: obj }), {}))
  }

  get selectedCollectionSideOptions() {
    var allSides = this.selectedCollection?.displayLayers.map(d => d.numberOfSides) ?? [];
    return Object.values<number>(allSides.reduce((acc, obj) => ({ ...acc, [obj]: obj }), {}))
  }

  get selectedDisplayLayerLinkedDisplayLayerIdOptions() {
    var clipDisplayLayerFormGroup = this.clipDisplayLayersFormArray.controls[this.clipDisplayLayersFormArrayIndex];
    var displayLayerId = clipDisplayLayerFormGroup.get('displayLayerIdControl')?.value;
    return this.selectedCollectionDisplayLayerMap.find(x => x.some(y => y === displayLayerId));
  }

  selectedDirection: Direction | undefined = undefined
  selectedNumberOfSides: number | undefined = undefined
  selectedDisplayLayerId: string | undefined = undefined

  directionChange = (newDirection: Direction) => {
    var selectedDisplayLayer = this.selectedCollection?.displayLayers.find(d => d.direction.directionId === newDirection.directionId && d.numberOfSides === this.selectedNumberOfSides && !d.linkedPreviousDisplayLayerId);
    this.changeDisplayLayerInForm(selectedDisplayLayer);
    this.selectedDisplayLayerId = selectedDisplayLayer?.displayLayerId;
  }

  sideNumberChange = (newSideNumber: number) => {
    var selectedDisplayLayer = this.selectedCollection?.displayLayers.find(d => d.direction.directionId === this.selectedDirection?.directionId && d.numberOfSides === newSideNumber && !d.linkedPreviousDisplayLayerId);
    this.changeDisplayLayerInForm(selectedDisplayLayer);
    this.selectedDisplayLayerId = selectedDisplayLayer?.displayLayerId;
  }

  displayLayerIdChange = (displayLayerId: string) => {
    var selectedDisplayLayer = this.selectedCollection?.displayLayers.find(d => d.displayLayerId === displayLayerId);
    this.changeDisplayLayerInForm(selectedDisplayLayer);
  }

  changeDisplayLayerInForm = (selectedDisplayLayer: Displaylayer | undefined) => {
    var clipDisplayLayerFormGroup = this.clipDisplayLayersFormArray.controls[this.clipDisplayLayersFormArrayIndex];
    clipDisplayLayerFormGroup.get('displayLayerIdControl')?.setValue(selectedDisplayLayer?.displayLayerId);

    var layerClipDisplayLayersFormArray = this.getLayerClipDisplayLayersFormGroups(clipDisplayLayerFormGroup);
    for (var i = 0; i < layerClipDisplayLayersFormArray.length; i++) {
      layerClipDisplayLayersFormArray[i].get('layerIdControl')?.setValue(selectedDisplayLayer?.layers.filter(l => l.isOverlay !== true)[i].layerId);
    }
  }

  clipDisplayLayersFormArrayIndex: number = -1

  selectCollection = (collection: Collection) => {
    var selectedDisplayLayer = collection.displayLayers.find(d => d.displayLayerId === collection.collectionDisplayLayer.displayLayerId);
    this.setupCollectionEditor(collection, selectedDisplayLayer);
    var layerClipDisplayLayersFormArray = this.formBuilder.array([]);
    selectedDisplayLayer?.layers.filter(l => l.isOverlay !== true).forEach(l => {
      var colour = collection.collectionDisplayLayer.layerCollectionDisplayLayers.find(lc => l.layerId == lc.layerId);
      var group = this.formBuilder.group({
        layerIdControl: this.formBuilder.control(l.layerId),
        colourControl: this.formBuilder.control('#' + colour?.colour),
        endColourControl: this.formBuilder.control(null)
      });
      layerClipDisplayLayersFormArray.push(group);
    });
    var clipDisplayLayerControl = this.formBuilder.group({
      displayLayerIdControl: this.formBuilder.control(selectedDisplayLayer?.displayLayerId),
      reverseControl: this.formBuilder.control(false),
      flipHorizontalControl: this.formBuilder.control(false),
      flipVerticalControl: this.formBuilder.control(false),
      colourControl: this.formBuilder.control(null),
      endColourControl: this.formBuilder.control(null),
      fadeTypeControl: this.formBuilder.control(null),
      enableLayerColourTransitionControl: this.formBuilder.control(false),
      layerClipDisplayLayersFormArray: layerClipDisplayLayersFormArray
    });

    if (collection.collectionType === Collectiontypes.Background) {
      this.backgroundColourControl.reset(null);
      this.endBackgroundColourControl.reset(null);
    }

    this.clipDisplayLayersFormArray.push(clipDisplayLayerControl);
    this.clipDisplayLayersFormArrayIndex = this.clipDisplayLayersFormArray.length - 1;
  }

  setupCollectionEditor = (collection: Collection | undefined, selectedDisplayLayer: Displaylayer | undefined) => {
    if (collection) {
      this.selectedCollection = collection;
    }

    this.selectedDirection = this.selectedCollectionDirectionOptions.find(x => x.directionId === selectedDisplayLayer?.direction.directionId);
    this.selectedNumberOfSides = selectedDisplayLayer?.numberOfSides;
    this.selectedDisplayLayerId = selectedDisplayLayer?.displayLayerId;
    this.editorState = Clipbuildereditorstates.ClipDisplayLayerEditor;
  }

  getLayerClipDisplayLayersFormGroups = (clipDisplayLayerGroup: AbstractControl) => {
    var group = <UntypedFormGroup>clipDisplayLayerGroup
    return (<UntypedFormArray>group?.get('layerClipDisplayLayersFormArray')).controls
  }

  convertFormGroupToCollection = (clipDisplayLayerFormGroup: AbstractControl) => {
    var displayLayerId = clipDisplayLayerFormGroup.get('displayLayerIdControl')?.value
    return this.collections.find(c => c.displayLayers.some(d => d.displayLayerId === displayLayerId));
  }

  get collectionForegrounds() {
    return this.collections.filter(c => c.collectionType === Collectiontypes.Foreground);
  }

  get hasClip() {
    return this.clips.length > 0;
  }

  clipNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9_-]+")]);
  backgroundColourControl = this.formBuilder.control(null);
  endBackgroundColourToggleControl = this.formBuilder.control(false);
  endBackgroundColourControl = this.formBuilder.control(null);
  clipDisplayLayersFormArray = this.formBuilder.array([], [Validators.maxLength(this.maximumCollections)]);
  beatLengthControl = this.formBuilder.control(4, [Validators.required, Validators.max(4), Validators.min(1)]);
  startingBeatControl = this.formBuilder.control(1, [Validators.required, Validators.max(4), Validators.min(1)]);

  clipForm = this.formBuilder.group({
    clipNameControl: this.clipNameControl,
    clipDisplayLayersFormArray: this.clipDisplayLayersFormArray,
    backgroundColourControl: this.backgroundColourControl,
    endBackgroundColourToggleControl: this.endBackgroundColourToggleControl,
    endBackgroundColourControl: this.endBackgroundColourControl,
    beatLengthControl: this.beatLengthControl,
    startingBeatControl: this.startingBeatControl,
  }, { validator: this.clipFormValidator.bind(this) });

  clipFormValidator(form: UntypedFormGroup): ValidationErrors | null {
    if (form.get('backgroundColourControl')?.value === null && (form.get('clipDisplayLayersFormArray') as UntypedFormArray).length === 0) {
      return { noLayers: true };
    }

    if (beatsPerLayer - form.get('beatLengthControl')?.value < form.get('startingBeatControl')?.value - 1) {
      return { invalidBeatSettings: true };
    }

    return null;
  }

  showEditor = false;
  showExistingClipWarning = true;

  clearEditor = () => {
    this.setClipId(0);
    this.clipNameControl.reset();
    this.backgroundColourControl.reset(null);
    this.endBackgroundColourControl.reset(null);
    this.endBackgroundColourToggleControl.reset(false);
    this.beatLengthControl.reset(4);
    this.startingBeatControl.reset(1);
    this.clipDisplayLayersFormArray.clear();
    this.selectedCollection = null;
    this.undoClipDisplayLayer = undefined;
    this.undoBackgroundColour = undefined;
    this.showExistingClipWarning = true;
  }

  cancelEditor = () => {
    var returnUrl = this.route.snapshot.queryParamMap.get('return');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    }
    else if (this.noClipChanges() === false) {
      this.modalService.open(ConfirmationmodalComponent, { centered: true }).result.then(
        (succes) => {
          this.clearEditor();
          this.showEditor = false;
        },
        (fail) => {
        });
    } else {
      this.clearEditor();
      this.showEditor = false;
    }
  }

  addNewClip = () => {
    this.clearEditor();
    this.backgroundColourControl.setValue('#000000');
    this.showEditor = true;
    this.editorState = Clipbuildereditorstates.BackgroundColourOrBackgroundSelectCollection;
  }

  toggleAddNewClipDisplayLayer = () => {
    this.editorState = Clipbuildereditorstates.ClipList;
    this.selectedCollection = null;
  }

  addNewForegroundClipDisplayLayer = () => {
    this.undoClipDisplayLayer = undefined;
    this.editorState = Clipbuildereditorstates.ForegroundSelectCollection;
    this.selectedCollection = null;
  }

  cancelAddingDisplayLayer = () => {
    var editorState = Clipbuildereditorstates.ClipList;
    if (this.undoClipDisplayLayer) {
      this.clipDisplayLayersFormArray.controls[this.clipDisplayLayersFormArrayIndex] = this.convertClipDisplayLayerToFormGroup(this.undoClipDisplayLayer);
    } else {
      this.clipDisplayLayersFormArray.removeAt(this.clipDisplayLayersFormArrayIndex);
      if (this.selectedCollection?.collectionType === Collectiontypes.Background) {
        editorState = Clipbuildereditorstates.BackgroundColourOrBackgroundSelectCollection;
        this.backgroundColourControl.reset('#000000');
      }
    }

    this.editorState = editorState;
    this.selectedCollection = null;
  }

  cancelEditingBackground = () => {
    if (this.undoBackgroundColour) {
      this.backgroundColourControl.setValue(this.undoBackgroundColour.backgroundColour !== null ? '#' + this.undoBackgroundColour.backgroundColour : null)
      this.endBackgroundColourControl.setValue(this.undoBackgroundColour.endBackgroundColour !== null ? '#' + this.undoBackgroundColour.endBackgroundColour : null)
      this.undoBackgroundColour = undefined;
    }
    this.editorState = Clipbuildereditorstates.ClipList;
  }

  addClipDisplayLayer = (selectedClipDisplayLayer: Clipdisplaylayer) => {
    var group = this.convertClipDisplayLayerToFormGroup(selectedClipDisplayLayer);
    this.clipDisplayLayersFormArray.push(group);
  }

  convertClipDisplayLayerToFormGroup = (clipDisplayLayer: Clipdisplaylayer) => {
    var layerClipDisplayLayersFormArray = this.formBuilder.array([]);

    var enableLayerColourTransition = false;
    clipDisplayLayer.layerClipDisplayLayers.forEach(l => {
      var endColour = null;
      if (l.endColour !== null) {
        enableLayerColourTransition = true;
        endColour = '#' + l.endColour;
      }
      var group = this.formBuilder.group({
        layerIdControl: this.formBuilder.control(l.layerId),
        colourControl: this.formBuilder.control('#' + l.colour),
        endColourControl: this.formBuilder.control(endColour)
      });
      layerClipDisplayLayersFormArray.push(group);
    });
    return this.formBuilder.group({
      displayLayerIdControl: this.formBuilder.control(clipDisplayLayer.displayLayerId),
      reverseControl: this.formBuilder.control(clipDisplayLayer.reverse),
      flipHorizontalControl: this.formBuilder.control(clipDisplayLayer.flipHorizontal),
      flipVerticalControl: this.formBuilder.control(clipDisplayLayer.flipVertical),
      colourControl: this.formBuilder.control(clipDisplayLayer.colour === null ? null : '#' + clipDisplayLayer.colour),
      fadeTypeControl: this.formBuilder.control(clipDisplayLayer.fadeType),
      enableLayerColourTransitionControl: this.formBuilder.control(enableLayerColourTransition),
      layerClipDisplayLayersFormArray: layerClipDisplayLayersFormArray
    });
  }

  convertToFormControl = (abstractControl: AbstractControl | null) => {
    return abstractControl as UntypedFormControl
  }

  removeclipDisplayLayer = (index: number) => {
    this.clipDisplayLayersFormArray.removeAt(index);
    if (index === 0 && this.clipDisplayLayersFormArray.length === 0 && this.backgroundColourControl.value === null) {
      this.removeBackgroundColour();
    }
  }

  moveBack = (index: number) => {
    let currentControl = this.clipDisplayLayersFormArray.controls[index];
    this.clipDisplayLayersFormArray.controls[index] = this.clipDisplayLayersFormArray.controls[index - 1];
    this.clipDisplayLayersFormArray.controls[index - 1] = currentControl;
  }

  moveForward = (index: number) => {
    let currentControl = this.clipDisplayLayersFormArray.controls[index];
    this.clipDisplayLayersFormArray.controls[index] = this.clipDisplayLayersFormArray.controls[index + 1];
    this.clipDisplayLayersFormArray.controls[index + 1] = currentControl;
  }

  saving = false;

  unchangedClip: Clip = <Clip>{};
  noClipChanges = () => {
    return JSON.stringify(this.unchangedClip) === JSON.stringify(this.editorClip);
  }

  get unableToSave() {
    return !this.clipForm.valid || this.saving || this.noClipChanges()
  }

  get editorClip(): Clip {
    return <Clip>{
      clipId: this.clipId,
      clipName: this.clipNameControl.value,
      clipDisplayLayers: this.clipDisplayLayersFormArray.controls.map((formGroup) => {
        var clipDisplayLayer = <Clipdisplaylayer>{
          displayLayerId: formGroup.get('displayLayerIdControl')?.value,
          reverse: formGroup.get('reverseControl')?.value,
          flipHorizontal: formGroup.get('flipHorizontalControl')?.value,
          flipVertical: formGroup.get('flipVerticalControl')?.value,
          colour: formGroup.get('colourControl')?.value?.slice(1) ?? null,
          fadeType: formGroup.get('fadeTypeControl')?.value,
          layerClipDisplayLayers: []
        }

        this.getLayerClipDisplayLayersFormGroups(formGroup).forEach(fg => {
          var layerClipDisplayLayer = <Layerclipdisplaylayer>{
            colour: fg.get('colourControl')?.value.slice(1),
            endColour: fg.get('endColourControl')?.value?.slice(1) ?? null,
            layerId: fg.get('layerIdControl')?.value
          }
          clipDisplayLayer.layerClipDisplayLayers.push(layerClipDisplayLayer);
        });

        return clipDisplayLayer;
      }),
      backgroundColour: this.backgroundColourControl.value?.slice(1) ?? null,
      endBackgroundColour: this.endBackgroundColourControl.value?.slice(1) ?? null,
      beatLength: this.beatLengthControl.value,
      startingBeat: this.startingBeatControl.value,
    };
  }

  get selectedCollectionClip(): Clip {
    return <Clip>{
      clipId: this.editorClip.clipId,
      backgroundColour: this.editorClip.backgroundColour,
      endBackgroundColour: this.editorClip.endBackgroundColour,
      beatLength: this.editorClip.beatLength,
      clipName: this.editorClip.clipName,
      startingBeat: this.editorClip.startingBeat,
      clipDisplayLayers: [this.editorClip.clipDisplayLayers[this.clipDisplayLayersFormArrayIndex]]
    }
  }

  onSubmit = () => {
    this.saving = true;

    this.clipService.post(this.editorClip).pipe(
      catchError((error: HttpErrorResponse) => {
        this.saving = false;
        return throwError(() => new Error());
      })
    ).subscribe((clip: Clip) => {
      var returnUrl = this.route.snapshot.queryParamMap.get('return');
      if (returnUrl) {
        var timelineIndex = this.route.snapshot.queryParamMap.get('index');
        var replace = this.route.snapshot.queryParamMap.get('replace');
        if (timelineIndex && replace){
          returnUrl = returnUrl + '&index=' + timelineIndex + '&clipId=' + clip.clipId + '&replace=' + replace;
        }
        this.router.navigateByUrl(returnUrl);
      }
      else {
        this.saving = false;
        if (this.clipId === 0) {
          this.clips.push(clip);
        } else {
          let index = this.clips.findIndex(clip => clip.clipId === this.clipId);
          this.clips[index] = clip;
        }
        this.clearEditor();
        this.showEditor = false;
      }
    });;
  }

  undoClipDisplayLayer: Clipdisplaylayer | undefined = undefined;
  undoBackgroundColour: { backgroundColour: string | null, endBackgroundColour: string | null } | undefined = undefined;

  editClipDisplayLayer = (index: number) => {
    this.clipDisplayLayersFormArrayIndex = index;
    var clipDisplayLayer = this.editorClip.clipDisplayLayers[index];
    this.undoClipDisplayLayer = JSON.parse(JSON.stringify(clipDisplayLayer));
    var collection = this.collections.find(c => c.displayLayers.some(d => d.displayLayerId === clipDisplayLayer.displayLayerId));
    var displayLayer = collection?.displayLayers.find(d => d.displayLayerId === clipDisplayLayer.displayLayerId);
    this.setupCollectionEditor(collection, displayLayer);
  }

  editClip = (clip: Clip) => {
    this.setClipBase(clip);
    this.setClipId(clip.clipId);
    this.clipNameControl.setValue(clip.clipName);
    this.unchangedClip = { ...this.editorClip };
    this.editorState = Clipbuildereditorstates.ClipList;
    this.showEditor = true;
  }

  cloneClip = (clip: Clip) => {
    this.setClipBase(clip);
    this.clipNameControl.setValue(clip.clipName + '-copy');
    this.unchangedClip = { ...this.editorClip };
    this.editorState = Clipbuildereditorstates.ClipList;
    this.showEditor = true;
  }

  private setClipBase = (clip: Clip) => {
    this.clearEditor();
    this.backgroundColourControl.setValue(clip.backgroundColour !== null ? '#' + clip.backgroundColour : null)
    this.endBackgroundColourControl.setValue(clip.endBackgroundColour !== null ? '#' + clip.endBackgroundColour : null)
    this.endBackgroundColourToggleControl.setValue(clip.endBackgroundColour !== null)
    this.beatLengthControl.setValue(clip.beatLength);
    this.startingBeatControl.setValue(clip.startingBeat);

    if (clip.clipDisplayLayers) {
      clip.clipDisplayLayers.forEach(cl => {
        this.addClipDisplayLayer(cl);
      });
    }
  }

  get shouldDisableDisplayLayer() {
    var keys = this.editorClip.clipDisplayLayers.map(v => v.flipHorizontal + '-' + v.flipVertical + '-' + v.reverse + '-' + v.displayLayerId + '-' + v.fadeType);
    var uniqueKeys = keys.filter(function (item, pos) {
      return keys.indexOf(item) == pos;
    });
    return uniqueKeys.length !== this.editorClip.clipDisplayLayers.length;
  }

  get shouldDisableDisplayLayerToolTip() {
    return this.shouldDisableDisplayLayer === true ? 'Previous layer has same settings so will be hidden' : ''
  }

  canAddCollection = () => {
    if (this.collectionForegrounds.length > 0 && this.clipDisplayLayersFormArray.length < this.maximumCollections) {
      return true;
    }

    return false;
  }

  canAddCollectionTooltip = () => {
    if (this.collectionForegrounds.length === 0) {
      return 'There are no foregrounds to select';
    }

    if (this.clipDisplayLayersFormArray.length >= this.maximumCollections) {
      return 'You can only have ' + this.maximumCollections + ' collections per clip';
    }

    return '';
  }

  addBackgroundColour = () => {
    this.editorState = Clipbuildereditorstates.ClipList
  }

  editBackgroundColour = () => {
    this.undoBackgroundColour = { backgroundColour: this.editorClip.backgroundColour, endBackgroundColour: this.editorClip.endBackgroundColour }
    this.editorState = Clipbuildereditorstates.BackgroundColourEditor
  }

  removeBackgroundColour = () => {
    this.backgroundColourControl.reset('#000000');
    this.endBackgroundColourControl.reset(null);
    this.endBackgroundColourToggleControl.reset(false);
    this.editorState = Clipbuildereditorstates.BackgroundColourOrBackgroundSelectCollection;
  }

  endBackgroundColourChange = (endBackgroundColourToggleControl: AbstractControl | null) => {
    if (endBackgroundColourToggleControl && endBackgroundColourToggleControl.value === true) {
      this.endBackgroundColourControl.setValue('#000000');
    } else {
      this.endBackgroundColourControl.reset(null);
    }
  }

  bpm: number = 0;
  isPlaying: boolean = false;
  setBpm = (bpm: number) => {
    this.bpm = bpm;
  }

  setIsPlaying = (isPlaying: boolean) => {
    this.isPlaying = isPlaying;
  }

  get startingBeatOptions() {
    var startingBeatOptions = new Array<number>();
    for (var i = 0; i <= beatsPerLayer - this.beatLengthControl.value; i++) {
      startingBeatOptions.push(i + 1);
    }

    return startingBeatOptions;
  };

  updateStartingBeat() {
    if (this.clipForm.hasError('invalidBeatSettings') === true) {
      this.startingBeatControl.setValue(1);
    }
  }

  get colourChoices() {
    var colourChoices: string[] = [];
    this.clips.forEach(c => {
      if (c.backgroundColour !== null && colourChoices.indexOf('#' + c.backgroundColour) === -1) {
        colourChoices.push('#' + c.backgroundColour)
      }
      if (c.endBackgroundColour !== null && colourChoices.indexOf('#' + c.endBackgroundColour) === -1) {
        colourChoices.push('#' + c.endBackgroundColour)
      }
      if (c.clipDisplayLayers) {
        c.clipDisplayLayers.forEach(d => {
          if (d.colour !== null && colourChoices.indexOf('#' + d.colour) === -1) {
            colourChoices.push('#' + d.colour)
          }

          d.layerClipDisplayLayers.forEach(l => {
            if (l.colour !== null && colourChoices.indexOf('#' + l.colour) === -1) {
              colourChoices.push('#' + l.colour)
            }
            if (l.endColour !== null && colourChoices.indexOf('#' + l.endColour) === -1) {
              colourChoices.push('#' + l.endColour)
            }
          });
        });
      }
    });
    return colourChoices.sort((a: string, b: string) => {
      return this.extractHueFromHex(a) - this.extractHueFromHex(b);
    });
  }

  extractHueFromHex = (hex: string) => {
    var rgbArray = hex.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    var r = rgbArray[0];
    var g = rgbArray[1];
    var b = rgbArray[2];

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      if (h) {
        h /= 6;
      }
    }

    return h ?? 0;
  }

  autoGenerateName = () => {
    var guid = (<any>crypto).randomUUID();
    this.clipNameControl.setValue(guid);
  }

  showClipInfo = () => {
    let modal = this.modalService.open(ClipinfoComponent, { size: 'xl' });
    modal.componentInstance.clip = this.editorClip;
  }
}
