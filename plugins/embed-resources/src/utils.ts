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

import { EmbedEvents, ALL_HIDEABLE_FIELDS, type EmbedConfig, type EmbedComponentType, type EmbedHideableField } from '@hcengineering/embed'

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
  // Special value "*" expands to all hideable fields
  const hideFieldsParam = params.get('hideFields')
  let hideFields: EmbedHideableField[] | undefined
  if (hideFieldsParam != null && hideFieldsParam !== '') {
    const raw = hideFieldsParam.split(',').map((f) => f.trim())
    hideFields = raw.includes('*') ? [...ALL_HIDEABLE_FIELDS] : raw as EmbedHideableField[]
  }

  return {
    component,
    token,
    project: params.get('project') ?? undefined,
    issue: params.get('issue') ?? undefined,
    externalUser: params.get('externalUser') ?? undefined,
    hideFields,
    document: params.get('document') ?? undefined,
    file: params.get('file') ?? undefined,
    folder: params.get('folder') ?? undefined,
    drive: params.get('drive') ?? undefined,
    thread: params.get('thread') ?? undefined,
    department: params.get('department') ?? undefined,
    milestone: params.get('milestone') ?? undefined,
    space: params.get('space') ?? undefined,
    readonly: params.get('readonly') === 'true',
    mode: params.get('mode') ?? undefined
  }
}

/**
 * Create an observer that notifies the parent of height changes.
 *
 * Uses scrollHeight (not contentRect.height) to capture the full content
 * height including padding and overflow. Also watches for DOM mutations
 * (async content loads, lazy lists) that may change height without
 * triggering a ResizeObserver callback.
 */
export function createResizeNotifier (element: HTMLElement): { disconnect: () => void } {
  let lastHeight = 0

  function reportHeight (): void {
    // scrollHeight includes content + padding, capturing overflow.
    // Also check documentElement.scrollHeight for the full page height
    // (e.g. popups/panels rendered outside the observed element).
    const height = Math.ceil(Math.max(
      element.scrollHeight,
      element.offsetHeight,
      document.documentElement.scrollHeight
    ))
    if (height !== lastHeight) {
      lastHeight = height
      notifyResize(height)
    }
  }

  const resizeObserver = new ResizeObserver(() => { reportHeight() })
  resizeObserver.observe(element)
  resizeObserver.observe(document.documentElement)

  // Catch dynamic DOM changes (lazy-loaded lists, async component mounts)
  const mutationObserver = new MutationObserver(() => { reportHeight() })
  mutationObserver.observe(element, { childList: true, subtree: true })

  // Initial measurement after layout settles
  requestAnimationFrame(() => { reportHeight() })

  return {
    disconnect (): void {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }
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
 * Notify the parent that a document was created.
 */
export function notifyDocumentCreated (documentId: string): void {
  postToParent(EmbedEvents.DocumentCreated, { documentId })
}

/**
 * Notify the parent that a document was selected.
 */
export function notifyDocumentSelected (documentId: string): void {
  postToParent(EmbedEvents.DocumentSelected, { documentId })
}

/**
 * Notify the parent that a file was selected.
 */
export function notifyFileSelected (fileId: string): void {
  postToParent(EmbedEvents.FileSelected, { fileId })
}

/**
 * Create a click interceptor that catches clicks on issue links before they navigate.
 *
 * In the embed context, clicking an issue in IssuesView/KanbanView causes a full page
 * navigation (e.g. from /embed?component=issue-list&... to /embed//tracker/SUPPO-2)
 * rather than a fragment change. This interceptor catches those clicks on the capture phase,
 * extracts the issue identifier from the href, fires huly-embed-issue-selected, and
 * prevents the default navigation.
 *
 * @param container The DOM element to listen on (captures clicks from all descendants).
 * @returns A cleanup function to call in onDestroy.
 */
export function createClickInterceptor (container: HTMLElement): () => void {
  function handleClick (event: MouseEvent): void {
    const target = event.target as HTMLElement
    const anchor = target.closest('a[href]') as HTMLAnchorElement | null
    if (anchor == null) return

    const href = anchor.getAttribute('href')
    if (href == null) return

    // Match issue identifier in URL path — pattern: UPPERCASE-DIGITS
    // e.g. /tracker/SUPPO-2, /tracker/PROJECT-ID/issues/SUPPORT-42
    const match = href.match(/\/([A-Z][A-Z0-9]*-\d+)(?:\/|$|\?)/)
    if (match != null) {
      event.preventDefault()
      event.stopPropagation()
      notifyIssueSelected(match[1])
    }
  }

  // Use capture phase to intercept before the link navigates
  container.addEventListener('click', handleClick, true)
  return () => { container.removeEventListener('click', handleClick, true) }
}
