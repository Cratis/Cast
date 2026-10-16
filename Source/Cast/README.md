# @cratis/cast

The engine behind [Cratis Cast](https://cast.cratis.io) sites: an Astro integration that turns one `cast.yaml` into a verified, event-sourced personal site.

```js
// astro.config.mjs
import cast from '@cratis/cast';
import { defineConfig } from 'astro/config';

export default defineConfig({ integrations: [cast()] });
```

The quickest start is `npm create @cratis/cast@latest`. Documentation: [getting started](https://github.com/Cratis/Cast/blob/main/Documentation/getting-started.md), [cast.yaml reference](https://github.com/Cratis/Cast/blob/main/Documentation/cast-yaml.md), [cast.json reference](https://github.com/Cratis/Cast/blob/main/Documentation/cast-json.md), [badges and the registry](https://github.com/Cratis/Cast/blob/main/Documentation/badges-and-registry.md).

Besides the integration, the package exports what other Astro projects need to render a Cast profile: `@cratis/cast/profile` (`castView`, the hosts, the browser data), `@cratis/cast/machine` (`castJson`, `profileFromCastJson`, the cast.json schema) and the page components `@cratis/cast/site/pages/ProfilePage.astro` and `CvPage.astro`. The JSON Schemas are `@cratis/cast/cast.schema.json` (cast.yaml) and `@cratis/cast/cast-json.schema.json` (cast.json, version 2).
