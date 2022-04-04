import { TestBed } from '@angular/core/testing';

import { LayerUploadService } from './layerupload.service';

describe('LayerUploadService', () => {
  let service: LayerUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayerUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
