// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { plainText } from '@cratis/cast/profile';
import type { DirectoryMember } from './DirectoryMember';

/**
 * The one line a directory card shows under the role: the cast.json tagline, else its title, else the GitHub bio.
 * Taglines are written in Cast inline markup; the card shows plain text, also for summaries kept from older builds.
 */
export function cardLine(member: DirectoryMember): string | undefined {
    const tagline = member.cast?.tagline;
    return (tagline ? plainText(tagline) : undefined) || member.cast?.title || member.bio;
}
