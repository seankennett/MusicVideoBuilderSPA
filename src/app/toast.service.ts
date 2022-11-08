import { Injectable } from '@angular/core';
import { timer } from 'rxjs';
import { Toastinfo } from './toastinfo';

const millisecondsInSecond = 1000;
const secondsInMinute = 60;

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() { 
    timer(0, 5*millisecondsInSecond)
    .subscribe(() =>{
      var dateNow = Date.now();
      this.toasts.forEach(toast => {
        var timespan = Math.round((dateNow - toast.dateCreated) / millisecondsInSecond);
        if (timespan >= secondsInMinute){
          toast.timeDisplay = Math.round(timespan / secondsInMinute) + " minutes ago";
        }else if (timespan > 0){
          toast.timeDisplay = timespan + " seconds ago";
        }
      });
    });
  }

  toasts: Toastinfo[] = [];

  show(body: string, pageName: string) {
    this.toasts.push({ dateCreated: Date.now(), body: body, timeDisplay: 'just now', pageName: pageName });
  }

  remove(toast: Toastinfo) {
    this.toasts = this.toasts.filter(t => t != toast);
  }
}
