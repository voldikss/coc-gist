import { Octokit } from '@octokit/rest'
import fetch from 'node-fetch'
import { StatusBarItem, window } from 'coc.nvim'
import { logger } from './util/logger'
import { log } from 'util'

// interface GistFile {
//   content: string
//   filename: string
//   language: string
//   raw_url: string
//   size: number
//   type: string
// }
//
// interface GistResponse {
//   id: string
//   url: string
//   html_url: string
//   public: boolean
//   created_at: string
//   updated_at: string
//   description: string
//   files: { [filename: string]: GistFile }
// }

export class Gist {
  private octokit: Octokit
  private statusItem: StatusBarItem
  constructor(private token: string) {
    this.octokit = new Octokit({ auth: token })
    this.statusItem = window.createStatusBarItem(0, { progress: true })
  }

  public async list() {
    this.statusItem.text = 'Loading gists...'
    this.statusItem.show()
    const resp = await this.octokit.gists.list()
    this.statusItem.hide()
    if (resp.status >= 200 && resp.status <= 299 && resp.data) {
      return resp.data
    } else {
      window.showMessage('Failed to fetch gists', 'error')
      return []
    }
  }

  public async create(filename: string, content: string) {
    const gistContent = {
      description: '',
      public: false,
      files: {
        [filename]: {
          filename,
          content: content
        }
      }
    }
    const description = await window.requestInput('description')
    if (description) gistContent['description'] = description
    const isPublic = await window.showPrompt('public?')
    if (isPublic) gistContent['public'] = true

    this.statusItem.text = 'Creating gist...'
    this.statusItem.show()
    const resp = await this.octokit.gists.create(gistContent)
    this.statusItem.hide()
    if (resp.status < 200 || resp.status > 299) {
      window.showMessage('Failed to create gist', 'error')
      return -1
    }
    return resp.data.id
  }

  public async delete(id: string) {
    this.statusItem.text = 'Deleting gist...'
    this.statusItem.show()
    const resp = await this.octokit.gists.delete({ gist_id: id })
    this.statusItem.hide()
    if (resp.status < 200 || resp.status > 299) {
      window.showMessage('Failed to delete gist', 'error')
    }
  }

  public async update(id: string, filename: string, content: string) {
    this.statusItem.text = 'Creating gist...'
    this.statusItem.show()
    const resp = await this.octokit.gists.update({
      gist_id: id,
      files: {
        [filename]: {
          filename,
          content: content
        }
      }
    })
    this.statusItem.hide()
    if (resp.status < 200 || resp.status > 299) {
      window.showMessage('Failed to update gist', 'error')
    }
  }

  // get content
  public async get(url: string): Promise<string> {
    this.statusItem.text = `Loading gist content...`
    this.statusItem.show()
    let text = ''
    try {
      const resp = await fetch(url)
      text = await resp.text()
    } catch (error) {
      logger.log(error)
      window.showMessage('Failed to get gist content', 'error')
    }
    this.statusItem.hide()
    return text
  }
}
