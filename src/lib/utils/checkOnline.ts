export async function isReallyOnline() {
  try {
    await fetch('/ping', { method: 'HEAD' });
    return true;
  } catch {
    return false;
  }
}