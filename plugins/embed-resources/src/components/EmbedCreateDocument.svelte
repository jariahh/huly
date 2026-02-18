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
  import { createResizeNotifier, notifyError, notifyDocumentCreated } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let TargetComponent: any
  let loading = true
  let done = false
  let createdDocumentId: string | undefined

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/document-resources/src/components/CreateDocument.svelte')
      TargetComponent = mod.default
    } catch {
      notifyError('Failed to load create document component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })

  function handleClose (event: CustomEvent): void {
    const id = event?.detail?.id
    if (id !== undefined) {
      createdDocumentId = id
      notifyDocumentCreated(id)
    }
    done = true
  }
</script>

<div class="embed-create-document" bind:this={container}>
  {#if done}
    <div class="embed-done">
      {#if createdDocumentId !== undefined}
        <p>Document created successfully.</p>
      {:else}
        <p>Document creation cancelled.</p>
      {/if}
    </div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if TargetComponent !== undefined}
    <svelte:component
      this={TargetComponent}
      space={config.space}
      parent={undefined}
      on:close={handleClose}
    />
  {/if}
</div>

<style lang="scss">
  .embed-create-document {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    // Strip dialog/modal styling from the Card component
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

  .embed-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--theme-halfcontent-color, #999);
  }
</style>
