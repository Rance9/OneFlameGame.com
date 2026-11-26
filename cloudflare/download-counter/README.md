# One Flame download counter

A Cloudflare Worker that answers `https://download.oneflamegame.com/one-flame-v<version>.nes`. It hands over that version's ROM file from this repository's GitHub Release and counts the download.

For each successful download it records one data point in Workers Analytics Engine, with six values:

| Column | Holds | Example |
|---|---|---|
| `blob1` | version | `1.0.0` |
| `blob2` | browser name | `Chrome`, `Safari`, `Firefox`, `Edge`, `Samsung Internet`, `Opera`, `other` |
| `blob3` | operating system | `Windows`, `macOS`, `iOS`, `Android`, `ChromeOS`, `Linux`, `other` |
| `blob4` | device type | `desktop`, `phone`, `tablet` |
| `blob5` | country, from Cloudflare's request data | `US` (`unknown` if Cloudflare gives none) |
| `blob6` | the referring page's path on oneflamegame.com | `/download/`, or `other` for another site, or `none` |

It stores no IP address, no user-agent string, no cookie and no identifier of any kind. It doesn't count HEAD requests, failed requests, or requests whose user agent says bot, crawler or spider. A version without a release file returns 404.

It runs within the Workers Free plan: 100,000 requests a day, and for Analytics Engine 100,000 data points written and 10,000 queries a day. Cloudflare keeps the data points for three months.

## Set it up

Before you start, oneflamegame.com must be an active zone in your Cloudflare account, and this repository must be public (release files of a private repository can't be downloaded by visitors).

1. Open a terminal in this folder, `cloudflare/download-counter`.
2. Sign Wrangler, Cloudflare's command-line tool, in to your Cloudflare account. The first time, `npx` downloads Wrangler.
   ```
   npx wrangler@4 login
   ```
   Your browser opens. Approve the access, then come back to the terminal.
3. Deploy the Worker.
   ```
   npx wrangler@4 deploy
   ```
   This creates the Worker `one-flame-download-counter`, connects it to the Analytics Engine dataset `one_flame_downloads`, and attaches the address `download.oneflamegame.com`. Cloudflare creates the DNS record for that address itself. If a CNAME record for `download.oneflamegame.com` already exists, delete it first; Cloudflare can't attach the address while it's there.
4. Check it: open `https://download.oneflamegame.com/one-flame-v9.9.9.nes`. You should see "Not found", which means the Worker answers and that version has no release.

The dataset itself is created the first time a download is counted.

## Each release

1. On GitHub, create a release with the tag `v<version>`, for example `v1.0.0`, and attach the ROM file named exactly `one-flame-v<version>.nes`, for example `one-flame-v1.0.0.nes`.
2. Open `https://download.oneflamegame.com/one-flame-v<version>.nes` and check that the file downloads. Nothing needs to change in the Worker; it serves any version that has a release file.
3. Update `src/data/release.json` on the site with `"released": true`, the `version`, `fileName`, `sizeText` and `sha256`, then commit and push.

## Read the counts

1. Create an API token: in the Cloudflare dashboard, open **My Profile** > **API Tokens** > **Create Token** > **Create Custom Token**. Give it the permission **Account** | **Account Analytics** | **Read**, for your account only, and create it. Copy the token; Cloudflare shows it once.
2. Copy your account ID from the Cloudflare dashboard.
3. In PowerShell, put both into environment variables for this session only. Never put the token in a file.
   ```powershell
   $env:CF_ACCOUNT_ID = "your account ID"
   $env:CF_ANALYTICS_TOKEN = "your token"
   ```
4. Run a query. This one shows downloads per day for the last 90 days:
   ```powershell
   $query = "SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, SUM(_sample_interval) AS downloads FROM one_flame_downloads WHERE timestamp > NOW() - INTERVAL '90' DAY GROUP BY day ORDER BY day"
   Invoke-RestMethod -Method Post -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CF_ACCOUNT_ID/analytics_engine/sql" -Headers @{ Authorization = "Bearer $env:CF_ANALYTICS_TOKEN" } -Body $query | ConvertTo-Json -Depth 5
   ```
   The counts are in `data`. Analytics Engine may sample data points when there are very many, so the queries add up `_sample_interval` instead of counting rows; at this site's volume every download is kept.

Swap in any of these queries:

Downloads per version:
```sql
SELECT blob1 AS version, SUM(_sample_interval) AS downloads FROM one_flame_downloads GROUP BY version ORDER BY downloads DESC
```

Downloads per browser:
```sql
SELECT blob2 AS browser, SUM(_sample_interval) AS downloads FROM one_flame_downloads GROUP BY browser ORDER BY downloads DESC
```

Downloads per operating system:
```sql
SELECT blob3 AS os, SUM(_sample_interval) AS downloads FROM one_flame_downloads GROUP BY os ORDER BY downloads DESC
```

Downloads per country:
```sql
SELECT blob5 AS country, SUM(_sample_interval) AS downloads FROM one_flame_downloads GROUP BY country ORDER BY downloads DESC
```

Downloads per device type:
```sql
SELECT blob4 AS device, SUM(_sample_interval) AS downloads FROM one_flame_downloads GROUP BY device ORDER BY downloads DESC
```

Downloads per referring page:
```sql
SELECT blob6 AS page, SUM(_sample_interval) AS downloads FROM one_flame_downloads GROUP BY page ORDER BY downloads DESC
```

Add `WHERE timestamp > NOW() - INTERVAL '30' DAY` before `GROUP BY` to look at the last 30 days only. Because Cloudflare keeps data points for three months, run the per-version query now and then and keep the totals if you want a running count over a longer time. GitHub's own download count for each release file is a second number to compare with.
