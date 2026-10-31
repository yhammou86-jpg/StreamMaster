# Hydra

**One addon. Every source.** A Stremio / Nuvio addon that aggregates public trackers and Torznab
indexers, probes your debrid cache in a single batch call, and falls back to native P2P — so there
is always something to press play on.

Runs entirely on Vercel's free tier. Zero runtime dependencies.

```
Stremio  ──┐
           ├──►  Hydra  ──►  Cinemeta (title lookup)
Nuvio    ──┘         │
                     ├──►  10 sources in parallel, hard deadline
                     ├──►  debrid checkcached  (1 request, N hashes)
                     └──►  ranked stream list
                              ├─ ⚡ cached  → /r/<hash>  → direct link
                              └─ P2P        → infohash + trackers
```

---

## What a result looks like

Every card carries one fact per line, so a choice takes a glance instead of a decode:

```
⚡ TB
🔥 4K | ⚡ Cached | 🛰️ 6.71 GB
🎬 Sugar ▸ S02E03 · Shibboleth
💎 WEB-DL · x265 · DV
🔊 Atmos · DD+
📚 TorBox Library · ABC
```

Switch to `style: compact` for a single line. No image badges: no client renders markdown images
reliably in a stream title, so Hydra uses Unicode glyphs only — the same approach AIOStreams takes.

---

## Why this is different

Most addons that get popular on a VPS fall apart on serverless, because they assume a long-running
process with a warm cache and unlimited time. Hydra is designed around the opposite constraint, and
that constraint turns out to be an advantage:

| Problem on serverless | Hydra's answer |
|---|---|
| No database for user config | Config lives compressed in the URL (`~310 bytes`) |
| 10–60 s function limit | Deadline-budgeted scraping, returns partial results instead of failing |
| Cold starts | Zero dependencies — pure Node built-ins, no SDK/axios/cheerio |
| No persistent cache | Per-instance LRU + single-flight, which covers the real traffic pattern |
| N debrid API calls per result | **One** batched `checkcached` call for up to 100 hashes |
| Debrid account filled with dead torrents | **Lazy resolve** — a torrent is only added when you press play |
| Can't seed torrents from a lambda | **Native P2P** — return an infohash, let the client do the work |
| Trackers blocked unevenly by network | **Source diagnostics** — probe them, keep the ones that answer |

Three details worth calling out:

**Lazy resolution.** Stream URLs point at Hydra (`/r/<infohash>`), not at your debrid account. On
play, Hydra registers the magnet (instant, because it is cached), picks the right file inside the
torrent, mints a direct link, and 302-redirects you there. Browsing 40 results costs exactly one
debrid request.

**Ranking that respects physics.** A 4K REMUX with one seeder is not better than a 1080p WEB-DL with
ninety — it just buffers forever. Seed count feeds the score as a liveness penalty, and cached
results skip that penalty entirely because the service serves them from disk.

**Informed choice over a fixed list.** Public trackers are fragile and fail asymmetrically: a source
dead from one datacenter is fine from another. Rather than guess, the setup page runs a live probe
and shows you what each source returned, with latency. Keep the winners.

---

## Deploy in five minutes

### 1. Push to GitHub

```bash
git clone https://github.com/<you>/hydrastream.git
cd hydrastream
git remote set-url origin https://github.com/<you>/hydrastream.git
git push -u origin main
```

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
2. Framework preset: **Other**. Build command: leave empty. Output directory: leave empty.
3. (Optional) Add environment variable `CONFIG_SECRET` — see below.
4. Deploy.

That is it. Vercel detects `api/*.js` as serverless functions and serves `public/` as static files.
No build step, no `npm install`, nothing to compile.

### 3. Install the addon

Open `https://<your-project>.vercel.app/configure`, work through the four steps, and use
**Direct Install** (opens the app), **Manifest URL** (paste into Nuvio), or **Download**.

---

## Local development

```bash
npm run dev     # http://localhost:7000
npm test        # 19 assertions, no framework
```

`npm run dev` runs a dependency-free HTTP server that mirrors the Vercel routing table exactly, so
what you test locally is what you deploy. There is nothing to install.

---

## Configuration reference

Everything below is set through `/configure` and encoded into the addon URL.

| Key | Meaning |
|---|---|
| `svc` | `torbox` · `realdebrid` |
| `key` | API key for the selected service. Optional. |
| `mode` | `hybrid` (cached via debrid, rest P2P) · `debrid` (debrid only) · `p2p` (never contact it) |
| `style` | `rich` (one fact per line) · `compact` (single line) |
| `providers` | Per-source toggles |
| `res` | Allowed resolutions: `4k` `1080p` `720p` `480p` |
| `max` | Max results returned (5–100) |
| `minSeed` | Minimum seeders |
| `noCam` | Drop CAM / TS / screener releases |
| `sort` | `quality` · `seeders` · `size` |
| `cachedOnly` | Only show what the service can serve right now |
| `uncached` | Allow the service to fetch uncached torrents on play (slow first play) |
| `preferEfficient` | Slight boost for x265 / AV1 encodes |
| `lang` | Preferred language tag, e.g. `ita` |
| `torznab` | `{ url, key }` — Jackett / Prowlarr / any Newznab feed |
| `prowlarr` | `{ url, key }` — Prowlarr's aggregate JSON API |

