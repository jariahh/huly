<!--
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { type Ref, type Class, type Doc } from '@hcengineering/core'
  import { type EmbedConfig } from '@hcengineering/embed'
  import { createResizeNotifier, notifyError } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let KanbanView: any
  let loading = true

  const boardCardClass = 'board:class:Card' as Ref<Class<Doc>>

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/board-resources/src/components/KanbanView.svelte')
      KanbanView = mod.default
    } catch {
      notifyError('Failed to load board kanban component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-board" bind:this={container}>
  {#if config.space === undefined}
    <div class="embed-error">Missing space parameter</div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if KanbanView !== undefined}
    <svelte:component
      this={KanbanView}
      _class={boardCardClass}
      space={config.space}
      query={{}}
      options={undefined}
    />
  {/if}
</div>

<style lang="scss">
  .embed-board {
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
