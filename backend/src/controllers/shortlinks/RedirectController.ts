import { Request, Response } from 'express';
import { collection, Collections } from '@config/db';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';
import { snapshotRequestAsync } from '@utils/geo';

type RedirectStatus = 'active' | 'disabled' | 'not_started' | 'expired';

function evaluateShortlinkStatus(shortlink: Shortlink, now: Date = new Date()): RedirectStatus {
  if (!shortlink.active) return 'disabled';
  if (shortlink.activeFrom && now < new Date(shortlink.activeFrom)) return 'not_started';
  if (shortlink.activeTo && now > new Date(shortlink.activeTo)) return 'expired';
  return 'active';
}

function getStatusHtmlConfig(status: RedirectStatus, activeFrom?: Date): {
  icon: string;
  badgeIcon: string;
  badgeText: string;
  title: string;
  message: string;
} {
  if (status === 'not_started') {
    const formattedDate = activeFrom
      ? new Date(activeFrom).toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      : '';
    return {
      icon: 'schedule',
      badgeIcon: 'hourglass_top',
      badgeText: 'Coming Soon',
      title: 'This link will be active soon',
      message: `The owner has scheduled this shortlink to activate on ${formattedDate}.`,
    };
  }
  if (status === 'expired') {
    return {
      icon: 'history_toggle_off',
      badgeIcon: 'timer_off',
      badgeText: 'Expired',
      title: 'This link has expired',
      message: 'The validity period for this shortlink has ended and it is no longer accepting visits.',
    };
  }
  return {
    icon: 'link_off',
    badgeIcon: 'block',
    badgeText: 'Disabled',
    title: 'This link is disabled',
    message: 'The owner has temporarily disabled this shortlink.',
  };
}

function renderStatusPage(status: RedirectStatus, activeFrom?: Date): string {
  const config = getStatusHtmlConfig(status, activeFrom);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.title} · LinkTracker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --surface:       #fafaf3;
      --outline-var:   #cac6b8;
      --primary:       #636037;
      --on-surface:    #1b1c18;
      --on-surface-v:  #49473c;
      --error:         #ba1a1a;
      --error-cnt:     #ffdad6;
      --on-error-cnt:  #93000a;
    }
    html, body {
      min-height: 100vh;
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      color: var(--on-surface);
      padding: 1.5rem;
    }
    .card {
      background: #ffffff;
      border: 1px solid var(--outline-var);
      border-radius: 2rem;
      padding: 3rem 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(99, 96, 55, 0.08);
      animation: rise 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .icon-wrap {
      width: 5rem;
      height: 5rem;
      border-radius: 9999px;
      background: var(--error-cnt);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.75rem;
    }
    .icon-wrap .material-symbols-outlined {
      font-size: 2.25rem;
      color: var(--error);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--error-cnt);
      color: var(--on-error-cnt);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1.25rem;
    }
    h1 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 0.75rem;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: var(--on-surface-v);
      margin-bottom: 2rem;
    }
    .divider {
      height: 1px;
      background: var(--outline-var);
      margin: 0 -2.5rem 1.75rem;
    }
    .footer-note {
      font-size: 12px;
      color: var(--on-surface-v);
      opacity: 0.65;
    }
    .footer-note strong { color: var(--primary); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      <span class="material-symbols-outlined">${config.icon}</span>
    </div>
    <div class="badge">
      <span class="material-symbols-outlined">${config.badgeIcon}</span>
      ${config.badgeText}
    </div>
    <h1>${config.title}</h1>
    <p>${config.message}</p>
    <div class="divider"></div>
    <p class="footer-note">Powered by <strong>LinkTracker</strong>.</p>
  </div>
</body>
</html>`;
}

export class RedirectController {
  public redirect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const slug = this.extractSlug(req);
    const shortlink = await collection<Shortlink>(Collections.Shortlinks).findOne({ slug });
    if (!shortlink) {
      throw new ApiError(404, 'Shortlink not found', 'NOT_FOUND');
    }

    const status = evaluateShortlinkStatus(shortlink);
    if (status !== 'active') {
      res.set('Cache-Control', 'no-store');
      const statusCode = status === 'not_started' ? 200 : 410;
      res.status(statusCode).send(renderStatusPage(status, shortlink.activeFrom));
      return;
    }

    if (shortlink.projectId) {
      const project = await collection(Collections.Projects).findOne({ _id: shortlink.projectId });
      if (project?.isArchived) {
        res.set('Cache-Control', 'no-store');
        res.status(410).send(renderStatusPage('disabled', shortlink.activeFrom));
        return;
      }
    }

    this.recordClick(shortlink, req).catch((err) => {
      console.warn('[redirect] failed to record click:', err);
    });

    res.set('Cache-Control', 'no-store');
    res.redirect(302, shortlink.url);
  });

  private extractSlug(req: Request): string {
    const slug = req.params.slug;
    if (!slug || typeof slug !== 'string' || slug.length === 0) {
      throw new ApiError(400, 'Missing slug', 'VALIDATION_ERROR');
    }
    return slug;
  }

  private async recordClick(shortlink: Shortlink, req: Request): Promise<void> {
    if (!shortlink._id) return;
    const snap = await snapshotRequestAsync(req);
    const click: ShortlinkClick = {
      shortlinkId: shortlink._id,
      slug: shortlink.slug,
      timestamp: new Date(),
      ip: snap.ip,
      ipHash: snap.ipHash,
      userAgent: snap.userAgent,
      referer: snap.referer,
      acceptLanguage: snap.acceptLanguage,
      device: snap.device,
      geo: snap.geo,
    };
    await Promise.all([
      collection<ShortlinkClick>(Collections.ShortlinkClicks).insertOne(click),
      collection<Shortlink>(Collections.Shortlinks).updateOne(
        { _id: shortlink._id },
        { $inc: { clicksCount: 1 } }
      ),
    ]);
  }
}
