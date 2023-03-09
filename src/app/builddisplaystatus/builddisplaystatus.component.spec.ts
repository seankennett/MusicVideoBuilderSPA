import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuilddisplaystatusComponent } from './builddisplaystatus.component';

describe('BuilddisplaystatusComponent', () => {
  let component: BuilddisplaystatusComponent;
  let fixture: ComponentFixture<BuilddisplaystatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuilddisplaystatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuilddisplaystatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
