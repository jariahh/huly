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

import { EmbedEvents, type EmbedConfig, type EmbedComponentType } from '@hcengineering/embed'

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

  return {
    component,
    token,
    project: params.get('project') ?? undefined,
    issue: params.get('issue') ?? undefined,
    externalUser: params.get('externalUser') ?? undefined
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
