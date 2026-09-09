import { Icon } from '@/components/atoms/Icon/Icon';
import { TableRow, TableCell } from '@/components/atoms/Table';
import { formatLocalizedTooltip } from '@/utils/date.utils';
import type { ClickLogEntry } from '@/types/shortlink.types';
import { getClicksLogDeviceIcon, getRefererBadgeInfo } from './ClicksLogDrawer.utils';

function TimestampCell({ timestamp, userTimezone }: { timestamp: string; userTimezone: string }) {
  return (
    <TableCell className="clicks-td-timestamp">
      <div className="clicks-cell-flex">
        <div className="clicks-cell-icon-wrap clicks-cell-icon-wrap--time">
          <Icon name="clock" size={13} />
        </div>
        <span className="clicks-time-text">{formatLocalizedTooltip(timestamp, userTimezone)}</span>
      </div>
    </TableCell>
  );
}

function SlugCell({ slug }: { slug: string }) {
  return (
    <TableCell className="clicks-td-slug">
      <div className="clicks-slug-pill">
        <Icon name="link" size={12} />
        <span>/{slug}</span>
      </div>
    </TableCell>
  );
}

function LocationCell({ geo }: { geo: ClickLogEntry['geo'] }) {
  const city = geo.city || 'Unknown';
  const regionCountry = [geo.region, geo.country].filter(Boolean).join(', ') || 'Global';
  return (
    <TableCell className="clicks-td-location">
      <div className="clicks-cell-flex">
        <div className="clicks-cell-icon-wrap clicks-cell-icon-wrap--globe">
          <Icon name="globe" size={14} />
        </div>
        <div className="clicks-location-details">
          <span className="clicks-city-text">{city}</span>
          <span className="clicks-country-badge">{regionCountry}</span>
        </div>
      </div>
    </TableCell>
  );
}

function DeviceCell({ device }: { device: ClickLogEntry['device'] }) {
  const iconName = getClicksLogDeviceIcon(device.type);
  return (
    <TableCell className="clicks-td-device">
      <div className="clicks-cell-flex">
        <div className="clicks-cell-icon-wrap clicks-cell-icon-wrap--device">
          <Icon name={iconName} size={14} />
        </div>
        <div className="clicks-device-details">
          <span className="clicks-browser-text">{device.browser}</span>
          <span className="clicks-os-badge">{device.os}</span>
        </div>
      </div>
    </TableCell>
  );
}

function RefererCell({ referer }: { referer?: string }) {
  const info = getRefererBadgeInfo(referer);
  return (
    <TableCell className="clicks-td-referer">
      <span className={`clicks-referer-badge clicks-referer-badge--${info.variant}`} title={referer || 'Direct'}>
        <Icon name={info.icon} size={11} />
        <span>{info.label}</span>
      </span>
    </TableCell>
  );
}

export function ClicksLogRow({ click: c, slug, userTimezone }: { click: ClickLogEntry; slug?: string; userTimezone: string }) {
  return (
    <TableRow>
      <TimestampCell timestamp={c.timestamp} userTimezone={userTimezone} />
      {!slug && <SlugCell slug={c.slug} />}
      <LocationCell geo={c.geo} />
      <DeviceCell device={c.device} />
      <RefererCell referer={c.referer} />
    </TableRow>
  );
}
