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

// Inline mock factory — defines constants without going through the monorepo
// build graph. Must be declared before any imports that would pull in the real
// @hcengineering/embed via ts-jest.

jest.mock('@hcengineering/embed', () => ({
  EmbedEvents: {
    Ready: 'huly-embed-ready',
    IssueCreated: 'huly-embed-issue-created',
    IssueSelected: 'huly-embed-issue-selected',
    IssueClosed: 'huly-embed-issue-closed',
    DocumentCreated: 'huly-embed-document-created',
    DocumentSelected: 'huly-embed-document-selected',
    FileSelected: 'huly-embed-file-selected',
    Resize: 'huly-embed-resize',
    Error: 'huly-embed-error'
  },
  ALL_HIDEABLE_FIELDS: [
    'status', 'priority', 'assignee', 'labels', 'component',
    'estimation', 'milestone', 'duedate', 'parent'
  ]
}))

// Pull in the real ALL_HIDEABLE_FIELDS value from our mock (not the real pkg).
const { ALL_HIDEABLE_FIELDS } = jest.requireMock('@hcengineering/embed') as {
  ALL_HIDEABLE_FIELDS: string[]
}

// Helpers

/**
 * Shared mock factory used both in the module-level jest.mock() call above
 * and in freshUtils() after jest.resetModules() clears the registry.
 */
const embedMockFactory = (): object => ({
  EmbedEvents: {
    Ready: 'huly-embed-ready',
    IssueCreated: 'huly-embed-issue-created',
    IssueSelected: 'huly-embed-issue-selected',
    IssueClosed: 'huly-embed-issue-closed',
    DocumentCreated: 'huly-embed-document-created',
    DocumentSelected: 'huly-embed-document-selected',
    FileSelected: 'huly-embed-file-selected',
    Resize: 'huly-embed-resize',
    Error: 'huly-embed-error'
  },
  ALL_HIDEABLE_FIELDS: [
    'status', 'priority', 'assignee', 'labels', 'component',
    'estimation', 'milestone', 'duedate', 'parent'
  ]
})

/**
 * Re-import utils with a clean module registry so the module-level
 * `_targetOrigin` variable is reset to '*' between tests that need it.
 */
async function freshUtils (): Promise<typeof import('../utils')> {
  jest.resetModules()
  jest.mock('@hcengineering/embed', embedMockFactory)
  return await import('../utils')
}

/**
 * Make window.parent appear to be a different window (i.e. we are inside an
 * iframe) and attach a jest spy to its postMessage method.
 *
 * Returns the spy and a cleanup function that restores the original descriptor.
 */
function mockInsideIframe (): { postMessageSpy: jest.Mock, restore: () => void } {
  const postMessageSpy = jest.fn()
  const fakeParent = { postMessage: postMessageSpy } as unknown as Window

  const original = Object.getOwnPropertyDescriptor(window, 'parent')

  Object.defineProperty(window, 'parent', {
    configurable: true,
    get: () => fakeParent
  })

  return {
    postMessageSpy,
    restore: () => {
      if (original !== undefined) {
        Object.defineProperty(window, 'parent', original)
      }
    }
  }
}

// parseEmbedConfig

