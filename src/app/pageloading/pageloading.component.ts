import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-pageloading',
  templateUrl: './pageloading.component.html',
  styleUrls: ['./pageloading.component.scss']
})
export class PageloadingComponent implements OnInit {  
  @Input() pageLoading: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

}
