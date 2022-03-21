import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-layerupload',
  templateUrl: './layerupload.component.html',
  styleUrls: ['./layerupload.component.scss']
})
export class LayerUploadComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
  }

  layerUploadForm = this.formBuilder.group({
    layerName:['', Validators.required]
  })

  get layerName() {
    return this.layerUploadForm.get('layerName');
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.layerUploadForm.value);
  }
}
