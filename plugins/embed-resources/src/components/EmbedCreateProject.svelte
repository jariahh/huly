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
  import { createResizeNotifier, notifyError, postToParent } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let CreateProject: any
  let loading = true
  let done = false

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/tracker-resources/src/components/projects/CreateProject.svelte')
      CreateProject = mod.default
    } catch {
      notifyError('Failed to load CreateProject component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })

  function handleClose (): void {
    done = true
    postToParent('huly-embed-close')
  }
</script>

<div class="embed-create-project" bind:this={container}>
  {#if done}
    <div class="embed-done">
      <p>Project creation completed.</p>
    </div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if CreateProject !== undefined}
    <svelte:component this={CreateProject} on:close={handleClose} />
  {:else}
    <div class="embed-error">Failed to load component</div>
  {/if}
</div>

<style lang="scss">
  .embed-create-project {
    width: 100%;
    display: flex;
    flex-direction: column;

    // Strip dialog/modal styling from CreateProject's Card component
    :global(.antiCard.dialog) {
      max-width: none !important;
      width: 100% !important;
      height: 100% !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
    }

    // Hide the close (X) button in the card header
    :global(.antiCard-header > .antiCard-header__right-panel > button.iconOnly) {
      display: none !important;
    }
  }

  .embed-done {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-content-color, #333);
  }
</style>
