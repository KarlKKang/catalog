/**
 * Encode a string as a URL component, using the application/x-www-form-urlencoded format.
 *
 * Note that although this function has the same name as PHP's `urlencode`, this function does not percent-encode the characters `! ~ * ' ( )` as PHP's `urlencode` does. Otherwise they are equivalent.
 * This encoding is also the same as used by AWS S3 for encoding object keys.
 *
 * It's also worth noting that it does not strictly comply with the application/x-www-form-urlencoded specification, which further requires that `! ~ ' ( )` be percent-encoded, but this is a common variation that is widely supported and used in practice.
 *
 * @param uri A value representing an unencoded component.
 * @return The encoded component, equivalent to the result of JavaScript's built-in encodeURIComponent function, but with spaces replaced by plus signs (+) as required by the application/x-www-form-urlencoded format.
 * @throws {URIError} Thrown by `encodeURIComponent` if the input contains a lone surrogate.
 */
export function urlencode(uri: string | number): string {
    return encodeURIComponent(uri).replace(/%20/g, '+');
}
