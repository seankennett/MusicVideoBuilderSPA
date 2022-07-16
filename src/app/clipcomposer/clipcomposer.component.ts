import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { Clip } from '../clip';
import { ClipService } from '../clip.service';
import { Layer } from '../layer';
import { LayerFinder } from '../layerfinder';
import { UserLayer } from '../userlayer';
import { UserlayerService } from '../userlayer.service';

@Component({
  selector: 'app-clipcomposer',
  templateUrl: './clipcomposer.component.html',
  styleUrls: ['./clipcomposer.component.scss']
})
export class ClipComposerComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private userLayerService: UserlayerService, private clipService: ClipService) { }

  ngOnInit(): void {    
      this.userLayerService.getAll().pipe(
        catchError((error: HttpErrorResponse) => {
          alert('Something went wrong on the server, try again!');
          return throwError(() => new Error('Something went wrong on the server, try again!'));
        })
      ).subscribe((userLayers: UserLayer[]) => {
        this.userLayers = userLayers
      });
      
      this.clipService.getAll().pipe(
        catchError((error: HttpErrorResponse) => {
          alert('Something went wrong on the server, try again!');
          return throwError(() => new Error('Something went wrong on the server, try again!'));
        })
      ).subscribe((clips: Clip[]) => {
        this.clips = clips
        if (clips.length === 0){
          this.showEditor = true;
        }
      });
  }

  clips: Clip[] = [];
  userLayers: UserLayer[] = [];
  clipId: number  = 0;

  get userBackgrounds() {
    return this.userLayers.filter(l => l.layerTypeId === 1);
  }

  get userForegrounds() {
    return this.userLayers.filter(l => l.layerTypeId === 2);
  }

  clipNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]);
  layersFormArray = this.formBuilder.array([], [Validators.required])

  clipForm = this.formBuilder.group({
    clipNameControl: this.clipNameControl,
    layersFormArray: this.layersFormArray
  })

  showEditor = false;
  isAddingLayer = false;

  toggleAddNewLayer = () => {
    this.isAddingLayer = !this.isAddingLayer;
  }

  addLayer = (selectedLayer: Layer) => {
    this.isAddingLayer = false;
    this.layersFormArray.push(this.formBuilder.control(selectedLayer));
  }

  removeLayer = (control: AbstractControl) => {
    this.layersFormArray.controls = this.layersFormArray.controls.filter(c => c !== control);
  }

  moveUp = (index: number) => {
    let currentControl = this.layersFormArray.controls[index];
    this.layersFormArray.controls[index] = this.layersFormArray.controls[index - 1];
    this.layersFormArray.controls[index - 1] = currentControl;
  }

  moveDown = (index: number) => {
    let currentControl = this.layersFormArray.controls[index];
    this.layersFormArray.controls[index] = this.layersFormArray.controls[index + 1];
    this.layersFormArray.controls[index + 1] = currentControl;
  }

saving = false;

  onSubmit = () =>{
    this.saving = true;

    var clip = <Clip>{
      clipId: this.clipId,
      clipName: this.clipNameControl.value,
      userLayers: Array.from(this.layersFormArray.controls.map((control) => {
        return control.value.userLayerId
      }))
    };

    console.log(clip);

    this.clipService.post(clip).pipe(
      catchError((error: HttpErrorResponse) => {
        this.saving = false;
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((clip: Clip) => {
      this.saving = false;
      console.log(clip);
    });; 
  }

  disableLayer = (layer : Layer) => {
    return this.layersFormArray.controls.some(control => control.value === layer);
  }

  disableLayerTooltip = (layer : Layer) => {
    if (this.disableLayer(layer)){
      return 'Layer already in use';
    }
      return'';
    
  }
}
