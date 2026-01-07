import { Client, Session } from "@heroiclabs/nakama-js";

const NAKAMA_SERVER = "localhost";
const NAKAMA_PORT = "7350";
const NAKAMA_USE_SSL = false;
const SERVER_KEY = "defaultkey";

export const nakamaClient = new Client(SERVER_KEY, NAKAMA_SERVER, NAKAMA_PORT, NAKAMA_USE_SSL);

export interface StorageObject {
  collection: string;
  key: string;
  value: any;
  version: string;
  permission_read: number;
  permission_write: number;
  create_time: string;
  update_time: string;
}

export class NakamaService {
  private static session: Session | null = null;

  static setSession(session: Session) {
    this.session = session;
    localStorage.setItem('nakama_session', session.token);
  }

  static getSession(): Session | null {
    if (this.session) {
      return this.session;
    }

    const token = localStorage.getItem('nakama_session');
    if (token) {
      this.session = Session.restore(token, token);
      return this.session;
    }

    return null;
  }

  static clearSession() {
    this.session = null;
    localStorage.removeItem('nakama_session');
  }

  static isAuthenticated(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const nowUnix = Math.floor(Date.now() / 1000);
    return session.isexpired(nowUnix) === false;
  }

  static async authenticateEmail(email: string, password: string): Promise<Session> {
    const session = await nakamaClient.authenticateEmail(email, password);
    this.setSession(session);
    return session;
  }

  static async logout() {
    this.clearSession();
  }

  static async rpc<T = any>(id: string, payload?: any): Promise<T> {
    const session = this.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }

    const response = await nakamaClient.rpc(session, id, payload || {});
    return (response.payload ? JSON.parse(response.payload as any) : null) as T;
  }
}
