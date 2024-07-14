/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id: 'dashboards',
        title: 'Dashboards',
        subtitle: 'Unique dashboard designs',
        type: 'group',
        icon: 'heroicons_outline:home',
        children: [
            {
                id: 'dashboards.project',
                title: 'Home',
                type: 'basic',
                icon: 'heroicons_outline:clipboard-document-check',
                link: '/admin/dashboards/home',
            },
        ],
    },
    {
        id: 'modules',
        title: 'Modules',
        subtitle: 'Unique Admin designs',
        type: 'group',
        icon: 'heroicons_outline:folder-open',
        children: [
            {
                id: 'dashboards.project',
                title: 'Sitie',
                type: 'basic',
                icon: 'heroicons_outline:globe-alt',
                link: '/admin/modules/sitie',
            },
            {
                id: 'dashboards.project',
                title: 'Microsities',
                type: 'basic',
                icon: 'heroicons_outline:queue-list',
                link: '/admin/modules/microsities',
            },
            {
                id: 'dashboards.project',
                title: 'Pages',
                type: 'basic',
                icon: 'heroicons_outline:document-duplicate',
                link: '/admin/modules/pages',
            },
            {
                id: 'dashboards.project',
                title: 'Templates',
                type: 'basic',
                icon: 'heroicons_outline:rectangle-group',
                link: '/admin/modules/templates',
            },
            {
                id: 'dashboards.project',
                title: 'File Manager',
                type: 'basic',
                icon: 'heroicons_outline:cloud',
                link: '/admin/modules/file-manager',
            },
        ],
    },
    {
        id: 'security',
        title: 'Security',
        subtitle: 'Unique Security designs',
        type: 'group',
        icon: 'heroicons_outline:shield-check',
        children: [
            {
                id: 'dashboards.project',
                title: 'Users',
                type: 'basic',
                icon: 'heroicons_outline:users',
                link: '/admin/security/users',
            },
            {
                id: 'dashboards.project',
                title: 'Parameters',
                type: 'basic',
                icon: 'heroicons_outline:adjustments-horizontal',
                link: '/admin/security/parameters',
            },
            {
                id: 'dashboards.project',
                title: 'Settings',
                type: 'basic',
                icon: 'heroicons_outline:wrench-screwdriver',
                link: '/admin/security/settings',
            },
        ],
    },
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example',
    },
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example',
    },
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id: 'example',
        title: 'Example',
        type: 'basic',
        icon: 'heroicons_outline:chart-pie',
        link: '/example',
    },
];
