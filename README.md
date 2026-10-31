# Hydra

**One addon. Every source.** A Stremio / Nuvio addon that aggregates public trackers, probes
TorBox cache in a single batch call, and falls back to native P2P — so there is always
something to press play on.

Runs entirely on Vercel's free tier. Zero runtime dependencies.

```
Stremio  ──┐
           ├──►  Hydra  ──►  Cinemeta (title lookup)
Nuvio    ──┘         │
                     ├──►  9 scrapers in parallel, hard deadline
                     ├──►  TorBox checkcached  (1 request, N hashes)
                     └──►  ranked stream list
                              ├─ ⚡ cached  → /r/<hash>  → TorBox direct link
                              └─ P2P        → infohash + trackers
```

---

## Why this is different

Most addons that get popular on a VPS fall apart on serverless, because they assume a
long-running process with a warm cache and unlimited time. Hydra is designed around the
opposite constraint, and that constraint turns out to be an advantage:

| Problem on serverless | Hydra's answer |
|---|---|
| No database for user config | Config lives compressed in the URL (`~150 bytes`) |
| 10–60 s function limit | Deadline-budgeted scraping, returns partial results instead of failing |
| Cold starts | Zero dependencies — pure Node built-ins, no SDK/axios/cheerio |
| No persistent cache | Per-instance LRU + single-flight, which covers the real traffic pattern |
| N debrid API calls per result | **One** batched `checkcached` call for up to 100 hashes |
| TorBox account filled with dead torrents | **Lazy resolve** — the torrent is only added when you actually press play |
| Can't seed torrents from a lambda | **Native P2P** — return an infohash, let the client do the work |

Two details worth calling out:

**Lazy resolution.** Stream URLs point at Hydra (`/r/<infohash>`), not at TorBox. When you
press play, Hydra registers the magnet (instant, because it is cached), picks the right file
inside the torrent, mints a direct link, and 302-redirects you there. Browsing a list of 40
results costs exactly one TorBox request.

**Ranking that respects physics.** A 4K REMUX with one seeder is not better than a 1080p
WEB-DL with ninety — it just buffers forever. Seed count feeds into the score as a liveness
penalty, and cached results skip that penalty entirely because TorBox serves them from disk.

---

## Deploy in five minutes

### 1. Fork or clone

```bash
git clone https://github.com/<you>/hydrastream.git
cd hydrastream
```

### 2. Push to your own GitHub repo

```bash
git remote set-url origin https://github.com/<you>/hydrastream.git
git push -u origin main
```

### 3. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
2. Framework preset: **Other**. Build command: leave empty. Output directory: leave empty.
3. (Optional) Add environment variable `CONFIG_SECRET` — see below.
4. Deploy.

That is it. Vercel detects `api/*.js` as serverless functions and serves `public/` as static
files. No build step, no `npm install`, nothing to compile.

### 4. Install the addon

Open `https://<your-project>.vercel.app/configure`, build your configuration, and copy the
manifest URL.

- **Stremio** — Add-ons → paste the URL, or use the "Install in Stremio" button.
- **Nuvio** — Dashboard → Addons → Add Addon → paste the same URL.

Both clients read the same Stremio addon protocol, so one URL works in both.

---

## Local development

```bash
npm run dev     # http://localhost:7000
npm test        # 19 assertions, no framework
```

`npm run dev` runs a dependency-free HTTP server that mirrors the Vercel routing table
exactly, so what you test locally is what you deploy. There is nothing to install.

---

## Configuration reference

Everything below is set through `/configure` and encoded into the addon URL.

| Key | Meaning |
|---|---|
| `mode` | `hybrid` (cached via TorBox, rest P2P) · `debrid` (TorBox only) · `p2p` (never contact TorBox) |
| `tb` | TorBox API key. Optional. |
| `providers` | Per-source toggles |
| `res` | Allowed resolutions: `4k` `1080p` `720p` `480p` |
| `max` | Max results returned (5–100) |
| `minSeed` | Minimum seeders |
| `noCam` | Drop CAM / TS / screener releases |
| `sort` | `quality` · `seeders` · `size` |
| `cachedOnly` | Only show what TorBox can serve right now |
| `tbUncached` | Allow TorBox to fetch uncached torrents on play (slow first play) |
| `preferEfficient` | Slight boost for x265 / AV1 encodes |
| `lang` | Preferred language tag, e.g. `ita` |
| `prowlarr` | `{ url, key }` for a self-hosted indexer manager |

