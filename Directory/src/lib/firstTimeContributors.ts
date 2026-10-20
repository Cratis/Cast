// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DirectoryMember } from '../../integration/DirectoryMember';
import type { FirstTimeContributor } from '../../integration/OrgStats';

/** Links to an existing directory page, never to an unbuilt route. */
export function contributorProfileUrl(contributor: FirstTimeContributor, members: readonly DirectoryMember[]): string {
    const member = members.find(member => member.handle.toLowerCase() === contributor.login.toLowerCase());
    return member ? `/${member.handle.toLowerCase()}/` : contributor.profileUrl;
}
