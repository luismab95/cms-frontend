import { Injectable } from '@angular/core';
import {
    FuseNavigationItem,
    FuseNavigationService,
} from '@fuse/components/navigation';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class SearchMockApi {
    private _defaultNavigation: FuseNavigationItem[] = [];

    /**
     * Constructor
     */
    constructor(
        private _fuseMockApiService: FuseMockApiService,
        private _navigationService: NavigationService,
        private _fuseNavigationService: FuseNavigationService
    ) {
        // Register Mock API handlers
        this._navigationService.navigation$.subscribe((navigation) => {
            this._defaultNavigation = navigation.compact;
            this.registerHandlers();
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // Get the flat navigation and store it
        const flatNavigation = this._fuseNavigationService.getFlatNavigation(
            this._defaultNavigation
        );

        // -----------------------------------------------------------------------------------------------------
        // @ Search results - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/common/search')
            .reply(({ request }) => {
                // Get the search query
                const query = cloneDeep(request.body.query.toLowerCase());

                // If the search query is an empty string,
                // return an empty array
                if (query === '') {
                    return [200, { results: [] }];
                }

                // Filter the navigation
                const pagesResults = cloneDeep(flatNavigation).filter(
                    (page) =>
                        page.title?.toLowerCase().includes(query) ||
                        (page.subtitle && page.subtitle.includes(query))
                );

                // Prepare the results array
                const results = [];

                // If there are page results...
                if (pagesResults.length > 0) {
                    // Normalize the results
                    pagesResults.forEach((result: any) => {
                        // Add the page title as the value
                        result.value = result.title;
                    });

                    // Add to the results
                    results.push({
                        id: 'pages',
                        label: 'Páginas',
                        results: pagesResults,
                    });
                }

                // Return the response
                return [200, results];
            });
    }
}
