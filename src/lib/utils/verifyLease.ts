// src/lib/utils/verifyLease.ts

/**
* Executes anywhere (Client or Server).
* Reads the public key to ensure the token hasn't been altered by the user.
*/

import * as jose from 'jose';

export async function verifyOfflineLeaseJwt(token: string) {
  const publicKeyString = process.env.NEXT_PUBLIC_OFFLINE_PUBLIC_KEY;
  if (!publicKeyString) {
    throw new Error("Missing NEXT_PUBLIC_OFFLINE_PUBLIC_KEY configuration.");
  }

  try {
    const publicKey = await jose.importSPKI(publicKeyString, 'Ed25519');
    const { payload } = await jose.jwtVerify(token, publicKey);
    
    return {
      isValid: true,
      userId: payload.userId as string,
      tier: payload.tier as string,
    };
  } catch (err) {
    // Throws if the token is expired, has a bad signature, or was tampered with
    console.warn("Cryptographic verification failed. Rejecting offline lease.", err);
    return { isValid: false, userId: null, tier: 'free' };
  }
}