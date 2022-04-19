import { Component, Input, OnInit } from '@angular/core';
import { Link } from '../link';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @Input() links: Link[] = [];
  
  constructor() { }

  ngOnInit(): void {
  }

}
