import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudiomodalComponent } from './audiomodal.component';

describe('AudiomodalComponent', () => {
  let component: AudiomodalComponent;
  let fixture: ComponentFixture<AudiomodalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AudiomodalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AudiomodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
