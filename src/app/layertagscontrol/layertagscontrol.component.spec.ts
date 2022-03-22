import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayertagscontrolComponent } from './layertagscontrol.component';

describe('LayertagscontrolComponent', () => {
  let component: LayertagscontrolComponent;
  let fixture: ComponentFixture<LayertagscontrolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayertagscontrolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayertagscontrolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
