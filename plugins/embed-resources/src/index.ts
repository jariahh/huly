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

import { type Resources } from '@hcengineering/platform'
import EmbedApp from './components/EmbedApp.svelte'
import EmbedCreateIssue from './components/EmbedCreateIssue.svelte'
import EmbedIssueList from './components/EmbedIssueList.svelte'
import EmbedIssueDetail from './components/EmbedIssueDetail.svelte'
import EmbedKanban from './components/EmbedKanban.svelte'
import EmbedComments from './components/EmbedComments.svelte'

export default async (): Promise<Resources> => ({
  component: {
    EmbedApp,
    EmbedCreateIssue,
    EmbedIssueList,
    EmbedIssueDetail,
    EmbedKanban,
    EmbedComments
  }
})
