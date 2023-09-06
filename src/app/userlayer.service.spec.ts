import { TestBed } from '@angular/core/testing';

import { UserlayerService } from './userdisplaylayer.service';

describe('UserlayerService', () => {
  let service: UserlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
