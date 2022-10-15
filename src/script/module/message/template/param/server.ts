import { paramWithRedirect } from './helper';
import * as body from '../body/server';
import * as title from '../title/server';

export const invalidResponse = paramWithRedirect(body.invalidResponse);
export const connectionError = {
    title: title.connectionError,
    message: body.connectionError
};
export const status429 = {
    title: title.status429,
    message: body.status429
};
export const status503 = {
    title: title.status503,
    message: body.status503,
    color: 'orange'
};
export const status400And500 = function (responseText: string) {
    return {
        message: body.status400And500(responseText)
    };
};
export const status403 = {
    message: body.status403
};