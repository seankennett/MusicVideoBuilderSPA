import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransitioninfoComponent } from '../transitioninfo/transitioninfo.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private modalService: NgbModal) { }

  storageUrl = environment.storageUrl;

  ngOnInit(): void {
  }

  showTransitions = () =>{
    this.modalService.open(TransitioninfoComponent);
  }
}
