import { throwError, isObject, isString, isArray, isNumber } from './helper';

interface CDNPolicy {
    Statement: [{
        Resource: string,
        Condition: {
            DateLessThan: {
                'AWS:EpochTime': number
            },
            DateGreaterThan?: {
                'AWS:EpochTime': number
            },
            IpAddress?: {
                'AWS:SourceIp': string
            }
        }
    }]
}

export type CDNCredentials = {
    Signature: string,
    'Key-Pair-Id': string,
    Policy: CDNPolicy
};

function checkCDNPolicy(policy: any) {
    if (!isObject(policy)) {
        throwError();
    }

    const statementArray = policy.Statement;
    if (!isArray(statementArray) || statementArray.length != 1) {
        throwError();
    }

    const statement = statementArray[0];
    if (!isObject(statement)) {
        throwError();
    }

    if (!isString(statement.Resource) || !isObject(statement.Condition)) {
        throwError();
    }

    const condition = statement.Condition;
    const dateLessThan = condition.DateLessThan;
    if (!isObject(dateLessThan)) {
        throwError();
    }

    if (!isNumber(dateLessThan['AWS:EpochTime'])) {
        throwError();
    }

    const dateGreaterThan = condition.DateGreaterThan;
    if (isObject(dateGreaterThan)) {
        if (!isNumber(dateGreaterThan['AWS:EpochTime'])) {
            throwError();
        }
    } else if (dateGreaterThan !== undefined) {
        throwError();
    }

    const ipAddress = condition.IpAddress;
    if (isObject(ipAddress)) {
        if (!isString(ipAddress['AWS:SourceIp'])) {
            throwError();
        }
    } else if (ipAddress !== undefined) {
        throwError();
    }
}

export function check(credentials: any) {

    if (!isObject(credentials)) {
        throwError();
    }

    if (!isString(credentials.Signature)) {
        throwError();
    }

    if (!isString(credentials['Key-Pair-Id'])) {
        throwError();
    }

    checkCDNPolicy(credentials.Policy);
}