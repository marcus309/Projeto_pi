
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Usuario {
    id: number;
    nome: string;
    email: string;
    senha: string;
    tipo: 'adm' | 'cliente';
}

export type CreateUsuario = Omit<Usuario, 'id'>;

@Injectable({ providedIn: 'root' })
export class UsuarioService {
    
    private readonly API = 'http://localhost:3000/users';
  

    constructor(private http: HttpClient) {}

    cadastrar(payload: CreateUsuario): Observable<Usuario> {
        return this.http.post<Usuario>(this.API, payload);
    }

    buscarPorEmail(email: string): Observable<Usuario | null> {
        return this.http.get<Usuario[]>(`${this.API}?email=${encodeURIComponent(email)}`).pipe(
            map(arr => arr.length ? arr[0] : null)
        );
    }
}