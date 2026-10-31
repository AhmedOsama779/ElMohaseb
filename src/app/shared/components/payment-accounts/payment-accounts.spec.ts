import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentAccounts } from './payment-accounts';

describe('PaymentAccounts', () => {
  let component: PaymentAccounts;
  let fixture: ComponentFixture<PaymentAccounts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentAccounts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentAccounts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
