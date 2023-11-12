import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildassettableComponent } from './buildassettable.component';

describe('BuildassettableComponent', () => {
  let component: BuildassettableComponent;
  let fixture: ComponentFixture<BuildassettableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuildassettableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildassettableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
