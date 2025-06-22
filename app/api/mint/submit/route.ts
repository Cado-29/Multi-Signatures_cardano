// pages/api/mint/submit.ts

import type { NextRequest } from 'next/server';
import { BlockfrostProvider } from '@meshsdk/core';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { signedTx } = await req.json();

    const provider = new BlockfrostProvider(
      process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_PREPROD || ''
    );

    const txHash = await provider.submitTx(signedTx);

    return new Response(JSON.stringify({ txHash }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Submit API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Transaction submission failed', details: error?.message || error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
