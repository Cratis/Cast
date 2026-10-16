// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { z } from 'zod';
import type { castSchema } from './castSchema';

/** cast.yaml as written, before defaults are applied. */
export type CastInput = z.input<typeof castSchema>;

/** cast.yaml after validation and defaults. Career events always carry a `seq`; `github.login` always equals `person.handle`. */
export type CastConfig = Omit<z.output<typeof castSchema>, 'career'> & {
    career: { events: CareerEvent[] };
    github: z.output<typeof castSchema>['github'] & { login: string };
};

/** One fact in the career stream. */
export type CareerEvent = Omit<z.output<typeof castSchema>['career']['events'][number], 'seq'> & { seq: number };
