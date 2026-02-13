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

import { getClient as getAccountClient, type WorkspaceLoginInfo } from '@hcengineering/account-client'
import clientPlugin from '@hcengineering/client'
import core, {
  type Account,
  ClientConnectEvent,
  pickPrimarySocialId,
  setCurrentAccount
} from '@hcengineering/core'
import { type EmbedConfig } from '@hcengineering/embed'
import login from '@hcengineering/login'
import { getMetadata, getResource, setMetadata } from '@hcengineering/platform'
import presentation, { setClient } from '@hcengineering/presentation'

/**
 * Minimal platform bootstrap for embedded components.
 * Skips the full workbench UI — only loads what the embedded component needs.
 *
 * Flow:
 * 1. Validate token via accounts API → get workspace info (endpoint, UUID, role)
 * 2. Set platform metadata (token, endpoint, workspace)
 * 3. Create the platform client (WebSocket connection)
 * 4. Set current account context (socialIds, role)
 * 5. Initialize the presentation layer (LiveQuery, pipeline)
 */
export async function bootstrapEmbed (config: EmbedConfig): Promise<void> {
  // 1. Validate token and get workspace info from accounts server
  const accountsUrl = getMetadata(login.metadata.AccountsUrl)
  if (accountsUrl === undefined || accountsUrl === '') {
    throw new Error('Accounts URL not configured')
  }

  const accountClient = getAccountClient(accountsUrl as string, config.token)
  const loginInfo = await accountClient.getLoginInfoByToken()

  if (loginInfo === null || !('workspace' in loginInfo)) {
    throw new Error('Invalid embed token')
  }

  const wsInfo = loginInfo as WorkspaceLoginInfo

  // 2. Set required platform metadata
  setMetadata(presentation.metadata.Token, wsInfo.token)
  setMetadata(presentation.metadata.WorkspaceUuid, wsInfo.workspace)
  setMetadata(presentation.metadata.WorkspaceName, wsInfo.workspaceUrl)
  setMetadata(presentation.metadata.Endpoint, wsInfo.endpoint)

  // 3. Configure client protocol
  setMetadata(clientPlugin.metadata.UseBinaryProtocol, true)
  setMetadata(clientPlugin.metadata.UseProtocolCompression, true)
  setMetadata(clientPlugin.metadata.FilterModel, 'ui')

  // 4. Create platform client
  const endpoint = getMetadata(login.metadata.TransactorOverride) ?? wsInfo.endpoint
  const clientFactory = await getResource(clientPlugin.function.GetClient)
  const newClient = await clientFactory(wsInfo.token, endpoint, {
    onConnect: async (event: ClientConnectEvent, data: any): Promise<void> => {
      if (event === ClientConnectEvent.Connected || event === ClientConnectEvent.Reconnected) {
        setMetadata(presentation.metadata.SessionId, data)
      }
    }
  })

  // 5. Build account context from social IDs
  const socialIds = await accountClient.getSocialIds(true)
  const me: Account = {
    uuid: wsInfo.account,
    role: wsInfo.role,
    primarySocialId: pickPrimarySocialId(socialIds)._id,
    socialIds: socialIds.map((si) => si._id),
    fullSocialIds: socialIds
  }
  setCurrentAccount(me)

  // 6. Initialize presentation layer (LiveQuery, pipeline, getClient())
  await setClient(newClient)
}
