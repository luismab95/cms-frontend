import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Layout } from './layout/layout';
import { LanguageService } from './shared/services/language.service';
import { HomeService } from './core/services/home.service';
import { initialDataResolver } from './app.resolvers';
import { NoAuthGuard } from './core/guards/noAuth.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { MenuGuard } from './core/guards/menu.guard';

export const routes: Routes = [
  // Redirect empty path to 'default sitie'
  { path: '', pathMatch: 'full', redirectTo: 'es' },

  // Redirect signed-in user to the '/dashboards/project'
  //
  // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
  // path. Below is another redirection for that path to redirect the user to the desired
  // location. This is a small convenience to keep all main routes together here on this file.
  {
    path: 'signed-in-redirect',
    pathMatch: 'full',
    redirectTo: 'admin/dashboards/home',
  },

  // Auth routes for guests
  {
    path: 'auth',
    canActivate: [NoAuthGuard],
    canActivateChild: [NoAuthGuard],
    component: Layout,
    data: {
      layout: 'empty',
    },
    children: [
      {
        path: 'confirmation-required',
        loadComponent: () =>
          import('./pages/auth/confirmation-required/confirmation-required').then(
            (m) => m.AuthConfirmationRequired,
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password').then((m) => m.AuthForgotPassword),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/auth/reset-password/reset-password').then((m) => m.AuthResetPassword),
      },
      {
        path: 'sign-in',
        loadComponent: () => import('./pages/auth/sign-in/sign-in').then((m) => m.AuthSignIn),
        resolve: {
          languages: () => inject(LanguageService).getAllPublic(),
        },
      },
      {
        path: 'sign-out',
        loadComponent: () => import('./pages/auth/sign-out/sign-out').then((m) => m.AuthSignOut),
      },
      {
        path: 'unlock-session',
        loadComponent: () =>
          import('./pages/auth/unlock-session/unlock-session').then((m) => m.AuthUnlockSession),
      },
      {
        path: '**',
        redirectTo: 'sign-in',
      },
    ],
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [AuthGuard, MenuGuard],
    canActivateChild: [AuthGuard, MenuGuard],
    data: {
      layout: 'panel',
    },
    component: Layout,
    resolve: {
      initialData: initialDataResolver,
    },
    children: [
      // Dashboards
      {
        path: 'dashboards',
        children: [
          {
            path: 'home',
            loadComponent: () => import('./pages/admin/home/home').then((m) => m.Home),
            resolve: {
              countElements: () => inject(HomeService).getCountElements(),
              top10Pages: () => inject(HomeService).getTop10Pages(),
              visitVsPages: () => inject(HomeService).getVisitVsPages(),
              weekVisit: () => inject(HomeService).getWeekVisit(),
              yearVisit: () => inject(HomeService).getYearVisit(),
            },
          },
        ],
      },
      //Default
      {
        path: '**',
        redirectTo: 'dashboards/home',
      },
    ],
  },

  // Landing routes
  {
    path: ':lang',
    component: Layout,
    data: {
      layout: 'empty',
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/landing/router/router').then((m) => m.LandingRouterComponent),
      },
      {
        path: ':page',
        loadComponent: () =>
          import('./pages/landing/router/router').then((m) => m.LandingRouterComponent),
      },
      {
        path: ':micrositie/:page',
        loadComponent: () =>
          import('./pages/landing/router/router').then((m) => m.LandingRouterComponent),
      },
    ],
  },
];
