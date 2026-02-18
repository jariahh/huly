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
  import { createResizeNotifier, notifyError } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let MyIssues: any
  let loading = true

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/tracker-resources/src/components/myissues/MyIssues.svelte')
      MyIssues = mod.default
    } catch {
      notifyError('Failed to load MyIssues component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-my-issues" bind:this={container}>
  {#if loading}
    <div class="embed-loading">Loading...</div>
  {:else if MyIssues !== undefined}
    <svelte:component this={MyIssues} />
  {:else}
    <div class="embed-error">Failed to load component</div>
  {/if}
</div>

<style lang="scss">
  .embed-my-issues {
    width: 100%;
    height: 100%;
  }
</style>
