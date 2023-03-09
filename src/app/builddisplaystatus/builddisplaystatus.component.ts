import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-builddisplaystatus',
  templateUrl: './builddisplaystatus.component.html',
  styleUrls: ['./builddisplaystatus.component.scss']
})
export class BuilddisplaystatusComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input()
  file: File | null = null

  @Input()
  isBuilding: boolean = false

  @Input()
  isUploadingAudio: boolean = false
}
