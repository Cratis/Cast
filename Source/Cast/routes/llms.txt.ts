// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import * as data from 'virtual:cast';
import { llmsText } from '../machine/llmsText';

export const prerender = true;

export const GET: APIRoute = () => new Response(llmsText(data), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
