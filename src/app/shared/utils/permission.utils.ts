import { getLocalStorage } from './storage.util';

export enum PermissionCode {
    homePanel = '1Y92kqNW',
    visitPanel = 'ykXK0H0U',
    editSitie = '36UZ0RQg',
    viewSitie = '5fwbZLLU',
    listLanguage = 'nrkF3VVI',
    viewLanguage = '61cGjjBh',
    createLanguage = 'k98skpeq',
    editLanguage = 'tGZIuIJy',
    toogleLanguage = 'KjGSelQN',
    listMicrosite = 'ti3sLWHa',
    viewMicrosite = 'dVPwVfsd',
    createMicrosite = 'M2tvgxnG',
    editMicrosite = 'M3PDTVb9',
    listUser = 'TBpcCd38',
    viewUser = 'ZHlQ9KrH',
    createUser = 'mRmgLeE5',
    editUser = '04KyWbNE',
    toogleUser = 'ohnPymiK',
    listFiles = 'YbvsOt1D',
    viewFiles = 'bl91z6ln',
    createFiles = 'g8OPBd52',
    editFiles = 'vPMaZlhD',
    toogleFiles = '8JvU2adQ',
    listParameter = '6feAKEbQ',
    editParameter = 'EPhy1acm',
    vieProfile = 'Av9GKwXr',
    editProfile = 'UUyOxarc',
    listPage = 'IBULAcv6',
    viewPage = 'mNrjFV4D',
    createPage = 'D909LuAx',
    editPage = 'gQvc2kR3',
    editContentPage = 'v9bcjxCr',
    editDesignPage = 'eMxnylbB',
    listTemplate = 'WW3mZKOi',
    viewTemplate = 'qVy9ZdWg',
    createTemplate = 'V8isIxyj',
    editTemplate = 'g7pqWe97',
    editContentTemplate = 'pBCHggtI',
    editDesignTemplate = 'P8zRlKsM',
    listReviewPages = 'g6U5KJ1n',
    viewReviewPages = 'pHsaJvoS',
    toogleStatusReviewPage = 'SlzdPrIk',
}

/**
 * Find action by code
 * @param code
 * @returns
 */
export function validAction(code: string) {
    const actions = JSON.parse(getLocalStorage('actions'));
    return actions.includes(code);
}
