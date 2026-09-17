import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '@utils/asyncHandler';
import { ShortlinkModel } from '@models/ShortlinkModel';
import {
  AnalyticsBreakdownEntry,
  AnalyticsService,
  ProjectBreakdownEntry,
  TimelineEntry,
} from '@services/AnalyticsService';
import { ApiError } from '@utils/ApiError';

export interface AnalyticsSummaryResponse {
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  clicksLast30d: number;
  totalShortlinks: number;
  activeShortlinks: number;
  topLink: ReturnType<ShortlinkModel['toResponse']> | null;
  clicksTimeline: TimelineEntry[];
  byDevice: AnalyticsBreakdownEntry[];
  byBrowser: AnalyticsBreakdownEntry[];
  byOs: AnalyticsBreakdownEntry[];
  byCountry: AnalyticsBreakdownEntry[];
  byProject: ProjectBreakdownEntry[];
}

export class AnalyticsController {
  private readonly shortlinkModel = new ShortlinkModel();

  public getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userIdStr = req.user?.id;
    if (!userIdStr) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const rangeParam = (req.query.range as string) || '30d';
    const clientTz = req.query.tz as string | undefined;
    const summaryData = await AnalyticsService.getSummary(new ObjectId(userIdStr), rangeParam, clientTz);

    const topLink = summaryData.topLinkDoc ? this.shortlinkModel.toResponse(summaryData.topLinkDoc) : null;
    const responsePayload: AnalyticsSummaryResponse = {
      ...summaryData,
      topLink,
    };

    res.json({ ok: true, data: responsePayload });
  });
}
