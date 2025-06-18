import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveMesuresComponent } from './live-mesures.component';

describe('LiveMesuresComponent', () => {
  let component: LiveMesuresComponent;
  let fixture: ComponentFixture<LiveMesuresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMesuresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveMesuresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
