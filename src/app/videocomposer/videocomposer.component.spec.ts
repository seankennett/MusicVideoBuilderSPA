import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideocomposerComponent } from './videocomposer.component';

describe('VideocomposerComponent', () => {
  let component: VideocomposerComponent;
  let fixture: ComponentFixture<VideocomposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideocomposerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideocomposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
