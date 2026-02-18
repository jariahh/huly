<!--
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { type EmbedConfig } from '@hcengineering/embed'
  import tracker, { type Issue } from '@hcengineering/tracker'
  import { createQuery } from '@hcengineering/presentation'
  import { createResizeNotifier, notifyError } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let ActivityComponent: any
  let issueDoc: Issue | undefined
  let loading = true

  const issueQuery = createQuery()

  // Resolve the issue from identifier (e.g. "SUPPORT-42")
  $: if (config.issue !== undefined) {
    issueQuery.query(
      tracker.class.Issue,
      { identifier: config.issue },
      (res) => {
        issueDoc = res[0]
        if (issueDoc === undefined) {
          notifyError(`Issue not found: ${config.issue}`)
        }
      }
    )
  }

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/activity-resources/src/components/Activity.svelte')
      ActivityComponent = mod.default
    } catch {
      notifyError('Failed to load activity component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-activity" bind:this={container}>
  {#if config.issue === undefined}
    <div class="embed-error">Missing issue parameter</div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if issueDoc !== undefined && ActivityComponent !== undefined}
    <svelte:component
      this={ActivityComponent}
      object={issueDoc}
      showCommenInput={!(config.readonly ?? false)}
    />
  {:else if issueDoc === undefined && !loading}
    <div class="embed-loading">Loading issue...</div>
  {/if}
</div>

<style lang="scss">
  .embed-activity {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .embed-error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-error-color, #f44336);
  }

  .embed-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-halfcontent-color, #999);
  }
</style>
