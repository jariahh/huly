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
  import { type Project } from '@hcengineering/tracker'
  import tracker from '@hcengineering/tracker-resources/src/plugin'
  import { createQuery } from '@hcengineering/presentation'
  import { createResizeNotifier, notifyError } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let project: Project | undefined
  let ComponentBrowser: any
  let loading = true

  const projectQuery = createQuery()

  $: if (config.project !== undefined) {
    projectQuery.query(tracker.class.Project, { identifier: config.project }, (res) => {
      project = res[0]
    })
  }

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/tracker-resources/src/components/components/ComponentBrowser.svelte')
      ComponentBrowser = mod.default
    } catch {
      notifyError('Failed to load ComponentBrowser component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-components" bind:this={container}>
  {#if loading}
    <div class="embed-loading">Loading...</div>
  {:else if ComponentBrowser !== undefined && (project !== undefined || config.project === undefined)}
    <svelte:component
      this={ComponentBrowser}
      label={tracker.string.Components}
      query={{ space: project?._id }}
      search={''}
      filterMode={'all'}
    />
  {:else if config.project !== undefined && project === undefined}
    <div class="embed-loading">Loading project...</div>
  {:else}
    <div class="embed-error">Failed to load component</div>
  {/if}
</div>

<style lang="scss">
  .embed-components {
    width: 100%;
    flex: 1;
    min-height: 0;
  }
</style>
