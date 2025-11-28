
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';

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
    private readonly STATIC_DB = 'backend/db.json';
    private readonly LS_KEY = 'produtos';

    constructor(private http: HttpClient) {}

    listar(): Observable<Produto[]> {
        
        return this.http.get<Produto[]>(this.API).pipe(
            map(list => list.map(p => ({ ...p, img: this.normalizeImgPath(p.img) }))),
            
            catchError(() => this.http.get<any>(this.STATIC_DB).pipe(
                map(db => (db?.products ?? []).map((p: any) => ({
                    id: Number(p.id),
                    nome: p.nome,
                    preco: Number(p.preco),
                    img: this.normalizeImgPath(p.img)
                })))
            )),
            
            catchError(() => {
                const raw = localStorage.getItem(this.LS_KEY);
                const list: Produto[] = raw ? JSON.parse(raw) : [];
                return of(list.map(p => ({ ...p, img: this.normalizeImgPath(p.img) })));
            })
        );
    }

    buscarPorId(id: number): Observable<Produto> {
        return this.http.get<Produto>(`${this.API}/${id}`);
    }

    incluir(produto: CreateProduto): Observable<Produto> {
       
        return this.http.get<Produto[]>(this.API).pipe(
            map(list => this.nextId(list)),
            map(nextId => ({ ...produto, id: nextId })),
            switchMap(body => this.http.post<Produto>(this.API, body)),
            
            catchError(() => {
                const raw = localStorage.getItem(this.LS_KEY);
                const current: Produto[] = raw ? JSON.parse(raw) : [];
                const id = this.nextId(current);
                const novo: Produto = { ...produto, id, img: this.normalizeImgPath((produto as any).img) };
                const updated = [...current, novo];
                localStorage.setItem(this.LS_KEY, JSON.stringify(updated));
                return of(novo);
            })
        );
    }

    editar(id: number, changes: Partial<Produto>): Observable<Produto> {
        return this.http.patch<Produto>(`${this.API}/${id}`, changes).pipe(
            catchError(() => {
                const raw = localStorage.getItem(this.LS_KEY);
                const current: Produto[] = raw ? JSON.parse(raw) : [];
                const updated = current.map(p => p.id === id ? { ...p, ...changes } as Produto : p);
                localStorage.setItem(this.LS_KEY, JSON.stringify(updated));
                const result = updated.find(p => p.id === id)!;
                return of(result);
            })
        );
    }

    excluir(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API}/${id}`).pipe(
            catchError(() => {
                const raw = localStorage.getItem(this.LS_KEY);
                const current: Produto[] = raw ? JSON.parse(raw) : [];
                const updated = current.filter(p => p.id !== id);
                localStorage.setItem(this.LS_KEY, JSON.stringify(updated));
                return of(void 0);
            })
        );
    }



    private nextId(list: Array<{ id: number | string }>): number {
        const maxId = list.reduce((acc, item) => {
            const n = Number((item as any)?.id);
            return Number.isFinite(n) ? Math.max(acc, n) : acc;
        }, 0);
        return maxId + 1;
    }

    private normalizeImgPath(path?: string | null): string {
        if (!path) return 'images/badboy.png';
        let out = String(path).trim();
        out = out.replace(/^\/+/, '');
        out = out.replace(/^src\/assets\//i, 'assets/');
        out = out.replace(/^assets\/images\//i, 'images/');
        out = out.replace(/^public\//i, '');
        out = out.replace(/\.PNG$/i, '.png');
        return out;
    }
}