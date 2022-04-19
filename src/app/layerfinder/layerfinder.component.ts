import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, filter, map, Observable, OperatorFunction, throwError } from 'rxjs';
import { Layer } from '../layer';
import { LayerService } from '../layer.service';
import { LayerFinder } from '../layerfinder';
import { Layertype } from '../layertype';
import { PopularTag } from '../populartag';
import { UserLayer } from '../userlayer';
import { UserlayerService } from '../userlayer.service';

@Component({
  selector: 'app-layerfinder',
  templateUrl: './layerfinder.component.html',
  styleUrls: ['./layerfinder.component.scss']
})
export class LayerFinderComponent implements OnInit {

  constructor(private layerService: LayerService, private userLayerService: UserlayerService) { }

  @ViewChild('bpmControl') bpmControl! : NgModel;

  ngOnInit(): void {
    this.layerService.getAll().pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((layerFinders: LayerFinder[]) => {
      this.layerFinders = layerFinders;
      this.disableSearch = false;
      this.userLayerService.getAll().pipe(
        catchError((error: HttpErrorResponse) => {
          alert('Something went wrong on the server, try again!');
          return throwError(() => new Error('Something went wrong on the server, try again!'));
        })
      ).subscribe((userLayers: UserLayer[]) => {
        for (var userLayer of userLayers) {
          let layerFinder = this.layerFinders.find(l => l.layerId === userLayer.layerId);
          if (layerFinder) {
            layerFinder.userLayerStatusId = userLayer.userLayerStatusId
          }
        }
      });
      
      var tagCounter = layerFinders.flatMap(lf => lf.tags).reduce((prev, cur) => {
        var typedPrev = prev as any;
        typedPrev[cur] = (typedPrev[cur] || 0) + 1;
        return prev;
      }, {});

      this.popularTags = Object.keys(tagCounter).map(key => {
        return new PopularTag(key, (tagCounter as any)[key]);
      }).sort((x, y) => y.count - x.count).slice(0, 10);
    });  
  }

  disableSearch = true;
  typeAheadValue = "";
  layerType = 0;
  layerTypeList: Layertype[] = [
    new Layertype(0, 'All'),
    new Layertype(1, 'Background'),
    new Layertype(2, 'Foreground')
  ];

  private _bpm: number = 135;
  get bpm(){return this._bpm}
  set bpm(value: number){
    if (this.bpmControl.valid === true){
      this._bpm = value
    }
  }

  isPlaying: boolean = false;

  layerFinders: LayerFinder[] = [];

  popularTags: PopularTag[] = [];

  selectedLayers: LayerFinder[] = [];
  selectedTags: string[] = [];

  pendingUserLayers: Layer[] = [];

  formatter = (tag: string) => tag;

  search: OperatorFunction<string, readonly string[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter((term) => term.length >= 1),
      map((term) =>
        this.layerFinders.flatMap((layerFinder) => layerFinder.tags)
          .filter((value, index, array) => array.indexOf(value) === index && new RegExp(term, 'mi').test(value))
          .slice(0, 10)
      )
    );

  selectItem = (selectItem: any) => {
    selectItem.preventDefault();
    this.typeAheadValue = "";
    this.addTag(selectItem.item);
  };

  layerTypeChange = () =>{
    this.selectedLayers = [];
    for (var tag of this.selectedTags){
      this.addTag(tag);
    }
  }

  addTag = (tag: string) =>{
    if (this.selectedTags.indexOf(tag) === -1){
      this.selectedTags.push(tag);
    }

    let layersContainingTags = this.layerFinders.filter(lf => lf.tags.indexOf(tag) > -1 && (this.layerType === 0 || this.layerType === lf.layerTypeId));
    for (var layerContainingTags of layersContainingTags){
      if (this.selectedLayers.some(sl => sl.layerId === layerContainingTags.layerId) === false){
        this.selectedLayers.push(layerContainingTags);
      }
    }
  }

  removeSelectedTag = (tag: string) =>{
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.selectedLayers = this.selectedLayers.filter(sl => sl.tags.some(t => this.selectedTags.indexOf(t) !== -1));
  }

  addUserLayer = (selectedLayer: Layer) => {
    var previousUserLayerStatus = selectedLayer.userLayerStatusId;
    selectedLayer.userLayerStatusId = 3;

    this.userLayerService.postUserLayer({layerId: selectedLayer.layerId, userLayerId: 0, dateUpdated:new Date(), userLayerStatusId: selectedLayer.userLayerStatusId }).pipe(
      catchError((error: HttpErrorResponse) => {
        selectedLayer.userLayerStatusId = previousUserLayerStatus;
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe();
  }

  togglePlay = () =>{
    this.isPlaying = !this.isPlaying;
  }
  
}
