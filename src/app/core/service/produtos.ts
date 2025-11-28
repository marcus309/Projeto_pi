import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

export interface Produto {
    id: number;
    nome: string;
    preco: number;
    img: string;
}

export type CreateProduto = Omit<Produto, 'id'>;

@Injectable({ providedIn: 'root' })
export class ProdutoService {
    private readonly BASE = document?.baseURI || '/';
    private readonly STATIC_DB = new URL('backend/db.json', this.BASE).toString();
    private readonly LS_PRODUCTS = 'produtos';
    private readonly LS_DELETED = 'produtos_deleted_ids';
    private readonly LS_OVERRIDES = 'produtos_overrides';

    constructor(private http: HttpClient) {}

    listar(): Observable<Produto[]> {
        const local = this.readLocalProducts();
        return this.http.get<any>(this.STATIC_DB).pipe(
            map(db => (db?.products ?? []).map((p: any) => this.mapRow(p))),
            map(staticList => this.mergeWithRules(staticList, local)),
            map(merged => {
                localStorage.setItem(this.LS_PRODUCTS, JSON.stringify(merged));
                return merged;
            }),
            catchError(() => of(local))
        );
    }

    buscarPorId(id: number): Observable<Produto | null> {
        const all = this.readLocalProducts();
        const found = all.find(p => p.id === id) || null;
        return of(found);
    }

    incluir(produto: CreateProduto): Observable<Produto> {
        const current = this.readLocalProducts();
        const next = this.nextId(current.map(p => p.id));
        const novo: Produto = { ...produto, id: next, img: this.normalizeImgPath((produto as any).img) };
        localStorage.setItem(this.LS_PRODUCTS, JSON.stringify([...current, novo]));
        return of(novo);
    }

    editar(id: number, changes: Partial<Produto>): Observable<Produto> {
        const overrides = this.readOverrides();
        const patch: Partial<Produto> = {};
        if (typeof changes.nome !== 'undefined') patch.nome = String(changes.nome);
        if (typeof changes.preco !== 'undefined') patch.preco = Number(changes.preco);
        if (typeof changes.img !== 'undefined') patch.img = this.normalizeImgPath(changes.img as any);
        overrides[id] = { ...(overrides[id] || {}), ...patch };
        localStorage.setItem(this.LS_OVERRIDES, JSON.stringify(overrides));

        const products = this.readLocalProducts();
        const updated = products.map(p => (p.id === id ? { ...p, ...patch } : p));
        localStorage.setItem(this.LS_PRODUCTS, JSON.stringify(updated));

        const result = updated.find(p => p.id === id) || null;
        return of(result as Produto);
    }

    excluir(id: number): Observable<void> {
        const deleted = this.readDeleted();
        if (!deleted.includes(id)) {
            deleted.push(id);
            localStorage.setItem(this.LS_DELETED, JSON.stringify(deleted));
        }
        const products = this.readLocalProducts().filter(p => p.id !== id);
        localStorage.setItem(this.LS_PRODUCTS, JSON.stringify(products));
        return of(void 0);
    }

    private readLocalProducts(): Produto[] {
        try {
            const raw = localStorage.getItem(this.LS_PRODUCTS);
            const list: Produto[] = raw ? JSON.parse(raw) : [];
            return list.map(p => ({
                id: Number((p as any).id),
                nome: String((p as any).nome),
                preco: Number((p as any).preco),
                img: this.normalizeImgPath((p as any).img)
            }));
        } catch {
            return [];
        }
    }

    private readDeleted(): number[] {
        try {
            const raw = localStorage.getItem(this.LS_DELETED);
            const arr: any[] = raw ? JSON.parse(raw) : [];
            return arr.map(x => Number(x)).filter(n => Number.isFinite(n));
        } catch {
            return [];
        }
    }

    private readOverrides(): Record<number, Partial<Produto>> {
        try {
            const raw = localStorage.getItem(this.LS_OVERRIDES);
            const obj = raw ? JSON.parse(raw) : {};
            const out: Record<number, Partial<Produto>> = {};
            for (const k of Object.keys(obj)) {
                const id = Number(k);
                if (!Number.isFinite(id)) continue;
                const v = obj[k] || {};
                out[id] = {
                    ...(typeof v.nome !== 'undefined' ? { nome: String(v.nome) } : {}),
                    ...(typeof v.preco !== 'undefined' ? { preco: Number(v.preco) } : {}),
                    ...(typeof v.img !== 'undefined' ? { img: this.normalizeImgPath(v.img) } : {})
                };
            }
            return out;
        } catch {
            return {};
        }
    }

    private mapRow(p: any): Produto {
        return {
            id: Number(p.id),
            nome: String(p.nome),
            preco: Number(p.preco),
            img: this.normalizeImgPath(p.img)
        };
    }

    private nextId(existingIds: number[]): number {
        const max = existingIds.reduce((acc, n) => (Number.isFinite(n) ? Math.max(acc, n) : acc), 0);
        return max + 1;
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

    private mergeWithRules(staticList: Produto[], local: Produto[]): Produto[] {
        const deleted = new Set(this.readDeleted());
        const overrides = this.readOverrides();
        const norm = (s: string) => (s || '').trim().toLowerCase();

        const staticIds = new Set(staticList.map(s => s.id));

        const localById = new Map<number, Produto>(local.map(i => [i.id, i]));
        const localByName = new Map<string, Produto>();
        for (const l of local) {
            const key = norm(l.nome);
            if (!localByName.has(key)) localByName.set(key, l);
        }

        const canonical: Produto[] = [];
        for (const s of staticList) {
            if (deleted.has(s.id)) continue;
            const ov = overrides[s.id] || {};
            const byId = localById.get(s.id);
            const byName = localByName.get(norm(s.nome));
            const base = byId || byName || s;
            const merged: Produto = {
                id: s.id,
                nome: typeof ov.nome !== 'undefined' ? String(ov.nome) : base.nome,
                preco: typeof ov.preco !== 'undefined' ? Number(ov.preco) : base.preco,
                img: typeof ov.img !== 'undefined' ? this.normalizeImgPath(ov.img) : this.normalizeImgPath(base.img)
            };
            canonical.push(merged);
        }

        const onlyLocal = local
            .filter(l => !deleted.has(l.id))
            .filter(l => !staticIds.has(l.id))
            .sort((a, b) => a.id - b.id);

        return [...canonical, ...onlyLocal];
    }
}