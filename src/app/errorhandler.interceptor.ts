import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpContextToken,
  HttpContext
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';

const bodyToken = new HttpContextToken<string>(() => "Error");

export function errorBody(body: string) {
  return new HttpContext().set(bodyToken, body);
}

@Injectable()
export class ErrorhandlerInterceptor implements HttpInterceptor {

  constructor(private toastService: ToastService, private router: Router) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        var errorBody = request.context.get(bodyToken);
        if (errorBody) {
          this.toastService.show(errorBody, this.router.url);
        }

        return throwError(() => new Error());
      })
    );
  }
}
