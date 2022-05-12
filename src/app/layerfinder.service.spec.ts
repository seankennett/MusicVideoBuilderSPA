import { TestBed } from '@angular/core/testing';

import { LayerFinderService } from './layerfinder.service';

describe('LayerService', () => {
  let service: LayerFinderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayerFinderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
