import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProdutoService, Produto } from '@core/service/produtos'; 
import { UsuarioService, Usuario } from '../core/service/usuario';

declare const bootstrap: any;

interface ItemCarrinho extends Produto {
    qtd: number;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './home.html',
    styleUrls: ['./home.css']
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('carrinhoOffcanvas', { static: false }) carrinhoOffcanvasRef!: ElementRef;

    produtos: Produto[] = [];
    carrinho: ItemCarrinho[] = [];
    offcanvas: any = null;

    showUserMenu = false;
    userApi: Usuario | null = null;

    public readonly currentYear: number = new Date().getFullYear();

    private routerSub?: Subscription;

    constructor(
        private router: Router,
        private produtoService: ProdutoService,
        private usuarioService: UsuarioService
    ) {}

    ngOnInit(): void {
        this.refreshProdutos();

        this.routerSub = this.router.events.subscribe(ev => {
            if (ev instanceof NavigationEnd) {
                if (this.router.url === '/' || this.router.url.startsWith('/#')) {
                    this.refreshProdutos();
                }
            }
        });

        this.carrinho = this.getCarrinho();
        this.atualizarTotalLocalStorage();

        const sessaoRaw = localStorage.getItem('user');
        if (sessaoRaw) {
            try {
                const sessao = JSON.parse(sessaoRaw) as { email?: string };
                if (sessao?.email) {
                    this.usuarioService.buscarPorEmail(sessao.email.toLowerCase()).subscribe({
                        next: (u) => { this.userApi = u; },
                        error: () => { this.userApi = null; }
                    });
                }
            } catch {
                this.userApi = null;
            }
        }
    }

    ngAfterViewInit(): void {
        if (this.carrinhoOffcanvasRef?.nativeElement && typeof bootstrap !== 'undefined' && bootstrap?.Offcanvas) {
            this.offcanvas = new bootstrap.Offcanvas(this.carrinhoOffcanvasRef.nativeElement);
        }
    }

    ngOnDestroy(): void {
        if (this.routerSub) this.routerSub.unsubscribe();
    }

    @HostListener('window:focus')
    onFocus(): void {
        this.refreshProdutos();
    }

    @HostListener('document:click')
    onDocClick(): void {
        this.showUserMenu = false;
    }

    onAvatarClick(event: MouseEvent): void {
        event.stopPropagation();
        this.showUserMenu = !this.showUserMenu;
    }

    verPedidos(): void {
        this.showUserMenu = false;
        this.router.navigate(['/pedidos']);
    }

    irParaAdmin(): void {
        this.showUserMenu = false;
        this.router.navigate(['/admin']);
    }

    finalizarSessao(): void {
        localStorage.removeItem('user');
        this.showUserMenu = false;
        this.router.navigate(['/login']);
    }

    private refreshProdutos(): void {
        this.produtoService.listar().subscribe({
            next: (data) => {
                this.produtos = (data || []).map(p => this.normalizeProduto(p));
            },
            error: () => {
                const armazenados = localStorage.getItem('produtos');
                this.produtos = armazenados ? (JSON.parse(armazenados) as Produto[]).map(p => this.normalizeProduto(p)) : [];
            }
        });
    }

    private normalizeProduto(p: Produto): Produto {
        const img = this.normalizeImgPath(p.img as unknown as string);
        return { ...p, img };
    }

    private normalizeImgPath(path: string | undefined | null): string {
        if (!path) return 'images/badboy.png';
        let out = path.replace(/^\/+/, '');
        out = out.replace(/^src\/assets\//, 'assets/');
        out = out.replace(/^assets\/images\//, 'images/');
        out = out.replace(/^public\//, '');
        out = out.replace(/\.PNG$/i, '.png');
        return out;
    }

    private getCarrinho(): ItemCarrinho[] {
        try {
            const raw = localStorage.getItem('carrinho');
            if (!raw) return [];
            const parsed = JSON.parse(raw) as any[];
            return parsed.map(p => ({
                id: p.id,
                nome: p.nome,
                preco: Number(p.preco),
                img: this.normalizeImgPath(p.img),
                qtd: Number(p.qtd ?? 1)
            })) as ItemCarrinho[];
        } catch {
            return [];
        }
    }

    private salvarCarrinho(): void {
        localStorage.setItem('carrinho', JSON.stringify(this.carrinho));
        this.atualizarTotalLocalStorage();
    }

    adicionarAoCarrinho(id: number): void {
        const item = this.carrinho.find(i => i.id === id);
        if (item) {
            item.qtd += 1;
        } else {
            const produto = this.produtos.find(p => p.id === id);
            if (produto) this.carrinho.push({ ...produto, qtd: 1 });
        }
        this.salvarCarrinho();
        this.abrirCarrinho();
    }

    alterarQuantidade(id: number, delta: number): void {
        const item = this.carrinho.find(i => i.id === id);
        if (!item) return;
        item.qtd += delta;
        if (item.qtd <= 0) {
            this.carrinho = this.carrinho.filter(i => i.id !== id);
        }
        this.salvarCarrinho();
    }

    removerItem(id: number): void {
        this.carrinho = this.carrinho.filter(i => i.id !== id);
        this.salvarCarrinho();
    }

    get totalCarrinho(): number {
        return this.carrinho.reduce((sum, i) => sum + Number(i.preco) * Number(i.qtd), 0);
    }

    abrirCarrinho(): void {
        this.showUserMenu = false;
        if (this.offcanvas?.show) this.offcanvas.show();
    }

    fecharCarrinho(): void {
        if (this.offcanvas?.hide) this.offcanvas.hide();
    }

    finalizarCompra(): void {
        if (this.carrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        this.fecharCarrinho();
        this.router.navigate(['/checkout']);
    }

    private atualizarTotalLocalStorage(): void {
        localStorage.setItem('total', this.totalCarrinho.toFixed(2));
    }

    onImgError(event: Event): void {
        const target = event.target as HTMLImageElement;
        if (!target) return;
        target.onerror = null;
        target.src = 'images/badboy.png';
    }
}