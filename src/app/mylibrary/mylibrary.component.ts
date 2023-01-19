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
import { Videoasset } from '../videoasset';
import { VideoassetsService } from '../videoassets.service';

@Component({
  selector: 'app-mylibrary',
  templateUrl: './mylibrary.component.html',
  styleUrls: ['./mylibrary.component.scss']
})
export class MyLibraryComponent implements OnInit {

  constructor(private videoService: VideoService, private clipService: ClipService, private userLayerService: UserlayerService) { }

  videoAssets: Videoasset[] = [];
  videos: Video[] = [];
  dependentClips: { clip: Clip, videos: Video[] }[] = [];
  independentClips: Clip[] = [];
  clips: Clip[] = [];
  dependentUserLayers: { userLayer: UserLayer, clips: Clip[] }[] = [];
  independentUserLayers: UserLayer[] = [];

  get buildingVideos(){
    return this.videos.filter(v => v.isBuilding);
  }

  get notBuildingVideos(){
    return this.videos.filter(v => !v.isBuilding);
  }

  ngOnInit(): void {
    this.videoService.getAllAssets().subscribe((videoAssets: Videoasset[]) => {
      this.videoAssets = videoAssets;
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
    });
  }

  pageLoading = true;

  loading = false;

  getFormattedDateTime = (date: Date) =>{
    var date = new Date(date);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  removeVideo = (videoRoute: { video: Video, tab: number }) => {
    this.loading = true;
    this.videoService.delete(videoRoute.video.videoId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return throwError(() => new Error());
      })
    ).subscribe(() => {
      this.videos = this.videos.filter(v => v.videoId !== videoRoute.video.videoId);
      var dependentClips = this.dependentClips.filter(d => d.videos.some(v => v.videoId === videoRoute.video.videoId));
      dependentClips.forEach(dc => {
        if (dc.videos.length === 1) {
          this.independentClips.push(dc.clip);
          this.dependentClips = this.dependentClips.filter(c => c.clip.clipId !== dc.clip.clipId);
        } else {
          dc.videos = dc.videos.filter(v => v.videoId !== videoRoute.video.videoId);
        }
      });
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
      var dependentUserLayers = this.dependentUserLayers.filter(d => d.clips.some(c => c.clipId === clip.clipId));
      dependentUserLayers.forEach(du => {
        if (du.clips.length === 1) {
          this.independentUserLayers.push(du.userLayer);
          this.dependentUserLayers = this.dependentUserLayers.filter(u => u.userLayer.userLayerId !== du.userLayer.userLayerId);
        } else {
          du.clips = du.clips.filter(c => c.clipId !== clip.clipId);
        }
      });
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
