import { Component, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-bpmcontrol',
  templateUrl: './bpmcontrol.component.html',
  styleUrls: ['./bpmcontrol.component.scss']
})
export class BpmcontrolComponent implements OnInit {

  @ViewChild('bpmControl') bpmControl! : NgModel;
  @Output() bpmEvent = new EventEmitter<number>();
  @Output() isPlayingEvent = new EventEmitter<boolean>();
  
  constructor() { }

  ngOnInit(): void {
    this.bpmEvent.emit(this.bpm);
    this.isPlayingEvent.emit(this.isPlaying);
  }

  private _bpm: number = 135;
  get bpm(){return this._bpm}
  set bpm(value: number){
    if (this.bpmControl.valid === true){
      this._bpm = value
      this.bpmEvent.emit(value);
    }
  }

  isPlaying: boolean = false;

  togglePlay = () =>{
    this.isPlaying = !this.isPlaying;
    this.isPlayingEvent.emit(this.isPlaying);
  }
}
