import { ApexOptions } from 'ng-apexcharts';

export interface CountElementsI {
    pages: number;
    microsities: number;
    templates: number;
    files: number;
}

export interface WeekVisitI {
    lastWeek: WeekVisitDataI;
    thisWeek: WeekVisitDataI;
}

export interface WeekVisitDataI {
    sitie: number;
    page: number;
    micrositie: number;
    data: number[];
}

export const weekVisit = (data: WeekVisitI) =>
    ({
        chart: {
            fontFamily: 'inherit',
            foreColor: 'inherit',
            height: '100%',
            type: 'line',
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        colors: ['#64748B', '#94A3B8'],
        dataLabels: {
            enabled: true,
            enabledOnSeries: [0],
            background: {
                borderWidth: 0,
            },
        },
        grid: {
            borderColor: 'var(--fuse-border)',
        },
        labels: [
            'Lunes',
            'Martes',
            'Miercoles',
            'Jueves',
            'Viernes',
            'Sabado',
            'Domingo',
        ],
        legend: {
            show: false,
        },
        plotOptions: {
            bar: {
                columnWidth: '50%',
            },
        },
        series: {
            thisWeek: [
                {
                    name: 'Visitas',
                    type: 'line',
                    data: data.thisWeek.data,
                },
            ],
            lastWeek: [
                {
                    name: 'Visitas',
                    type: 'line',
                    data: data.lastWeek.data,
                },
            ],
        },
        stroke: {
            width: [3, 0],
        },
        tooltip: {
            followCursor: true,
            theme: 'dark',
        },
        xaxis: {
            axisBorder: {
                show: false,
            },
            axisTicks: {
                color: 'var(--fuse-border)',
            },
            labels: {
                style: {
                    colors: 'var(--fuse-text-secondary)',
                },
            },
            tooltip: {
                enabled: false,
            },
        },
        yaxis: {
            labels: {
                offsetX: -16,
                style: {
                    colors: 'var(--fuse-text-secondary)',
                },
            },
        },
    }) as unknown as ApexOptions;

export interface YearVisitI {
    lastYear: YearVisitDataI[];
    thisYear: YearVisitDataI[];
}

export interface YearVisitDataI {
    name: string;
    data: { x: string; y: number }[];
}

export const yearVisit = (data: YearVisitI) =>
    ({
        chart: {
            animations: {
                speed: 400,
                animateGradually: {
                    enabled: false,
                },
            },
            fontFamily: 'inherit',
            foreColor: 'inherit',
            width: '100%',
            height: '100%',
            type: 'area',
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        colors: ['#818CF8'],
        dataLabels: {
            enabled: false,
        },
        fill: {
            colors: ['#312E81'],
        },
        grid: {
            show: true,
            borderColor: '#334155',
            padding: {
                top: 10,
                bottom: -40,
                left: 0,
                right: 0,
            },
            position: 'back',
            xaxis: {
                lines: {
                    show: true,
                },
            },
        },
        series: data,
        stroke: {
            width: 2,
        },
        tooltip: {
            followCursor: true,
            theme: 'dark',
            x: {
                format: 'MMM dd, yyyy',
            },
            y: {
                formatter: (value: number): string => `${value}`,
            },
        },
        xaxis: {
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            crosshairs: {
                stroke: {
                    color: '#475569',
                    dashArray: 0,
                    width: 2,
                },
            },
            labels: {
                offsetY: -20,
                style: {
                    colors: '#CBD5E1',
                },
            },
            tickAmount: 20,
            tooltip: {
                enabled: false,
            },
            type: 'datetime',
        },
        yaxis: {
            axisTicks: {
                show: false,
            },
            axisBorder: {
                show: false,
            },
            min: (min: number): number => min - 750,
            max: (max: number): number => max + 250,
            tickAmount: 5,
            show: false,
        },
    }) as unknown as ApexOptions;

export const visitVsPages = (data: YearVisitI) =>
    ({
        chart: {
            animations: {
                enabled: false,
            },
            fontFamily: 'inherit',
            foreColor: 'inherit',
            height: '100%',
            type: 'area',
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        colors: ['#64748B', '#94A3B8'],
        dataLabels: {
            enabled: false,
        },
        fill: {
            colors: ['#64748B', '#94A3B8'],
            opacity: 0.5,
        },
        grid: {
            show: false,
            padding: {
                bottom: -40,
                left: 0,
                right: 0,
            },
        },
        legend: {
            show: false,
        },
        series: data,
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        tooltip: {
            followCursor: true,
            theme: 'dark',
            x: {
                format: 'MMM dd, yyyy',
            },
        },
        xaxis: {
            axisBorder: {
                show: false,
            },
            labels: {
                offsetY: -20,
                rotate: 0,
                style: {
                    colors: 'var(--fuse-text-secondary)',
                },
            },
            tickAmount: 3,
            tooltip: {
                enabled: false,
            },
            type: 'datetime',
        },
        yaxis: {
            labels: {
                style: {
                    colors: 'var(--fuse-text-secondary)',
                },
            },
            max: (max: number): number => max + 250,
            min: (min: number): number => min - 250,
            show: false,
            tickAmount: 5,
        },
    }) as unknown as ApexOptions;

export interface Top10PagesI {
    name: string;
    lang: string;
    micrositie: string;
    path: string;
    visits: number;
}
