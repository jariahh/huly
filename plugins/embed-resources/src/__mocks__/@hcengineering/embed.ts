// Manual mock for @hcengineering/embed
// Provides the constants and types consumed by utils.ts without pulling in
// the full monorepo build graph.

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

export const ALL_HIDEABLE_FIELDS: EmbedHideableField[] = [
  'status', 'priority', 'assignee', 'labels', 'component',
  'estimation', 'milestone', 'duedate', 'parent'
]

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
