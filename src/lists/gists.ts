import {
  ListAction,
  ListItem,
  BasicList,
  Neovim,
  workspace,
  window,
  Location,
  Range,
  Position,
  ListContext,
} from 'coc.nvim'
import { Gist } from '../gist'
import colors from 'colors/safe'
import { fsCreateTmpfile, fsWriteFile } from '../util/fs'

interface GistsListFile {
  id: string
  url: string      // for insert/open
  html_url: string // for browserOpen
  public: boolean
  filename: string
  description: string
}

export default class GistsList extends BasicList {
  public readonly name = 'gist'
  public readonly description = 'gists list'
  public readonly defaultAction = 'browserOpen'
  public actions: ListAction[] = []

  constructor(protected nvim: Neovim, private gist: Gist, private token: string) {
    super(nvim)

    this.addAction('open', async (item: ListItem) => {
      const { filename, url } = item.data as GistsListFile
      const content = await gist.get(url)
      const filepath = await fsCreateTmpfile(filename)
      await fsWriteFile(filepath, content)
      setTimeout(async () => {
        await nvim.command(`edit ${filepath}`)
      }, 500)
    })

    this.addAction('preview', async (item: ListItem, context: ListContext) => {
      const { filename, url } = item.data as GistsListFile
      const content = await gist.get(url)
      const filepath = await fsCreateTmpfile(filename)
      await fsWriteFile(filepath, content)
      await this.previewLocation(
        Location.create(filepath, Range.create(
          Position.create(0, 0),
          Position.create(0, 0)
        )),
        context
      )
    })

    this.addAction('append', async (item: ListItem) => {
      const { url } = item.data as GistsListFile
      const content = await gist.get(url)
      setTimeout(async () => {
        const pos = await window.getCursorPosition()
        nvim.call('append', [pos.line, content.split('\n')], true);
      }, 500)
    })

    this.addAction('delete', async (item: ListItem) => {
      const data = item.data as GistsListFile
      await gist.delete(data.id)
    }, { persist: true, reload: true })

    this.addAction('browserOpen', async (item: ListItem) => {
      const data = item.data as GistsListFile
      await workspace.openResource(data.html_url)
    })
  }

  public async loadItems(): Promise<ListItem[]> {
    const res: ListItem[] = []
    const result = await this.gist.list()

    for (const item of result) {
      for (const file of Object.values(item['files'])) {
        const gist: GistsListFile = {
          id: item['id'],
          url: file['raw_url'],
          html_url: item['html_url'],
          public: item['public'],
          filename: file['filename'],
          description: item['description'],
        }
        const label = `[${colors.yellow(gist.filename)}] ${colors.underline(gist.description)}`
        res.push({
          label,
          filterText: label,
          data: Object.assign({}, gist)
        })
      }
    }
    return res
  }
}