describe('parseEmbedConfig', () => {
  let parseEmbedConfig: typeof import('../utils')['parseEmbedConfig']

  beforeEach(async () => {
    // Each test gets a fresh module so _targetOrigin is reset to '*'.
    const utils = await freshUtils()
    parseEmbedConfig = utils.parseEmbedConfig
  })

  // --- missing required params ---

  it('returns undefined when component param is missing', () => {
    const result = parseEmbedConfig('?token=abc123')
    expect(result).toBeUndefined()
  })

  it('returns undefined when token param is missing', () => {
    const result = parseEmbedConfig('?component=create-issue')
    expect(result).toBeUndefined()
  })

  it('returns undefined when both component and token are missing', () => {
    const result = parseEmbedConfig('')
    expect(result).toBeUndefined()
  })

  // --- minimal valid config ---

  it('parses a minimal config with only component and token', () => {
    const result = parseEmbedConfig('?component=create-issue&token=tok123')
    expect(result).not.toBeUndefined()
    expect(result?.component).toBe('create-issue')
    expect(result?.token).toBe('tok123')
  })

  it('returns undefined for all optional fields in a minimal config', () => {
    const result = parseEmbedConfig('?component=create-issue&token=tok123')
    expect(result?.project).toBeUndefined()
    expect(result?.issue).toBeUndefined()
    expect(result?.externalUser).toBeUndefined()
    expect(result?.hideFields).toBeUndefined()
    expect(result?.document).toBeUndefined()
    expect(result?.file).toBeUndefined()
    expect(result?.folder).toBeUndefined()
    expect(result?.drive).toBeUndefined()
    expect(result?.thread).toBeUndefined()
    expect(result?.department).toBeUndefined()
    expect(result?.milestone).toBeUndefined()
    expect(result?.space).toBeUndefined()
    expect(result?.mode).toBeUndefined()
  })

  // --- all optional fields ---

  it('parses all optional string fields when provided', () => {
    const search = [
      'component=issue-list',
      'token=mytoken',
      'project=PROJ',
      'issue=PROJ-42',
      'externalUser=auth0|abc123',
      'document=doc-id',
      'file=file-id',
      'folder=folder-id',
      'drive=drive-id',
      'thread=thread-id',
      'department=dept-id',
      'milestone=ms-id',
      'space=space-id',
      'mode=compact'
    ].join('&')

    const result = parseEmbedConfig('?' + search)
    expect(result).not.toBeUndefined()
    expect(result?.component).toBe('issue-list')
    expect(result?.token).toBe('mytoken')
    expect(result?.project).toBe('PROJ')
    expect(result?.issue).toBe('PROJ-42')
    expect(result?.externalUser).toBe('auth0|abc123')
    expect(result?.document).toBe('doc-id')
    expect(result?.file).toBe('file-id')
    expect(result?.folder).toBe('folder-id')
    expect(result?.drive).toBe('drive-id')
    expect(result?.thread).toBe('thread-id')
    expect(result?.department).toBe('dept-id')
    expect(result?.milestone).toBe('ms-id')
    expect(result?.space).toBe('space-id')
    expect(result?.mode).toBe('compact')
  })

  // --- readonly ---

  it('defaults readonly to false when param is absent', () => {
    const result = parseEmbedConfig('?component=issue-list&token=t')
    expect(result?.readonly).toBe(false)
  })

  it('sets readonly to true when param value is "true"', () => {
    const result = parseEmbedConfig('?component=issue-list&token=t&readonly=true')
    expect(result?.readonly).toBe(true)
  })

  it('sets readonly to false when param value is "false"', () => {
    const result = parseEmbedConfig('?component=issue-list&token=t&readonly=false')
    expect(result?.readonly).toBe(false)
  })

  it('sets readonly to false when param value is any string other than "true"', () => {
    const result = parseEmbedConfig('?component=issue-list&token=t&readonly=1')
    expect(result?.readonly).toBe(false)
  })

  // --- hideFields ---

  it('leaves hideFields undefined when param is absent', () => {
    const result = parseEmbedConfig('?component=create-issue&token=t')
    expect(result?.hideFields).toBeUndefined()
  })

  it('leaves hideFields undefined when param is an empty string', () => {
    const result = parseEmbedConfig('?component=create-issue&token=t&hideFields=')
    expect(result?.hideFields).toBeUndefined()
  })

  it('parses a single hideFields value', () => {
    const result = parseEmbedConfig('?component=create-issue&token=t&hideFields=status')
    expect(result?.hideFields).toEqual(['status'])
  })

  it('parses multiple hideFields values separated by commas', () => {
    const result = parseEmbedConfig('?component=create-issue&token=t&hideFields=status,priority,assignee')
    expect(result?.hideFields).toEqual(['status', 'priority', 'assignee'])
  })

  it('trims whitespace around comma-separated hideFields values', () => {
    // URLSearchParams decodes %2C as comma and + as space, so encode accordingly.
    const result = parseEmbedConfig('?component=create-issue&token=t&hideFields=status%2C+priority%2C+duedate')
    expect(result?.hideFields).toEqual(['status', 'priority', 'duedate'])
  })

  it('expands wildcard "*" in hideFields to ALL_HIDEABLE_FIELDS', () => {
    const result = parseEmbedConfig('?component=create-issue&token=t&hideFields=*')
    expect(result?.hideFields).toEqual(ALL_HIDEABLE_FIELDS)
    expect(result?.hideFields).toHaveLength(ALL_HIDEABLE_FIELDS.length)
  })

  it('expands wildcard "*" even when mixed with other values in the list', () => {
    const result = parseEmbedConfig('?component=create-issue&token=t&hideFields=status%2C*')
    expect(result?.hideFields).toEqual(ALL_HIDEABLE_FIELDS)
  })

  it('returns an independent copy of ALL_HIDEABLE_FIELDS for wildcard expansion', () => {
    const result = parseEmbedConfig('?component=create-issue&token=t&hideFields=*')
    result?.hideFields?.push('extra' as any)
    // The original constant must not be mutated.
    expect(ALL_HIDEABLE_FIELDS).not.toContain('extra')
  })

  // --- parentOrigin side-effect ---

  it('sets _targetOrigin to parentOrigin value so subsequent postMessage calls use it', async () => {
    const utils = await freshUtils()
    const { postMessageSpy, restore } = mockInsideIframe()
    try {
      utils.parseEmbedConfig('?component=create-issue&token=t&parentOrigin=https://example.com')
      utils.notifyReady()
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'huly-embed-ready' }),
        'https://example.com'
      )
    } finally {
      restore()
    }
  })

  it('keeps _targetOrigin as "*" when parentOrigin param is absent', async () => {
    const utils = await freshUtils()
    const { postMessageSpy, restore } = mockInsideIframe()
    try {
      utils.parseEmbedConfig('?component=create-issue&token=t')
      utils.notifyReady()
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'huly-embed-ready' }),
        '*'
      )
    } finally {
      restore()
    }
  })

  it('keeps _targetOrigin as "*" when parentOrigin param is an empty string', async () => {
    const utils = await freshUtils()
    const { postMessageSpy, restore } = mockInsideIframe()
    try {
      utils.parseEmbedConfig('?component=create-issue&token=t&parentOrigin=')
      utils.notifyReady()
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'huly-embed-ready' }),
        '*'
      )
    } finally {
      restore()
    }
  })

  // --- search string with / without leading '?' ---

  it('handles a search string with a leading "?" correctly', () => {
    const result = parseEmbedConfig('?component=kanban&token=tok')
    expect(result?.component).toBe('kanban')
    expect(result?.token).toBe('tok')
  })

  it('handles a search string without a leading "?" correctly', () => {
    const result = parseEmbedConfig('component=kanban&token=tok')
    expect(result?.component).toBe('kanban')
    expect(result?.token).toBe('tok')
  })
})

