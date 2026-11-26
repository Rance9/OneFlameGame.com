// The One Flame ROM download counter.
//
// Answers https://download.oneflamegame.com/one-flame-v<version>.nes, hands over that version's file from
// the site repository's GitHub Release, and for each successful download writes one data point to
// Workers Analytics Engine: the version, browser name, operating system, device type, country and the
// referring page's path on oneflamegame.com. It stores no IP address, no user-agent string, no cookie
// and no identifier of any kind.

const RELEASES = 'https://github.com/Rance9/OneFlameGame.com/releases/download';
const FILE_PATH = /^\/one-flame-v(\d+\.\d+\.\d+)\.nes$/;
const SITE_HOSTS = new Set(['oneflamegame.com', 'www.oneflamegame.com']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = FILE_PATH.exec(url.pathname);
    if (!match) return notFound();

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const version = match[1];
    const fileName = `one-flame-v${version}.nes`;
    const upstream = await fetch(`${RELEASES}/v${version}/${fileName}`, { method: request.method, redirect: 'follow' });

    // A version with no release file is unknown.
    if (upstream.status === 404) return notFound();
    if (!upstream.ok) return new Response('The download is not available right now. Please try again later.', { status: 502 });

    if (request.method === 'GET') count(request, env, version);

    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    });
    const length = upstream.headers.get('Content-Length');
    if (length) headers.set('Content-Length', length);
    return new Response(request.method === 'HEAD' ? null : upstream.body, { status: 200, headers });
  },
};

function notFound() {
  return new Response('Not found', { status: 404 });
}

/** Writes one data point for a successful GET, unless the user agent says it's a bot, crawler or spider. */
function count(request, env, version) {
  const ua = request.headers.get('User-Agent') || '';
  if (/bot|crawler|spider/i.test(ua) || !env.DOWNLOADS) return;
  try {
    env.DOWNLOADS.writeDataPoint({
      indexes: [version],
      blobs: [
        version,
        browserName(ua),
        operatingSystem(ua),
        deviceType(ua, request.headers.get('Sec-CH-UA-Mobile')),
        request.cf?.country || 'unknown',
        referringPath(request.headers.get('Referer')),
      ],
      doubles: [1],
    });
  } catch {
    // Counting must never stop a download.
  }
}

function browserName(ua) {
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari';
  return 'other';
}

function operatingSystem(ua) {
  if (/Windows NT|Windows Phone/.test(ua)) return 'Windows';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'other';
}

function deviceType(ua, chMobile) {
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet';
  if (chMobile === '?1' || /iPhone|iPod|Mobile|Windows Phone/.test(ua)) return 'phone';
  return 'desktop';
}

/** The referring page's path on oneflamegame.com, "other" for any other site, or "none". */
function referringPath(referer) {
  if (!referer) return 'none';
  try {
    const from = new URL(referer);
    return SITE_HOSTS.has(from.hostname) ? from.pathname : 'other';
  } catch {
    return 'other';
  }
}
