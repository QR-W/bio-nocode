import Dexie, { type Table } from 'dexie'
import type { AppConfig, DataRecord } from '../../types/AppConfig'
import type { User } from '../../types/user'

class NoCodeDB extends Dexie {
  apps!: Table<AppConfig>
  records!: Table<DataRecord>
  users!: Table<User>

  constructor() {
    super('NoCodePlatformDB')

    this.version(2).stores({
      apps: 'id, updatedAt, userId',
      records: 'id, appId, createdAt',
      users: 'id, username',
    })
  }
}

export const db = new NoCodeDB()