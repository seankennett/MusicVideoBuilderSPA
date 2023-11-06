import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipinfoComponent } from './clipinfo.component';

describe('ClipinfoComponent', () => {
  let component: ClipinfoComponent;
  let fixture: ComponentFixture<ClipinfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClipinfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClipinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
