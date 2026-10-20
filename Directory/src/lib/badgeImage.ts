// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { badgeSvg, Tier, tierStyles } from '@cratis/cast/badges';

/** Image attributes using the generated badge's intrinsic dimensions. */
export function badgeImage(tier: Tier) {
    const svg = badgeSvg(tier);
    return {
        src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
        width: Number(svg.match(/width="(\d+)"/)?.[1]),
        height: 20,
        alt: `${tierStyles[tier].label} badge`,
    };
}
