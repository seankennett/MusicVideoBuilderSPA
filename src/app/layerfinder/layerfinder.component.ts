import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { LayerService } from '../layer.service';
import { LayerTag } from '../layertag';

@Component({
  selector: 'app-layerfinder',
  templateUrl: './layerfinder.component.html',
  styleUrls: ['./layerfinder.component.scss']
})
export class LayerFinderComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private layerService: LayerService) { }

  ngOnInit(): void {
    this.disableEnableForm(true);
    this.layerService.getAll().pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((layerTags: LayerTag[]) => {
      this.layerTags = layerTags;
      this.disableEnableForm(false);
    });
  }

  disableEnableForm(isDisabled: boolean) {
    if (isDisabled) {
      this.layerFinderForm.disable({
        emitEvent: false
      });
    } else {
      this.layerFinderForm.enable({
        emitEvent: false
      });
    }    
  }

  layerFinderForm  = this.formBuilder.group({
    layerName: ['', [Validators.required]]
  });
  layerTags: LayerTag[] = [];


  get layerName() {
    return this.layerFinderForm.get('layerName');
  }

  onSubmit() {
    console.log(this.layerFinderForm.value)
  }
}
