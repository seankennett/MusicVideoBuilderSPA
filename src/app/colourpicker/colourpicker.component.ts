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
  @Input() colourChoices!: string[];

  constructor() { }

  ngOnInit(): void {
  }

  updateControl = (event: any) => {
    if (event.target.value) {
      this.control.setValue(event.target.value);
    }

    event.target.value = "";
  }

  displayRGB = (hex: string) => {
    var rgbArray = hex.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) ?? [255, 255, 255];
    return 'R=' + rgbArray[0] + ',G=' + rgbArray[1] + ',B=' + rgbArray[2];
  }
}
