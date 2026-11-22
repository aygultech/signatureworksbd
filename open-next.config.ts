import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache'
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache'
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue'

// ISR on the Cloudflare free plan:
//  - KV stores rendered pages (incremental cache)
//  - D1 tracks revalidatePath() calls so admin edits purge the cache immediately
//  - the in-memory queue handles background regeneration (adequate for this traffic level)
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: d1NextTagCache,
  queue: memoryQueue,
})
