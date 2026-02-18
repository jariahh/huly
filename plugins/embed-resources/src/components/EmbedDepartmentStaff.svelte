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
  let DepartmentStaff: any
  let loading = true

  onMount(async () => {
    if (container !== undefined) {
      observer = createResizeNotifier(container)
    }
    try {
      const mod = await import('@hcengineering/hr-resources/src/components/DepartmentStaff.svelte')
      DepartmentStaff = mod.default
    } catch {
      notifyError('Failed to load department staff component')
    }
    loading = false
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div class="embed-department-staff" bind:this={container}>
  {#if config.department === undefined}
    <div class="embed-error">Missing department parameter</div>
  {:else if loading}
    <div class="embed-loading">Loading...</div>
  {:else if DepartmentStaff !== undefined}
    <svelte:component
      this={DepartmentStaff}
      objectId={config.department}
    />
  {/if}
</div>

<style lang="scss">
  .embed-department-staff {
    width: 100%;
    height: 100%;
    position: relative;
  }
</style>
