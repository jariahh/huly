<!--
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { type Ref, SortingOrder } from '@hcengineering/core'
  import { type EmbedConfig, EmbedEvents } from '@hcengineering/embed'
  import tracker, { type Issue, type Project } from '@hcengineering/tracker'
  import { createQuery, getClient } from '@hcengineering/presentation'
  import { Component } from '@hcengineering/ui'
  import { postToParent, createResizeNotifier } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: ResizeObserver | undefined
  let project: Project | undefined
  let latestIssueAtMount: Ref<Issue> | undefined

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

    // Snapshot the most recently created issue ID so we can detect new ones on close.
    // CreateIssue dispatches the same 'close' event for both cancel and success,
    // but on success the new issue will exist in the local model by the time our handler runs
    // (Card waits for the createIssue() promise before dispatching 'close').
    try {
      const client = getClient()
      const latest = await client.findAll(
        tracker.class.Issue,
        {},
        { sort: { createdOn: SortingOrder.Descending }, limit: 1 }
      )
      latestIssueAtMount = latest[0]?._id
    } catch {
      // Ignore — we'll just report cancelled if detection fails
    }
  })

  onDestroy(() => {
    observer?.disconnect()
  })

  async function handleClose (): Promise<void> {
    try {
      const client = getClient()
      const latest = await client.findAll(
        tracker.class.Issue,
        {},
        { sort: { createdOn: SortingOrder.Descending }, limit: 1 }
      )
      if (latest.length > 0 && latest[0]._id !== latestIssueAtMount) {
        postToParent(EmbedEvents.IssueCreated, {
          issueId: latest[0]._id,
          identifier: latest[0].identifier
        })
        return
      }
    } catch {
      // Fall through to cancelled
    }
    postToParent(EmbedEvents.IssueCreated, { cancelled: true })
  }
</script>

<div class="embed-create-issue" bind:this={container}>
  {#if project !== undefined || config.project === undefined}
    <Component
      is={tracker.component.CreateIssue}
      props={{ space: project?._id, shouldSaveDraft: false }}
      on:close={handleClose}
    />
  {:else}
    <div class="embed-loading">Loading project...</div>
  {/if}
</div>

<style lang="scss">
  .embed-create-issue {
    width: 100%;
    padding: 1rem;
  }

  .embed-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-halfcontent-color, #999);
  }
</style>
