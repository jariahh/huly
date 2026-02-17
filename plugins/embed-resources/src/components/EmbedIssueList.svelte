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
  import { type Project } from '@hcengineering/tracker'
  import tracker from '@hcengineering/tracker-resources/src/plugin'
  import { createQuery } from '@hcengineering/presentation'
  import { Component } from '@hcengineering/ui'
  import { type Viewlet } from '@hcengineering/view'
  import { setActiveViewletId } from '@hcengineering/view-resources'
  import { createResizeNotifier, createClickInterceptor } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: ResizeObserver | undefined
  let cleanupClickInterceptor: (() => void) | undefined
  let project: Project | undefined

  const projectQuery = createQuery()

  $: if (config.project !== undefined) {
    projectQuery.query(tracker.class.Project, { identifier: config.project }, (res) => {
      project = res[0]
    })
  }

  onMount(() => {
    // Force list viewlet before IssuesView mounts
    setActiveViewletId('tracker:viewlet:IssueList' as Ref<Viewlet>)

    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    cleanupClickInterceptor = createClickInterceptor(container)
  })

  onDestroy(() => {
    observer?.disconnect()
    cleanupClickInterceptor?.()
  })
</script>

<div class="embed-issue-list" bind:this={container}>
  {#if project !== undefined || config.project === undefined}
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
  .embed-issue-list {
    width: 100%;
    height: 100%;

    // Hide the viewlet switcher (list/kanban toggle) — mode is forced via setActiveViewletId
    :global(.switcher-container.subtle) { display: none; }
  }

  .embed-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-halfcontent-color, #999);
  }
</style>
