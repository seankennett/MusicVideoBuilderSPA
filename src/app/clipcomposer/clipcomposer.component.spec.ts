import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipcomposerComponent } from './clipcomposer.component';

describe('ClipcomposerComponent', () => {
  let component: ClipcomposerComponent;
  let fixture: ComponentFixture<ClipcomposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClipcomposerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClipcomposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