// postToParent

describe('postToParent', () => {
  let postToParent: typeof import('../utils')['postToParent']

  beforeEach(async () => {
    const utils = await freshUtils()
    postToParent = utils.postToParent
  })

  it('does nothing when window.parent === window (not inside an iframe)', () => {
    // In jsdom window.parent === window by default — postMessage on the top-level
    // window should never be called.
    const spy = jest.spyOn(window, 'postMessage').mockImplementation(() => {})
    postToParent('some-event', { foo: 'bar' })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('calls window.parent.postMessage when inside an iframe', () => {
    const { postMessageSpy, restore } = mockInsideIframe()
    try {
      postToParent('my-type', { key: 'value' })
      expect(postMessageSpy).toHaveBeenCalledTimes(1)
      expect(postMessageSpy).toHaveBeenCalledWith({ type: 'my-type', key: 'value' }, '*')
    } finally {
      restore()
    }
  })

  it('spreads payload properties into the message object alongside type', () => {
    const { postMessageSpy, restore } = mockInsideIframe()
    try {
      postToParent('evt', { a: 1, b: 2 })
      expect(postMessageSpy).toHaveBeenCalledWith({ type: 'evt', a: 1, b: 2 }, '*')
    } finally {
      restore()
    }
  })

  it('sends only the type property when no payload is provided', () => {
    const { postMessageSpy, restore } = mockInsideIframe()
    try {
      postToParent('evt')
      expect(postMessageSpy).toHaveBeenCalledWith({ type: 'evt' }, '*')
    } finally {
      restore()
    }
  })
})

// notify* convenience functions

describe('notify functions', () => {
  let utils: Awaited<ReturnType<typeof freshUtils>>
  let postMessageSpy: jest.Mock
  let restore: () => void

  beforeEach(async () => {
    utils = await freshUtils()
    ;({ postMessageSpy, restore } = mockInsideIframe())
  })

  afterEach(() => {
    restore()
  })

  it('notifyReady sends huly-embed-ready with no extra payload', () => {
    utils.notifyReady()
    expect(postMessageSpy).toHaveBeenCalledWith({ type: 'huly-embed-ready' }, '*')
  })

  it('notifyResize sends huly-embed-resize with the height payload', () => {
    utils.notifyResize(420)
    expect(postMessageSpy).toHaveBeenCalledWith({ type: 'huly-embed-resize', height: 420 }, '*')
  })

  it('notifyError sends huly-embed-error with the reason payload', () => {
    utils.notifyError('something went wrong')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-error', reason: 'something went wrong' },
      '*'
    )
  })

  it('notifyIssueCreated sends huly-embed-issue-created with issueId and identifier', () => {
    utils.notifyIssueCreated('id-abc', 'PROJ-42')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-created', issueId: 'id-abc', identifier: 'PROJ-42' },
      '*'
    )
  })

  it('notifyIssueCreateCancelled sends huly-embed-issue-created with cancelled: true', () => {
    utils.notifyIssueCreateCancelled()
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-created', cancelled: true },
      '*'
    )
  })

  it('notifyIssueSelected sends huly-embed-issue-selected with the identifier', () => {
    utils.notifyIssueSelected('PROJ-7')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-selected', identifier: 'PROJ-7' },
      '*'
    )
  })

  it('notifyIssueClosed sends huly-embed-issue-closed with identifier when provided', () => {
    utils.notifyIssueClosed('PROJ-7')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-closed', identifier: 'PROJ-7' },
      '*'
    )
  })

  it('notifyIssueClosed sends huly-embed-issue-closed with undefined identifier when omitted', () => {
    utils.notifyIssueClosed()
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-closed', identifier: undefined },
      '*'
    )
  })

  it('notifyDocumentCreated sends huly-embed-document-created with the documentId', () => {
    utils.notifyDocumentCreated('doc-xyz')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-document-created', documentId: 'doc-xyz' },
      '*'
    )
  })

  it('notifyDocumentSelected sends huly-embed-document-selected with the documentId', () => {
    utils.notifyDocumentSelected('doc-xyz')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-document-selected', documentId: 'doc-xyz' },
      '*'
    )
  })

  it('notifyFileSelected sends huly-embed-file-selected with the fileId', () => {
    utils.notifyFileSelected('file-abc')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-file-selected', fileId: 'file-abc' },
      '*'
    )
  })
})

