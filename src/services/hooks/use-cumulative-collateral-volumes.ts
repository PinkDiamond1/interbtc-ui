import { useQuery, UseQueryResult } from 'react-query';
import { CollateralUnit } from '@interlay/interbtc-api';

import { WRAPPED_TOKEN, CollateralToken } from 'config/relay-chains';
import { getLastMidnightTimestamps } from 'common/utils/utils';
import cumulativeVolumesFetcher, {
  CUMULATIVE_VOLUMES_FETCHER,
  VolumeDataPoint,
  VolumeType
} from 'services/fetchers/cumulative-volumes-fetcher';

const cutoffTimestamps = getLastMidnightTimestamps(6, true);

const useCumulativeCollateralVolumes = (
  collateralToken: CollateralToken
): UseQueryResult<VolumeDataPoint<CollateralUnit>[], Error> => {
  return useQuery<VolumeDataPoint<CollateralUnit>[], Error>(
    [
      CUMULATIVE_VOLUMES_FETCHER,
      VolumeType.Collateral,
      cutoffTimestamps,
      collateralToken, // returned amounts
      collateralToken, // filter by this collateral...
      WRAPPED_TOKEN // and this backing currency
    ],
    cumulativeVolumesFetcher
  );
};

export default useCumulativeCollateralVolumes;