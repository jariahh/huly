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

import { type Class, type Doc, type PersonUuid, type Ref } from '@hcengineering/core'
import { type Asset, type IntlString, type Plugin, plugin } from '@hcengineering/platform'
import { type AnyComponent } from '@hcengineering/ui'

/**
 * Embed component type identifiers for URL routing.
 * @public
 */
export type EmbedComponentType =
  | 'create-issue'
  | 'issue-list'
  | 'issue-detail'
  | 'kanban'
  | 'comments'

/**
 * Configuration passed to embedded components via URL params.
 * @public
 */
/**
 * Field names that can be hidden in the create-issue form.
 * These correspond to the `id` attributes on the toolbar field wrappers in CreateIssue.svelte.
 * @public
 */
export type EmbedHideableField =
  | 'status'
  | 'priority'
  | 'assignee'
  | 'estimation'
  | 'milestone'
  | 'duedate'
  | 'parent'

export interface EmbedConfig {
  component: EmbedComponentType
  token: string
  project?: string
  issue?: string
  externalUser?: string
  hideFields?: EmbedHideableField[]
}

/**
 * Restrictions applied to embedded components.
 * @public
 */
export interface EmbedRestrictions {
  readonly: boolean
  disableComments: boolean
  disableNavigation: boolean
  disableActions: boolean
}

/**
 * Persisted embed link document — tracks generated embed URLs.
 * Follows the guest PublicLink pattern.
 * @public
 */
export interface EmbedLink extends Doc {
  attachedTo: Ref<Doc>
  url: string
  component: EmbedComponentType
  restrictions: EmbedRestrictions
  revokable: boolean
  expiresOn?: number
}

/**
 * PostMessage event types used for iframe communication.
 * @public
 */
export const EmbedEvents = {
  Ready: 'huly-embed-ready',
  IssueCreated: 'huly-embed-issue-created',
  IssueSelected: 'huly-embed-issue-selected',
  IssueClosed: 'huly-embed-issue-closed',
  Resize: 'huly-embed-resize',
  Error: 'huly-embed-error'
} as const

/**
 * Dedicated embed account UUID — used for embed token generation.
 * Similar to the guest account pattern.
 * @public
 */
export const embedAccount = 'e7b96120-516f-49cd-941e-f4a5d2e49c9c' as PersonUuid

/**
 * @public
 */
export const embedId = 'embed' as Plugin

const embedPlugin = plugin(embedId, {
  class: {
    EmbedLink: '' as Ref<Class<EmbedLink>>
  },
  component: {
    EmbedApp: '' as AnyComponent,
    EmbedCreateIssue: '' as AnyComponent,
    EmbedIssueList: '' as AnyComponent,
    EmbedIssueDetail: '' as AnyComponent,
    EmbedKanban: '' as AnyComponent,
    EmbedComments: '' as AnyComponent
  },
  icon: {
    Embed: '' as Asset
  },
  string: {
    EmbedApplication: '' as IntlString
  }
})

export default embedPlugin
