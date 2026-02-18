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

import {
  type MeasureContext,
  type WorkspaceIds,
  type WorkspaceUuid,
  concatLink
} from '@hcengineering/core'
import {
  type EmbedComponentType,
  type EmbedRestrictions,
  embedAccount,
  embedId
} from '@hcengineering/embed'
import { getMetadata } from '@hcengineering/platform'
import type { Resources } from '@hcengineering/platform'
import serverCore from '@hcengineering/server-core'
import { generateToken, decodeTokenVerbose, TokenError } from '@hcengineering/server-token'

/**
 * Decoded embed token data.
 * @public
 */
export interface EmbedTokenData {
  account: string
  workspace: WorkspaceUuid
  component?: EmbedComponentType
  externalUser?: string
  restrictions?: EmbedRestrictions
}

/**
 * Generate a URL for an embedded component.
 * @public
 */
export function generateEmbedUrl (
  workspace: WorkspaceIds,
  component: EmbedComponentType,
  options: {
    project?: string
    issue?: string
    externalUser?: string
    restrictions?: EmbedRestrictions
    expiresInSeconds?: number
    brandedFront?: string
  } = {}
): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = options.expiresInSeconds !== undefined ? now + options.expiresInSeconds : now + 86400 // 24h default

  const token = generateToken(embedAccount, workspace.uuid, {
    embed: 'true',
    component,
    ...(options.externalUser !== undefined ? { externalUser: options.externalUser } : {})
  }, undefined, {
    nbf: now,
    exp
  })

  const front = options.brandedFront ?? getMetadata(serverCore.metadata.FrontUrl) ?? ''
  const params = new URLSearchParams()
  params.set('component', component)
  params.set('token', token)
  if (options.project !== undefined) params.set('project', options.project)
  if (options.issue !== undefined) params.set('issue', options.issue)
  if (options.externalUser !== undefined) params.set('externalUser', options.externalUser)

  return concatLink(front, `${embedId}?${params.toString()}`)
}

/**
 * Validate and decode an embed token.
 * Checks that the token is a valid embed token (not just any JWT).
 * @public
 */
export function validateEmbedToken (ctx: MeasureContext, token: string): EmbedTokenData {
  const decoded = decodeTokenVerbose(ctx, token)

  // Verify this is an embed token
  if (decoded.extra?.embed !== 'true') {
    throw new TokenError('Not a valid embed token')
  }

  // Check expiration
  if (decoded.exp !== undefined && Math.floor(Date.now() / 1000) > decoded.exp) {
    throw new TokenError('Embed token has expired')
  }

  // Check not-before
  if (decoded.nbf !== undefined && Math.floor(Date.now() / 1000) < decoded.nbf) {
    throw new TokenError('Embed token is not yet valid')
  }

  return {
    account: decoded.account,
    workspace: decoded.workspace,
    component: decoded.extra?.component as EmbedComponentType | undefined,
    externalUser: decoded.extra?.externalUser as string | undefined
  }
}

/**
 * Check if a token is an embed token (non-throwing).
 * @public
 */
export function isEmbedToken (extra: Record<string, any> | undefined): boolean {
  return extra?.embed === 'true'
}

/**
 * Server-side embed resources.
 * @public
 */
export default async (): Promise<Resources> => ({})
