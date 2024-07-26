import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';

/**
 * Find parameter by code
 * @param code
 * @returns
 */
export function findParameter(code: string, parameters: ParameterI[]) {
    return parameters.find((parameter) => parameter.code === code);
}

/**
 * Get value of auth background
 * @returns
 */
export function getLogo(code: string, parameters: ParameterI[]) {
    return `${findParameter('APP_STATICS_URL', parameters).value}/${findParameter(code, parameters).value}`;
}
