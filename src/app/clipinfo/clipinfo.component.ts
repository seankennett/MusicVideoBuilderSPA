import { Component, Input, OnInit } from '@angular/core';
import { Clip } from '../clip';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-clipinfo',
  templateUrl: './clipinfo.component.html',
  styleUrls: ['./clipinfo.component.scss']
})
export class ClipinfoComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  @Input() clip!:Clip

  displayColour = (colour:string | null)=>{
    return colour ? '#' + colour : '';
  }
}
