import { Routes } from '@angular/router';

/** Rutas con carga diferida (lazy) de cada sección. */
export const routes: Routes = [
  {
    path: '',
    title: 'Inicio · Fundamentos de Lógica',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'unidad/:id',
    title: 'Guía · Fundamentos de Lógica',
    loadComponent: () => import('./pages/guide/guide.component').then((m) => m.GuideComponent),
  },
  {
    path: 'laboratorio',
    title: 'Laboratorio · Fundamentos de Lógica',
    loadComponent: () => import('./pages/lab/lab.component').then((m) => m.LabComponent),
  },
  {
    path: 'examen',
    title: 'Examen · Fundamentos de Lógica',
    loadComponent: () => import('./pages/exam/exam.component').then((m) => m.ExamComponent),
  },
  {
    path: 'resultado',
    title: 'Resultados · Fundamentos de Lógica',
    loadComponent: () =>
      import('./pages/results/results.component').then((m) => m.ResultsComponent),
  },
  { path: '**', redirectTo: '' },
];
