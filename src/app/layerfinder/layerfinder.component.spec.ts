import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerFinderComponent } from './layerfinder.component';

describe('LayerfinderComponent', () => {
  let component: LayerFinderComponent;
  let fixture: ComponentFixture<LayerFinderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayerFinderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
