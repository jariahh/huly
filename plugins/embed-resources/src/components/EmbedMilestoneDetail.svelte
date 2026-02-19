<!--
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { type Ref } from '@hcengineering/core'
  import { type EmbedConfig } from '@hcengineering/embed'
  import tracker, { type Milestone } from '@hcengineering/tracker'
  import { createQuery } from '@hcengineering/presentation'
  import { createResizeNotifier, notifyError } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let milestone: Milestone | undefined
  let EditMilestone: any
  let loading = true

  const milestoneQuery = createQuery()

  // Resolve the milestone from config.milestone ID
  $: if (config.milestone !== undefined) {
    milestoneQuery.query(
      tracker.class.Milestone,
      { _id: config.milestone as Ref<Milestone> },
      (res) => {
        milestone = res[0]
        if (milestone === undefined) {
          notifyError(`Milestone not found: ${config.milestone}`)
        }
      }
    )
  }

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/tracker-resources/src/components/milestones/EditMilestone.svelte')
      EditMilestone = mod.default
    } catch {
      notifyError('Failed to load EditMilestone component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-milestone-detail" bind:this={container}>
  {#if config.milestone === undefined}
    <div class="embed-error">Missing milestone parameter</div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if milestone !== undefined && EditMilestone !== undefined}
    <svelte:component this={EditMilestone} object={milestone} />
  {:else if milestone === undefined}
    <div class="embed-loading">Loading milestone...</div>
  {:else}
    <div class="embed-error">Failed to load component</div>
  {/if}
</div>

<style lang="scss">
  .embed-milestone-detail {
    width: 100%;
  }
</style>
