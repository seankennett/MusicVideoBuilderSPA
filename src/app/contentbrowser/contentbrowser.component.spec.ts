import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentBrowserComponent } from './contentbrowser.component';

describe('LayerfinderComponent', () => {
  let component: ContentBrowserComponent;
  let fixture: ComponentFixture<ContentBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContentBrowserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
