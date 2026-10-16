# The Cast registry

[`members.yaml`](members.yaml) lists the people Cratis has reviewed and placed in the Cast. Every Cast site and the [directory](https://cast.cratis.io) read this file from `main` when they build. A site cannot give itself a tier: `cast.yaml` has no tier field, and the engine rejects one.

## The tiers

| Tier | Who | Where it comes from |
| --- | --- | --- |
| **Core** | The founders and maintainers of Cratis. | A line in this file, added by Cratis. |
| **Partner** | Consultants and companies Cratis vouches for: people we have worked with and would recommend for Cratis work. | A line in this file, added through a reviewed pull request. |
| **Contributor** | Anyone with at least one merged pull request in a public repository in the [Cratis organization](https://github.com/Cratis). | Computed from GitHub when a site or the directory builds. Never listed here. |

A tier says what someone's relationship to Cratis is. It is not a certification, and it does not come with programme benefits, discounts or referrals.

## Joining

- **Contributor.** Get a pull request merged in any public Cratis repository. The next build of your Cast site and of the directory shows the badge. There is nothing to apply for.
- **Partner.** Open a pull request that adds yourself to `members.yaml`:

  ```yaml
  - github: your-login
    tier: partner
    since: 2026-10          # when the partnership started, YYYY-MM
    role: Independent consultant
    company: Your Company   # optional
    site: https://you.dev   # optional: your site; the directory reads its /cast.json
    profile: https://you.dev/profile/cast.json   # optional: where your cast.json is, when not at <site>/cast.json
  ```

  With a `cast.json` (from a Cast site, or written by any site in the [cast.json format](../Documentation/cast-json.md)), the directory renders your full profile at `https://cast.cratis.io/<login>/`. Without one it shows a profile built from public GitHub data.

  Say in the pull request how you work with Cratis. Cratis reviews it, may ask to talk first, and merges it only when we can vouch for the work.
- **Core.** Added by Cratis.

## Changes and removal

Anyone listed can change their own `role`, `company`, `site` or `profile` in a pull request, or remove themselves at any time. Cratis removes a Partner entry when the partnership ends or when we can no longer vouch for the work, and says so in the pull request that removes it. Removal takes effect on the next build of each site; the badge then falls back to Contributor if the person has merged Cratis pull requests, or disappears.

## Validation

[`members.schema.json`](members.schema.json) gives editors completion. CI validates the file on every pull request: valid YAML, known fields only, `core` or `partner` only, unique handles (case-insensitive) and well-formed dates and URLs. CI does not check that a GitHub login exists; reviewers do.

```sh
yarn workspace @cratis/cast-registry test
```
