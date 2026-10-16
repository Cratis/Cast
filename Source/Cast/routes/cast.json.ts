// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import * as data from 'virtual:cast';
import { castJson } from '../machine/castJson';

export const prerender = true;

export const GET: APIRoute = () =>
    new Response(JSON.stringify(castJson(data), null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
