import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProdutoService, Produto } from '../core/service/produtos';
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
export class Home implements OnInit, AfterViewInit {
    @ViewChild('carrinhoOffcanvas', { static: false }) carrinhoOffcanvasRef!: ElementRef;

    produtos: Produto[] = [];
    carrinho: ItemCarrinho[] = [];
    offcanvas: any = null;

    showUserMenu = false;
    userApi: Usuario | null = null;

    public readonly currentYear: number = new Date().getFullYear();

    constructor(
        private router: Router,
        private produtoService: ProdutoService,
        private usuarioService: UsuarioService
    ) {}

    ngOnInit(): void {
        this.produtoService.listar().subscribe({
            next: (data) => {
                this.produtos = (data || []).map(p => this.normalizeProduto(p));
                localStorage.setItem('produtos', JSON.stringify(this.produtos));
            },
            error: () => {
                const armazenados = localStorage.getItem('produtos');
                if (armazenados) {
                    const parsed = JSON.parse(armazenados) as Produto[];
                    this.produtos = parsed.map(p => this.normalizeProduto(p));
                } else {
                    this.produtos = [
                        { id: 1, nome: 'Carolina Herrera Bad Boy', preco: 619.90, img: 'images/badboy.png' },
                        { id: 2, nome: 'Invictus Victory', preco: 760.00, img: 'images/invictus.png' },
                        { id: 3, nome: 'Phantom', preco: 400.00, img: 'images/phantom.PNG' },
                        { id: 4, nome: 'Granado Gardênia', preco: 599.99, img: 'images/floral.png' },
                        { id: 5, nome: 'Essencial Único', preco: 899.90, img: 'images/amadeirado.png' },
                        { id: 6, nome: 'Citrus Amber', preco: 699.90, img: 'images/citrico.png' },
                        { id: 7, nome: 'Xerjoff Erba Pura', preco: 2009.90, img: 'images/luxo.png' },
                        { id: 8, nome: 'Stronger With You', preco: 599.90, img: 'images/doce.png' },
                        { id: 9, nome: 'Nautica Voyage', preco: 249.90, img: 'images/nautica.png' },
                        { id: 10, nome: 'Versace Eros', preco: 399.90, img: 'images/eros.png' },
                        { id: 11, nome: 'Bleu de Chanel', preco: 699.90, img: 'images/bleu.jpg' },
                        { id: 12, nome: '212 VIP Black', preco: 349.90, img: 'images/212vip.png' }
                    ];
                    localStorage.setItem('produtos', JSON.stringify(this.produtos));
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
