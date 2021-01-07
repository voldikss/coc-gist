import { Octokit } from '@octokit/rest'
import fetch from 'node-fetch'
import { window } from 'coc.nvim'

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
  constructor(private token: string) {
    this.octokit = new Octokit({ auth: token })
  }

  public async list() {
    const statusItem = window.createStatusBarItem(0, { progress: true })
    statusItem.text = 'Loading gists...'
    statusItem.show()
    const resp = await this.octokit.gists.list()
    statusItem.hide()
    if (resp.status >= 200 && resp.status <= 299 && resp.data) {
      return resp.data
    } else {
      return resp.data
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

    const statusItem = window.createStatusBarItem(0, { progress: true })
    statusItem.text = 'Creating gist...'
    statusItem.show()
    const resp = await this.octokit.gists.create(gistContent)
    statusItem.hide()
    return resp.data.id
  }

  public async delete(id: string) {
    const statusItem = window.createStatusBarItem(0, { progress: true })
    statusItem.text = 'Deleting gist...'
    statusItem.show()
    await this.octokit.gists.delete({ gist_id: id })
    statusItem.hide()
  }

  public async update(id: string, filename: string, content: string) {
    const statusItem = window.createStatusBarItem(0, { progress: true })
    statusItem.text = 'Creating gist...'
    statusItem.show()
    const resp = await this.octokit.gists.update({
      gist_id: id,
      files: {
        [filename]: {
          filename,
          content: content
        }
      }
    })
    statusItem.hide()
    return resp.data.id
  }

  // get content
  public async get(url: string): Promise<string> {
    const statusItem = window.createStatusBarItem(0, { progress: true })
    statusItem.text = `Loading gist content...`
    statusItem.show()
    const resp = await fetch(url)
    const text = await resp.text()
    statusItem.hide()
    return text
  }
}
