export function scaledDelay(ms: number, speed: number): number {
  return Math.round(ms / speed)
}
