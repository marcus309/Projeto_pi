
import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService, Usuario } from '../core/service/usuario';

interface SessaoUsuario {
    email: string;
    nome?: string;
    tipo?: 'adm' | 'cliente';
}

const SESSION_KEY = 'user';

@Component({
    selector: 'app-user-menu',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './sidebar.html',
    styleUrls: ['./sidebar.css']
})
export class UserMenu {
    @Output() toggleSideba = new EventEmitter<void>();

    isOpen = false;
    userSession: SessaoUsuario | null = null;
    userApi: Usuario | null = null;
    loading = false;

    constructor(
        private el: ElementRef<HTMLElement>,
        private usuarioService: UsuarioService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.userSession = this.getSessionUser();
        const email = this.userSession?.email;
        if (!email) return;

        this.loading = true;
        this.usuarioService.buscarPorEmail(email.toLowerCase()).subscribe({
            next: (u) => { this.userApi = u; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    private getSessionUser(): SessaoUsuario | null {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) as SessaoUsuario : null;
        } catch {
            return null;
        }
    }

    toggleMenu(event?: MouseEvent): void {
        if (event) event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(ev: MouseEvent): void {
        if (!this.isOpen) return;
        const target = ev.target as Node;
        if (this.el.nativeElement.contains(target)) return;
        this.isOpen = false;
    }

    @HostListener('document:keydown.escape')
    onEsc(): void {
        if (this.isOpen) this.isOpen = false;
    }

    async sair(): Promise<void> {
        localStorage.removeItem(SESSION_KEY);
        this.isOpen = false;
        await this.router.navigate(['/login']);
    }

    get isLogged(): boolean {
        return !!this.userSession?.email;
    }

    get nome(): string {
        return this.userApi?.nome || this.userSession?.nome || 'Usuário';
    }

    get email(): string {
        return this.userApi?.email || this.userSession?.email || '';
    }

    get tipo(): 'adm' | 'cliente' | undefined {
        return this.userApi?.tipo || this.userSession?.tipo;
    }
}