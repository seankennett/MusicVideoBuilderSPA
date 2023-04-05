import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Buildstatus } from '../buildstatus';
import { Clip } from '../clip';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { VideoService } from '../video.service';
import { Buildasset } from '../buildasset';
import { BuildsService } from '../builds.service';

@Component({
  selector: 'app-mylibrary',
  templateUrl: './mylibrary.component.html',
  styleUrls: ['./mylibrary.component.scss']
})
export class MyLibraryComponent implements OnInit {

  constructor(private videoService: VideoService, private clipService: ClipService, private buildService: BuildsService) { }

  buildAssets: Buildasset[] = [];
  videos: Video[] = [];
  dependentClips: { clip: Clip, videos: Video[] }[] = [];
  independentClips: Clip[] = [];
  clips: Clip[] = [];
  Formats = Formats;

  get buildingVideos(){    
    return this.videos.filter(v => this.buildAssets.some(ba => ba.videoId === v.videoId && (ba.buildStatus == Buildstatus.BuildingPending || ba.buildStatus == Buildstatus.PaymentChargePending)));
  }

  get notBuildingVideos(){
    return this.videos.filter(v => !this.buildingVideos.some(b => b.videoId === v.videoId));
  }

  get completeBuildAssets(){
    return this.buildAssets.filter(ba => ba.buildStatus === Buildstatus.Complete);
  }

  ngOnInit(): void {
    this.buildService.getAll().subscribe((buildAssets: Buildasset[]) => {
      this.buildAssets = buildAssets;
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
      this.loading = false;
    });
  }
}
