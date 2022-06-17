import * as React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTable } from 'react-table';
import { useErrorHandler, withErrorBoundary } from 'react-error-boundary';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import Big from 'big.js';
import clsx from 'clsx';
import { roundTwoDecimals, VaultExt } from '@interlay/interbtc-api';
import { BitcoinUnit, BitcoinAmount } from '@interlay/monetary-js';

import SectionTitle from 'parts/SectionTitle';
import ErrorFallback from 'components/ErrorFallback';
import PrimaryColorEllipsisLoader from 'components/PrimaryColorEllipsisLoader';
import InformationTooltip from 'components/tooltips/InformationTooltip';
import InterlayTable, {
  InterlayTableContainer,
  InterlayThead,
  InterlayTbody,
  InterlayTr,
  InterlayTh,
  InterlayTd
} from 'components/UI/InterlayTable';
import { RELAY_CHAIN_NATIVE_TOKEN, RELAY_CHAIN_NATIVE_TOKEN_SYMBOL } from 'config/relay-chains';
import { getCollateralization, getVaultStatusLabel } from 'utils/helpers/vaults';
import { PAGES, URL_PARAMETERS } from 'utils/constants/links';
import { shortAddress, displayMonetaryAmount } from 'common/utils/utils';
import * as constants from '../../../../../constants';
import genericFetcher, { GENERIC_FETCHER } from 'services/fetchers/generic-fetcher';
import { BTCToCollateralTokenRate } from 'types/currency';
import { StoreType } from 'common/types/util.types';

const getCollateralizationColor = (
  collateralization: string | undefined,
  secureCollateralThreshold: Big
): string | undefined => {
  if (collateralization === undefined) return undefined;

  if (new Big(collateralization).gte(secureCollateralThreshold)) {
    return clsx('text-interlayConifer', 'font-medium');
  } else {
    // Liquidation
    return clsx('text-interlayCinnabar', 'font-medium');
  }
};

interface Vault {
  vaultId: string;
  lockedBTC: BitcoinAmount;
  lockedDOT: string;
  pendingBTC: string;
  status: string;
  unsettledCollateralization: string | undefined;
  settledCollateralization: string | undefined;
}

