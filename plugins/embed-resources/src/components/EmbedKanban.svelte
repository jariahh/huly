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
  import { Component } from '@hcengineering/ui'
  import { createResizeNotifier, createNavigationInterceptor } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: ResizeObserver | undefined
  let unsubscribeNav: (() => void) | undefined
  let project: Project | undefined

  const projectQuery = createQuery()

  $: if (config.project !== undefined) {
    projectQuery.query(tracker.class.Project, { identifier: config.project }, (res) => {
      project = res[0]
    })
  }

  onMount(() => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    unsubscribeNav = createNavigationInterceptor()
  })

  onDestroy(() => {
    observer?.disconnect()
    unsubscribeNav?.()
  })
</script>

<div class="embed-kanban" bind:this={container}>
  {#if project !== undefined || config.project === undefined}
    <!--
      IssuesView supports both list and kanban viewlet modes internally.
      The user can switch between views via the viewlet selector.
      TODO: Add viewlet preference param to force kanban mode.
    -->
    <Component
      is={tracker.component.IssuesView}
      props={{
        space: project?._id,
        query: {}
      }}
    />
  {:else}
    <div class="embed-loading">Loading project...</div>
  {/if}
</div>

<style lang="scss">
  .embed-kanban {
    width: 100%;
    height: 100%;
  }

  .embed-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-halfcontent-color, #999);
  }
</style>
