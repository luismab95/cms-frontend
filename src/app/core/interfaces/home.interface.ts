import { formatNumber } from 'app/shared/utils/number.utils';
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
    series: {
      thisWeek: [
        {
          name: 'Visitas',
          data: data.thisWeek.data,
        },
      ],
      lastWeek: [
        {
          name: 'Visitas',
          data: data.lastWeek.data,
        },
      ],
    },
    colors: ['#6366F1', '#A5B4FC'],
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      foreColor: '#64748B',
      height: 350,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true,
      },
      toolbar: {
        tools: {
          download: false,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true,
        },
      },
      locales: [
        {
          name: 'es',
          options: {
            toolbar: {
              selectionZoom: 'Zoom de selección',
              zoomIn: 'Acercar',
              zoomOut: 'Alejar',
              reset: 'Restablecer zoom',
            },
          },
        },
      ],
      defaultLocale: 'es',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'straight',
    },
    labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    yaxis: {
      labels: {
        formatter: function (val: number) {
          return val.toString();
        },
      },
      title: {
        text: 'Visitas',
      },
    },
    tooltip: {
      shared: false,
      y: {
        formatter: function (val: string) {
          return val;
        },
      },
    },
  }) as unknown as ApexOptionsI;

export interface YearVisitI {
  lastYear: YearVisitDataI[];
  thisYear: YearVisitDataI[];
}

export interface VisitI {
  total: number;
  pages: number;
  microsities: number;
  sitie: number;
}

export interface YearVisitDataI {
  name: string;
  data: { x: string; y: number }[];
}

export const yearVisit = (data: YearVisitI) =>
  ({
    series: data,
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      foreColor: '#64748B',
      stacked: false,
      height: 350,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true,
      },
      toolbar: {
        tools: {
          download: false,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true,
        },
      },
      locales: [
        {
          name: 'es',
          options: {
            toolbar: {
              selectionZoom: 'Zoom de selección',
              zoomIn: 'Acercar',
              zoomOut: 'Alejar',
              reset: 'Restablecer zoom',
            },
          },
        },
      ],
      defaultLocale: 'es',
    },
    colors: ['#6366F1'],
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    yaxis: {
      labels: {
        formatter: function (val: number) {
          return val.toString();
        },
      },
      title: {
        text: 'Visitas',
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: true,
      },
    },
    tooltip: {
      shared: false,
      y: {
        formatter: function (val: string) {
          return val;
        },
      },
    },
  }) as unknown as ApexOptionsI;

export interface Top10PagesI {
  pageId: number;
  micrositieId: number | null;
  name: string;
  lang: string;
  micrositie: string;
  path: string;
  visits: number;
}

export const distributionOrigen = (data: VisitI) => {
  return {
    series: [data.microsities, data.pages],
    chart: {
      type: 'donut',
      width: 250,
    },
    labels: ['Micrositio', 'Páginas'],
    colors: ['#00bc7d', '#62748e'],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 25,
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 500,
              formatter: () => 'Total visitas',
            },
            value: {
              show: true,
              offsetY: -10,
              color: '#0f172a',
              fontSize: '28px',
              fontWeight: 700,
              formatter: (val: number) => formatNumber(val),
            },
            total: {
              showAlways: true,
              show: true,
              formatter: (val: any) => {
                const series = val.seriesData.series as number[];
                const total = series.reduce((acc: number, value: number) => acc + value, 0);
                return formatNumber(total);
              },
            },
          },
        },
      },
    },
  } as unknown as ApexOptions;
};
