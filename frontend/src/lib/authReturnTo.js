export function safeReturnTo() {
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('returnTo');
  if (returnTo && returnTo.startsWith('/')) {
    return returnTo;
  }
  return '/';
}
