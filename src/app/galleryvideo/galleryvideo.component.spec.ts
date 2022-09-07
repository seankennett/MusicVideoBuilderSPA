import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryvideoComponent } from './galleryvideo.component';

describe('GalleryvideoComponent', () => {
  let component: GalleryvideoComponent;
  let fixture: ComponentFixture<GalleryvideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GalleryvideoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GalleryvideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
