import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerUploadComponent } from './layerupload.component';

describe('LayeruploadComponent', () => {
  let component: LayerUploadComponent;
  let fixture: ComponentFixture<LayerUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayerUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
