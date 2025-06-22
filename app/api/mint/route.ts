// pages/api/mint.ts

import type { NextRequest } from 'next/server';
import { Transaction, ForgeScript, BlockfrostProvider, MeshWallet } from '@meshsdk/core';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipientAddress, utxos } = body;

    const provider = new BlockfrostProvider(
      process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_PREPROD || ''
    );

    const meshWallet = new MeshWallet({
      networkId: 0, // preprod
      fetcher: provider,
      submitter: provider,
      key: {
        type: 'mnemonic',
        words: process.env.MNEMONIC_PHRASE?.split(' ') || [],
      },
    });

    const meshWalletAddress = await meshWallet.getChangeAddress();
    const forgingScript = ForgeScript.withOneSignature(meshWalletAddress);

    const tx = new Transaction({ initiator: meshWallet });
    tx.setTxInputs(utxos);
    tx.mintAsset(forgingScript, {
      assetName: 'MyTestToken',
      assetQuantity: '1',
      metadata: {
        name: 'My Test Token',
        image: 'ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua',
        mediaType: 'image/png',
        description: 'Minted from Next.js and Mesh SDK!',
      },
      label: '721',
      recipient: recipientAddress,
    });
    tx.setChangeAddress(recipientAddress);

    const unsignedTx = await tx.build();

    // Server signs first (partial sign)
    const partiallySignedTx = await meshWallet.signTx(unsignedTx, true);

    return new Response(JSON.stringify({ unsignedTx: partiallySignedTx }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Mint API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Minting failed', details: error?.message || error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
