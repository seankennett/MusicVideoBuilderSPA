import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Layertype } from '../layertype';

@Component({
  selector: 'app-layertypecontrol',
  templateUrl: './layertypecontrol.component.html',
  styleUrls: ['./layertypecontrol.component.scss']
})
export class LayertypecontrolComponent implements OnInit {
  @Input() form!: FormGroup;
  constructor() { }

  ngOnInit(): void {
  }

  layerTypeList: Layertype[] = [
    new Layertype(1, 'Background'),
    new Layertype(2, 'Foreground')
  ];

}
