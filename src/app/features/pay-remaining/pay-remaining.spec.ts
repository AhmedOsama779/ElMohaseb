import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayRemaining } from './pay-remaining';

describe('PayRemaining', () => {
  let component: PayRemaining;
  let fixture: ComponentFixture<PayRemaining>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayRemaining]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayRemaining);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
