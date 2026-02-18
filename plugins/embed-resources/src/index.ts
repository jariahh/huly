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
import EmbedMyIssues from './components/EmbedMyIssues.svelte'
import EmbedMilestones from './components/EmbedMilestones.svelte'
import EmbedMilestoneDetail from './components/EmbedMilestoneDetail.svelte'
import EmbedComponents from './components/EmbedComponents.svelte'
import EmbedIssueTemplates from './components/EmbedIssueTemplates.svelte'
import EmbedIssuePreview from './components/EmbedIssuePreview.svelte'
import EmbedTimeReports from './components/EmbedTimeReports.svelte'
import EmbedCreateProject from './components/EmbedCreateProject.svelte'
import EmbedDocument from './components/EmbedDocument.svelte'
import EmbedDocumentList from './components/EmbedDocumentList.svelte'
import EmbedCreateDocument from './components/EmbedCreateDocument.svelte'
import EmbedFileBrowser from './components/EmbedFileBrowser.svelte'
import EmbedFileDetail from './components/EmbedFileDetail.svelte'
import EmbedThread from './components/EmbedThread.svelte'
import EmbedActivity from './components/EmbedActivity.svelte'
import EmbedCalendar from './components/EmbedCalendar.svelte'
import EmbedBoard from './components/EmbedBoard.svelte'
import EmbedDepartmentStaff from './components/EmbedDepartmentStaff.svelte'
import EmbedToDos from './components/EmbedToDos.svelte'
import EmbedMyLeads from './components/EmbedMyLeads.svelte'
import EmbedApplications from './components/EmbedApplications.svelte'

export default async (): Promise<Resources> => ({
  component: {
    EmbedApp,
    EmbedCreateIssue,
    EmbedIssueList,
    EmbedIssueDetail,
    EmbedKanban,
    EmbedComments,
    EmbedMyIssues,
    EmbedMilestones,
    EmbedMilestoneDetail,
    EmbedComponents,
    EmbedIssueTemplates,
    EmbedIssuePreview,
    EmbedTimeReports,
    EmbedCreateProject,
    EmbedDocument,
    EmbedDocumentList,
    EmbedCreateDocument,
    EmbedFileBrowser,
    EmbedFileDetail,
    EmbedThread,
    EmbedActivity,
    EmbedCalendar,
    EmbedBoard,
    EmbedDepartmentStaff,
    EmbedToDos,
    EmbedMyLeads,
    EmbedApplications
  }
})
