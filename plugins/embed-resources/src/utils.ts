//
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
//

import { EmbedEvents, type EmbedConfig, type EmbedComponentType, type EmbedHideableField } from '@hcengineering/embed'
import { location } from '@hcengineering/ui'

/**
 * Target origin for postMessage calls to the parent window.
 * Set via the `parentOrigin` URL parameter. Defaults to '*'.
 */
let _targetOrigin = '*'

/**
 * Send a postMessage to the parent window (iframe host).
 */
export function postToParent (type: string, payload?: Record<string, any>): void {
  if (window.parent !== window) {
    window.parent.postMessage({ type, ...payload }, _targetOrigin)
  }
}

/**
 * Send the ready event to the parent.
 */
export function notifyReady (): void {
  postToParent(EmbedEvents.Ready)
}

/**
 * Send a resize event with the current document height.
 */
export function notifyResize (height: number): void {
  postToParent(EmbedEvents.Resize, { height })
}

/**
 * Send an error event to the parent.
 */
export function notifyError (reason: string): void {
  postToParent(EmbedEvents.Error, { reason })
}

/**
 * Parse embed configuration from URL search params.
 */
export function parseEmbedConfig (search: string): EmbedConfig | undefined {
  const params = new URLSearchParams(search)
  const component = params.get('component') as EmbedComponentType | null
  const token = params.get('token')

  if (component == null || token == null) {
    return undefined
  }

  // Set target origin for postMessage if provided
  const parentOrigin = params.get('parentOrigin')
  if (parentOrigin != null && parentOrigin !== '') {
    _targetOrigin = parentOrigin
  }

  // Parse hideFields as comma-separated list, e.g. "status,priority,duedate"
  const hideFieldsParam = params.get('hideFields')
  const hideFields = hideFieldsParam != null && hideFieldsParam !== ''
    ? hideFieldsParam.split(',').map((f) => f.trim()) as EmbedHideableField[]
    : undefined

  return {
    component,
    token,
    project: params.get('project') ?? undefined,
    issue: params.get('issue') ?? undefined,
    externalUser: params.get('externalUser') ?? undefined,
    hideFields
  }
}

/**
 * Create a ResizeObserver that notifies the parent of height changes.
 */
export function createResizeNotifier (element: HTMLElement): ResizeObserver {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      notifyResize(Math.ceil(entry.contentRect.height))
    }
  })
  observer.observe(element)
  return observer
}

/**
 * Notify the parent that a new issue was created.
 */
export function notifyIssueCreated (issueId: string, identifier: string): void {
  postToParent(EmbedEvents.IssueCreated, { issueId, identifier })
}

/**
 * Notify the parent that issue creation was cancelled.
 */
export function notifyIssueCreateCancelled (): void {
  postToParent(EmbedEvents.IssueCreated, { cancelled: true })
}

/**
 * Notify the parent that an issue was selected (clicked) in a list/kanban/detail view.
 */
export function notifyIssueSelected (identifier: string): void {
  postToParent(EmbedEvents.IssueSelected, { identifier })
}

/**
 * Notify the parent that an issue detail view was closed.
 */
export function notifyIssueClosed (identifier?: string): void {
  postToParent(EmbedEvents.IssueClosed, { identifier })
}

/**
 * Create a navigation interceptor that watches the location store for fragment changes.
 *
 * In embed context, Workbench.svelte is not running, so clicking an issue in a list/kanban
 * updates location.fragment but no panel renders. This interceptor detects the fragment change,
 * parses the issue identifier from it, fires huly-embed-issue-selected, and undoes the navigation.
 *
 * Fragment format: `component|identifier|_class|element` (pipe-delimited, URI-encoded)
 * Example: `tracker:EditIssue|SUPPORT-42|tracker:class:Issue|content`
 *
 * @returns An unsubscribe function to call in onDestroy.
 */
export function createNavigationInterceptor (): () => void {
  let previousFragment: string | undefined

  const unsubscribe = location.subscribe((loc) => {
    const fragment = loc.fragment
    if (fragment != null && fragment.length > 0 && fragment !== previousFragment) {
      try {
        const parts = decodeURIComponent(fragment).split('|')
        // parts = ['tracker:EditIssue', 'SUPPORT-42', 'tracker:class:Issue', 'content']
        if (parts.length >= 3 && parts[2].includes('Issue')) {
          notifyIssueSelected(parts[1])
        }
      } catch {
        // Ignore malformed fragments
      }
      // Undo the navigation — no panel to show in embed context
      history.back()
    }
    previousFragment = fragment
  })

  return unsubscribe
}
