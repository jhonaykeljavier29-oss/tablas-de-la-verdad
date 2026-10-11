import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UNITS } from '../../data/units';
import { FundamentosComponent } from '../units/fundamentos.component';
import { ProposicionalComponent } from '../units/proposicional.component';
import { CategoricaComponent } from '../units/categorica.component';
import { IngenieriaComponent } from '../units/ingenieria.component';

/** Guía teórica con pestañas para las 4 unidades. */
@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [
    FundamentosComponent,
    ProposicionalComponent,
    CategoricaComponent,
    IngenieriaComponent,
  ],
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.css',
})
export class GuideComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly unidades = UNITS;
  readonly activa = signal<1 | 2 | 3 | 4>(1);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id >= 1 && id <= 4) {
        this.activa.set(id as 1 | 2 | 3 | 4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  cambiar(id: 1 | 2 | 3 | 4): void {
    this.router.navigate(['/unidad', id]);
  }
}
