import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache'
import kvNextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache'
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue'

// ISR on the Cloudflare free plan:
//  - KV stores rendered pages (incremental cache)
//  - a second KV namespace tracks revalidatePath() calls so admin edits purge the cache immediately
//  - the in-memory queue handles background regeneration (adequate for this traffic level)
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: kvNextTagCache,
  queue: memoryQueue,
})
