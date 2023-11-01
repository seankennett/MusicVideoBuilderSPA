import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Collection } from '../collection';
import { Collectiontypes } from '../collectiontypes';
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';

@Component({
  selector: 'app-collectionsearch',
  templateUrl: './collectionsearch.component.html',
  styleUrls: ['./collectionsearch.component.scss']
})
export class CollectionsearchComponent implements OnInit {

  @Input() collections!:Collection[]
  @Input() forcedCollectionType : Collectiontypes | null = null
  @Input() showEdit:boolean = false
  @Input() showEditColour:boolean = false

  @Output() editCollectionEvent = new EventEmitter<Collection>();

  constructor() { }

  ngOnInit(): void {
    if (this.forcedCollectionType){
      this.collectionType = this.forcedCollectionType
    }
  }

  typeAheadValue = "";
  collectionType = Collectiontypes.All;
  collectionTypeList: Array<Collectiontypes> = [
    Collectiontypes.All,
    Collectiontypes.Background,
    Collectiontypes.Foreground
  ];

  Collectiontypes = Collectiontypes;

  bpm: number = 0;
  isPlaying: boolean = false;

  get popularCollections() {
    return this.collections.filter(x => this.collectionType === Collectiontypes.All || this.collectionType === x.collectionType).sort((current, next) => current.userCount - next.userCount).slice(0, 6);
  }

  get selectedCollections() {
    var selectedCollections = [] as Collection[];
    this.selectedCollectionNames.forEach(collectionName => {
      let matchedCollections = this.collections.filter(lf => lf.collectionName === collectionName && (this.collectionType === Collectiontypes.All || this.collectionType === lf.collectionType));
      for (var matchedCollection of matchedCollections) {
        selectedCollections.push(matchedCollection);
      }
    });

    return selectedCollections;
  };
  selectedCollectionNames: string[] = [];

  formatter = (tag: string) => tag;

  search: OperatorFunction<string, readonly string[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter((term) => term.length >= 1),
      map((term) =>
        this.collections.map((collection) => collection.collectionName)
          .filter((value, index, array) => array.indexOf(value) === index && new RegExp(term, 'mi').test(value))
          .slice(0, 10)
      )
    );

  selectItem = (selectItem: any) => {
    selectItem.preventDefault();
    this.typeAheadValue = "";
    this.addName(selectItem.item);
  };

  addName = (tag: string) => {
    if (this.selectedCollectionNames.indexOf(tag) === -1) {
      this.selectedCollectionNames.push(tag);
    }
  }

  removeSelectedTag = (tag: string) => {
    this.selectedCollectionNames = this.selectedCollectionNames.filter(t => t !== tag);
  }

  setBpm = (bpm: number) => {
    this.bpm = bpm;
  }

  setIsPlaying = (isPlaying: boolean) => {
    this.isPlaying = isPlaying;
  }

  editCollection = (collection: Collection) =>{
    this.editCollectionEvent.emit(collection)
  }
}
