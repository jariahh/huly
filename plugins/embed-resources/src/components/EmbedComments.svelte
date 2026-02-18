<!--
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
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
  let issueDoc: Issue | undefined
  let Channel: any
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
    // Dynamically import Channel to avoid hard dependency on chunter-resources bundle
    try {
      const mod = await import('@hcengineering/chunter-resources')
      Channel = (mod as any).ChannelEmbeddedContent
    } catch {
      notifyError('Failed to load comments component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-comments" bind:this={container}>
  {#if config.issue === undefined}
    <div class="embed-error">Missing issue parameter</div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if issueDoc !== undefined && Channel !== undefined}
    <svelte:component
      this={Channel}
      object={issueDoc}
      height="100%"
      width="100%"
      collection="comments"
      withInput={true}
      readonly={false}
    />
  {:else if issueDoc === undefined}
    <div class="embed-loading">Loading issue...</div>
  {/if}
</div>

<style lang="scss">
  .embed-comments {
    width: 100%;
    height: 100%;
    position: relative;
  }
</style>
