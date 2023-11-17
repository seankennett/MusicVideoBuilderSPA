import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-licensemodal',
  templateUrl: './licensemodal.component.html',
  styleUrls: ['./licensemodal.component.scss']
})
export class LicensemodalComponent {
  constructor(public activeModal: NgbActiveModal) { }
}
