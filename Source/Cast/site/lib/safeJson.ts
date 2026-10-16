// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * JSON that is safe to place inside an HTML `<script>` element. `<`, `>` and `&` become Unicode escapes, so text
 * such as `</script>` in cast.yaml cannot close the element, and U+2028/U+2029 are escaped for old parsers.
 * The result parses back to the same value.
 */
export const safeJson = (value: unknown): string =>
    JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
