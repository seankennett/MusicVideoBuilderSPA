import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MylayersComponent } from './mylayers.component';

describe('MylayersComponent', () => {
  let component: MylayersComponent;
  let fixture: ComponentFixture<MylayersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MylayersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MylayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
