
import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type PedidoStatus = 'pendente' | 'processando' | 'enviado' | 'concluido' | 'cancelado';

interface ItemPedido {
    produtoId: string | number;
    nome: string;
    img?: string;
    preco: number;
    qtd: number;
}

interface PedidoDto {
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

@Component({
    selector: 'app-pedido',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './pedidos.html',
    styleUrls: ['./pedidos.css']
})
export class Pedido implements OnInit {
    carregando = false;
    erro = false;

    private lista = signal<PedidoDto[]>([]);
    private abertoDrawer = signal(false);
    private selecionadoPedido = signal<PedidoDto | null>(null);

    filtroTexto = signal<string>('');
    filtroStatus = signal<string>('todos');
    dataInicio = signal<string | null>(null);
    dataFim = signal<string | null>(null);

    filtrados = computed<PedidoDto[]>(() => {
        const txt = (this.filtroTexto() || '').toLowerCase().trim();
        const st = this.filtroStatus();
        const di = this.dataInicio() ? new Date(this.dataInicio() as string) : null;
        const df = this.dataFim() ? new Date(this.dataFim() as string) : null;

        return this.lista().filter((p: PedidoDto) => {
            const matchTxt =
                !txt ||
                p.numero.toLowerCase().includes(txt) ||
                p.clienteNome.toLowerCase().includes(txt) ||
                p.clienteEmail.toLowerCase().includes(txt);

            const matchSt = st === 'todos' || p.status === st;

            const d = new Date(p.criadoEm);
            const matchDi = !di || d >= di;
            const matchDf = !df || d <= df;

            return matchTxt && matchSt && matchDi && matchDf;
        });
    });

    ngOnInit(): void {
        this.carregando = true;
        this.erro = false;

        try {
            const rawUser = localStorage.getItem('user');
            const email = rawUser ? (JSON.parse(rawUser)?.email as string | undefined) : undefined;

            const raw = localStorage.getItem('pedidos');
            const all = raw ? (JSON.parse(raw) as PedidoDto[]) : [];

            const list = email ? all.filter((p: PedidoDto) => p.clienteEmail === email) : all;
            this.lista.set(Array.isArray(list) ? list : []);
            this.carregando = false;
        } catch {
            this.erro = true;
            this.carregando = false;
        }
    }

    resetFiltros(): void {
        this.filtroTexto.set('');
        this.filtroStatus.set('todos');
        this.dataInicio.set(null);
        this.dataFim.set(null);
    }

    abrirDetalhes(p: PedidoDto): void {
        this.selecionadoPedido.set(p);
        this.abertoDrawer.set(true);
    }

    fecharDetalhes(): void {
        this.abertoDrawer.set(false);
        this.selecionadoPedido.set(null);
    }

    aberto(): boolean {
        return this.abertoDrawer();
    }

    selecionado(): PedidoDto | null {
        return this.selecionadoPedido();
    }

    totalItens(p: PedidoDto): number {
        return (p.itens || []).reduce((acc: number, it: ItemPedido) => acc + Number(it.qtd || 0), 0);
    }

    onImgError(e: Event): void {
        const el = e.target as HTMLImageElement;
        el.src = 'assets/images/placeholder.png';
    }

    classeStatus(status: PedidoDto['status']): string {
        switch (status) {
            case 'pendente': return 'status status-pendente';
            case 'processando': return 'status status-processando';
            case 'enviado': return 'status status-enviado';
            case 'concluido': return 'status status-concluido';
            case 'cancelado': return 'status status-cancelado';
            default: return 'status';
        }
    }

    trackById(_index: number, p: PedidoDto): string {
        return p.id;
    }
}