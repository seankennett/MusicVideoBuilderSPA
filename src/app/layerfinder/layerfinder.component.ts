import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map, Observable, OperatorFunction } from 'rxjs';
import { LayerFinderService } from '../layerfinder.service';
import { LayerFinder } from '../layerfinder';
import { PopularTag } from '../populartag';
import { Layertypes } from '../layertypes';
import { MsalService } from '@azure/msal-angular';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-layerfinder',
  templateUrl: './layerfinder.component.html',
  styleUrls: ['./layerfinder.component.scss']
})
export class LayerFinderComponent implements OnInit {

  constructor(private layerService: LayerFinderService, private authService: MsalService, private toastService: ToastService) { }

  @ViewChild('bpmControl') bpmControl!: NgModel;

  ngOnInit(): void {
    this.isLoggedIn = this.authService.instance.getAllAccounts().length > 0;
    this.layerService.getAll().subscribe((layerFinders: LayerFinder[]) => {
      this.layerFinders = layerFinders;
      this.disableSearch = false;
      this.pageLoading = false;
    });
  }

  pageLoading = true;

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

  setBpm = (bpm: number) => {
    this.bpm = bpm;
  }

  setIsPlaying = (isPlaying: boolean) => {
    this.isPlaying = isPlaying;
  }
}
