
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pedido } from './pedidos'; 


describe('Pedido (standalone component)', () => {
  let component: Pedido;
  let fixture: ComponentFixture<Pedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Pedido,
       
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Pedido);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});