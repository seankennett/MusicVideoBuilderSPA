import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { LayerFinder } from '../layerfinder';
import { UserLayer } from '../userlayer';
import { UserlayerService } from '../userlayer.service';

@Component({
  selector: 'app-clipcomposer',
  templateUrl: './clipcomposer.component.html',
  styleUrls: ['./clipcomposer.component.scss']
})
export class ClipComposerComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private userLayerService: UserlayerService) { }

  ngOnInit(): void {    
      this.userLayerService.getAll().pipe(
        catchError((error: HttpErrorResponse) => {
          alert('Something went wrong on the server, try again!');
          return throwError(() => new Error('Something went wrong on the server, try again!'));
        })
      ).subscribe((userLayers: UserLayer[]) => {
        this.userLayers = userLayers
      }); 
  }

  userLayers: UserLayer[] = [];

  clipNameControl = this.formBuilder.control('', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]);
  layersFormArray = this.formBuilder.array([], [Validators.required])

  clipForm = this.formBuilder.group({
    clipNameControl: this.clipNameControl,
    layersFormArray: this.layersFormArray
  })

  onSubmit = () =>{

  }

}
