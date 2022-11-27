import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Clip } from '../clip';
import { ClipService } from '../clip.service';
import { Layer } from '../layer';
import { LayerFinder } from '../layerfinder';
import { Layertypes } from '../layertypes';
import { UserLayer } from '../userlayer';
import { UserlayerService } from '../userlayer.service';

const beatsPerLayer = 4;

@Component({
  selector: 'app-clipbuilder',
  templateUrl: './clipbuilder.component.html',
  styleUrls: ['./clipbuilder.component.scss']
})
export class ClipBuilderComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private userLayerService: UserlayerService, private clipService: ClipService, private route: ActivatedRoute, private location: Location) { }

  ngOnInit(): void {
    this.clipService.getAll().subscribe((clips: Clip[]) => {
      this.userLayerService.getAll().subscribe((userLayers: UserLayer[]) => {
        this.clips = clips;
        this.userLayers = userLayers
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

  Layertypes = Layertypes;

  pageLoading = true;

  clips: Clip[] = [];
  userLayers: UserLayer[] = [];
  clipId: number = 0;

  setClipId = (clipId: number) => {
    this.clipId = clipId;
    if (clipId === 0) {
      this.location.replaceState('/clipBuilder/');
    } else {
      this.location.replaceState('/clipBuilder/' + clipId);
    }

  }

  get userBackgrounds() {
    return this.userLayers.filter(l => l.layerType === Layertypes.Background);
  }

  get userForegrounds() {
    return this.userLayers.filter(l => l.layerType === Layertypes.Foreground);
  }

  get hasClip() {
    return this.clips.length > 0;
  }

  clipNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]);
  backgroundColourControl = this.formBuilder.control('#000000');
  layersFormArray = this.formBuilder.array([], [Validators.maxLength(255)]);
  beatLengthControl = this.formBuilder.control(4, [Validators.required, Validators.max(4), Validators.min(1)]);
  startingBeatControl = this.formBuilder.control(1, [Validators.required, Validators.max(4), Validators.min(1)]);

  clipForm = this.formBuilder.group({
    clipNameControl: this.clipNameControl,
    layersFormArray: this.layersFormArray,
    backgroundColourControl: this.backgroundColourControl,
    beatLengthControl: this.beatLengthControl,
    startingBeatControl: this.startingBeatControl,
  }, { validator: this.clipFormValidator.bind(this) });

  clipFormValidator(form: FormGroup): ValidationErrors | null {
    if (this.backgroundColour === null && (form.get('layersFormArray') as FormArray).length === 0) {
      return { noLayers: true };
    }

    if (beatsPerLayer - form.get('beatLengthControl')?.value < form.get('startingBeatControl')?.value - 1) {
      return { invalidBeatSettings: true };
    }

    return null;
  }

  showEditor = false;
  showExistingClipWarning = true;
  isAddingLayer = false;

  toggleEditor = () => {
    this.setClipId(0);
    this.clipNameControl.reset();
    this.backgroundColourControl.reset('#000000');
    this.backgroundColour = null;
    this.beatLengthControl.reset(4);
    this.startingBeatControl.reset(1);
    this.layersFormArray.clear();
    this.isAddingLayer = false;
    this.showExistingClipWarning = true;
    this.showEditor = !this.showEditor;
  }

  toggleAddNewLayer = () => {
    this.isAddingLayer = !this.isAddingLayer;
  }

  closeWarning = () => {
    this.showExistingClipWarning = false;
  }

  addLayer = (selectedLayer: Layer | UserLayer) => {
    this.isAddingLayer = false;
    this.layersFormArray.push(this.formBuilder.control(selectedLayer));
  }

  removeLayer = (index: number) => {
    this.layersFormArray.removeAt(index);
  }

  moveBack = (index: number) => {
    let currentControl = this.layersFormArray.controls[index];
    this.layersFormArray.controls[index] = this.layersFormArray.controls[index - 1];
    this.layersFormArray.controls[index - 1] = currentControl;
  }

  moveForward = (index: number) => {
    let currentControl = this.layersFormArray.controls[index];
    this.layersFormArray.controls[index] = this.layersFormArray.controls[index + 1];
    this.layersFormArray.controls[index + 1] = currentControl;
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
      userLayers: this.layersFormArray.controls.map((control) => {
        return control.value
      }),
      backgroundColour: this.backgroundColour,
      beatLength: this.beatLengthControl.value,
      startingBeat: this.startingBeatControl.value,
    };
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

  editClip = (clip: Clip) => {
    this.toggleEditor();
    this.setClipId(clip.clipId);
    this.clipNameControl.setValue(clip.clipName);
    if (clip.backgroundColour !== null) {
      this.addBackgroundColour(clip.backgroundColour);
    }
    this.beatLengthControl.setValue(clip.beatLength);
    this.startingBeatControl.setValue(clip.startingBeat);

    if (clip.userLayers) {
      clip.userLayers.forEach(ul => {
        var userLayer = this.userLayers.find(userLayer => userLayer.userLayerId === ul.userLayerId);
        if (userLayer) {
          this.addLayer(userLayer);
        }
      });
    }

    this.unchangedClip = { ...this.editorClip };
  }

  disableLayer = (layer: Layer) => {
    return this.layersFormArray.controls.some(control => control.value === layer);
  }

  disableLayerTooltip = (layer: Layer) => {
    if (this.disableLayer(layer)) {
      return 'Layer already in use';
    }
    return '';
  }

  canAddLayer = () => {
    if (this.userForegrounds.length > 0) {
      return true;
    }

    return false;
  }

  canAddLayerTooltip = () => {
    if (this.userForegrounds.length === 0) {
      return 'You must select a foreground to be able to add more';
    }

    return '';
  }

  backgroundColour: string | null = null;

  addBackgroundColour = (backgroundColour: string) => {
    this.backgroundColour = backgroundColour;
    this.isAddingLayer = false;
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
