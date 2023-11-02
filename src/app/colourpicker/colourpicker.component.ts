import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-colourpicker',
  templateUrl: './colourpicker.component.html',
  styleUrls: ['./colourpicker.component.scss']
})
export class ColourpickerComponent implements OnInit {

  @Input() control!: FormControl;
  @Input() id!: string;
  @Input() tooltip!: string;

  constructor() { }

  ngOnInit(): void {
  }

}
