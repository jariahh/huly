<!--
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { type EmbedConfig } from '@hcengineering/embed'
  import { parseEmbedConfig, notifyReady, notifyError } from '../utils'
  import { bootstrapEmbed } from '../embed'
  import EmbedCreateIssue from './EmbedCreateIssue.svelte'
  import EmbedIssueList from './EmbedIssueList.svelte'
  import EmbedIssueDetail from './EmbedIssueDetail.svelte'
  import EmbedKanban from './EmbedKanban.svelte'
  import EmbedComments from './EmbedComments.svelte'

  let config: EmbedConfig | undefined
  let clientReady = false
  let error: string | undefined

  onMount(async () => {
    config = parseEmbedConfig(window.location.search)
    if (config === undefined) {
      error = 'Missing required parameters: component, token'
      notifyError(error)
      return
    }

    try {
      await bootstrapEmbed(config)
      clientReady = true
      notifyReady()
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to initialize embed'
      error = msg
      notifyError(msg)
    }
  })
</script>

<div class="embed-app">
  {#if error}
    <div class="embed-error">
      <p>{error}</p>
    </div>
  {:else if clientReady && config}
    {#if config.component === 'create-issue'}
      <EmbedCreateIssue {config} />
    {:else if config.component === 'issue-list'}
      <EmbedIssueList {config} />
    {:else if config.component === 'issue-detail'}
      <EmbedIssueDetail {config} />
    {:else if config.component === 'kanban'}
      <EmbedKanban {config} />
    {:else if config.component === 'comments'}
      <EmbedComments {config} />
    {:else}
      <div class="embed-error">
        <p>Unknown component: {config.component}</p>
      </div>
    {/if}
  {:else}
    <div class="embed-loading">
      <p>Loading...</p>
    </div>
  {/if}
</div>

<style lang="scss">
  .embed-app {
    width: 100%;
    height: 100%;
    overflow: auto;
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
