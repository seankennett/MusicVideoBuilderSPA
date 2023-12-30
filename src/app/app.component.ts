import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ResolutionmodalComponent } from './resolutionmodal/resolutionmodal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public isMenuCollapsed = true;
  title = 'Music Video Builder';
  isIframe = false;
  loginDisplay = false;
  private readonly _destroying$ = new Subject<void>();

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
  } 

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  showResolutions = () => {
    this.modalService.open(ResolutionmodalComponent, { size: 'xl' });
  }
}
