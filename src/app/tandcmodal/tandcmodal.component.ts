import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-tandcmodal',
  templateUrl: './tandcmodal.component.html',
  styleUrls: ['./tandcmodal.component.scss']
})
export class TandcmodalComponent {
  constructor(public activeModal: NgbActiveModal) { }
}
