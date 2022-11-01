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
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-layerfinder',
  templateUrl: './layerfinder.component.html',
  styleUrls: ['./layerfinder.component.scss']
})
export class LayerFinderComponent implements OnInit {

  constructor(private layerService: LayerFinderService, private userLayerService: UserlayerService, private authService: MsalService) { }

  @ViewChild('bpmControl') bpmControl!: NgModel;

  ngOnInit(): void {
    this.isLoggedIn = this.authService.instance.getAllAccounts().length > 0;
    this.layerService.getAll().pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe((layerFinders: LayerFinder[]) => {
      this.layerFinders = layerFinders;
      this.disableSearch = false;
      if (this.isLoggedIn) {
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
      }
    });
  }

  private isLoggedIn = false;
  disableSearch = true;
  typeAheadValue = "";
  layerType = Layertypes.All;
  layerTypeList: Array<Layertypes> = [
    Layertypes.All,
    Layertypes.Background,
    Layertypes.Foreground
  ];

  Layertypes = Layertypes;

  bpm: number = 0;
  isPlaying: boolean = false;

  layerFinders: LayerFinder[] = [];

  get popularTags() {
    var tagCounter = this.layerFinders.filter(x => this.layerType === Layertypes.All || this.layerType === x.layerType).flatMap(lf => lf.tags).reduce((prev, cur) => {
      var typedPrev = prev as any;
      typedPrev[cur] = (typedPrev[cur] || 0) + 1;
      return prev;
    }, {});

    var popularTags = Object.keys(tagCounter).map(key => {
      return new PopularTag(key, (tagCounter as any)[key]);
    }).sort((x, y) => y.count - x.count).slice(0, 10);

    return popularTags;
  }

  get popularLayers() {
    return this.layerFinders.filter(x => this.layerType === Layertypes.All || this.layerType === x.layerType).sort((current, next) => current.userCount - next.userCount).slice(0, 6);
  }

  trackByPopularTag = (index: number, popularTag: PopularTag) => {
    return popularTag.tagName
  }

  get selectedLayers() {
    var selectedLayers = [] as LayerFinder[];
    this.selectedTags.forEach(tag => {
      let layersContainingTags = this.layerFinders.filter(lf => lf.tags.indexOf(tag) > -1 && (this.layerType === Layertypes.All || this.layerType === lf.layerType));
      for (var layerContainingTags of layersContainingTags) {
        if (selectedLayers.some(sl => sl.layerId === layerContainingTags.layerId) === false) {
          selectedLayers.push(layerContainingTags);
        }
      }
    });

    return selectedLayers;
  };
  selectedTags: string[] = [];

  get hasBackground() {
    return this.layerFinders.some(x => x.layerType === Layertypes.Background);
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

  addTag = (tag: string) => {
    if (this.selectedTags.indexOf(tag) === -1) {
      this.selectedTags.push(tag);
    }
  }

  removeSelectedTag = (tag: string) => {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  addUserLayer = (selectedLayer: Layer) => {
    var previousUserLayerStatus = selectedLayer.userLayerStatus;

    let layerFinder = this.layerFinders.find(l => l.layerId === selectedLayer.layerId);
    if (layerFinder) {
      layerFinder.userLayerStatus = Userlayerstatus.Saved;
    }

    this.userLayerService.postUserLayer({ layerId: selectedLayer.layerId, userLayerId: 0, dateUpdated: new Date(), userLayerStatus: selectedLayer.userLayerStatus, layerType: selectedLayer.layerType, layerName: selectedLayer.layerName }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (layerFinder) {
          layerFinder.userLayerStatus = previousUserLayerStatus;
        }
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe();
  }

  disableLayer = (layer: Layer) => !this.isLoggedIn || layer?.userLayerStatus != null;

  disableLayerTooltip = (layer: Layer) => {
    if (!this.isLoggedIn){
      return 'You must be signed in to add layer';
    }
    
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
