import { Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Layout } from './layout/layout';
import { LanguageService } from './shared/services/language.service';
import { HomeService } from './core/services/home.service';
import { initialDataResolver } from './app.resolvers';
import { NoAuthGuard } from './core/guards/noAuth.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { MenuGuard } from './core/guards/menu.guard';
import { SitieService } from './core/services/sitie.service';
import { TemplateService } from './core/services/templates.service';
import { ParameterService } from './core/services/parameter.service';
import { RoleService } from './shared/services/role.service';
import { UserService } from './core/services/user.service';
import { FileManagerService } from './core/services/file-manager.service';
import { MicrosityService } from './core/services/micrositie.service';
import { PageService } from './core/services/pages.service';
import { PagesDetail } from './pages/admin/pages/detail/detail';
import { PagesList } from './pages/admin/pages/list';
import { PagesCanvas } from './pages/admin/pages/canvas/canvas';
import { ElementService } from './core/services/element.service';

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
              sitie: () => inject(SitieService).find(),
            },
          },
        ],
      },
      // Content
      {
        path: 'content',
        children: [
          {
            path: 'sitie',
            loadComponent: () => import('./pages/admin/sitie/sitie').then((m) => m.Sitie),
            resolve: {
              sitie: () => inject(SitieService).find(),
              languages: () =>
                inject(LanguageService).getAll({
                  page: 1,
                  limit: 10,
                  search: null,
                  status: null,
                }),
              templates: () =>
                inject(TemplateService).getAll({
                  page: 1,
                  limit: 99999,
                  search: null,
                  status: true,
                }),
            },
          },
          // {
          //     path: 'microsities',
          //     loadChildren: () =>
          //         import(
          //             'app/modules/admin/microsities/micrositie.routes'
          //         ),
          // },
          {
            path: 'pages',
            children: [
              {
                path: '',
                component: PagesList,
                resolve: {
                  pages: () =>
                    inject(PageService).getAll({
                      limit: 10,
                      page: 1,
                      search: null,
                      status: null,
                      micrositieId: null,
                    }),
                },
              },
              {
                path: 'detail',
                component: PagesDetail,
                resolve: {
                  page: () =>
                    inject(PageService).find(
                      inject(Router)!.currentNavigation()?.extras?.state!['id'],
                    ),
                  micrositie: () =>
                    inject(MicrosityService).find(
                      inject(Router).currentNavigation()?.extras?.state!['micrositieId'],
                    ),
                  sitie: () => inject(SitieService).find(),
                  languages: () =>
                    inject(LanguageService).getAll({
                      limit: 99999,
                      page: 1,
                      search: null,
                      status: true,
                    }),
                  // elements: () =>
                  //   inject(ElementService).getAll({
                  //     limit: 99999,
                  //     page: 1,
                  //     search: null,
                  //     status: true,
                  //   }),
                },
              },
              {
                path: 'canvas',
                component: PagesCanvas,
                resolve: {
                  page: () =>
                    inject(PageService).find(
                      inject(Router)!.currentNavigation()?.extras?.state!['id'],
                    ),
                  micrositie: () =>
                    inject(MicrosityService).find(
                      inject(Router).currentNavigation()?.extras?.state!['micrositieId'],
                    ),
                  sitie: () => inject(SitieService).find(),
                  languages: () =>
                    inject(LanguageService).getAll({
                      limit: 99999,
                      page: 1,
                      search: null,
                      status: null,
                    }),
                  elements: () =>
                    inject(ElementService).getAll({
                      limit: 99999,
                      page: 1,
                      search: null,
                      status: true,
                    }),
                },
              },
            ],
          },
          // {
          //     path: 'templates',
          //     loadChildren: () =>
          //         import(
          //             'app/modules/admin/templates/templates.routes'
          //         ),
          // },
          {
            path: 'file-manager',
            loadComponent: () =>
              import('./pages/admin/file-manager/list').then((m) => m.FileManagerList),
            resolve: {
              files: () =>
                inject(FileManagerService).getFiles({
                  page: 1,
                  limit: 10,
                  search: null,
                  status: null,
                }),
              parameters: () => inject(ParameterService).getAll(),
            },
          },
          // {
          //     path: 'review-pages',
          //     loadChildren: () =>
          //         import(
          //             'app/modules/admin/review/review.routes'
          //         ),
          // },
        ],
      },
      {
        path: 'security',
        children: [
          {
            path: 'users',
            loadComponent: () => import('./pages/admin/users/list').then((m) => m.UsersList),
            resolve: {
              users: () =>
                inject(UserService).getAll({
                  limit: 10,
                  page: 1,
                  search: null,
                  status: null,
                }),
              roles: () => inject(RoleService).getAll(),
            },
          },
          {
            path: 'parameters',
            loadComponent: () =>
              import('./pages/admin/parameters/parameters').then((m) => m.Parameters),
            resolve: {
              parameters: () => inject(ParameterService).getAll(),
            },
          },
          {
            path: 'settings',
            loadComponent: () => import('./pages/admin/settings/settings').then((m) => m.Settings),
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