### Environment variables

| Variable | Required | Effect |
|---|---|---|
| `CONFIG_SECRET` | no | Encrypts the config blob with AES-256-GCM. Changing it invalidates existing URLs. |
| `PORT` | no | Local dev port (default `7000`). |

---

## Sources

| Source | Type | Notes |
|---|---|---|
| **Knaben** | meta-search | Indexes dozens of trackers behind one API and reports live seeders. Carries most of the weight. |
| **YTS** | movies | Small, high-quality encodes. IMDb-addressable. |
| **EZTV** | series | IMDb-addressable, so episode matching is exact. |
| **SolidTorrents** | both | DHT index, no Cloudflare challenge. |
| **Nyaa** | anime | RSS feed, filtered to anime genres. |
| **The Pirate Bay** | both | Via `apibay.org`. Frequently challenged by Cloudflare. |
| **AniTosho** | anime | Mirrors several anime trackers. |
| **RARBG** | both | Off by default — heavily rate limited. |
| **Prowlarr** | both | Off by default — needs a publicly reachable instance. |

Providers fail independently. If Cloudflare blocks three of them from your region, the other
six still answer and the request still succeeds.

---

## HTTP routes

| Route | Purpose |
|---|---|
| `GET /manifest.json` | Default manifest (P2P, no key) |
| `GET /<config>/manifest.json` | Personalised manifest |
| `GET /<config>/stream/<movie\|series>/<id>.json` | Stream list |
| `GET /r/<infohash>?c=<config>` | Lazy TorBox resolve → 302 to direct link |
| `GET /health` | Status + provider list |
| `POST /api/config` | `{action:"encode"}` or `{action:"verify", key}` |

Responses include an `x-hydra-stats` header with per-provider counts and timing, which is
useful when debugging a source that stopped working.

---

## Security and privacy

- **No server-side storage.** There is no database and no user account. Your TorBox key is
  inside your own URL and nowhere else.
- **No video proxying.** Hydra never handles a byte of media. Debrid links go straight from
  TorBox to your player; P2P traffic goes straight from peers to your player.
- **Opaque URLs (optional).** With `CONFIG_SECRET` set, the config blob is AES-256-GCM
  encrypted. Without it, it is deflate-compressed and base64url-encoded — readable by anyone
  who sees the URL, which is the same trade-off every addon of this kind makes.
- **P2P exposes your IP** to other peers in the swarm. That is inherent to BitTorrent, not to
  this addon. Use a VPN if that matters to you, or stay in `debrid` mode.

---

## Project layout

```
api/                 Vercel serverless functions (thin wrappers)
  manifest.js
  stream.js
  resolve.js
  config.js
  health.js
src/
  app.js             route handlers, shared by Vercel and local dev
  config.js          schema, defaults, clamping
  codec.js           URL config encode/decode (+ optional AES-256-GCM)
  orchestrator.js    fan-out, deadline, dedupe
  rank.js            scoring and filtering
  parse.js           release-name intelligence
  format.js          Stremio stream objects
  torbox.js          TorBox API client
  trackers.js        P2P tracker list
  metadata.js        Cinemeta lookups
  cache.js           LRU + single-flight
  http.js            fetch with timeouts
  providers/         one file per source
public/
  index.html         landing page
  configure.html     configuration UI
scripts/
  dev.js             local server
  selftest.js        test suite
vercel.json          routing table
```

---

## Licence and disclaimer

MIT. See [LICENSE](LICENSE).

Hydra is an indexer. It does not host, store, upload, or distribute any media. All metadata
and torrent references come from third-party public services, and debrid playback is
performed entirely by your own TorBox account. You are responsible for complying with the
laws of your jurisdiction and with the terms of any service you connect.
