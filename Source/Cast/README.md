# @cratis/cast

The engine behind [Cratis Cast](https://cast.cratis.io) sites: an Astro integration that turns one `cast.yaml` into a verified, event-sourced personal site.

```js
// astro.config.mjs
import cast from '@cratis/cast';
import { defineConfig } from 'astro/config';

export default defineConfig({ integrations: [cast()] });
```

The quickest start is `npm create @cratis/cast@latest`. Documentation: [getting started](https://github.com/Cratis/Cast/blob/main/Documentation/getting-started.md), [cast.yaml reference](https://github.com/Cratis/Cast/blob/main/Documentation/cast-yaml.md), [badges and the registry](https://github.com/Cratis/Cast/blob/main/Documentation/badges-and-registry.md).