const VaultsTable = (): JSX.Element => {
  const { t } = useTranslation();
  const { bridgeLoaded } = useSelector((state: StoreType) => state.general);
  const history = useHistory();

  const {
    isIdle: currentActiveBlockNumberIdle,
    isLoading: currentActiveBlockNumberLoading,
    data: currentActiveBlockNumber,
    error: currentActiveBlockNumberError
  } = useQuery<number, Error>([GENERIC_FETCHER, 'system', 'getCurrentActiveBlockNumber'], genericFetcher<number>(), {
    enabled: !!bridgeLoaded
  });
  useErrorHandler(currentActiveBlockNumberError);

  const {
    isIdle: relayChainNativeTokenCollateralSecureThresholdIdle,
    isLoading: relayChainNativeTokenCollateralSecureThresholdLoading,
    data: relayChainNativeTokenCollateralSecureThreshold,
    error: relayChainNativeTokenCollateralSecureThresholdError
  } = useQuery<Big, Error>(
    [GENERIC_FETCHER, 'vaults', 'getSecureCollateralThreshold', RELAY_CHAIN_NATIVE_TOKEN],
    genericFetcher<Big>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(relayChainNativeTokenCollateralSecureThresholdError);

  const {
    isIdle: relayChainNativeTokenCollateralLiquidationThresholdIdle,
    isLoading: relayChainNativeTokenCollateralLiquidationThresholdLoading,
    data: relayChainNativeTokenCollateralLiquidationThreshold,
    error: relayChainNativeTokenCollateralLiquidationThresholdError
  } = useQuery<Big, Error>(
    [GENERIC_FETCHER, 'vaults', 'getLiquidationCollateralThreshold', RELAY_CHAIN_NATIVE_TOKEN],
    genericFetcher<Big>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(relayChainNativeTokenCollateralLiquidationThresholdError);

  const {
    isIdle: btcToRelayChainNativeTokenRateIdle,
    isLoading: btcToRelayChainNativeTokenRateLoading,
    data: btcToRelayChainNativeTokenRate,
    error: btcToRelayChainNativeTokenRateError
  } = useQuery<BTCToCollateralTokenRate, Error>(
    [GENERIC_FETCHER, 'oracle', 'getExchangeRate', RELAY_CHAIN_NATIVE_TOKEN],
    genericFetcher<BTCToCollateralTokenRate>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(btcToRelayChainNativeTokenRateError);

  const { isIdle: vaultsExtIdle, isLoading: vaultsExtLoading, data: vaultsExt, error: vaultsExtError } = useQuery<
    Array<VaultExt<BitcoinUnit>>,
    Error
  >([GENERIC_FETCHER, 'vaults', 'list'], genericFetcher<Array<VaultExt<BitcoinUnit>>>(), {
    enabled: !!bridgeLoaded
  });
  useErrorHandler(vaultsExtError);

  const columns = React.useMemo(
    () => [
      {
        Header: t('account_id'),
        accessor: 'vaultId',
        classNames: ['text-left'],
        Cell: function FormattedCell({ value }: { value: string }) {
          return <>{shortAddress(value)}</>;
        }
      },
      {
        Header: t('locked_dot', {
          collateralTokenSymbol: RELAY_CHAIN_NATIVE_TOKEN_SYMBOL
        }),
        accessor: 'lockedDOT',
        classNames: ['text-right']
      },
      {
        Header: t('locked_btc'),
        accessor: 'lockedBTC',
        classNames: ['text-right'],
        Cell: function FormattedCell({ value }: { value: BitcoinAmount }) {
          return displayMonetaryAmount(value);
        }
      },
      {
        Header: t('pending_btc'),
        accessor: 'pendingBTC',
        classNames: ['text-right'],
        tooltip: t('vault.tip_pending_btc')
      },
      {
        Header: t('collateralization'),
        accessor: '',
        classNames: ['text-left'],
        tooltip: t('vault.tip_collateralization'),
        Cell: function FormattedCell({ row: { original } }: { row: { original: Vault } }) {
          if (original.unsettledCollateralization === undefined && original.settledCollateralization === undefined) {
            return <span>∞</span>;
          } else {
            return (
              <>
                {relayChainNativeTokenCollateralSecureThreshold && (
                  <div>
                    <p
                      className={getCollateralizationColor(
                        original.settledCollateralization,
                        relayChainNativeTokenCollateralSecureThreshold
                      )}
                    >
                      {original.settledCollateralization === undefined
                        ? '∞'
                        : roundTwoDecimals(original.settledCollateralization.toString()) + '%'}
                    </p>
                    <p className='text-xs'>
                      <span>{t('vault.pending_table_subcell')}</span>
                      <span
                        className={getCollateralizationColor(
                          original.unsettledCollateralization,
                          relayChainNativeTokenCollateralSecureThreshold
                        )}
                      >
                        {original.unsettledCollateralization === undefined
                          ? '∞'
                          : roundTwoDecimals(original.unsettledCollateralization.toString()) + '%'}
                      </span>
                    </p>
                  </div>
                )}
              </>
            );
          }
        }
      },
      {
        Header: t('status'),
        accessor: 'status',
        classNames: ['text-left'],
        Cell: function FormattedCell({ value }: { value: string }) {
          let statusClasses;
          if (value === constants.VAULT_STATUS_ACTIVE) {
            statusClasses = clsx('text-interlayConifer', 'font-medium');
          }
          if (value === constants.VAULT_STATUS_UNDER_COLLATERALIZED) {
            statusClasses = clsx('text-interlayCalifornia', 'font-medium');
          }
          if (value === constants.VAULT_STATUS_THEFT || value === constants.VAULT_STATUS_LIQUIDATED) {
            statusClasses = clsx('text-interlayCinnabar', 'font-medium');
          }

          return <span className={statusClasses}>{value}</span>;
        }
      }
    ],
    [t, relayChainNativeTokenCollateralSecureThreshold]
  );

  const vaults: Array<Vault> | undefined = React.useMemo(() => {
    if (
      vaultsExt &&
      btcToRelayChainNativeTokenRate &&
      relayChainNativeTokenCollateralLiquidationThreshold &&
      relayChainNativeTokenCollateralSecureThreshold &&
      currentActiveBlockNumber
    ) {
      const rawVaults = vaultsExt.map((vaultExt) => {
        const statusLabel = getVaultStatusLabel(
          vaultExt,
          currentActiveBlockNumber,
          relayChainNativeTokenCollateralLiquidationThreshold,
          relayChainNativeTokenCollateralSecureThreshold,
          btcToRelayChainNativeTokenRate,
          t
        );

        const vaultCollateral = vaultExt.backingCollateral;
        const settledTokens = vaultExt.issuedTokens;
        const settledCollateralization = getCollateralization(vaultCollateral, settledTokens, btcToRelayChainNativeTokenRate);
        const unsettledTokens = vaultExt.toBeIssuedTokens;
        const unsettledCollateralization = getCollateralization(
          vaultCollateral,
          unsettledTokens.add(settledTokens),
          btcToRelayChainNativeTokenRate
        );

        return {
          vaultId: vaultExt.id.accountId.toString(),
          // TODO: fetch collateral reserved
          lockedBTC: settledTokens,
          lockedDOT: displayMonetaryAmount(vaultCollateral),
          pendingBTC: displayMonetaryAmount(unsettledTokens),
          status: statusLabel,
          unsettledCollateralization: unsettledCollateralization?.toString(),
          settledCollateralization: settledCollateralization?.toString()
        };
      });

      const sortedVaults = rawVaults.sort((vaultA, vaultB) => {
        const vaultALockedBTC = vaultA.lockedBTC;
        const vaultBLockedBTC = vaultB.lockedBTC;
        return vaultBLockedBTC.gt(vaultALockedBTC) ? 1 : vaultALockedBTC.gt(vaultBLockedBTC) ? -1 : 0;
      });

      return sortedVaults;
    }
  }, [
    btcToRelayChainNativeTokenRate,
    currentActiveBlockNumber,
    relayChainNativeTokenCollateralLiquidationThreshold,
    relayChainNativeTokenCollateralSecureThreshold,
    t,
    vaultsExt
  ]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data: vaults ?? []
  });

  const renderTable = () => {
    if (
      currentActiveBlockNumberIdle ||
      currentActiveBlockNumberLoading ||
      relayChainNativeTokenCollateralSecureThresholdIdle ||
      relayChainNativeTokenCollateralSecureThresholdLoading ||
      relayChainNativeTokenCollateralLiquidationThresholdIdle ||
      relayChainNativeTokenCollateralLiquidationThresholdLoading ||
      btcToRelayChainNativeTokenRateIdle ||
      btcToRelayChainNativeTokenRateLoading ||
      vaultsExtIdle ||
      vaultsExtLoading
    ) {
      return <PrimaryColorEllipsisLoader />;
    }

    const handleRowClick = (vaultId: string) => () => {
      history.push(PAGES.VAULTS.replace(`:${URL_PARAMETERS.VAULT.ACCOUNT}`, vaultId));
    };

    return (
      <InterlayTable {...getTableProps()}>
        <InterlayThead>
          {/* TODO: should type properly */}
          {headerGroups.map((headerGroup: any) => (
            // eslint-disable-next-line react/jsx-key
            <InterlayTr {...headerGroup.getHeaderGroupProps()}>
              {/* TODO: should type properly */}
              {headerGroup.headers.map((column: any) => (
                // eslint-disable-next-line react/jsx-key
                <InterlayTh
                  {...column.getHeaderProps([
                    {
                      className: clsx(column.classNames),
                      style: column.style
                    }
                  ])}
                >
                  {column.render('Header')}
                  {column.tooltip && (
                    <InformationTooltip className={clsx('inline-block', 'ml-1')} label={column.tooltip} />
                  )}
                </InterlayTh>
              ))}
            </InterlayTr>
          ))}
        </InterlayThead>
        <InterlayTbody {...getTableBodyProps()}>
          {/* TODO: should type properly */}
          {rows.map((row: any) => {
            prepareRow(row);

            const { key, className: rowClassName, ...restRowProps } = row.getRowProps();

            return (
              <InterlayTr
                key={key}
                className={clsx(rowClassName, 'cursor-pointer')}
                {...restRowProps}
                onClick={handleRowClick(row.original.vaultId)}
              >
                {/* TODO: should type properly */}
                {row.cells.map((cell: any) => {
                  return (
                    // eslint-disable-next-line react/jsx-key
                    <InterlayTd
                      {...cell.getCellProps([
                        {
                          className: clsx(cell.column.classNames),
                          style: cell.column.style
                        }
                      ])}
                    >
                      {cell.render('Cell')}
                    </InterlayTd>
                  );
                })}
              </InterlayTr>
            );
          })}
        </InterlayTbody>
      </InterlayTable>
    );
  };

  // TODO: should add pagination
  return (
    <InterlayTableContainer className='space-y-6'>
      <SectionTitle>{t('dashboard.vault.vaults')}</SectionTitle>
      {renderTable()}
    </InterlayTableContainer>
  );
};

export default withErrorBoundary(VaultsTable, {
  FallbackComponent: ErrorFallback,
  onReset: () => {
    window.location.reload();
  }
});
