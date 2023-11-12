import { Component, Input, OnInit } from '@angular/core';
import { Buildasset } from '../buildasset';
import { Formats } from '../formats';
import { License } from '../license';
import { Resolution } from '../resolution';

@Component({
  selector: 'app-buildassettable',
  templateUrl: './buildassettable.component.html',
  styleUrls: ['./buildassettable.component.scss']
})
export class BuildassettableComponent implements OnInit {

  @Input() buildAssets: Buildasset[] = [];
  @Input() showDownload: boolean = true;
  
  constructor() { }

  ngOnInit(): void {
  }

  Licenses = License;
  Formats = Formats;

  getFormattedDateTime = (date: Date) => {
    var date = new Date(date);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  displayResolution = (resolution: Resolution) => {
    switch (resolution) {
      case Resolution.FourK:
        return '4K';
      case Resolution.Hd:
        return 'HD';
      default:
        return 'Free'
    }
  }
}
