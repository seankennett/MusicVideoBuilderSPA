import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageloadingComponent } from './pageloading.component';

describe('PageloadingComponent', () => {
  let component: PageloadingComponent;
  let fixture: ComponentFixture<PageloadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageloadingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageloadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
