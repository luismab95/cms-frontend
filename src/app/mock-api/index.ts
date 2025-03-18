import { inject, Injectable } from '@angular/core';
import { NotificationsMockApi } from 'app/mock-api/common/notifications/api';
import { SearchMockApi } from 'app/mock-api/common/search/api';
import { AnalyticsMockApi } from 'app/mock-api/dashboards/analytics/api';
import { ProjectMockApi } from 'app/mock-api/dashboards/project/api';

@Injectable({ providedIn: 'root' })
export class MockApiService {
    analyticsMockApi = inject(AnalyticsMockApi);
    notificationsMockApi = inject(NotificationsMockApi);
    projectMockApi = inject(ProjectMockApi);
    searchMockApi = inject(SearchMockApi);
}
