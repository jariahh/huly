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
  import { createResizeNotifier, notifyError } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let TargetComponent: any
  let loading = true

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/drive-resources/src/components/FilePanel.svelte')
      TargetComponent = mod.default
    } catch {
      notifyError('Failed to load file detail component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-file-detail" bind:this={container}>
  {#if config.file === undefined}
    <div class="embed-error">Missing file parameter</div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if TargetComponent !== undefined}
    <svelte:component
      this={TargetComponent}
      _id={config.file}
      readonly={config.readonly ?? false}
      embedded={true}
    />
  {/if}
</div>

<style lang="scss">
  .embed-file-detail {
    width: 100%;
    height: 100%;
    position: relative;
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
