
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './esqueci-senha.html',
  styleUrls: ['./esqueci-senha.css']
})
export class EsqueciSenha {
  onSubmit(event: Event): void {
    event.preventDefault();
    window.alert('E-mail de recuperação enviado.');
  }
}