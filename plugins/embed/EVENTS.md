# Huly Embed — iframe postMessage Event Reference

All events are sent from the Huly iframe to the parent window via `window.parent.postMessage()`. Every message is a plain object with a `type` field prefixed by `huly-embed-`.

## Listening for Events

```typescript
window.addEventListener('message', (event) => {
  // Optional: validate origin
  if (event.origin !== 'https://your-huly-instance.com') return

  const { type, ...payload } = event.data
  switch (type) {
    case 'huly-embed-ready':
      // iframe is initialized and ready
      break
    case 'huly-embed-issue-created':
      if (payload.cancelled) {
        // user cancelled issue creation
      } else {
        // issue was created
        console.log(payload.identifier) // e.g. "SUPPORT-42"
        console.log(payload.issueId)    // internal UUID
      }
      break
    case 'huly-embed-issue-selected':
      // user clicked an issue in a list, kanban, or detail view
      console.log(payload.identifier) // e.g. "SUPPORT-42"
      break
    case 'huly-embed-resize':
      // iframe content height changed
      console.log(payload.height) // number in pixels
      break
    case 'huly-embed-error':
      // something went wrong
      console.log(payload.reason) // error message string
      break
  }
})
```

---

## Events

### `huly-embed-ready`

Fired once after the iframe has bootstrapped (authenticated, connected to server, component mounted).

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'huly-embed-ready'` | Event identifier |

**Source:** All components (fired by EmbedApp after bootstrap completes).

**When to use:** Gate any parent-to-iframe communication until this event fires. Before this point, the iframe is still loading.

---

### `huly-embed-issue-created`

Fired when the user submits or cancels the create-issue form.

#### On success:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'huly-embed-issue-created'` | Event identifier |
| `issueId` | `string` | Internal UUID of the created issue |
| `identifier` | `string` | Human-readable identifier, e.g. `"SUPPORT-42"` |

#### On cancel:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'huly-embed-issue-created'` | Event identifier |
| `cancelled` | `true` | Indicates the user cancelled |

**Source:** `create-issue` component only.

**When to use:** Close the iframe or show a toast after issue creation. On cancel, close the iframe or reset the UI.

```typescript
// Example: Angular
this.hulyEmbed.on('huly-embed-issue-created', (payload) => {
  if (payload.cancelled) {
    this.dialog.close()
  } else {
    this.toaster.success(`Created ${payload.identifier}`)
    this.dialog.close()
    this.refreshIssueList()
  }
})
```

---

### `huly-embed-issue-selected`

Fired when the user clicks an issue in a list view, kanban board, or clicks a linked issue (sub-issue, parent, related) in the detail view. The click is intercepted — no navigation happens inside the iframe.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'huly-embed-issue-selected'` | Event identifier |
| `identifier` | `string` | Human-readable identifier, e.g. `"SUPPORT-42"` |

**Source:** `issue-list`, `kanban`, and `issue-detail` components.

**When to use:** Navigate the parent app to the selected issue, open a new embed iframe for the issue detail, or update the parent app's state.

```typescript
// Example: React
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.data.type === 'huly-embed-issue-selected') {
      navigate(`/issues/${event.data.identifier}`)
    }
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}, [])
```

---

### `huly-embed-resize`

Fired whenever the iframe content's height changes (via ResizeObserver).

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'huly-embed-resize'` | Event identifier |
| `height` | `number` | Content height in pixels (rounded up) |

**Source:** All components.

**When to use:** Auto-size the iframe element to match content height, avoiding internal scrollbars.

```typescript
iframe.style.height = `${payload.height}px`
```

---

### `huly-embed-error`

Fired when initialization fails (bad token, missing params, network error) or a component encounters an unrecoverable error.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'huly-embed-error'` | Event identifier |
| `reason` | `string` | Human-readable error message |

**Source:** All components.

**When to use:** Show an error state in the parent app, retry with a fresh token, or log for diagnostics.

---

### `huly-embed-issue-closed`

Reserved for future use. Will fire when an issue detail panel is explicitly closed.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'huly-embed-issue-closed'` | Event identifier |
| `identifier` | `string` (optional) | Issue identifier if available |

