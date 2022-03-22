import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

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

  layerTypeList: layerType[] = [
    new layerType(1, 'Background'),
    new layerType(2, 'Foreground')
  ];

}

export class layerType {
  id: number;
  name: string;
 
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}
