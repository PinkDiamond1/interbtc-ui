import { Registration } from '@polkadot/types/interfaces';
import { encodeAddress } from '@polkadot/util-crypto';
import { useQuery, UseQueryResult } from 'react-query';

import { SS58_FORMAT } from '@/constants';

// Return mapping of account id to display name
// TODO: can return entire identity and showcase that via a component
const getIdentities = async (): Promise<Map<string, string>> => {
  const identities = await window.bridge.api.query.identity.identityOf.entries();
  const accountDisplayMapping: Map<string, string> = new Map();
  identities.forEach((identity) => {
    const formattedAccountId = encodeAddress(identity[0].args.toString(), SS58_FORMAT);
    const registration: Registration = identity[1].unwrap();
    const displayName = registration.info.display.asRaw.toHuman()?.toString();
    accountDisplayMapping.set(formattedAccountId, displayName ? displayName : '');
  });
  return accountDisplayMapping;
};

const useGetIdentities = (bridgeLoaded: boolean): UseQueryResult<Map<string, string>> => {
  return useQuery({ queryKey: 'getIdentities', queryFn: getIdentities, enabled: bridgeLoaded });
};

export { useGetIdentities };
