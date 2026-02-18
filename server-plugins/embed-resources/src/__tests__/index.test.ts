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

import type { MeasureContext, WorkspaceIds, WorkspaceUuid } from '@hcengineering/core'
import type { EmbedComponentType } from '@hcengineering/embed'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports from the module under test
// ---------------------------------------------------------------------------

jest.mock('@hcengineering/core', () => ({
  concatLink: jest.fn((base: string, path: string) => {
    const cleanBase = base.replace(/\/$/, '')
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${cleanBase}${cleanPath}`
  })
}))

// Mock TokenError as a real Error subclass so instanceof checks work
class MockTokenError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'TokenError'
  }
}

jest.mock('@hcengineering/embed', () => ({
  embedAccount: 'e7b96120-516f-49cd-941e-f4a5d2e49c9c',
  embedId: 'embed'
}))

jest.mock('@hcengineering/platform', () => ({
  getMetadata: jest.fn()
}))

jest.mock('@hcengineering/server-core', () => ({
  __esModule: true,
  default: {
    metadata: {
      FrontUrl: 'server-core.metadata.FrontUrl'
    }
  }
}))

jest.mock('@hcengineering/server-token', () => ({
  generateToken: jest.fn(),
  decodeTokenVerbose: jest.fn(),
  TokenError: MockTokenError
}))

// ---------------------------------------------------------------------------
// Import mocked modules and the module under test
// ---------------------------------------------------------------------------

import { concatLink } from '@hcengineering/core'
import { getMetadata } from '@hcengineering/platform'
import { generateToken, decodeTokenVerbose, TokenError } from '@hcengineering/server-token'
import serverCore from '@hcengineering/server-core'

import { generateEmbedUrl, validateEmbedToken, isEmbedToken, type EmbedTokenData } from '../index'

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockConcatLink = concatLink as jest.MockedFunction<typeof concatLink>
const mockGetMetadata = getMetadata as jest.MockedFunction<typeof getMetadata>
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>
const mockDecodeTokenVerbose = decodeTokenVerbose as jest.MockedFunction<typeof decodeTokenVerbose>

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const TEST_WORKSPACE: WorkspaceIds = {
  uuid: '11111111-1111-1111-1111-111111111111' as WorkspaceUuid,
  url: 'test-workspace',
  dataId: undefined
}

const mockMeasureContext: MeasureContext = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  measure: jest.fn(),
  newChild: jest.fn(),
  end: jest.fn(),
  with: jest.fn(),
  withSync: jest.fn(),
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  contextData: {}
} as unknown as MeasureContext

// ---------------------------------------------------------------------------
// Tests: isEmbedToken
// ---------------------------------------------------------------------------

describe('isEmbedToken', () => {
  it('returns true for extra with embed === "true"', () => {
    expect(isEmbedToken({ embed: 'true' })).toBe(true)
  })

  it('returns false for extra with embed === "false"', () => {
    expect(isEmbedToken({ embed: 'false' })).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isEmbedToken(undefined)).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isEmbedToken({})).toBe(false)
  })

  it('returns false when embed is a boolean true (not the string "true")', () => {
    expect(isEmbedToken({ embed: true })).toBe(false)
  })

  it('returns false when embed key is absent but other keys are present', () => {
    expect(isEmbedToken({ component: 'create-issue' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: generateEmbedUrl
// ---------------------------------------------------------------------------

describe('generateEmbedUrl', () => {
  const FAKE_TOKEN = 'fake.jwt.token'
  const FRONT_URL = 'https://huly.example.com'

  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateToken.mockReturnValue(FAKE_TOKEN)
    // Default: getMetadata returns FrontUrl
    mockGetMetadata.mockReturnValue(FRONT_URL)
    // Default: concatLink joins base + path
    mockConcatLink.mockImplementation((base: string, path: string) => {
      const cleanBase = (base as string).replace(/\/$/, '')
      const cleanPath = (path as string).startsWith('/') ? path : `/${path}`
      return `${cleanBase}${cleanPath}`
    })
  })

  it('generates a URL with the component and token query params', () => {
    const url = generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    expect(url).toContain('component=create-issue')
    expect(url).toContain(`token=${FAKE_TOKEN}`)
  })

  it('includes project param when provided', () => {
    const url = generateEmbedUrl(TEST_WORKSPACE, 'issue-list', { project: 'SUPPORT' })

    expect(url).toContain('project=SUPPORT')
  })

  it('includes issue param when provided', () => {
    const url = generateEmbedUrl(TEST_WORKSPACE, 'issue-detail', { issue: 'SUPPORT-42' })

    expect(url).toContain('issue=SUPPORT-42')
  })

  it('includes externalUser param when provided', () => {
    const url = generateEmbedUrl(TEST_WORKSPACE, 'create-issue', { externalUser: 'auth0|abc123' })

    expect(url).toContain('externalUser=auth0%7Cabc123')
  })

  it('omits project, issue, and externalUser params when not provided', () => {
    const url = generateEmbedUrl(TEST_WORKSPACE, 'kanban')

    expect(url).not.toContain('project=')
    expect(url).not.toContain('issue=')
    expect(url).not.toContain('externalUser=')
  })

  it('uses brandedFront override when provided', () => {
    const brandedUrl = 'https://branded.example.com'
    generateEmbedUrl(TEST_WORKSPACE, 'create-issue', { brandedFront: brandedUrl })

    expect(mockConcatLink).toHaveBeenCalledWith(brandedUrl, expect.any(String))
    // getMetadata should NOT be called when brandedFront is provided
    expect(mockGetMetadata).not.toHaveBeenCalled()
  })

  it('falls back to FrontUrl from metadata when brandedFront is not provided', () => {
    generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    expect(mockGetMetadata).toHaveBeenCalledWith(serverCore.metadata.FrontUrl)
    expect(mockConcatLink).toHaveBeenCalledWith(FRONT_URL, expect.any(String))
  })

  it('falls back to empty string when neither brandedFront nor FrontUrl metadata is available', () => {
    mockGetMetadata.mockReturnValue(undefined)

    generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    expect(mockConcatLink).toHaveBeenCalledWith('', expect.any(String))
  })

  it('uses the default 24-hour expiry when expiresInSeconds is not specified', () => {
    const now = Math.floor(Date.now() / 1000)
    generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    expect(mockGenerateToken).toHaveBeenCalledTimes(1)
    const callArgs = mockGenerateToken.mock.calls[0]
    // 5th arg (index 4) is the options object with nbf/exp
    const tokenOptions = callArgs[4] as { nbf: number, exp: number }
    expect(tokenOptions.exp - tokenOptions.nbf).toBe(86400)
    // Allow 2-second window for test execution time
    expect(tokenOptions.nbf).toBeGreaterThanOrEqual(now - 1)
    expect(tokenOptions.nbf).toBeLessThanOrEqual(now + 1)
  })

  it('uses custom expiry when expiresInSeconds is specified', () => {
    const now = Math.floor(Date.now() / 1000)
    generateEmbedUrl(TEST_WORKSPACE, 'create-issue', { expiresInSeconds: 3600 })

    const callArgs = mockGenerateToken.mock.calls[0]
    const tokenOptions = callArgs[4] as { nbf: number, exp: number }
    expect(tokenOptions.exp - tokenOptions.nbf).toBe(3600)
    expect(tokenOptions.nbf).toBeGreaterThanOrEqual(now - 1)
    expect(tokenOptions.nbf).toBeLessThanOrEqual(now + 1)
  })

  it('passes embed:true, component, and externalUser in token extra', () => {
    generateEmbedUrl(TEST_WORKSPACE, 'issue-list', { externalUser: 'user-99' })

    const callArgs = mockGenerateToken.mock.calls[0]
    const extra = callArgs[2] as Record<string, string>
    expect(extra.embed).toBe('true')
    expect(extra.component).toBe('issue-list')
    expect(extra.externalUser).toBe('user-99')
  })

  it('does not include externalUser in token extra when not provided', () => {
    generateEmbedUrl(TEST_WORKSPACE, 'kanban')

    const callArgs = mockGenerateToken.mock.calls[0]
    const extra = callArgs[2] as Record<string, string>
    expect(extra).not.toHaveProperty('externalUser')
  })

  it('passes the embedAccount UUID as the first arg to generateToken', () => {
    generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    const callArgs = mockGenerateToken.mock.calls[0]
    expect(callArgs[0]).toBe('e7b96120-516f-49cd-941e-f4a5d2e49c9c')
  })

  it('passes workspace.uuid as the second arg to generateToken', () => {
    generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    const callArgs = mockGenerateToken.mock.calls[0]
    expect(callArgs[1]).toBe(TEST_WORKSPACE.uuid)
  })

  it('builds the embed path using the embedId', () => {
    generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    expect(mockConcatLink).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringMatching(/^embed\?/)
    )
  })

  it('returns the result of concatLink', () => {
    const expectedUrl = 'https://huly.example.com/embed?component=create-issue&token=fake.jwt.token'
    mockConcatLink.mockReturnValue(expectedUrl)

    const url = generateEmbedUrl(TEST_WORKSPACE, 'create-issue')

    expect(url).toBe(expectedUrl)
  })
})

// ---------------------------------------------------------------------------
// Tests: validateEmbedToken
// ---------------------------------------------------------------------------

describe('validateEmbedToken', () => {
  const VALID_ACCOUNT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const VALID_WORKSPACE = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as WorkspaceUuid
  const FAKE_TOKEN = 'some.jwt.value'

  function nowSeconds (): number {
    return Math.floor(Date.now() / 1000)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully validates a valid embed token and returns EmbedTokenData', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true', component: 'create-issue', externalUser: 'user-42' },
      exp: now + 3600,
      nbf: now - 60
    })

    const result = validateEmbedToken(mockMeasureContext, FAKE_TOKEN)

    expect(result).toEqual<EmbedTokenData>({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      component: 'create-issue' as EmbedComponentType,
      externalUser: 'user-42'
    })
  })

  it('throws TokenError when embed extra field is not "true"', () => {
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'false' }
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow(TokenError)
    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow('Not a valid embed token')
  })

  it('throws TokenError when embed extra field is absent', () => {
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { component: 'issue-list' }
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow(TokenError)
  })

  it('throws TokenError when extra is undefined', () => {
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow(TokenError)
    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow('Not a valid embed token')
  })

  it('throws TokenError when token is expired', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true' },
      exp: now - 1 // expired 1 second ago
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow(TokenError)
    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow('Embed token has expired')
  })

  it('does not throw when token has no exp field (no expiry)', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true' },
      nbf: now - 60
      // no exp
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).not.toThrow()
  })

  it('throws TokenError when nbf is in the future (token not yet valid)', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true' },
      nbf: now + 60 // valid 60 seconds from now
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow(TokenError)
    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow('Embed token is not yet valid')
  })

  it('does not throw when token has no nbf field', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true' },
      exp: now + 3600
      // no nbf
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).not.toThrow()
  })

  it('extracts component from extra when present', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true', component: 'kanban' },
      exp: now + 3600,
      nbf: now - 10
    })

    const result = validateEmbedToken(mockMeasureContext, FAKE_TOKEN)

    expect(result.component).toBe('kanban')
  })

  it('returns undefined component when extra has no component field', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true' },
      exp: now + 3600
    })

    const result = validateEmbedToken(mockMeasureContext, FAKE_TOKEN)

    expect(result.component).toBeUndefined()
  })

  it('extracts externalUser from extra when present', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true', externalUser: 'auth0|xyz789' },
      exp: now + 3600
    })

    const result = validateEmbedToken(mockMeasureContext, FAKE_TOKEN)

    expect(result.externalUser).toBe('auth0|xyz789')
  })

  it('returns undefined externalUser when extra has no externalUser field', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true' },
      exp: now + 3600
    })

    const result = validateEmbedToken(mockMeasureContext, FAKE_TOKEN)

    expect(result.externalUser).toBeUndefined()
  })

  it('passes the provided MeasureContext to decodeTokenVerbose', () => {
    const now = nowSeconds()
    mockDecodeTokenVerbose.mockReturnValue({
      account: VALID_ACCOUNT,
      workspace: VALID_WORKSPACE,
      extra: { embed: 'true' },
      exp: now + 3600
    })

    validateEmbedToken(mockMeasureContext, FAKE_TOKEN)

    expect(mockDecodeTokenVerbose).toHaveBeenCalledWith(mockMeasureContext, FAKE_TOKEN)
  })

  it('propagates TokenError thrown by decodeTokenVerbose (e.g. invalid signature)', () => {
    mockDecodeTokenVerbose.mockImplementation(() => {
      throw new TokenError('Signature verification failed')
    })

    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow(TokenError)
    expect(() => validateEmbedToken(mockMeasureContext, FAKE_TOKEN)).toThrow('Signature verification failed')
  })
})

// ---------------------------------------------------------------------------
// Tests: default export (Resources factory)
// ---------------------------------------------------------------------------

describe('default export', () => {
  it('returns an empty Resources object when called', async () => {
    // Dynamic import to access the default export
    const mod = await import('../index')
    const resources = await mod.default()
    expect(resources).toEqual({})
  })
})
