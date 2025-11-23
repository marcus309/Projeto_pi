
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', pathMatch: 'full', loadComponent: () => import('./home/home').then(m => m.Home) },
    { path: 'home', loadComponent: () => import('./home/home').then(m => m.Home) },
    { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
    { path: 'admin', loadComponent: () => import('./admin/admin').then(m => m.Admin) },
    { path: 'checkout', loadComponent: () => import('./checkout/checkout').then(m => m.Checkout) },
    { path: 'contato', loadComponent: () => import('./contato/contato').then(m => m.Contato) },
    { path: 'esqueci-senha', loadComponent: () => import('./esqueci-senha/esqueci-senha').then(m => m.EsqueciSenha) },
    { path: 'cadastro', loadComponent: () => import('./cadastro/cadastro').then(m => m.Cadastro) },
    { path: 'conta', loadComponent: () => import('./sidebar/sidebar').then(m => m.UserMenu) },

    { path: 'pedidos', loadComponent: () => import('./pedidos/pedidos').then(m => m.Pedido) },

    { path: '**', redirectTo: '' }
];