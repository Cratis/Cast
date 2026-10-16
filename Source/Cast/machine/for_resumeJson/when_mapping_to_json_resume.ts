// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../../config/parseCast';
import { minimalCast } from '../../config/for_parseCast/given/a_minimal_cast';
import { resumeJson } from '../resumeJson';

describe('when mapping to JSON Resume', () => {
    const config = parseCast(`${minimalCast}
  location: Oslo, Norway
  country: "NO"
  languages: [Norwegian (native), English]
  links:
    linkedin: https://www.linkedin.com/in/ada/
career:
  events:
    - { date: '2018-02', endDate: '2020-12', type: VolunteerTeamJoined, title: Volunteer, org: Red Cross, summary: Helped. }
    - { date: '2018-07', type: EmploymentStarted, title: Engineer, org: Acme, role: Engineer, summary: Built *things*., skills: [C#] }
    - { date: '2023-03', type: EmploymentStarted, title: Lead, org: Globex, role: Lead, endsRole: Acme, summary: Led. }
skills:
  Languages: [C#, TypeScript]
`);
    const resume = resumeJson(config, 'https://ada.example/apple-touch-icon.png');

    it('should name the person', () => resume.basics.name.should.equal('Ada Lovelace'));
    it('should put GitHub first among profiles', () => resume.basics.profiles[0]!.url.should.equal('https://github.com/ada'));
    it('should map other profiles by network', () => resume.basics.profiles[1]!.network.should.equal('LinkedIn'));
    it('should list work newest first', () => resume.work.map(work => work.name).should.deep.equal(['Globex', 'Acme']));
    it('should end roles that ended', () => resume.work[1]!.endDate!.should.equal('2023-03'));
    it('should strip inline markup from summaries', () => resume.work[1]!.summary.should.equal('Built things.'));
    it('should map volunteering', () => resume.volunteer[0]!.organization.should.equal('Red Cross'));
    it('should split language and fluency', () => resume.languages.should.deep.equal([{ language: 'Norwegian', fluency: 'native' }, { language: 'English' }]));
    it('should map skill groups', () => resume.skills[0]!.keywords.should.deep.equal(['C#', 'TypeScript']));
    it('should keep the city', () => resume.basics.location!.city!.should.equal('Oslo'));
});
