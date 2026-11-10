export class CdpClient {
  private ws!: WebSocket;
  private id = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          if (data.id && this.pending.has(data.id)) {
            const { resolve, reject } = this.pending.get(data.id)!;
            this.pending.delete(data.id);
            if (data.error) reject(new Error(data.error.message));
            else resolve(data.result);
          }
        } catch {
          // ignore parse errors
        }
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async send(method: string, params: Record<string, any> = {}): Promise<any> {
    const messageId = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(messageId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: messageId, method, params }));
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

export async function waitForDebuggerUrl(port: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageTarget = targets.find((t: any) => t.type === "page" && t.webSocketDebuggerUrl);
        if (pageTarget) {
          return pageTarget.webSocketDebuggerUrl;
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return "";
}
