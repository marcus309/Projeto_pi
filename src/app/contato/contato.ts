
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-contato',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './contato.html',
    styleUrls: ['./contato.css']
})
export class Contato {
    formulario: FormGroup;

    constructor(private fb: FormBuilder) {
        this.formulario = this.fb.group({
            nome: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
            email: new FormControl<string>('', [Validators.required, Validators.email]),
            mensagem: new FormControl<string>('', [Validators.required, Validators.minLength(10), Validators.maxLength(500)])
        });
    }

    get nome() { return this.formulario.get('nome') as FormControl; }
    get email() { return this.formulario.get('email') as FormControl; }
    get mensagem() { return this.formulario.get('mensagem') as FormControl; }

    onSubmit(): void {
        this.formulario.markAllAsTouched();
        if (this.formulario.invalid) return;

        alert('Formulário enviado com sucesso!\n' + JSON.stringify(this.formulario.value));
        this.formulario.reset();
    }
}