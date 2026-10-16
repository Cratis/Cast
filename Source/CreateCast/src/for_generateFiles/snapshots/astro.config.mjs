import cast from '@cratis/cast';
import { defineConfig } from 'astro/config';

// cast() reads ./cast.yaml, captures public GitHub data at build time and adds every page.
export default defineConfig({
    integrations: [cast()],
});