// createResizeNotifier

describe('createResizeNotifier', () => {
  let createResizeNotifier: typeof import('../utils')['createResizeNotifier']
  let postMessageSpy: jest.Mock
  let restore: () => void
  let resizeObserverObserveSpy: jest.Mock
  let resizeObserverDisconnectSpy: jest.Mock
  let mutationObserverObserveSpy: jest.Mock
  let mutationObserverDisconnectSpy: jest.Mock
  let resizeCallback: Function
  let mutationCallback: Function
  let originalResizeObserver: typeof ResizeObserver
  let originalMutationObserver: typeof MutationObserver
  let originalRAF: typeof requestAnimationFrame

  beforeEach(async () => {
    const utils = await freshUtils()
    createResizeNotifier = utils.createResizeNotifier
    ;({ postMessageSpy, restore } = mockInsideIframe())

    resizeObserverObserveSpy = jest.fn()
    resizeObserverDisconnectSpy = jest.fn()
    mutationObserverObserveSpy = jest.fn()
    mutationObserverDisconnectSpy = jest.fn()
    originalResizeObserver = window.ResizeObserver
    originalMutationObserver = window.MutationObserver
    originalRAF = window.requestAnimationFrame

    // Stub ResizeObserver (jsdom does not implement it)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).ResizeObserver = jest.fn().mockImplementation((callback: Function) => {
      resizeCallback = callback
      return {
        observe: resizeObserverObserveSpy,
        disconnect: resizeObserverDisconnectSpy
      }
    })

    // Stub MutationObserver
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).MutationObserver = jest.fn().mockImplementation((callback: Function) => {
      mutationCallback = callback
      return {
        observe: mutationObserverObserveSpy,
        disconnect: mutationObserverDisconnectSpy
      }
    })

    // Execute requestAnimationFrame callbacks synchronously
    window.requestAnimationFrame = (cb: FrameRequestCallback) => { cb(0); return 0 }
  })

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver
    window.MutationObserver = originalMutationObserver
    window.requestAnimationFrame = originalRAF
    restore()
  })

  it('creates a ResizeObserver observing both the element and document.documentElement', () => {
    const el = document.createElement('div')
    createResizeNotifier(el)
    expect(window.ResizeObserver).toHaveBeenCalledTimes(1)
    expect(resizeObserverObserveSpy).toHaveBeenCalledWith(el)
    expect(resizeObserverObserveSpy).toHaveBeenCalledWith(document.documentElement)
  })

  it('creates a MutationObserver on the element with childList + subtree', () => {
    const el = document.createElement('div')
    createResizeNotifier(el)
    expect(window.MutationObserver).toHaveBeenCalledTimes(1)
    expect(mutationObserverObserveSpy).toHaveBeenCalledWith(el, { childList: true, subtree: true })
  })

  it('returns an object with a disconnect method', () => {
    const el = document.createElement('div')
    const observer = createResizeNotifier(el)
    expect(observer).toBeDefined()
    expect(typeof observer.disconnect).toBe('function')
  })

  it('disconnect() cleans up both ResizeObserver and MutationObserver', () => {
    const el = document.createElement('div')
    const observer = createResizeNotifier(el)
    observer.disconnect()
    expect(resizeObserverDisconnectSpy).toHaveBeenCalledTimes(1)
    expect(mutationObserverDisconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('uses scrollHeight/offsetHeight instead of contentRect for height measurement', () => {
    const el = document.createElement('div')
    // Set scrollHeight and offsetHeight to simulate real element sizing
    Object.defineProperty(el, 'scrollHeight', { value: 450, configurable: true })
    Object.defineProperty(el, 'offsetHeight', { value: 400, configurable: true })
    // documentElement.scrollHeight defaults to 0 in jsdom

    createResizeNotifier(el)
    // Initial rAF fires with max(scrollHeight=450, offsetHeight=400, docEl.scrollHeight=0) = 450
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-resize', height: 450 },
      '*'
    )
  })

  it('reports the larger of element scrollHeight and documentElement scrollHeight', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { value: 100, configurable: true })
    Object.defineProperty(el, 'offsetHeight', { value: 100, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 800, configurable: true })

    createResizeNotifier(el)
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-resize', height: 800 },
      '*'
    )

    // Restore
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 0, configurable: true })
  })

  it('deduplicates — does not fire if height has not changed', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { value: 300, configurable: true })
    Object.defineProperty(el, 'offsetHeight', { value: 300, configurable: true })

    createResizeNotifier(el)
    postMessageSpy.mockClear()

    // Trigger ResizeObserver callback — height is still 300, should not fire
    resizeCallback()
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('fires again when height changes between callbacks', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { value: 300, configurable: true, writable: true })
    Object.defineProperty(el, 'offsetHeight', { value: 300, configurable: true, writable: true })

    createResizeNotifier(el)
    postMessageSpy.mockClear()

    // Simulate content growing
    Object.defineProperty(el, 'scrollHeight', { value: 500, configurable: true, writable: true })
    Object.defineProperty(el, 'offsetHeight', { value: 500, configurable: true, writable: true })
    resizeCallback()
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-resize', height: 500 },
      '*'
    )
  })

  it('MutationObserver callback also triggers height measurement', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { value: 200, configurable: true, writable: true })
    Object.defineProperty(el, 'offsetHeight', { value: 200, configurable: true, writable: true })

    createResizeNotifier(el)
    postMessageSpy.mockClear()

    // Simulate DOM mutation causing content to grow
    Object.defineProperty(el, 'scrollHeight', { value: 350, configurable: true, writable: true })
    mutationCallback()
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-resize', height: 350 },
      '*'
    )
  })
})