### Environment variables

| Variable | Required | Effect |
|---|---|---|
| `CONFIG_SECRET` | no | Encrypts the config blob with AES-256-GCM. Changing it invalidates existing URLs. |
| `PORT` | no | Local dev port (default `7000`). |

---

## Debrid services

| Service | Status | Notes |
|---|---|---|
| **TorBox** | stable | Verified end-to-end against the live API. Batch `checkcached` handles 100 hashes per call. |
| **Real-Debrid** | beta | Follows the documented v1 API. Not exercised against a live account during development, so treat it as untested until you confirm with your own key. |
| Premiumize, AllDebrid, PikPak, OffCloud | not yet | Shown in the setup grid so the shape of the product is clear. |

Adding a service is deliberately small — implement two functions in `src/debrid/<name>.js` and
register it in `src/debrid/index.js`:

```js
async function checkCached(key, hashes) -> Set<infohash>   // which are instant
async function resolve(key, hash, hint, opts) -> string    // a direct HTTPS URL
```

---

## Sources

| Source | Tier | Notes |
|---|---|---|
| **Knaben** | 1 | Meta-search over dozens of trackers, with *live* seeders. Carries most of the weight. |
| **YTS** | 1 | Movies, small high-quality encodes. IMDb-addressable. |
| **EZTV** | 1 | Series, IMDb-addressable, so episode matching is exact. |
| **SolidTorrents** | 1 | DHT index, clean JSON API. |
| **Nyaa** | 1 | Anime, via RSS. |
| **The Pirate Bay** | 2 | Via `apibay.org`. Frequently challenged by Cloudflare. |
| **AniTosho** | 2 | Anime mirrors. |
| **RARBG** | 2 | Off by default — heavily rate limited. |
| **Torznab** | 3 | **Jackett, Prowlarr, or any Newznab feed.** One URL can unlock hundreds of indexers. |
| **Prowlarr** | 3 | Prowlarr's aggregate JSON search endpoint. |

Providers fail independently. If Cloudflare blocks three of them from your region, the other seven
still answer and the request still succeeds. Use **Test all sources** in step 2 to see exactly which
ones work from your deployment.

---

## HTTP routes

| Route | Purpose |
|---|---|
| `GET /manifest.json` | Default manifest (P2P, no key) |
| `GET /<config>/manifest.json` | Personalised manifest |
| `GET /<config>/stream/<movie\|series>/<id>.json` | Stream list |
| `GET /r/<infohash>?c=<config>` | Lazy resolve → 302 to a direct link |
| `GET /health` | Status, per-source success rates, debrid services |
| `POST /api/config` | `{action:"encode"}` · `{action:"verify"}` · `{action:"probe"}` |

Responses include an `x-hydra-stats` header with per-provider counts and timing, useful when
debugging a source that stopped working.

---

## Security and privacy

- **No server-side storage.** There is no database and no user account. Your key lives inside your
  own URL and nowhere else.
- **No password collection.** “Direct Install” uses the `stremio://` deep link, so Hydra never asks
  for — or sees — a Stremio account.
- **No video proxying.** Hydra never handles a byte of media. Debrid links go straight from the
  service to your player; P2P traffic goes straight from peers to your player.
- **Opaque URLs (optional).** With `CONFIG_SECRET` set, the config blob is AES-256-GCM encrypted.
  Without it, it is deflate-compressed and base64url-encoded — readable by anyone who sees the URL,
  the same trade-off every addon of this kind makes.
- **P2P exposes your IP** to other peers in the swarm. That is inherent to BitTorrent, not to this
  addon. Use a VPN if that matters, or stay in `debrid` mode.

---

## Project layout

```
api/                 Vercel serverless functions (thin wrappers)
src/
  app.js             route handlers, shared by Vercel and local dev
  config.js          schema, defaults, clamping
  codec.js           URL config encode/decode (+ optional AES-256-GCM)
  orchestrator.js    fan-out, deadline, dedupe, probe
  rank.js            scoring and filtering
  parse.js           release-name intelligence
  format.js          stream cards
  health.js          per-source success telemetry
  debrid/            service adapters (torbox, realdebrid) + registry
  providers/         one file per source
  metadata.js        Cinemeta lookups
  cache.js           LRU + single-flight
  http.js            fetch with timeouts
  trackers.js        P2P tracker list
public/
  index.html         landing page
  configure.html     four-step setup wizard
scripts/
  dev.js             local server
  selftest.js        test suite
vercel.json          routing table
```

---

## Licence and disclaimer

MIT. See [LICENSE](LICENSE).

Hydra is an indexer. It does not host, store, upload, or distribute any media. All metadata and
torrent references come from third-party public services, and debrid playback is performed entirely
by your own account. You are responsible for complying with the laws of your jurisdiction and with
the terms of any service you connect.
