'use client';

import { useState, useEffect } from 'react';
import { useWallet, CardanoWallet } from '@meshsdk/react';

export default function Home() {
  const { connected, wallet, connect, disconnect } = useWallet();
  const [assets, setAssets] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [changeAddress, setChangeAddress] = useState<string>('');
  const [usedAddresses, setUsedAddresses] = useState<string[]>([]);
  const [unusedAddresses, setUnusedAddresses] = useState<string[]>([]);

  const connectLace = async () => {
    try {
      await connect('lace');
    } catch (err) {
      console.error('Failed to connect to Lace:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setAssets(null);
    setChangeAddress('');
    setUsedAddresses([]);
    setUnusedAddresses([]);
  };

  const startMinting = async () => {
    const recipientAddress = await wallet.getChangeAddress();
    const utxos = await wallet.getUtxos();

    const res = await fetch('/api/mint', {
      method: 'POST',
      body: JSON.stringify({ recipientAddress, utxos }),
    });

    const { unsignedTx } = await res.json();

    const signedTx = await wallet.signTx(unsignedTx, true);

    const submitRes = await fetch('/api/mint/submit', {
      method: 'POST',
      body: JSON.stringify({ signedTx }),
    });

    const { txHash } = await submitRes.json();
    alert(`Transaction submitted: ${txHash}`);
  };

  useEffect(() => {
    async function fetchAddresses() {
      if (wallet) {
        try {
          const change = await wallet.getChangeAddress();
          setChangeAddress(change);

          const used = await wallet.getUsedAddresses();
          setUsedAddresses(used);

          const unused = await wallet.getUnusedAddresses();
          setUnusedAddresses(unused);
        } catch (err) {
          console.warn('Error fetching addresses:', err);
        }
      }
    }

    fetchAddresses();
  }, [wallet]);

  async function getAssets() {
    if (!wallet) return;
    setLoading(true);

    try {
      const utxos = await wallet.getUtxos();
      const assetsMap = new Map<string, bigint>();

      utxos.forEach(({ output }) => {
        output.amount.forEach(({ unit, quantity }) => {
          const qty = BigInt(quantity);
          const prev = assetsMap.get(unit) || BigInt(0);
          assetsMap.set(unit, prev + qty);
        });
      });

      const aggregatedAssets = Array.from(assetsMap, ([unit, quantity]) => ({
        unit,
        quantity: quantity.toString(),
      }));

      setAssets(aggregatedAssets);
    } catch (error) {
      console.error('Error getting assets:', error);
      setAssets(null);
    }

    setLoading(false);
  }

  return (
    <main
      style={{
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#121212',
        color: '#e0e0e0',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          backgroundColor: '#1e1e1e',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#ffffff' }}>
          🔗 Connect Wallet
        </h1>

        {!connected && (
          <>
            <CardanoWallet
              label="Other Wallets"
              isDark={true}
              persist={true}
            />
          </>
        )}

        {connected && (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={handleDisconnect}
                style={{
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                🔌 Disconnect
              </button>

              <button
                onClick={startMinting}
                style={{
                  backgroundColor: '#00c853',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                🪙 Mint My Token
              </button>
            </div>

            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#90caf9' }}>📫 Wallet Addresses</h2>
              <p><strong>Change Address:</strong> {changeAddress}</p>
              <p><strong>Used:</strong> {usedAddresses.join(', ') || 'None'}</p>
              <p><strong>Unused:</strong> {unusedAddresses.join(', ') || 'None'}</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', color: '#90caf9' }}>📦 Wallet Assets</h2>

              {assets ? (
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#263238',
                    color: '#e0f7fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem',
                  }}
                >
                  {JSON.stringify(assets, null, 2)}
                </pre>
              ) : (
                <button
                  onClick={getAssets}
                  disabled={loading}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1.2rem',
                    backgroundColor: loading ? '#ffa726' : '#424242',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  {loading ? 'Loading Assets...' : '📥 Get Wallet Assets'}
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
