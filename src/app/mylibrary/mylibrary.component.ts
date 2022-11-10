import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Clip } from '../clip';
import { ClipService } from '../clip.service';
import { Layer } from '../layer';
import { UserLayer } from '../userlayer';
import { UserlayerService } from '../userlayer.service';
import { Video } from '../video';
import { VideoService } from '../video.service';

@Component({
  selector: 'app-mylibrary',
  templateUrl: './mylibrary.component.html',
  styleUrls: ['./mylibrary.component.scss']
})
export class MyLibraryComponent implements OnInit {

  constructor(private videoService: VideoService, private clipService: ClipService, private userLayerService: UserlayerService) { }

  videos: Video[] = [];
  dependentClips: { clip: Clip, videos: Video[] }[] = [];
  independentClips: Clip[] = [];
  clips: Clip[] = [];
  dependentUserLayers: { userLayer: UserLayer, clips: Clip[] }[] = [];
  independentUserLayers: UserLayer[] = [];

  ngOnInit(): void {
    this.videoService.getAll().subscribe((videos: Video[]) => {
      this.videos = videos;
      this.clipService.getAll().subscribe((clips: Clip[]) => {
        clips.forEach(clip => {
          var dependentVideos = videos.filter(v => v.clips.some(c => c.clipId === clip.clipId));
          if (dependentVideos.length > 0) {
            this.dependentClips.push({ clip: clip, videos: dependentVideos });
          } else {
            this.independentClips.push(clip);
          }
        });

        this.userLayerService.getAll().subscribe((userLayers: UserLayer[]) => {
          userLayers.forEach(userLayer => {
            var dependentClips = clips.filter(c => c.userLayers && c.userLayers.some(u => u.userLayerId === userLayer.userLayerId));
            if (dependentClips.length > 0) {
              this.dependentUserLayers.push({ userLayer: userLayer, clips: dependentClips });
            } else {
              this.independentUserLayers.push(userLayer);
            }
          });

          this.pageLoading = false;
        });
      });
    });
  }

  pageLoading = true;

  loading = false;
  removeVideo = (videoRoute: { video: Video, tab: number }) => {
    this.loading = true;
    this.videoService.delete(videoRoute.video.videoId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return throwError(() => new Error());
      })
    ).subscribe(() => {
      this.videos = this.videos.filter(v => v.videoId !== videoRoute.video.videoId);
      this.loading = false;
    });
  }

  removeClip = (clip: Clip) => {
    this.loading = true;
    this.clipService.delete(clip.clipId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return throwError(() => new Error());
      })
    ).subscribe(() => {
      this.independentClips = this.independentClips.filter(x => x.clipId !== clip.clipId);
      this.loading = false;
    });
  }

  removeUserLayer = (layer: Layer) => {
    var userLayer = <UserLayer>layer;
    this.loading = true;
    this.userLayerService.delete(userLayer.userLayerId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return throwError(() => new Error());
      })
    ).subscribe(() => {
      this.independentUserLayers = this.independentUserLayers.filter(x => x.userLayerId !== userLayer.userLayerId);
      this.loading = false;
    });
  }

}
