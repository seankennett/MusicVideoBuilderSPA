import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ClipService } from '../clip.service';
import { Formats } from '../formats';
import { Video } from '../video';
import { Clip } from '../clip';
import { VideoService } from '../video.service';
import { UserLayer } from '../userlayer';

@Component({
  selector: 'app-videocomposer',
  templateUrl: './videocomposer.component.html',
  styleUrls: ['./videocomposer.component.scss']
})
export class VideoComposerComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private videoService: VideoService, private clipService: ClipService) { }

  ngOnInit(): void {
  }


  videos : Array<Video> = [];
  Formats = Formats;

  showEditor = false;

  editVideo = (video: Video) =>{
    console.log(video);
  }

  getVid = () =>{
    this.videoService.getAll().subscribe(video => this.videos = video);
  }

  saveVid = () =>{
    let clip = <Video>{
      bpm: 90, 
      format: Formats.mp4, 
      videoId: 0, 
      videoName: 'first',
      audioFileName: 'heavensAbove.mp3',
      videoDelay: '00:00:21.0000000', 
      clips: [<Clip>{
        clipId: 10,
        clipName:'abc',
        userLayers:[<UserLayer>{layerName:'something'}]
      },
      <Clip>{
        clipId: 11,
        clipName:'def',
        userLayers:[<UserLayer>{layerName:'something'}]
      }
    ]};
    this.videoService.post(clip).subscribe(video => this.videos = [video]);
  }
}
