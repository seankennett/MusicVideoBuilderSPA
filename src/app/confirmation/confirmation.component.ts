import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Resolution } from '../resolution';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params =>{
      var resolution: Resolution = Number(params['resolution']);
      if (!isNaN(resolution)){
        this.resolution = resolution;
      } 
    });    
  }

  resolution:Resolution | null = null
}
