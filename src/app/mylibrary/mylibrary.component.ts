import { Component, OnInit } from '@angular/core';
import { Clip } from '../clip';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { VideoService } from '../video.service';
import { CollectionService } from '../collection.service';
import { Collection } from '../collection';

@Component({
  selector: 'app-mylibrary',
  templateUrl: './mylibrary.component.html',
  styleUrls: ['./mylibrary.component.scss']
})
export class MyLibraryComponent implements OnInit {

  constructor(private videoService: VideoService, private clipService: ClipService, private collectionService: CollectionService) { }

  videos: Video[] = [];
  dependentClips: { clip: Clip, videos: Video[] }[] = [];
  independentClips: Clip[] = [];
  collections: Collection[] = [];
  Formats = Formats;

  get clips() {
    return this.independentClips.concat(this.dependentClips.map(d => d.clip))
  }

  ngOnInit(): void {
    var videos = this.videoService.getAll();
    this.videos = videos;
    var clips = this.clipService.getAll();
    this.collectionService.getAll().subscribe((collections: Collection[]) => {
      this.collections = collections;
      clips.forEach(clip => {
        var dependentVideos = videos.filter(v => v.videoClips.some(c => c.clipId === clip.clipId));
        if (dependentVideos.length > 0) {
          this.dependentClips.push({ clip: clip, videos: dependentVideos });
        } else {
          this.independentClips.push(clip);
        }
      });
      this.pageLoading = false;
    });
  }

  pageLoading = true;

  loading = false;

  removeVideo = (videoRoute: { video: Video, tab: number }) => {
    this.loading = true;
    this.videoService.delete(videoRoute.video.videoId);
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
  }

  removeClip = (clip: Clip) => {
    this.loading = true;
    this.clipService.delete(clip.clipId)
    this.independentClips = this.independentClips.filter(x => x.clipId !== clip.clipId);
    this.loading = false;
  }
}
