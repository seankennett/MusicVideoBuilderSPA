import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map, Observable, OperatorFunction } from 'rxjs';
import { CollectionService } from '../collection.service';
import { Collection } from '../collection';
import { PopularTag } from '../populartag';
import { Collectiontypes } from '../collectiontypes';
import { MsalService } from '@azure/msal-angular';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-contentbrowser',
  templateUrl: './contentbrowser.component.html',
  styleUrls: ['./contentbrowser.component.scss']
})
export class ContentBrowserComponent implements OnInit {

  constructor(private collectionService: CollectionService) { }

  @ViewChild('bpmControl') bpmControl!: NgModel;

  ngOnInit(): void {
    this.collectionService.getAll().subscribe((collections: Collection[]) => {
      this.collections = collections;
      this.pageLoading = false;
    });
  }

  pageLoading = true;
  collections: Collection[] = [];
}
