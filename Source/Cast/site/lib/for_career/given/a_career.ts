// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CareerEvent } from '../../../../config/CastConfig';

export const career: CareerEvent[] = [
    { seq: 1, date: '2015-08', type: 'StudiesStarted', title: 'Bachelor', org: 'University', summary: 'Studies.', skills: ['Functional programming'] },
    { seq: 2, date: '2018-07', type: 'EmploymentStarted', title: 'Engineer', org: 'Acme', role: 'Engineer', summary: 'Joined.', skills: ['C#', 'gRPC'] },
    { seq: 3, date: '2023-03', type: 'EmploymentStarted', title: 'Lead', org: 'Globex', role: 'Lead', endsRole: 'Acme', summary: 'Led.', skills: ['C#', 'Kubernetes'] },
    { seq: 4, date: '2024-06', type: 'CompanyCoFounded', title: 'Co-founder', org: 'Cratis', role: 'Co-founder', summary: 'Founded.' },
    { seq: 5, date: '2025-01', type: 'SystemDeployed', title: 'Shipped', org: 'Globex', summary: 'Live.' },
];
