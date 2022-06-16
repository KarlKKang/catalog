import {throwError, isObject, isString, isArray, isNumber} from './helper';

interface CDNPolicy {
	Statement: [{
		Resource: string,
		Condition: {
			DateLessThan: {
				"AWS:EpochTime": number
			},
			DateGreaterThan?: {
				"AWS:EpochTime": number
			},
			IpAddress?: {
				"AWS:SourceIp": string
			}
		}
	}]
};
interface BaseCDNCredentials {
	Signature: string,
	"Key-Pair-Id": string
};
interface CDNCredentialsWithPolicy extends BaseCDNCredentials {
	Policy: CDNPolicy
	Expires: undefined
};
interface CDNCredentialsWithExpires extends BaseCDNCredentials {
	Expires: number
	Policy: undefined
};
export type CDNCredentials = CDNCredentialsWithPolicy | CDNCredentialsWithExpires;

function checkCDNPolicy (policy: any) {
    if (!isObject(policy)) {
        throwError();
    }

    var statementArray: any = policy.Statement;
    if (!isArray(statementArray) || statementArray.length != 1) {
        throwError();
    }

    var statement: any = statementArray[0];
    if (!isObject(statement)) {
        throwError();
    }

    if (!isString(statement.Resource) || !isObject(statement.Condition)) {
        throwError();
    }

    var condition: {[key: string]: any} = statement.Condition;
    var dateLessThan: any = condition.DateLessThan;
    if (!isObject(dateLessThan)) {
        throwError();
    }

    if (!isNumber(dateLessThan["AWS:EpochTime"])) {
        throwError();
    }

    var dateGreaterThan: any = condition.DateGreaterThan;
    if (isObject(dateGreaterThan)) {
        if (!isNumber(dateGreaterThan["AWS:EpochTime"])) {
            throwError();
        }
    } else if (dateGreaterThan !== undefined) {
        throwError();
    }

    var ipAddress: any = condition.IpAddress;
    if (isObject(ipAddress)) {
        if (!isString(ipAddress["AWS:SourceIp"])) {
            throwError();
        }
    } else if (ipAddress !== undefined) {
        throwError();
    }
}

export function check (credentials: any) {

	if (!isObject(credentials)) {
		throwError();
	}

	if (!isString(credentials.Signature)) {
		throwError();
	}

	if (!isString(credentials["Key-Pair-Id"])) {
		throwError();
	}

    let policy = credentials.Policy;
	if (policy === undefined) {
		if (!isNumber(credentials.Expires)) {
			throwError();
		}
	} else {
		checkCDNPolicy(policy);
	}
}