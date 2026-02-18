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
  import { type EmbedConfig } from '@hcengineering/embed'
  import { createResizeNotifier, notifyError } from '../utils'

  export let config: EmbedConfig

  let container: HTMLElement
  let observer: { disconnect: () => void } | undefined
  let CalendarView: any
  let loading = true

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/calendar-resources/src/components/CalendarView.svelte')
      CalendarView = mod.default
    } catch {
      notifyError('Failed to load calendar component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-calendar" bind:this={container}>
  {#if loading}
    <div class="embed-loading">Loading...</div>
  {:else if CalendarView !== undefined}
    <svelte:component
      this={CalendarView}
    />
  {/if}
</div>

<style lang="scss">
  .embed-calendar {
    width: 100%;
    height: 100%;
    position: relative;
  }

</style>
