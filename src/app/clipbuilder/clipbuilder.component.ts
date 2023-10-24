import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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

const beatsPerLayer = 4;

@Component({
  selector: 'app-clipbuilder',
  templateUrl: './clipbuilder.component.html',
  styleUrls: ['./clipbuilder.component.scss']
})
export class ClipBuilderComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private collectionService: CollectionService, private clipService: ClipService, private route: ActivatedRoute, private location: Location) { }

  ngOnInit(): void {
    this.clipService.getAll().subscribe((clips: Clip[]) => {
      this.collectionService.getAll().subscribe((collections: Collection[]) => {
        this.clips = clips;
        this.collections = collections
        var id = Number(this.route.firstChild?.snapshot?.params['id']);
        if (!isNaN(id)) {
          var clip = clips.find(x => x.clipId === id);
          if (clip) {
            this.editClip(clip);
          }
        }
        this.pageLoading = false;
      });
    });
  }

  pageLoading = true;

  clips: Clip[] = [];
  collections: Collection[] = [];
  clipId: number = 0;

  maximumCollections = 5;

  setClipId = (clipId: number) => {
    this.clipId = clipId;
    if (clipId === 0) {
      this.location.replaceState('/clipBuilder/');
    } else {
      this.location.replaceState('/clipBuilder/' + clipId);
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

    var layerClipDisplayLayersFormArray = this.layerClipDisplayLayersFormArray(clipDisplayLayerFormGroup);
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
        colourControl: this.formBuilder.control('#' + colour?.colour)
      });
      layerClipDisplayLayersFormArray.push(group);
    });
    var clipDisplayLayerControl = this.formBuilder.group({
      displayLayerIdControl: this.formBuilder.control(selectedDisplayLayer?.displayLayerId),
      reverseControl: this.formBuilder.control(false),
      flipHorizontalControl: this.formBuilder.control(false),
      flipVerticalControl: this.formBuilder.control(false),
      layerClipDisplayLayersFormArray: layerClipDisplayLayersFormArray
    });

    this.clipDisplayLayersFormArray.push(clipDisplayLayerControl);
    this.clipDisplayLayersFormArrayIndex = this.clipDisplayLayersFormArray.length - 1;
  }

  setupCollectionEditor = (collection: Collection | undefined, selectedDisplayLayer: Displaylayer | undefined) => {
    if (collection) {
      this.selectedCollection = collection;
    }
    this.isAddingClipDisplayLayer = true;

    this.selectedDirection = this.selectedCollectionDirectionOptions.find(x => x.directionId === selectedDisplayLayer?.direction.directionId);
    this.selectedNumberOfSides = selectedDisplayLayer?.numberOfSides;
    this.selectedDisplayLayerId = selectedDisplayLayer?.displayLayerId;
  }

  layerClipDisplayLayersFormArray = (clipDisplayLayerGroup: AbstractControl) => {
    var group = <FormGroup>clipDisplayLayerGroup
    return (<FormArray>group?.get('layerClipDisplayLayersFormArray')).controls
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

  clipNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]);
  backgroundColourControl = this.formBuilder.control('#000000');
  clipDisplayLayersFormArray = this.formBuilder.array([], [Validators.maxLength(this.maximumCollections)]);
  beatLengthControl = this.formBuilder.control(4, [Validators.required, Validators.max(4), Validators.min(1)]);
  startingBeatControl = this.formBuilder.control(1, [Validators.required, Validators.max(4), Validators.min(1)]);

  clipForm = this.formBuilder.group({
    clipNameControl: this.clipNameControl,
    clipDisplayLayersFormArray: this.clipDisplayLayersFormArray,
    backgroundColourControl: this.backgroundColourControl,
    beatLengthControl: this.beatLengthControl,
    startingBeatControl: this.startingBeatControl,
  }, { validator: this.clipFormValidator.bind(this) });

  clipFormValidator(form: FormGroup): ValidationErrors | null {
    if (this.backgroundColour === null && (form.get('clipDisplayLayersFormArray') as FormArray).length === 0) {
      return { noLayers: true };
    }

    if (beatsPerLayer - form.get('beatLengthControl')?.value < form.get('startingBeatControl')?.value - 1) {
      return { invalidBeatSettings: true };
    }

    return null;
  }

  showEditor = false;
  showExistingClipWarning = true;
  isAddingClipDisplayLayer = false;

  toggleEditor = () => {
    this.setClipId(0);
    this.clipNameControl.reset();
    this.backgroundColourControl.reset('#000000');
    this.backgroundColour = null;
    this.beatLengthControl.reset(4);
    this.startingBeatControl.reset(1);
    this.clipDisplayLayersFormArray.clear();
    this.selectedCollection = null;
    this.undoClipDisplayLayerFormGroup = undefined;
    this.isAddingClipDisplayLayer = false;
    this.showExistingClipWarning = true;
    this.showEditor = !this.showEditor;
  }

  toggleAddNewClipDisplayLayer = () => {
    this.isAddingClipDisplayLayer = !this.isAddingClipDisplayLayer;
    this.selectedCollection = null;
  }

  addNewClipDisplayLayer = () =>{
    this.undoClipDisplayLayerFormGroup = undefined;
    this.toggleAddNewClipDisplayLayer();
  }

  cancelAddingDisplayLayer = () => {    
    if (this.undoClipDisplayLayerFormGroup) {
      this.clipDisplayLayersFormArray.controls[this.clipDisplayLayersFormArrayIndex] = this.convertClipDisplayLayerToFormGroup(this.undoClipDisplayLayerFormGroup);
    } else {
      this.clipDisplayLayersFormArray.removeAt(this.clipDisplayLayersFormArrayIndex);
    }
    this.toggleAddNewClipDisplayLayer();
  }

  addClipDisplayLayer = (selectedClipDisplayLayer: Clipdisplaylayer) => {
    var group = this.convertClipDisplayLayerToFormGroup(selectedClipDisplayLayer);
    this.clipDisplayLayersFormArray.push(group);
  }

  convertClipDisplayLayerToFormGroup = (clipDisplayLayer: Clipdisplaylayer) =>{
    var layerClipDisplayLayersFormArray = this.formBuilder.array([]);

    clipDisplayLayer.layerClipDisplayLayers.forEach(l => {
      var group = this.formBuilder.group({
        layerIdControl: this.formBuilder.control(l.layerId),
        colourControl: this.formBuilder.control('#' + l.colour)
      });
      layerClipDisplayLayersFormArray.push(group);
    });
    return this.formBuilder.group({
      displayLayerIdControl: this.formBuilder.control(clipDisplayLayer.displayLayerId),
      reverseControl: this.formBuilder.control(clipDisplayLayer.reverse),
      flipHorizontalControl: this.formBuilder.control(clipDisplayLayer.flipHorizontal),
      flipVerticalControl: this.formBuilder.control(clipDisplayLayer.flipVertical),
      layerClipDisplayLayersFormArray: layerClipDisplayLayersFormArray
    });
  }

  removeclipDisplayLayer = (index: number) => {
    this.clipDisplayLayersFormArray.removeAt(index);
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
          layerClipDisplayLayers: []
        }

        this.layerClipDisplayLayersFormArray(formGroup).forEach(fg => {
          var layerClipDisplayLayer = <Layerclipdisplaylayer>{
            colour: fg.get('colourControl')?.value.slice(1),
            layerId: fg.get('layerIdControl')?.value
          }
          clipDisplayLayer.layerClipDisplayLayers.push(layerClipDisplayLayer);
        });

        return clipDisplayLayer;
      }),
      backgroundColour: this.backgroundColour,
      beatLength: this.beatLengthControl.value,
      startingBeat: this.startingBeatControl.value,
    };
  }

  get selectedCollectionClip():Clip{
    return <Clip>{
      clipId: this.editorClip.clipId,
      backgroundColour: this.editorClip.backgroundColour,
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
      this.saving = false;
      if (this.clipId === 0) {
        this.clips.push(clip);
      } else {
        let index = this.clips.findIndex(clip => clip.clipId === this.clipId);
        this.clips[index] = clip;
      }
      this.toggleEditor();

    });;
  }

  undoClipDisplayLayerFormGroup: Clipdisplaylayer | undefined = undefined;

  editClipDisplayLayer = (index: number) => {
    this.clipDisplayLayersFormArrayIndex = index;
    var clipDisplayLayer = this.editorClip.clipDisplayLayers[index];
    this.undoClipDisplayLayerFormGroup = JSON.parse(JSON.stringify(clipDisplayLayer));
    var collection = this.collections.find(c => c.displayLayers.some(d => d.displayLayerId === clipDisplayLayer.displayLayerId));
    var displayLayer = collection?.displayLayers.find(d => d.displayLayerId === clipDisplayLayer.displayLayerId);
    this.setupCollectionEditor(collection, displayLayer);
  }

  editClip = (clip: Clip) => {
    this.setClipBase(clip);
    this.setClipId(clip.clipId);
    this.clipNameControl.setValue(clip.clipName);
    this.unchangedClip = { ...this.editorClip };
  }

  cloneClip = (clip: Clip) =>{
    this.setClipBase(clip);
    this.unchangedClip = { ...this.editorClip };
  }

  private setClipBase = (clip: Clip) =>{
    this.toggleEditor();
    if (clip.backgroundColour !== null) {
      this.addBackgroundColour(clip.backgroundColour);
    }
    this.beatLengthControl.setValue(clip.beatLength);
    this.startingBeatControl.setValue(clip.startingBeat);

    if (clip.clipDisplayLayers) {
      clip.clipDisplayLayers.forEach(cl => {
        this.addClipDisplayLayer(cl);
      });
    }
  }

  get shouldDisableDisplayLayer() {
    var allIds = this.editorClip.clipDisplayLayers.map(c => c.displayLayerId);
    var uniqueCount = new Set(allIds).size;
    return allIds.length !== uniqueCount;
  }

  get shouldDisableDisplayLayerToolTip() {
    return this.shouldDisableDisplayLayer === true ? 'Already in use' : ''
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

  backgroundColour: string | null = null;

  addBackgroundColour = (backgroundColour: string) => {
    this.backgroundColour = backgroundColour;
    this.isAddingClipDisplayLayer = false;
    this.clipForm.updateValueAndValidity({ onlySelf: true });
  }

  removeBackgroundColour = () => {
    this.backgroundColour = null;
    this.backgroundColourControl.reset('#000000');
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
}
