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

    this.version(3).stores({
      apps: 'id, updatedAt, userId',
      records: 'id, appId, createdAt',
      users: 'id, username',
    }).upgrade(async tx => {
      await tx.table('apps').toCollection().modify((app: AppConfig) => {
        if (app.userId == null || app.userId === undefined)
          app.userId = ''
        if (!app.views) {
          app.views = { tableColumns: [], charts: [] }
        } else {
          if (!Array.isArray(app.views.tableColumns))
            app.views.tableColumns = []
          if (!Array.isArray(app.views.charts))
            app.views.charts = []
        }
        if (!Array.isArray(app.pages))
          app.pages = []
      })
    })

    // 复合索引：按 appId + createdAt 分页，避免 listByApp 全表排序进内存
    this.version(4).stores({
      apps: 'id, updatedAt, userId',
      records: 'id, [appId+createdAt], appId, createdAt',
      users: 'id, username',
    })
  }
}

export const db = new NoCodeDB()
