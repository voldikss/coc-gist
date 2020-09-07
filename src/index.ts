import {
  commands,
  ExtensionContext,
  listManager,
  workspace
} from 'coc.nvim'
import Gists from './lists/gists'
import { GistService } from './gist'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions } = context
  const { nvim } = workspace

  const gist = new GistService()

  subscriptions.push(
    commands.registerCommand(
      'gist.create',
      async () => {
        // get current buffer content and post
        workspace.showMessage('No implemented yet.', 'warning')
      }
    )
  )

  subscriptions.push(
    listManager.registerList(
      new Gists(nvim, gist)
    )
  )
}
