import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getAverageTimeToFirstToken } from "../../../lib/api/metrics/averageTimeToFirstToken";
import { Result, resultsAll } from "@/packages/common/result";

async function handler(options: HandlerWrapperOptions<Result<number, string>>) {
  const { req, res, userData } = options;
  const { data: filterData, error: filterError } = resultsAll([
    options.body.getFilter(),
    options.body.getTimeFilter(),
  ]);
  if (filterError !== null) {
    res.status(400).json({ error: filterError, data: null });
    return;
  }
  const [filter, timeFilter] = filterData;

  const metrics = await getAverageTimeToFirstToken(
    filter,
    timeFilter,
    userData.orgId,
  );
  res.status(200).json(metrics);
}

export default withAuth(handler);
