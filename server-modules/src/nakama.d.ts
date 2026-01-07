// Type definitions for Nakama Runtime
// Based on Nakama 3.22.0 API

declare namespace nkruntime {
  interface Context {
    env: { [key: string]: string };
    executionMode: string;
    headers: { [key: string]: string[] };
    queryParams: { [key: string]: string[] };
    userId: string;
    username: string;
    vars: { [key: string]: string };
    userSessionExp: number;
    sessionId: string;
    clientIp: string;
    clientPort: string;
    lang: string;
  }

  interface Logger {
    debug(format: string, ...args: any[]): void;
    info(format: string, ...args: any[]): void;
    warn(format: string, ...args: any[]): void;
    error(format: string, ...args: any[]): void;
  }

  interface Nakama {
    logger: Logger;
  }

  interface Initializer {
    registerRpc(id: string, fn: RpcFunction): void;
    registerRtBefore(id: string, fn: RtBeforeFunction): void;
    registerRtAfter(id: string, fn: RtAfterFunction): void;
    registerMatchmakerMatched(fn: MatchmakerMatchedFunction): void;
    registerTournamentEnd(fn: TournamentEndFunction): void;
    registerTournamentReset(fn: TournamentResetFunction): void;
    registerLeaderboardReset(fn: LeaderboardResetFunction): void;
    registerMatch(name: string, handlers: MatchHandler): void;
  }

  type RpcFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    payload: string
  ) => string | void;

  type RtBeforeFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    envelope: any
  ) => any;

  type RtAfterFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    envelope: any
  ) => void;

  type MatchmakerMatchedFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    entries: any[]
  ) => string | null;

  type TournamentEndFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    tournament: any,
    end: number,
    reset: number
  ) => void;

  type TournamentResetFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    tournament: any,
    end: number,
    reset: number
  ) => void;

  type LeaderboardResetFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    leaderboard: any,
    reset: number
  ) => void;

  interface MatchHandler {
    matchInit?: (ctx: Context, logger: Logger, nk: Nakama, params: any) => any;
    matchJoinAttempt?: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: any,
      tick: number,
      state: any,
      presence: any,
      metadata: any
    ) => any;
    matchJoin?: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: any,
      tick: number,
      state: any,
      presences: any[]
    ) => any;
    matchLeave?: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: any,
      tick: number,
      state: any,
      presences: any[]
    ) => any;
    matchLoop?: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: any,
      tick: number,
      state: any,
      messages: any[]
    ) => any;
    matchTerminate?: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: any,
      tick: number,
      state: any,
      graceSeconds: number
    ) => any;
    matchSignal?: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: any,
      tick: number,
      state: any,
      data: string
    ) => any;
  }

  interface StorageWriteRequest {
    collection: string;
    key: string;
    userId?: string;
    value: any;
    version?: string;
    permissionRead?: number;
    permissionWrite?: number;
  }

  interface StorageReadRequest {
    collection: string;
    key: string;
    userId?: string;
  }

  interface StorageObject {
    collection: string;
    key: string;
    userId: string;
    value: any;
    version: string;
    permissionRead: number;
    permissionWrite: number;
    createTime: number;
    updateTime: number;
  }

  interface StorageDeleteRequest {
    collection: string;
    key: string;
    userId?: string;
    version?: string;
  }

  interface Nakama {
    storageRead(requests: StorageReadRequest[]): StorageObject[];
    storageWrite(requests: StorageWriteRequest[]): void;
    storageDelete(requests: StorageDeleteRequest[]): void;
    storageList(
      userId: string,
      collection: string,
      limit?: number,
      cursor?: string
    ): { objects: StorageObject[]; cursor: string };
    accountGetId(userId: string): any;
    accountUpdateId(
      userId: string,
      username?: string,
      metadata?: any,
      displayName?: string,
      timezone?: string,
      location?: string,
      langTag?: string,
      avatarUrl?: string
    ): void;
    usersGetId(userIds: string[]): any[];
    usersGetUsername(usernames: string[]): any[];
    usersBanId(userIds: string[]): void;
    usersUnbanId(userIds: string[]): void;
  }
}

declare function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
): void;
