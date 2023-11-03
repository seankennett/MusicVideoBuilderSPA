import { TestBed } from '@angular/core/testing';

import { AudiofileService } from './audiofile.service';

describe('AudiofileService', () => {
  let service: AudiofileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudiofileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
