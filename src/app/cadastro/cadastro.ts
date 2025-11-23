
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuarioService } from '../core/service/usuario'; 

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './cadastro.html',
  styleUrls: ['./cadastro.css']
})
export class Cadastro {
  formulario: FormGroup;
  errorMsg: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {
    this.formulario = this.fb.group(
      {
        nome: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
        email: new FormControl<string>('', [Validators.required, Validators.email]),
        senha: new FormControl<string>('', [Validators.required, Validators.minLength(6)]),
        confirmarSenha: new FormControl<string>('', [Validators.required])
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  get nome() { return this.formulario.get('nome') as FormControl; }
  get email() { return this.formulario.get('email') as FormControl; }
  get senha() { return this.formulario.get('senha') as FormControl; }
  get confirmarSenha() { return this.formulario.get('confirmarSenha') as FormControl; }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const s = group.get('senha')?.value ?? '';
    const c = group.get('confirmarSenha')?.value ?? '';
    if (!s || !c) return null;
    return s === c ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    this.errorMsg = null;
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    const { nome, email, senha } = this.formulario.value as { nome: string; email: string; senha: string };

    this.loading = true;

    // 1) Verifica duplicidade por e-mail
    this.usuarioService.buscarPorEmail(email.toLowerCase()).subscribe({
      next: (user) => {
        if (user) {
          this.loading = false;
          this.errorMsg = 'Já existe um usuário cadastrado com este e-mail.';
          return;
        }

        
        this.usuarioService.cadastrar({ nome, email, senha, tipo: 'cliente' }).subscribe({
          next: (created) => {
            this.loading = false;
            alert('Cadastro realizado com sucesso!');
            this.router.navigate(['/login']);
          },
          error: () => {
            this.loading = false;
            this.errorMsg = 'Falha ao cadastrar. Tente novamente.';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Não foi possível validar o e-mail. Verifique sua conexão.';
      }
    });
  }
}