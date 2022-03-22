import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';


@Component({
  selector: 'app-layertagscontrol',
  templateUrl: './layertagscontrol.component.html',
  styleUrls: ['./layertagscontrol.component.scss']
})
export class LayertagscontrolComponent implements OnInit {
  @Input() form!: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }
}
