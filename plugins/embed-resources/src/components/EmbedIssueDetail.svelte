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
  import tracker from '@hcengineering/tracker'
  import { Component } from '@hcengineering/ui'
  import { createResizeNotifier, createNavigationInterceptor } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: ResizeObserver | undefined
  let unsubscribeNav: (() => void) | undefined

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

<div class="embed-issue-detail" bind:this={container}>
  {#if config.issue !== undefined}
    <!-- EditIssue accepts identifier strings (e.g. "SUPPORT-42") as _id -->
    <Component
      is={tracker.component.EditIssue}
      props={{
        _id: config.issue,
        _class: tracker.class.Issue,
        embedded: true
      }}
    />
  {:else}
    <div class="embed-error">Missing issue parameter</div>
  {/if}
</div>

<style lang="scss">
  .embed-issue-detail {
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
</style>
