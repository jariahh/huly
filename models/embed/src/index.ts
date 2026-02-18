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

import { type Class, type Doc, type Domain, type IndexingConfiguration, type Ref } from '@hcengineering/core'
import { type EmbedComponentType, type EmbedLink, type EmbedRestrictions } from '@hcengineering/embed'
import { type Builder, Model } from '@hcengineering/model'
import core, { TDoc } from '@hcengineering/model-core'
import embed from './plugin'

export const EMBED_DOMAIN = 'embed' as Domain

@Model(embed.class.EmbedLink, core.class.Doc, EMBED_DOMAIN)
export class TEmbedLink extends TDoc implements EmbedLink {
  attachedTo!: Ref<Doc>
  url!: string
  component!: EmbedComponentType
  restrictions!: EmbedRestrictions
  revokable!: boolean
  expiresOn?: number
}

export function createModel (builder: Builder): void {
  builder.createModel(TEmbedLink)

  builder.createDoc(core.class.DomainIndexConfiguration, core.space.Model, {
    domain: EMBED_DOMAIN,
    disabled: [
      { createdOn: -1 },
      { space: 1 },
      { modifiedBy: 1 },
      { createdBy: 1 },
      { attachedToClass: 1 },
      { createdOn: -1 }
    ]
  })

  builder.mixin<Class<EmbedLink>, IndexingConfiguration<EmbedLink>>(
    embed.class.EmbedLink,
    core.class.Class,
    core.mixin.IndexConfiguration,
    {
      searchDisabled: true,
      indexes: []
    }
  )
}

export { embedId } from '@hcengineering/embed'
export { default } from './plugin'
