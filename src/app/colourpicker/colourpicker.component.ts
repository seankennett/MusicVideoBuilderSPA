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
}
