// Disabled for performance - creating a subscription per image is too expensive
// TODO: Implement batched zap count fetching or on-demand loading
export function useZapCount(_eventId: string | undefined): number {
  return 0;
}

// Format sats for display (e.g., 1000 -> "1k", 1500000 -> "1.5M")
export function formatSats(sats: number): string {
  if (sats === 0) return '';
  if (sats < 1000) return sats.toString();
  if (sats < 1000000) return (sats / 1000).toFixed(sats % 1000 === 0 ? 0 : 1) + 'k';
  return (sats / 1000000).toFixed(1) + 'M';
}
