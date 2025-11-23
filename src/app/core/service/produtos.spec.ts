
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';


import { ProdutosService } from './produtos'; 

describe('ProdutosService', () => {
  let service: ProdutosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProdutosService]
    });
    service = TestBed.inject(ProdutosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});