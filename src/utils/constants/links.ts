
const PAGES = Object.freeze({
  HOME: '/',
  BRIDGE: '/bridge',
  CHALLENGES: '/challenges',
  DASHBOARD_VAULTS: '/dashboard/vaults',
  DASHBOARD_PARACHAIN: '/dashboard/parachain',
  DASHBOARD_ORACLES: '/dashboard/oracles',
  DASHBOARD_ISSUE_REQUESTS: '/dashboard/issue-requests',
  DASHBOARD_REDEEM_REQUESTS: '/dashboard/redeem-requests',
  DASHBOARD_RELAY: '/dashboard/relay',
  DASHBOARD: '/dashboard',
  VAULT: '/vault',
  FEEDBACK: '/feedback',
  TRANSACTIONS: '/transactions'
});

const QUERY_PARAMETERS = Object.freeze({
  TAB: 'tab',
  PAGE: 'page',
  ISSUE_REQUESTS_PAGE: 'issueRequestPage',
  REDEEM_REQUESTS_PAGE: 'redeemRequestPage',
  ISSUE_REQUEST_ID: 'issueRequestId',
  REDEEM_REQUEST_ID: 'redeemRequestId'
});

export {
  PAGES,
  QUERY_PARAMETERS
};
