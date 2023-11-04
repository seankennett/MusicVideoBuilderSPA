import { TestBed } from '@angular/core/testing';

import { ConfirmationgaurdGuard } from './confirmationgaurd.guard';

describe('ConfirmationgaurdGuard', () => {
  let guard: ConfirmationgaurdGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ConfirmationgaurdGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
