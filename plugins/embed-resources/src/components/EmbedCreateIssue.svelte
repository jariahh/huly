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
  import { type EmbedConfig } from '@hcengineering/embed'
  import tracker, { type Issue, type Project } from '@hcengineering/tracker'
  import { createQuery, getClient } from '@hcengineering/presentation'
  import { Component } from '@hcengineering/ui'
  import { createResizeNotifier, notifyIssueCreated, notifyIssueCreateCancelled } from '../utils'

  export let config: EmbedConfig

  $: hideStatus = config.hideFields?.includes('status') ?? false
  $: hidePriority = config.hideFields?.includes('priority') ?? false
  $: hideAssignee = config.hideFields?.includes('assignee') ?? false
  $: hideLabels = config.hideFields?.includes('labels') ?? false
  $: hideComponent = config.hideFields?.includes('component') ?? false
  $: hideEstimation = config.hideFields?.includes('estimation') ?? false
  $: hideMilestone = config.hideFields?.includes('milestone') ?? false
  $: hideDuedate = config.hideFields?.includes('duedate') ?? false
  $: hideParent = config.hideFields?.includes('parent') ?? false

  let container: HTMLElement
  let observer: ResizeObserver | undefined
  let project: Project | undefined
  let latestIssueAtMount: Ref<Issue> | undefined
  let done = false
  let createdIdentifier: string | undefined

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
      const query = project?._id !== undefined ? { space: project._id } : {}
      const latest = await client.findAll(
        tracker.class.Issue,
        query,
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
      const query = project?._id !== undefined ? { space: project._id } : {}
      const latest = await client.findAll(
        tracker.class.Issue,
        query,
        { sort: { createdOn: SortingOrder.Descending }, limit: 1 }
      )
      if (latest.length > 0 && latest[0]._id !== latestIssueAtMount) {
        createdIdentifier = latest[0].identifier
        done = true
        notifyIssueCreated(latest[0]._id, latest[0].identifier)
        return
      }
    } catch {
      // Fall through to cancelled
    }
    done = true
    notifyIssueCreateCancelled()
  }
</script>

<div
  class="embed-create-issue"
  class:hide-status={hideStatus}
  class:hide-priority={hidePriority}
  class:hide-assignee={hideAssignee}
  class:hide-labels={hideLabels}
  class:hide-component={hideComponent}
  class:hide-estimation={hideEstimation}
  class:hide-milestone={hideMilestone}
  class:hide-duedate={hideDuedate}
  class:hide-parent={hideParent}
  bind:this={container}
>
  {#if done}
    <div class="embed-done">
      {#if createdIdentifier !== undefined}
        <p>Issue <strong>{createdIdentifier}</strong> created successfully.</p>
      {:else}
        <p>Issue creation cancelled.</p>
      {/if}
    </div>
  {:else if project !== undefined || config.project === undefined}
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
    height: 100%;
    display: flex;
    flex-direction: column;

    // Strip dialog/modal styling from CreateIssue's Card component.
    // The Card renders as .antiCard.dialog.large — a floating modal with shadow,
    // border-radius, max-width, and an X close button. For embed context we want
    // the form to render inline, filling its container with no chrome.
    :global(.antiCard.dialog) {
      max-width: none !important;
      width: 100% !important;
      height: 100% !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
    }

    // Hide the close (X) button in the card header — there's nothing to "close" in embed
    :global(.antiCard-header > .antiCard-header__right-panel > button.iconOnly) {
      display: none !important;
    }

    // Field visibility: hide toolbar items in CreateIssue.svelte's pool slot.
    // Most fields have id-bearing wrapper divs; labels and component are bare components
    // at positions 4 and 5 within .antiCard-pool (after status, priority, assignee divs).
    &.hide-status :global(#status-editor) { display: none; }
    &.hide-priority :global(#priority-editor) { display: none; }
    &.hide-assignee :global(#assignee-editor) { display: none; }
    &.hide-labels :global(.antiCard-pool > :nth-child(4)) { display: none; }
    &.hide-component :global(.antiCard-pool > :nth-child(5)) { display: none; }
    &.hide-estimation :global(#estimation-editor) { display: none; }
    &.hide-milestone :global(#milestone-editor) { display: none; }
    &.hide-duedate :global(#duedate-editor) { display: none; }
    &.hide-parent :global(#parentissue-editor) { display: none; }
  }

  .embed-done {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-content-color, #333);

    strong {
      font-weight: 600;
    }
  }

  .embed-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-halfcontent-color, #999);
  }
</style>
