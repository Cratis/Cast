// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The Cast directory. Every verification page lives at `${castDirectoryUrl}/<handle>`. */
export const castDirectoryUrl = 'https://cast.cratis.io';

/** The organization whose merged public pull requests make someone a Contributor. */
export const cratisOrganization = 'Cratis';

/** The reviewed registry, read at build time. A copy ships in the package as a fallback. */
export const registryUrl = 'https://raw.githubusercontent.com/Cratis/Cast/main/Registry/members.yaml';

/** Human-readable location of the registry, for "verified from" links. */
export const registryBlobUrl = 'https://github.com/Cratis/Cast/blob/main/Registry/members.yaml';

/** The verification page for a handle. */
export const verificationUrl = (handle: string): string => `${castDirectoryUrl}/${handle.toLowerCase()}`;
