import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsearchComponent } from './collectionsearch.component';

describe('CollectionsearchComponent', () => {
  let component: CollectionsearchComponent;
  let fixture: ComponentFixture<CollectionsearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CollectionsearchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
