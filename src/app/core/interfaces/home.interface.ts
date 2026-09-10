import { ApexAxisChartSeries, ApexNonAxisChartSeries, ApexOptions } from 'ng-apexcharts';

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

export interface ApexOptionsI extends Omit<ApexOptions, 'series'> {
  series?: {
    thisWeek: ApexAxisChartSeries | ApexNonAxisChartSeries;
    lastWeek: ApexAxisChartSeries | ApexNonAxisChartSeries;
    thisYear: ApexAxisChartSeries | ApexNonAxisChartSeries;
    lastYear: ApexAxisChartSeries | ApexNonAxisChartSeries;
  };
}

export const weekVisit = (data: WeekVisitI) =>
  ({
    chart: {
      fontFamily: 'inherit',
      foreColor: '#64748B',
      height: '100%',
      type: 'line',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    // Tailwind: indigo-500 / indigo-300
    colors: ['#6366F1', '#A5B4FC'],

    dataLabels: {
      enabled: true,
      enabledOnSeries: [0],
      background: {
        borderWidth: 0,
      },
    },

    // Tailwind: slate-200
    grid: {
      borderColor: '#E2E8F0',
    },

    labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],

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

      // Tailwind: slate-200
      axisTicks: {
        color: '#E2E8F0',
      },

      labels: {
        style: {
          // Tailwind: slate-500
          colors: '#64748B',
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
          // Tailwind: slate-500
          colors: '#64748B',
        },
      },
    },
  }) as unknown as ApexOptionsI;
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
      foreColor: '#64748B',
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
    // indigo-500
    colors: ['#6366F1'],
    dataLabels: {
      enabled: false,
    },
    // Relleno Indigo suave
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.25,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    // slate-200 / slate-100
    grid: {
      show: true,
      borderColor: '#E2E8F0',
      strokeDashArray: 0,
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
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    series: data,
    stroke: {
      width: 2,
      curve: 'smooth',
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
      // Crosshair sutil
      crosshairs: {
        stroke: {
          color: '#C7D2FE', // indigo-200
          dashArray: 4,
          width: 1,
        },
      },
      labels: {
        offsetY: -20,
        style: {
          colors: '#94A3B8', // slate-400
        },
      },
      tickAmount: 10,
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
  }) as unknown as ApexOptionsI;

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
  }) as unknown as ApexOptionsI;

export interface Top10PagesI {
  name: string;
  lang: string;
  micrositie: string;
  path: string;
  visits: number;
}
