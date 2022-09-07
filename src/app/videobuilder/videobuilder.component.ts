import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Video } from '../video';
import { VideoService } from '../video.service';

@Component({
  selector: 'app-videobuilder',
  templateUrl: './videobuilder.component.html',
  styleUrls: ['./videobuilder.component.scss']
})
export class VideoBuilderComponent implements OnInit {

  constructor(private videoService: VideoService) { }

  ngOnInit(): void {
    this.videoService.getAll().pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((videos: Video[]) => {
      this.videos = videos
    });
  }

  videos: Video[] = [];
  showSelectedVideo = false;
  videoLoading = false;

  selectVideo = (video: Video) =>{

  }
}
