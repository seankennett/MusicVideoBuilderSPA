import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideobuilderComponent } from './videobuilder.component';

describe('VideobuilderComponent', () => {
  let component: VideobuilderComponent;
  let fixture: ComponentFixture<VideobuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideobuilderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideobuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
