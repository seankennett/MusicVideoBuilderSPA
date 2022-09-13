import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipBuilderComponent } from './clipbuilder.component';

describe('ClipBuilderComponent', () => {
  let component: ClipBuilderComponent;
  let fixture: ComponentFixture<ClipBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClipBuilderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClipBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
