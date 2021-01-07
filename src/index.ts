import {
  commands,
  ExtensionContext,
  listManager,
  window,
  workspace
} from 'coc.nvim'
import Gists from './lists/gists'
import { Gist } from './gist'
import { fsMkdir, fsStat } from './util/fs'
import DB from './util/db'
import { GitHubOAuthService } from './github.oauth'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const stat = await fsStat(storagePath)
  if (!(stat?.isDirectory())) {
    await fsMkdir(storagePath)
  }

  const db = new DB(storagePath)
  const token = await db.fetch('token')
  if (!token) {
    const oauth = new GitHubOAuthService(db)
    const ifgen = await window.showPrompt('A user token is required for this extension, generate one?')
    if (ifgen) await oauth.start()
    return
  }

  const gist = new Gist(token)
  const { nvim } = workspace

  subscriptions.push(
    commands.registerCommand(
      'gist.create',
      async () => {
        const filename = await nvim.call('expand', ['%'])
        const content = (await workspace.document).textDocument.getText()
        await gist.create(filename, content)
      }
    )
  )

  subscriptions.push(
    listManager.registerList(
      new Gists(nvim, gist, token)
    )
  )
}
