import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-resolutionmodal',
  templateUrl: './resolutionmodal.component.html',
  styleUrls: ['./resolutionmodal.component.scss']
})
export class ResolutionmodalComponent {
  public constructor(public activeModal: NgbActiveModal) { }
}
