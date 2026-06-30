# echo-romania.github.io

One-page landing for ECHO Romania. Dark purple theme, animated UK ↔ Romania
hero map, and a single CTA to the main site at [echo-ai.ro](https://echo-ai.ro).

Pure static HTML / CSS / JS — no build step. Deployed to GitHub Pages by
`.github/workflows/pages.yml` on every push to `main`.

## Local preview

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Pages setup (one-time)

In the repo settings, under **Pages → Build and deployment → Source**, choose
**GitHub Actions**. The workflow then publishes the repo root on every push.
