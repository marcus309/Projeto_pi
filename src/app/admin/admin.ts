import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProdutoService, Produto } from '@core/service/produtos';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
    templateUrl: './admin.html',
    styleUrls: ['./admin.css']
})
export class Admin implements OnInit {
    produtos: Produto[] = [];
    showModal = false;
    produtoForm!: FormGroup;
    formId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private produtoService: ProdutoService
    ) {}

    ngOnInit(): void {
        this.criarFormulario();
        this.loadProdutos();
    }

    private criarFormulario(): void {
        const imgPattern = /^(images\/.+|assets\/images\/.+|https?:\/\/.+)\.(png|jpg|jpeg|webp|gif)$/i;
        this.produtoForm = this.fb.group({
            nome: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
            preco: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
            img: new FormControl<string>('', [Validators.required, Validators.pattern(imgPattern)])
        });
    }

    get nome() { return this.produtoForm.get('nome') as FormControl; }
    get preco() { return this.produtoForm.get('preco') as FormControl; }
    get img() { return this.produtoForm.get('img') as FormControl; }

    private loadProdutos(): void {
        this.produtoService.listar().subscribe({
            next: data => { this.produtos = data; },
            error: () => { this.produtos = []; }
        });
    }

    abrirNovo(): void {
        this.formId = null;
        this.produtoForm.reset();
        this.showModal = true;
        this.produtoForm.markAsPristine();
        this.produtoForm.markAsUntouched();
    }

    editarProduto(id: number): void {
        const p = this.produtos.find(x => x.id === id);
        if (!p) return;
        this.formId = p.id;
        this.produtoForm.setValue({ nome: p.nome, preco: p.preco, img: p.img });
        this.showModal = true;
        this.produtoForm.markAsPristine();
        this.produtoForm.markAsUntouched();
    }

    excluirProduto(id: number): void {
        if (!confirm('Excluir este produto?')) return;
        this.produtoService.excluir(id).subscribe({
            next: () => { this.loadProdutos(); },
            error: () => {}
        });
    }

    fecharModal(): void {
        this.showModal = false;
        this.formId = null;
    }

    salvarProduto(event: Event): void {
        event.preventDefault();
        this.produtoForm.markAllAsTouched();
        if (this.produtoForm.invalid) return;

        const payload = {
            nome: (this.nome.value || '').trim(),
            preco: Number(this.preco.value ?? 0),
            img: (this.img.value || '').trim()
        };

        if (this.formId == null) {
            this.produtoService.incluir(payload).subscribe({
                next: () => {
                    this.loadProdutos();
                    this.fecharModal();
                },
                error: () => {}
            });
        } else {
            this.produtoService.editar(this.formId, payload).subscribe({
                next: () => {
                    this.loadProdutos();
                    this.fecharModal();
                },
                error: () => {}
            });
        }
    }

    onImgError(ev: Event): void {
        const el = ev.target as HTMLImageElement;
        if (!el) return;
        el.src = 'images/badboy.png';
    }
}