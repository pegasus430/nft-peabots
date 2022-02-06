import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

const POLLING_INTERVAL = 12000;
const RPC_URLS = {
  1: "https://mainnet.infura.io/v3/84842078b09946638c03157f83405213",
  4: "https://rinkeby.infura.io/v3/84842078b09946638c03157f83405213"
};

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 1337]
});

export const walletconnect = new WalletConnectConnector({
  rpc: { 1: RPC_URLS[1] },
  bridge: "https://bridge.walletconnect.org",
  qrcode: true,
  pollingInterval: POLLING_INTERVAL
});

export const resetWalletConnector = (connector) => {
  //console.log(connector)
  if (
    connector &&
    connector instanceof WalletConnectConnector 
  ) {
    connector.walletConnectProvider = undefined
  }
}