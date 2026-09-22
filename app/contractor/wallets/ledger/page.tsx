import { WalletLedgerView } from '@/components/wallet-ledger-view';

export default function WalletLedgerPage() {
  return (
    <WalletLedgerView
      walletsPath="/web/api/wallets/reconciliation"
      ledgerPathTemplate="/web/api/wallets/{id}/ledger"
    />
  );
}