// createClickInterceptor

describe('createClickInterceptor', () => {
  let createClickInterceptor: typeof import('../utils')['createClickInterceptor']
  let postMessageSpy: jest.Mock
  let restore: () => void
  let container: HTMLElement

  beforeEach(async () => {
    const utils = await freshUtils()
    createClickInterceptor = utils.createClickInterceptor
    ;({ postMessageSpy, restore } = mockInsideIframe())

    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    restore()
  })

  // Helper: append an anchor, dispatch a click on it, then remove it.
  function clickAnchor (href: string): MouseEvent {
    const anchor = document.createElement('a')
    anchor.setAttribute('href', href)
    anchor.textContent = 'link'
    container.appendChild(anchor)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    anchor.dispatchEvent(event)
    container.removeChild(anchor)
    return event
  }

  // Helper: dispatch a click on a <span> child of an anchor (exercises closest() traversal).
  function clickInsideAnchor (href: string): void {
    const anchor = document.createElement('a')
    anchor.setAttribute('href', href)
    const span = document.createElement('span')
    anchor.appendChild(span)
    container.appendChild(anchor)
    span.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    container.removeChild(anchor)
  }

  // --- interception cases ---

  it('fires notifyIssueSelected for a simple tracker path /tracker/PROJ-1', () => {
    createClickInterceptor(container)
    clickAnchor('/tracker/PROJ-1')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-selected', identifier: 'PROJ-1' },
      '*'
    )
  })

  it('fires notifyIssueSelected for a path ending with a trailing slash /tracker/ABC-123/', () => {
    createClickInterceptor(container)
    clickAnchor('/tracker/ABC-123/')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-selected', identifier: 'ABC-123' },
      '*'
    )
  })

  it('fires notifyIssueSelected for a path followed by a query string /tracker/XY-99?foo=bar', () => {
    createClickInterceptor(container)
    clickAnchor('/tracker/XY-99?foo=bar')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-selected', identifier: 'XY-99' },
      '*'
    )
  })

  it('fires notifyIssueSelected for a double-slash embed path /embed//tracker/SUPPORT-42', () => {
    createClickInterceptor(container)
    clickAnchor('/embed//tracker/SUPPORT-42')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-selected', identifier: 'SUPPORT-42' },
      '*'
    )
  })

  it('fires notifyIssueSelected when the click target is a descendant of the anchor', () => {
    createClickInterceptor(container)
    clickInsideAnchor('/tracker/PROJ-7')
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'huly-embed-issue-selected', identifier: 'PROJ-7' },
      '*'
    )
  })

  // --- non-interception cases ---

  it('does NOT fire for an anchor with a plain URL that has no issue identifier', () => {
    createClickInterceptor(container)
    clickAnchor('https://example.com/page')
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('does NOT fire for an anchor with a relative path that has no issue identifier', () => {
    createClickInterceptor(container)
    clickAnchor('/some/regular/path')
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('does NOT fire for an anchor without an href attribute', () => {
    createClickInterceptor(container)
    const anchor = document.createElement('a')
    anchor.textContent = 'no href'
    container.appendChild(anchor)
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    container.removeChild(anchor)
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('does NOT fire for a click on a non-anchor element', () => {
    createClickInterceptor(container)
    const btn = document.createElement('button')
    container.appendChild(btn)
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    container.removeChild(btn)
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('does NOT match a lowercase path segment that does not satisfy the identifier pattern', () => {
    createClickInterceptor(container)
    // Identifiers must start with an uppercase letter.
    clickAnchor('/tracker/proj-1')
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  // --- preventDefault / stopPropagation ---

  it('calls both preventDefault and stopPropagation on an intercepted click', () => {
    createClickInterceptor(container)
    const anchor = document.createElement('a')
    anchor.setAttribute('href', '/tracker/PROJ-1')
    container.appendChild(anchor)

    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation')

    anchor.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(stopPropagationSpy).toHaveBeenCalled()

    container.removeChild(anchor)
  })

  it('does NOT call preventDefault for a non-matching click', () => {
    createClickInterceptor(container)
    const event = clickAnchor('/some/plain/path')
    // If preventDefault were called the defaultPrevented flag would be set.
    expect(event.defaultPrevented).toBe(false)
  })

  // --- cleanup function ---

  it('cleanup function removes the listener so subsequent clicks no longer fire', () => {
    const cleanup = createClickInterceptor(container)

    // Confirm interception works before cleanup.
    clickAnchor('/tracker/PROJ-1')
    expect(postMessageSpy).toHaveBeenCalledTimes(1)

    cleanup()
    postMessageSpy.mockClear()

    // After cleanup, the same click must not fire.
    clickAnchor('/tracker/PROJ-1')
    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('two interceptors on the same container each fire independently', () => {
    createClickInterceptor(container)
    createClickInterceptor(container)
    clickAnchor('/tracker/PROJ-1')
    expect(postMessageSpy).toHaveBeenCalledTimes(2)
  })

  it('cleaning up one of two interceptors leaves the other active', () => {
    const cleanup1 = createClickInterceptor(container)
    createClickInterceptor(container)

    cleanup1()
    postMessageSpy.mockClear()

    // The second interceptor should still fire exactly once.
    clickAnchor('/tracker/PROJ-1')
    expect(postMessageSpy).toHaveBeenCalledTimes(1)
  })
})
