
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type PedidoStatus = 'pendente' | 'processando' | 'enviado' | 'concluido' | 'cancelado';

interface ItemPedido {
    produtoId: string | number;
    nome: string;
    img?: string;
    preco: number;
    qtd: number;
}

interface Pedido {
    id: string;
    numero: string;
    clienteNome: string;
    clienteEmail: string;
    criadoEm: string;
    status: PedidoStatus;
    itens: ItemPedido[];
    subtotal: number;
    frete: number;
    total: number;
}

interface ItemCarrinho {
    id: number | string;
    nome?: string;
    preco?: number | string;
    img?: string;
    qtd?: number;
}

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './checkout.html',
    styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit {
    carrinho: ItemCarrinho[] = [];
    frete = 0;
    subtotal = 0;
    totalFinal = 0;

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.carrinho = this.getCarrinho();
        this.frete = this.getFretePadrao();
        this.subtotal = this.calcSubtotal(this.carrinho);
        this.totalFinal = this.subtotal + this.frete;
    }

    
    calcItemTotal(item: ItemCarrinho): number {
        const preco = Number(item.preco ?? 0);
        const qtd = Number(item.qtd ?? 1);
        return preco * qtd;
    }

    onSubmit(e: Event): void {
        e.preventDefault();
        this.finalizarCompra();
    }

    finalizarCompra(): void {
        const sessao = this.getUsuarioLogado();
        if (!sessao?.email) {
            alert('Faça login para finalizar a compra.');
            this.router.navigate(['/login']);
            return;
        }

        if (this.carrinho.length === 0) {
            alert('Seu carrinho está vazio.');
            return;
        }

        const catalogo = this.getCatalogo();
        const itens: ItemPedido[] = this.carrinho.map((i: ItemCarrinho) => {
            const ref = catalogo.find((p: any) => String(p.id) === String(i.id));
            return {
                produtoId: i.id,
                nome: i.nome || ref?.nome || 'Produto',
                img: i.img || ref?.img || 'assets/images/placeholder.png',
                preco: Number(i.preco ?? ref?.preco ?? 0),
                qtd: Number(i.qtd ?? 1)
            };
        });

        const subtotal = itens.reduce((s: number, it: ItemPedido) => s + it.preco * it.qtd, 0);
        const frete = this.frete;
        const total = subtotal + frete;

        const agora = new Date();
        const numero = this.gerarNumeroPedido(agora);

        const pedido: Pedido = {
            id: `p-${numero}`,
            numero,
            clienteNome: sessao.nome || 'Cliente',
            clienteEmail: sessao.email,
            criadoEm: agora.toISOString(),
            status: 'processando',
            itens,
            subtotal,
            frete,
            total
        };

        this.salvarPedidoLocal(pedido);

        localStorage.removeItem('carrinho');
        localStorage.setItem('total', '0.00');
        this.router.navigate(['/pedidos']);
    }

    private salvarPedidoLocal(pedido: Pedido): void {
        try {
            const raw = localStorage.getItem('pedidos');
            const lista = raw ? (JSON.parse(raw) as Pedido[]) : [];
            lista.push(pedido);
            localStorage.setItem('pedidos', JSON.stringify(lista));
        } catch {
            localStorage.setItem('pedidos', JSON.stringify([pedido]));
        }
    }

    private gerarNumeroPedido(d: Date): string {
        const y = d.getFullYear().toString().slice(-2);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const ms = d.getTime().toString().slice(-4);
        return `${y}${m}${day}${ms}`;
    }

    private getUsuarioLogado(): { email: string; nome?: string } | null {
        try {
            const raw = localStorage.getItem('user');
            return raw ? (JSON.parse(raw) as { email: string; nome?: string }) : null;
        } catch {
            return null;
        }
    }

    private getCarrinho(): ItemCarrinho[] {
        try {
            const raw = localStorage.getItem('carrinho');
            if (!raw) return [];
            const parsed = JSON.parse(raw) as any[];
            return parsed.map(p => ({
                id: p.id,
                nome: p.nome,
                preco: p.preco,
                img: p.img,
                qtd: p.qtd ?? 1
            })) as ItemCarrinho[];
        } catch {
            return [];
        }
    }

    private getFretePadrao(): number {
        const raw = localStorage.getItem('fretePadrao');
        const val = raw ? Number(raw) : 0;
        return Number.isFinite(val) ? val : 0;
    }

    private getCatalogo(): Array<{ id: number | string; nome: string; preco: number | string; img: string }> {
        try {
            const raw = localStorage.getItem('produtos');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private calcSubtotal(items: ItemCarrinho[]): number {
        return items.reduce((s: number, it: ItemCarrinho) => {
            const preco = Number(it.preco ?? 0);
            const qtd = Number(it.qtd ?? 1);
            return s + preco * qtd;
        }, 0);
    }
}