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
  let observer: ResizeObserver | undefined
  let issueDoc: Issue | undefined
  let IssuePreview: any
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
      const mod = await import('@hcengineering/tracker-resources/src/components/issues/IssuePreview.svelte')
      IssuePreview = mod.default
    } catch {
      notifyError('Failed to load IssuePreview component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-issue-preview" bind:this={container}>
  {#if config.issue === undefined}
    <div class="embed-error">Missing issue parameter</div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if issueDoc !== undefined && IssuePreview !== undefined}
    <svelte:component this={IssuePreview} object={issueDoc} />
  {:else if issueDoc === undefined}
    <div class="embed-loading">Loading issue...</div>
  {:else}
    <div class="embed-error">Failed to load component</div>
  {/if}
</div>

<style lang="scss">
  .embed-issue-preview {
    width: 100%;
    height: 100%;
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
