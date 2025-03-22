import { inject, Injectable } from '@angular/core';
import { NotificationsMockApi } from 'app/mock-api/common/notifications/api';
import { SearchMockApi } from 'app/mock-api/common/search/api';

@Injectable({ providedIn: 'root' })
export class MockApiService {
    notificationsMockApi = inject(NotificationsMockApi);
    searchMockApi = inject(SearchMockApi);
}
