
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../core/service/usuario'; 

interface Usuario {
  id?: number;
  nome?: string;
  email: string;
  senha: string;
  tipo: 'adm' | 'cliente';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email: string = '';
  senha: string = '';
  errorMsg: string | null = null;
  loading = false;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  login(): void {
    this.errorMsg = null;

    const emailNorm = this.email.trim().toLowerCase();
    const senhaNorm = this.senha.trim();

    if (!emailNorm || !senhaNorm) {
      this.errorMsg = 'Preencha e-mail e senha.';
      return;
    }

    this.loading = true;

    
    this.usuarioService.buscarPorEmail(emailNorm).subscribe({
      next: (user) => {
        this.loading = false;

        if (!user) {
          this.errorMsg = 'Email ou senha incorretos!';
          return;
        }

        
        if (user.senha !== senhaNorm) {
          this.errorMsg = 'Email ou senha incorretos!';
          return;
        }

        
        localStorage.setItem(
          'user',
          JSON.stringify({ email: user.email, tipo: user.tipo, nome: user.nome })
        );

        
        if (user.tipo === 'adm') {
          alert('Bem-vindo, administrador!');
          this.router.navigate(['/admin']).catch(err => {
            console.error('Falha ao navegar para /admin:', err);
            this.errorMsg = 'Não foi possível abrir a área administrativa. Tente novamente.';
          });
          return;
        }

        alert('Bem-vindo, cliente!');
        this.router.navigate(['/']).catch(err => {
          console.error('Falha ao navegar para /:', err);
          this.errorMsg = 'Não foi possível abrir a página inicial. Tente novamente.';
        });
      },
      error: (err) => {
        console.error('Erro ao consultar /users:', err);
        this.loading = false;
        this.errorMsg = 'Falha na autenticação. Verifique sua conexão e tente novamente.';
      }
    });
  }
}