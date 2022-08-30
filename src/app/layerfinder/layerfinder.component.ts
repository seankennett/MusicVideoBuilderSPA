import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, filter, map, Observable, OperatorFunction, throwError } from 'rxjs';
import { Layer } from '../layer';
import { LayerFinderService } from '../layerfinder.service';
import { LayerFinder } from '../layerfinder';
import { PopularTag } from '../populartag';
import { UserLayer } from '../userlayer';
import { UserlayerService } from '../userlayer.service';
import { Layertypes } from '../layertypes';
import { Userlayerstatus } from '../userlayerstatus';

@Component({
  selector: 'app-layerfinder',
  templateUrl: './layerfinder.component.html',
  styleUrls: ['./layerfinder.component.scss']
})
export class LayerFinderComponent implements OnInit {

  constructor(private layerService: LayerFinderService, private userLayerService: UserlayerService) { }

  @ViewChild('bpmControl') bpmControl!: NgModel;

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
            layerFinder.userLayerStatus = userLayer.userLayerStatus;
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
  layerTypeList: Array<Layertypes> = [
    Layertypes.All,
    Layertypes.Background,
    Layertypes.Foreground
  ];

  Layertypes = Layertypes;

  bpm: number = 0;
  isPlaying: boolean = false;

  layerFinders: LayerFinder[] = [];

  popularTags: PopularTag[] = [];

  selectedLayers: LayerFinder[] = [];
  selectedTags: string[] = [];

  get hasBackground() {
    return this.layerFinders.some(x => (x.userLayerStatus === Userlayerstatus.Saved || x.userLayerStatus === Userlayerstatus.Bought) && x.layerType === Layertypes.Background);
  }

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

  layerTypeChange = () => {
    this.selectedLayers = [];
    for (var tag of this.selectedTags) {
      this.addTag(tag);
    }
  }

  addTag = (tag: string) => {
    if (this.selectedTags.indexOf(tag) === -1) {
      this.selectedTags.push(tag);
    }

    let layersContainingTags = this.layerFinders.filter(lf => lf.tags.indexOf(tag) > -1 && (this.layerType === 0 || this.layerType === lf.layerType));
    for (var layerContainingTags of layersContainingTags) {
      if (this.selectedLayers.some(sl => sl.layerId === layerContainingTags.layerId) === false) {
        this.selectedLayers.push(layerContainingTags);
      }
    }
  }

  removeSelectedTag = (tag: string) => {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.selectedLayers = this.selectedLayers.filter(sl => sl.tags.some(t => this.selectedTags.indexOf(t) !== -1));
  }

  addUserLayer = (selectedLayer: Layer) => {
    var previousUserLayerStatus = selectedLayer.userLayerStatus;
    selectedLayer.userLayerStatus = Userlayerstatus.Saved;

    this.userLayerService.postUserLayer({ layerId: selectedLayer.layerId, userLayerId: 0, dateUpdated: new Date(), userLayerStatus: selectedLayer.userLayerStatus, layerType: selectedLayer.layerType, layerName: selectedLayer.layerName }).pipe(
      catchError((error: HttpErrorResponse) => {
        selectedLayer.userLayerStatus = previousUserLayerStatus;
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe();
  }

  disableLayer = (layer: Layer) => layer?.userLayerStatus === Userlayerstatus.Bought || layer?.userLayerStatus === Userlayerstatus.Saved;

  disableLayerTooltip = (layer: Layer) => {
    switch (layer?.userLayerStatus) {
      case Userlayerstatus.Bought: {
        return 'You have already bought this layer';
      }
      case Userlayerstatus.Saved: {
        return 'You have already saved this layer';
      }
      default: {
        return '';
      }
    }
  }

  setBpm = (bpm: number) => {
    this.bpm = bpm;
  }

  setIsPlaying = (isPlaying: boolean) => {
    this.isPlaying = isPlaying;
  }
}
