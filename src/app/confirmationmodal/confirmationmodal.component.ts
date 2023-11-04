import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmationmodal',
  templateUrl: './confirmationmodal.component.html',
  styleUrls: ['./confirmationmodal.component.scss']
})
export class ConfirmationmodalComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
