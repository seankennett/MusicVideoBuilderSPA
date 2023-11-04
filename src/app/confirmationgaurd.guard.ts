import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { ConfirmationmodalComponent } from './confirmationmodal/confirmationmodal.component';
import { ClipBuilderComponent } from './clipbuilder/clipbuilder.component';
import { MusicVideoBuilderComponent } from './musicvideobuilder/musicvideobuilder.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationgaurdGuard implements CanDeactivate<unknown> {
  constructor(private modalService: NgbModal) { }

  canDeactivate(
    component: ClipBuilderComponent | MusicVideoBuilderComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (component.unableToSave === false) {
      return this.modalService.open(ConfirmationmodalComponent, { centered: true }).result.then(
        (succes) => {
          return true;
        },
        (fail) => {
          return false;
        });
    }
    return true;
  }

}
