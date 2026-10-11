import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UNITS } from '../../data/units';
import { TOTAL_EXERCISES } from '../../data/exercise-bank';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly unidades = UNITS;
  readonly totalEjercicios = TOTAL_EXERCISES;
}
