import redeemRequestQuery from 'services/queries/redeemRequests';
import graphqlFetcher, { GRAPHQL_FETCHER } from 'services/fetchers/graphql-fetcher';
import { BitcoinAmount } from '@interlay/monetary-js';
import { newMonetaryAmount, RedeemStatus } from '@interlay/interbtc-api';
import { btcAddressFromEventToString } from 'common/utils/utils';
import { BITCOIN_NETWORK } from '../../constants';
import getTxDetailsForRequest from 'services/fetchers/request-btctx-fetcher';
import { COLLATERAL_TOKEN } from 'config/relay-chains';

const REDEEM_FETCHER = 'redeem-fetcher';

// TODO: type graphql query return
function decodeRedeemValues(redeem: any): any {
  redeem.request.requestedAmountBacking = BitcoinAmount.from.Satoshi(redeem.request.requestedAmountBacking);
  redeem.bridgeFee = BitcoinAmount.from.Satoshi(redeem.bridgeFee);
  redeem.btcTransferFee = BitcoinAmount.from.Satoshi(redeem.btcTransferFee);
  // TODO: get actual vault collateral when it's added to events
  redeem.collateralPremium = newMonetaryAmount(redeem.collateralPremium, COLLATERAL_TOKEN);
  if (redeem.cancellation) {
    redeem.cancellation.slashedCollateral =
      newMonetaryAmount(redeem.cancellation.slashedCollateral, COLLATERAL_TOKEN);
  }
  redeem.userBackingAddress = btcAddressFromEventToString(redeem.userBackingAddress, BITCOIN_NETWORK);
  return redeem;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const redeemFetcher = async ({ queryKey }: any): Promise<Array<any>> => {
  const [key, offset, limit, stableBtcConfirmations, where] = queryKey as RedeemFetcherParams;
  if (key !== REDEEM_FETCHER) throw new Error('Invalid key!');
  const redeemsData = await graphqlFetcher<Array<any>>()({ queryKey: [
    GRAPHQL_FETCHER,
    redeemRequestQuery(where),
    {
      limit,
      offset
    }
  ] });

  // TODO: type graphql returns
  const redeems = redeemsData?.data?.redeems || [];

  return await Promise.all(redeems.map(async redeem => {
    redeem = decodeRedeemValues(redeem);
    redeem.backingPayment = await getTxDetailsForRequest(
      window.bridge.interBtcApi.electrsAPI,
      redeem.id,
      redeem.vaultBackingAddress,
      stableBtcConfirmations,
      true // use op_return
    );
    return redeem;
  }));
};

// TODO: get graphql types to auto-decode enum? Can e.g. Relay do that?
export function getRedeemWithStatus(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  redeem: any,
  stableBtcConfirmations: number,
  stableParachainConfirmations: number,
  parachainActiveHeight: number
): any {
  stableParachainConfirmations = Number(stableParachainConfirmations);
  stableBtcConfirmations = Number(stableBtcConfirmations);
  parachainActiveHeight = Number(parachainActiveHeight);
  if (redeem.status !== 'Pending') {
    // ideally this would be auto-decoded, for now set by hand
    if (redeem.status === 'Expired') redeem.status = RedeemStatus.Expired;
    else if (redeem.status === 'Completed') redeem.status = RedeemStatus.Completed;
    else if (redeem.status === 'Retried') redeem.status = RedeemStatus.Retried;
    else if (redeem.status === 'Reimbursed') redeem.status = RedeemStatus.Reimbursed;
    return redeem;
  }
  if (!redeem.backingPayment || !redeem.backingPayment.btcTxId) {
    redeem.status = RedeemStatus.PendingWithBtcTxNotFound;
  } else if (!redeem.backingPayment.confirmations) {
    redeem.status = RedeemStatus.PendingWithBtcTxNotIncluded;
  } else if (
    redeem.backingPayment.confirmations < stableBtcConfirmations ||
    redeem.backingPayment.confirmedAtParachainActiveBlock === undefined ||
    redeem.backingPayment.confirmedAtParachainActiveBlock + stableParachainConfirmations > parachainActiveHeight
  ) {
    redeem.status = RedeemStatus.PendingWithTooFewConfirmations;
  } else {
    redeem.status = RedeemStatus.PendingWithEnoughConfirmations;
  }
  return redeem;
}

export type RedeemFetcherParams = [
  key: typeof REDEEM_FETCHER,
  offset: number,
  limit: number,
  stableBtcConfirmations: number,
  where?: string,
]

export {
  REDEEM_FETCHER
};

export default redeemFetcher;
