import { v4 as uuid } from 'uuid'
import { db } from './db'
import type { AppConfig, PartialAppConfig } from '../../types/AppConfig'
import { useAuthStore } from '../../stores/authStore'

export const appRepo = {

  async create(partial: PartialAppConfig): Promise<AppConfig> {
    const now = new Date().toISOString()
    const userId = useAuthStore.getState().currentUser?.id ?? ''
    const app: AppConfig = {
      id: uuid(),
      userId,   // ← 新增
      name: partial.name ?? '未命名应用',
      description: partial.description ?? '',
      experimentType: partial.experimentType ?? 'project',
      password: partial.password, 
      cellLine: partial.cellLine,
      fields: partial.fields ?? [],
      views: partial.views ?? { tableColumns: [], charts: [] },
      pages: partial.pages ?? [
        {
          key: 'login',
          title: '用户登录',
          icon: 'UserOutlined',
          components: [{ id: 'login_form', type: 'LoginForm' }],
        },
        {
          key: 'dashboard',
          title: '概览',
          icon: 'DashboardOutlined',
          components: [{ id: 'stats_1', type: 'StatsCards' }],
        },
        {
          key: 'input',
          title: '数据录入',
          icon: 'FormOutlined',
          components: [{ id: 'form_1', type: 'DataForm' }],
        },
        {
          key: 'list',
          title: '数据列表',
          icon: 'TableOutlined',
          components: [
            { id: 'search_1', type: 'SearchBar' },
            { id: 'table_1', type: 'DataTable' },
          ],
        },
        {
          key: 'chart',
          title: '图表分析',
          icon: 'BarChartOutlined',
          components: [{ id: 'chart_1', type: 'ChartView' }],
        },
      ],
      createdAt: now,
      updatedAt: now,
      version: 1,
      runnerOptions: partial.runnerOptions,
    }
    await db.apps.add(app)
    return app
  },

  async getById(id: string): Promise<AppConfig | undefined> {
    return db.apps.get(id)
  },

  async listAll(): Promise<AppConfig[]> {
    const userId = useAuthStore.getState().currentUser?.id ?? ''
    return db.apps
      .where('userId').equals(userId)
      .reverse()
      .sortBy('updatedAt')
  },

  async update(id: string, patch: PartialAppConfig): Promise<AppConfig> {
    const existing = await db.apps.get(id)
    if (!existing) throw new Error(`App not found: ${id}`)

    const updated: AppConfig = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    }
    await db.apps.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.apps, db.records, async () => {
      await db.apps.delete(id)
      await db.records.where('appId').equals(id).delete()
    })
  },

  async countRecords(appId: string): Promise<number> {
    return db.records.where('appId').equals(appId).count()
  },
}