import { TestBed } from '@angular/core/testing';

import { Lookup } from './lookup';

describe('Lookup', () => {
  let service: Lookup;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Lookup);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
