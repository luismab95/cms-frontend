import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { MenuGuard } from './core/auth/guards/menu.guard';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirect empty path to '/dashboards/project'
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
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'confirmation-required',
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation-required/confirmation-required.routes'
                    ),
            },
            {
                path: 'forgot-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.routes'
                    ),
            },
            {
                path: 'reset-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/reset-password/reset-password.routes'
                    ),
            },
            {
                path: 'sign-in',
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.routes'),
            },
            {
                path: 'sign-out',
                loadChildren: () =>
                    import('app/modules/auth/sign-out/sign-out.routes'),
            },
            {
                path: 'unlock-session',
                loadChildren: () =>
                    import(
                        'app/modules/auth/unlock-session/unlock-session.routes'
                    ),
            },
            //Default
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
        component: LayoutComponent,
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
                        loadChildren: () =>
                            import(
                                'app/modules/admin/dashboards/home/home.routes'
                            ),
                    },
                ],
            },
            // Modules
            {
                path: 'modules',
                children: [
                    {
                        path: 'sitie',
                        loadChildren: () =>
                            import('app/modules/admin/sitie/sitie.routes'),
                    },
                    {
                        path: 'microsities',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/microsities/micrositie.routes'
                            ),
                    },
                    {
                        path: 'pages',
                        loadChildren: () =>
                            import('app/modules/admin/pages/pages.routes'),
                    },
                    {
                        path: 'templates',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/templates/templates.routes'
                            ),
                    },
                    {
                        path: 'file-manager',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/file-manager/file-manager.routes'
                            ),
                    },
                    {
                        path: 'review-pages',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/review/review.routes'
                            ),
                    },
                ],
            },
            // Security
            {
                path: 'security',
                children: [
                    {
                        path: 'users',
                        loadChildren: () =>
                            import('app/modules/admin/users/users.routes'),
                    },
                    {
                        path: 'parameters',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/parameters/parameters.routes'
                            ),
                    },
                    {
                        path: 'settings',
                        loadChildren: () =>
                            import(
                                'app/modules/admin/settings/settings.routes'
                            ),
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
    //Maintenance
    {
        path: 'maintenance',
        loadChildren: () =>
            import('app/modules/error/maintenance/maintenance.routes'),
    },

    // 404 & Catch all
    {
        path: '404-not-found',
        pathMatch: 'full',
        loadChildren: () =>
            import('app/modules/error/error-404/error-404.routes'),
    },

    // 500 error
    {
        path: '500-error',
        pathMatch: 'full',
        loadChildren: () =>
            import('app/modules/error/error-500/error-500.routes'),
    },

    // Landing routes
    {
        path: ':lang',
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('app/modules/landing/router/router.routes'),
            },
            {
                path: ':page',
                loadChildren: () =>
                    import('app/modules/landing/router/router.routes'),
            },
            {
                path: ':micrositie/:page',
                loadChildren: () =>
                    import('app/modules/landing/router/router.routes'),
            },
        ],
    },

    { path: '**', redirectTo: '404-not-found' },
];
