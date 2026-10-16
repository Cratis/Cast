// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// The site's routes read the build's data here. Components never import it: they take the view as a prop,
// so the Cast directory can render them for any member.
import { config, github, writing, tier, sections, build, photo, photoUrl } from 'virtual:cast';
import { siteHost } from './profile/CastHost';
import { castView, type CastView } from './profile/CastView';

/** This site's profile, rendered on its own site. */
export const cast: CastView = castView({ config, github, writing, tier, sections, build, ...(photo ? { photo } : {}), ...(photoUrl ? { photoUrl } : {}) }, siteHost);
