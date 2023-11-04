import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-audiomodal',
  templateUrl: './audiomodal.component.html',
  styleUrls: ['./audiomodal.component.scss']
})
export class AudiomodalComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
