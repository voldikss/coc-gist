import {
  ListAction,
  ListContext,
  ListItem,
  BasicList,
  Neovim,
  workspace,
  fetch,
} from 'coc.nvim'
import { GistService } from '../gist'
import fetchGists from 'fetch-gists'
import colors from 'colors/safe'

interface GistObject {
  url: string
  description: string
  public: true | false
  id?: string
  raw_url: string
  filename: string
}

export default class GistsList extends BasicList {
  public readonly name = 'gist'
  public readonly description = 'gist'
  public readonly defaultAction = 'open'
  public actions: ListAction[] = []

  constructor(protected nvim: Neovim, private gist: GistService) {
    super(nvim)

    this.addAction('delete', async (item: ListItem) => {
      // post 'DELETE' and reload
      workspace.showMessage('No implemented yet.', 'warning')
    })

    this.addAction('open', async (item: ListItem) => {
      const { nvim } = this
      const { filename, raw_url } = item.data
      const statusItem = workspace.createStatusBarItem(0, { progress: true })
      statusItem.text = `Loading ${filename}...`
      statusItem.show()
      nvim.pauseNotification()
      const res = await fetch(raw_url)
      nvim.command('enew', true);
      nvim.call('append', [0, res.split('\n')], true);
      nvim.command(`write ${filename}`, true)
      nvim.resumeNotification()
      statusItem.hide()
    })

    this.addAction(
      'browserOpen',
      async (item: ListItem, _context) => {
        this.nvim.call('coc#util#open_url', item.data.url, true)
      },
      { persist: true, reload: true }
    )
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const statusItem = workspace.createStatusBarItem(0, { progress: true })
    statusItem.text = 'Loading gists...'
    statusItem.show()

    let res: ListItem[] = []
    const accessToken = process.env.COC_GIST_TOKEN
    const result = await fetchGists(accessToken)

    for (const item of result) {
      for (const file of Object.values(item['files'])) {
        const gist: GistObject = {
          url: item['url'],
          description: item['description'],
          public: item['public'],
          id: item['id'],
          raw_url: file['raw_url'],
          filename: file['filename']
        }
        const label = `[${colors.yellow(gist.filename)}] ${colors.gray(gist.description)}`
        res.push({
          label,
          filterText: label,
          data: Object.assign({}, gist)
        })
      }
    }
    statusItem.hide()
    return res
  }
}
