import { paramWithRedirect } from "./helper";
import * as body from "../body";
import * as title from "../title";

export const invalidResponse = paramWithRedirect(body.server.invalidResponse);
export const connectionError = {
    title: title.server.connectionError,
    message: body.server.connectionError
};
export const status429 = {
    title: title.server.status429,
    message: body.server.status429
};
export const status503 = {
    title: title.server.status503,
    message: body.server.status503,
    color: 'orange'
};
export const status400And500 = function (responseText: string) {
    return {
        message: body.server.status400And500(responseText)
    };
};
export const status403 = {
    message: body.server.status403
};