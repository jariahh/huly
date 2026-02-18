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
  import { Popup, PanelInstance, TooltipInstance } from '@hcengineering/ui'
  import { parseEmbedConfig, notifyReady, notifyError } from '../utils'
  import { bootstrapEmbed } from '../embed'
  import EmbedCreateIssue from './EmbedCreateIssue.svelte'
  import EmbedIssueList from './EmbedIssueList.svelte'
  import EmbedIssueDetail from './EmbedIssueDetail.svelte'
  import EmbedKanban from './EmbedKanban.svelte'
  import EmbedComments from './EmbedComments.svelte'
  import EmbedMyIssues from './EmbedMyIssues.svelte'
  import EmbedMilestones from './EmbedMilestones.svelte'
  import EmbedMilestoneDetail from './EmbedMilestoneDetail.svelte'
  import EmbedComponents from './EmbedComponents.svelte'
  import EmbedIssueTemplates from './EmbedIssueTemplates.svelte'
  import EmbedIssuePreview from './EmbedIssuePreview.svelte'
  import EmbedTimeReports from './EmbedTimeReports.svelte'
  import EmbedCreateProject from './EmbedCreateProject.svelte'
  import EmbedDocument from './EmbedDocument.svelte'
  import EmbedDocumentList from './EmbedDocumentList.svelte'
  import EmbedCreateDocument from './EmbedCreateDocument.svelte'
  import EmbedFileBrowser from './EmbedFileBrowser.svelte'
  import EmbedFileDetail from './EmbedFileDetail.svelte'
  import EmbedThread from './EmbedThread.svelte'
  import EmbedActivity from './EmbedActivity.svelte'
  import EmbedCalendar from './EmbedCalendar.svelte'
  import EmbedBoard from './EmbedBoard.svelte'
  import EmbedDepartmentStaff from './EmbedDepartmentStaff.svelte'
  import EmbedToDos from './EmbedToDos.svelte'
  import EmbedMyLeads from './EmbedMyLeads.svelte'
  import EmbedApplications from './EmbedApplications.svelte'

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
    {:else if config.component === 'my-issues'}
      <EmbedMyIssues {config} />
    {:else if config.component === 'milestones'}
      <EmbedMilestones {config} />
    {:else if config.component === 'milestone-detail'}
      <EmbedMilestoneDetail {config} />
    {:else if config.component === 'components'}
      <EmbedComponents {config} />
    {:else if config.component === 'issue-templates'}
      <EmbedIssueTemplates {config} />
    {:else if config.component === 'issue-preview'}
      <EmbedIssuePreview {config} />
    {:else if config.component === 'time-reports'}
      <EmbedTimeReports {config} />
    {:else if config.component === 'create-project'}
      <EmbedCreateProject {config} />
    {:else if config.component === 'document'}
      <EmbedDocument {config} />
    {:else if config.component === 'document-list'}
      <EmbedDocumentList {config} />
    {:else if config.component === 'create-document'}
      <EmbedCreateDocument {config} />
    {:else if config.component === 'file-browser'}
      <EmbedFileBrowser {config} />
    {:else if config.component === 'file-detail'}
      <EmbedFileDetail {config} />
    {:else if config.component === 'thread'}
      <EmbedThread {config} />
    {:else if config.component === 'activity'}
      <EmbedActivity {config} />
    {:else if config.component === 'calendar'}
      <EmbedCalendar {config} />
    {:else if config.component === 'board'}
      <EmbedBoard {config} />
    {:else if config.component === 'department-staff'}
      <EmbedDepartmentStaff {config} />
    {:else if config.component === 'todos'}
      <EmbedToDos {config} />
    {:else if config.component === 'my-leads'}
      <EmbedMyLeads {config} />
    {:else if config.component === 'applications'}
      <EmbedApplications {config} />
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

<!-- UI infrastructure: renders popups, tooltips, and panels from global stores.
     Without these, showPopup() calls (used by all toolbar buttons) silently do nothing. -->
<Popup contentPanel={undefined} />
<PanelInstance contentPanel={undefined} />
<TooltipInstance />

<style lang="scss">
  // Hide the Root.svelte status bar in embed context — it shows location/timezone
  // and a gear icon that serve no purpose in an iframe. Also reclaim the height.
  :global(#ui-root:has(.embed-app) > .antiStatusBar) {
    display: none !important;
  }
  :global(#ui-root:has(.embed-app) > .app) {
    height: 100% !important;
  }

  // Make the body background transparent in embed context so the host app's
  // background shows through. The default Huly theme sets a light gray body bg
  // which looks like a modal backdrop when the create-issue card floats over it.
  :global(body:has(.embed-app)) {
    background: transparent !important;
    background-color: transparent !important;
  }

  .embed-app {
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--theme-bg-color, #fff);
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
