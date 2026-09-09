import { TableHeader, TableHeadCell } from '@/components/atoms/Table';

export function TableHead() {
  return (
    <TableHeader>
      <tr>
        <TableHeadCell className="sl-col-project">Project</TableHeadCell>
        <TableHeadCell className="sl-col-url">Destination URL</TableHeadCell>
        <TableHeadCell className="sl-col-slug">Shortlink</TableHeadCell>
        <TableHeadCell className="sl-col-clicks">Clicks</TableHeadCell>
        <TableHeadCell className="sl-col-expires">Expires</TableHeadCell>
        <TableHeadCell className="sl-col-status">Status</TableHeadCell>
        <TableHeadCell align="right">Actions</TableHeadCell>
      </tr>
    </TableHeader>
  );
}
