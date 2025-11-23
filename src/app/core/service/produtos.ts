// src/app/core/services/produto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Produto {
    id: number;
    nome: string;
    preco: number;
    img: string;
}

export type CreateProduto = Omit<Produto, 'id'>;

@Injectable({ providedIn: 'root' })
export class ProdutoService {
   
    private readonly API = 'http://localhost:3000/products';
    

    constructor(private http: HttpClient) {}

    listar(): Observable<Produto[]> {
        return this.http.get<Produto[]>(this.API);
    }

    buscarPorId(id: number): Observable<Produto> {
        return this.http.get<Produto>(`${this.API}/${id}`);
    }

    incluir(produto: CreateProduto): Observable<Produto> {
        return this.http.post<Produto>(this.API, produto);
    }

    editar(id: number, changes: Partial<Produto>): Observable<Produto> {
        return this.http.patch<Produto>(`${this.API}/${id}`, changes);
    }

    excluir(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API}/${id}`);
    }
}