**Source:** `issue-detail` component (not yet wired).

---

## Events by Component

| Component | URL `component=` | Events Fired |
|-----------|------------------|-------------|
| Create Issue | `create-issue` | `ready`, `issue-created`, `resize`, `error` |
| Issue List | `issue-list` | `ready`, `issue-selected`, `resize`, `error` |
| Kanban Board | `kanban` | `ready`, `issue-selected`, `resize`, `error` |
| Issue Detail | `issue-detail` | `ready`, `issue-selected`, `resize`, `error` |
| Comments | `comments` | `ready`, `resize`, `error` |

---

## iframe URL Format

```
{HULY_URL}/embed?component={type}&token={jwt}&project={id}&issue={id}&parentOrigin={origin}
```

| Param | Required | Description |
|-------|----------|-------------|
| `component` | Yes | One of: `create-issue`, `issue-list`, `issue-detail`, `kanban`, `comments` |
| `token` | Yes | JWT embed token |
| `project` | For `create-issue`, `issue-list`, `kanban` | Project identifier, e.g. `"SUPPORT"` |
| `issue` | For `issue-detail`, `comments` | Issue identifier, e.g. `"SUPPORT-42"` |
| `parentOrigin` | No | Restricts postMessage target origin. Defaults to `'*'` |
| `externalUser` | No | External user ID for tracking |
| `hideFields` | No | Comma-separated list of fields to hide in `create-issue`. See below. |

### `hideFields` — Configurable Field Visibility

For the `create-issue` component, you can hide specific toolbar fields by passing a comma-separated list:

```
/embed?component=create-issue&token=...&project=SUPPORT&hideFields=status,priority,duedate,parent
```

**Available field names:**

| Field Name | What It Hides |
|-----------|---------------|
| `status` | Status/Backlog selector |
| `priority` | Priority level selector |
| `assignee` | Assignee member picker |
| `estimation` | Time estimate field |
| `milestone` | Milestone selector |
| `duedate` | Due date calendar picker |
| `parent` | Parent issue selector |

**Not hideable** (no CSS hook in upstream code): Tags/Labels, Component selector.

Example — show only assignee and priority:
```
&hideFields=status,estimation,milestone,duedate,parent
```

---

## TypeScript Types

```typescript
type HulyEmbedEventType =
  | 'huly-embed-ready'
  | 'huly-embed-issue-created'
  | 'huly-embed-issue-selected'
  | 'huly-embed-issue-closed'
  | 'huly-embed-resize'
  | 'huly-embed-error'

interface HulyEmbedReadyEvent {
  type: 'huly-embed-ready'
}

interface HulyEmbedIssueCreatedEvent {
  type: 'huly-embed-issue-created'
  issueId: string
  identifier: string
  cancelled?: never
}

interface HulyEmbedIssueCreateCancelledEvent {
  type: 'huly-embed-issue-created'
  cancelled: true
  issueId?: never
  identifier?: never
}

interface HulyEmbedIssueSelectedEvent {
  type: 'huly-embed-issue-selected'
  identifier: string
}

interface HulyEmbedIssueClosedEvent {
  type: 'huly-embed-issue-closed'
  identifier?: string
}

interface HulyEmbedResizeEvent {
  type: 'huly-embed-resize'
  height: number
}

interface HulyEmbedErrorEvent {
  type: 'huly-embed-error'
  reason: string
}

type HulyEmbedEvent =
  | HulyEmbedReadyEvent
  | HulyEmbedIssueCreatedEvent
  | HulyEmbedIssueCreateCancelledEvent
  | HulyEmbedIssueSelectedEvent
  | HulyEmbedIssueClosedEvent
  | HulyEmbedResizeEvent
  | HulyEmbedErrorEvent
```
