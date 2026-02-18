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
  | 'my-issues'
  | 'milestones'
  | 'milestone-detail'
  | 'components'
  | 'issue-templates'
  | 'issue-preview'
  | 'time-reports'
  | 'create-project'
  | 'document'
  | 'document-list'
  | 'create-document'
  | 'file-browser'
  | 'file-detail'
  | 'thread'
  | 'activity'
  | 'calendar'
  | 'board'
  | 'department-staff'
  | 'todos'
  | 'my-leads'
  | 'applications'

/**
 * Field names that can be hidden in the create-issue form.
 * @public
 */
export type EmbedHideableField =
  | 'status'
  | 'priority'
  | 'assignee'
  | 'labels'
  | 'component'
  | 'estimation'
  | 'milestone'
  | 'duedate'
  | 'parent'

/**
 * All hideable field names. Used to expand the '*' wildcard.
 * @public
 */
export const ALL_HIDEABLE_FIELDS: EmbedHideableField[] = [
  'status', 'priority', 'assignee', 'labels', 'component',
  'estimation', 'milestone', 'duedate', 'parent'
]

/** @public */
export interface EmbedConfig {
  component: EmbedComponentType
  token: string
  project?: string
  issue?: string
  externalUser?: string
  hideFields?: EmbedHideableField[]
  document?: string
  file?: string
  folder?: string
  drive?: string
  thread?: string
  department?: string
  milestone?: string
  space?: string
  readonly?: boolean
  mode?: string
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
  DocumentCreated: 'huly-embed-document-created',
  DocumentSelected: 'huly-embed-document-selected',
  FileSelected: 'huly-embed-file-selected',
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
    EmbedActivity: '' as AnyComponent,
    EmbedApp: '' as AnyComponent,
    EmbedApplications: '' as AnyComponent,
    EmbedBoard: '' as AnyComponent,
    EmbedCalendar: '' as AnyComponent,
    EmbedComments: '' as AnyComponent,
    EmbedComponents: '' as AnyComponent,
    EmbedCreateDocument: '' as AnyComponent,
    EmbedCreateIssue: '' as AnyComponent,
    EmbedCreateProject: '' as AnyComponent,
    EmbedDepartmentStaff: '' as AnyComponent,
    EmbedDocument: '' as AnyComponent,
    EmbedDocumentList: '' as AnyComponent,
    EmbedFileBrowser: '' as AnyComponent,
    EmbedFileDetail: '' as AnyComponent,
    EmbedIssueDetail: '' as AnyComponent,
    EmbedIssueList: '' as AnyComponent,
    EmbedIssuePreview: '' as AnyComponent,
    EmbedIssueTemplates: '' as AnyComponent,
    EmbedKanban: '' as AnyComponent,
    EmbedMilestoneDetail: '' as AnyComponent,
    EmbedMilestones: '' as AnyComponent,
    EmbedMyIssues: '' as AnyComponent,
    EmbedMyLeads: '' as AnyComponent,
    EmbedThread: '' as AnyComponent,
    EmbedTimeReports: '' as AnyComponent,
    EmbedToDos: '' as AnyComponent
  },
  icon: {
    Embed: '' as Asset
  },
  string: {
    EmbedApplication: '' as IntlString
  }
})

export default embedPlugin
