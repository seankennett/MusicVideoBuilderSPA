import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryplayerComponent } from './galleryplayer.component';

describe('GalleryplayerComponent', () => {
  let component: GalleryplayerComponent;
  let fixture: ComponentFixture<GalleryplayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GalleryplayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GalleryplayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
