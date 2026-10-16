# Ada Lovelace

My [Cratis Cast](https://cast.cratis.io) site: one [`cast.yaml`](cast.yaml), built with [@cratis/cast](https://github.com/Cratis/Cast).

## Next steps

1. Install and run it:

   ```sh
   npm install
   npm run dev        # http://localhost:4321
   ```

2. Fill in [`cast.yaml`](cast.yaml). Every section has a commented example; uncomment what you want. Your editor completes fields from the schema.
3. Build with live GitHub numbers (optional locally, automatic in CI):

   ```sh
   GITHUB_TOKEN=$(gh auth token) npm run build
   ```

4. Push to GitHub and turn on Pages: **Settings → Pages → Source: GitHub Actions**. The workflow in [`.github/workflows/publish.yaml`](.github/workflows/publish.yaml) builds on every push and every hour.
5. Point the DNS for `www.ada.example` at GitHub Pages; [`public/CNAME`](public/CNAME) already names it.

The site will be at https://www.ada.example.

## Your badge

Your Cast badge is checked on every build: Core and Partner come from the [Cast registry](https://github.com/Cratis/Cast/blob/main/Registry/README.md), Contributor from merged public pull requests in the Cratis organization. Verification page: https://cast.cratis.io/ada
