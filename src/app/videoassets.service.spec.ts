import { TestBed } from '@angular/core/testing';

import { VideoassetsService } from './videoassets.service';

describe('VideoassetsService', () => {
  let service: VideoassetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoassetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
