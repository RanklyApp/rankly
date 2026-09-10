/**
 * Time-bucketed rotation offset for the promoted block. Changes once per hour,
 * so within an ISR cache window the order is stable (server-rendered, SEO-safe)
 * but paid apps beyond MAX_PROMOTED still cycle over time.
 */
export function rotationOffset(bucketMs = 60 * 60 * 1000): number {
  return Math.floor(Date.now() / bucketMs);
}
