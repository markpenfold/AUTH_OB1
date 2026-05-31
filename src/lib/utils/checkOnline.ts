// src/lib/utils/checkOnline.ts

export async function isReallyOnline(): Promise<boolean> {
  // Quick optimization: If the OS already reports offline, don't even waste battery pinging
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return false;
  }

  try {
    await fetch('/ping', { 
      method: 'HEAD',
      cache: 'no-store', // Force it to bypass the browser cache completely
      signal: AbortSignal.timeout(2000) // Cut the cord if the server takes > 2 seconds
    });
    return true;
  } catch {
    return false;
  }
}