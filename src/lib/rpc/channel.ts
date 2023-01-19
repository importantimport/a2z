import type { EventBasedChannel } from 'async-call-rpc'

export type A2ZChannelOptions = {
  url: string
  secret?: string
}

export class A2ZChannel extends EventTarget implements EventBasedChannel {
  constructor(
    private options: A2ZChannelOptions = {
      url: 'http://localhost:6800/jsonrpc',
    }
  ) {
    super()
  }

  on(listener: (data: unknown) => void) {
    const callback = (e: Event): void => listener((e as MessageEvent).data)
    this.addEventListener('message', callback)
    return () => this.removeEventListener('message', callback)
  }

  async send(data: {
    id: string
    jsonrpc: '2.0'
    method: string
    params: unknown[]
  }): Promise<void> {
    this.dispatchEvent(
      new MessageEvent('message', {
        data: await fetch(this.options.url, {
          method: 'POST',
          body: JSON.stringify({
            ...data,
            method: `aria2.${data.method}`,
            params: [
              ...(this.options.secret ? [`token:${this.options.secret}`] : []),
              ...data.params,
            ],
          }),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }).then((res) => res.json()),
      })
    )
  }
}
