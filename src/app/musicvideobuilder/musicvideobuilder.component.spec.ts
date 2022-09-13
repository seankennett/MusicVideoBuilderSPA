import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicVideoBuilderComponent } from './musicvideobuilder.component';

describe('MusicVideoBuilderComponent', () => {
  let component: MusicVideoBuilderComponent;
  let fixture: ComponentFixture<MusicVideoBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MusicVideoBuilderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MusicVideoBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
