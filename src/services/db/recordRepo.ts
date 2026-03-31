import Dexie from 'dexie'
import { v4 as uuid } from 'uuid'
import { db } from './db'
import type { DataRecord } from '../../types/AppConfig'

export const RECORD_TABLE_PAGE_SIZE_DEFAULT = 50
/** 图表/时间轴等使用的最近记录条数上限，避免一次载入全表 */
export const RECORD_SAMPLE_MAX = 5000

export const recordRepo = {

  async create(appId: string, data: Record<string, unknown>): Promise<DataRecord> {
    const now = new Date().toISOString()
    const record: DataRecord = {
      id: uuid(),
      appId,
      data,
      createdAt: now,
      updatedAt: now,
    }
    await db.records.add(record)
    return record
  },

  /** 全量列表（导出、自然语言筛选）；数据量大时慎用 */
  async listByApp(appId: string): Promise<DataRecord[]> {
    return db.records
      .where('[appId+createdAt]')
      .between([appId, Dexie.minKey], [appId, Dexie.maxKey])
      .reverse()
      .toArray()
  },

  /** Dexie 复合索引分页，createdAt 降序（最新在前） */
  async listByAppPaged(appId: string, offset: number, limit: number): Promise<DataRecord[]> {
    if (limit <= 0) return []
    return db.records
      .where('[appId+createdAt]')
      .between([appId, Dexie.minKey], [appId, Dexie.maxKey])
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray()
  },

  async countByApp(appId: string): Promise<number> {
    return db.records.where('appId').equals(appId).count()
  },

  async countByAppThisMonth(appId: string): Promise<number> {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0, 23, 59, 59, 999,
    ).toISOString()
    return db.records
      .where('[appId+createdAt]')
      .between([appId, start], [appId, end])
      .count()
  },

  async update(id: string, data: Record<string, unknown>): Promise<void> {
    await db.records.update(id, {
      data,
      updatedAt: new Date().toISOString(),
    })
  },

  async delete(id: string): Promise<void> {
    await db.records.delete(id)
  },

  async exportCSV(appId: string, fieldNames: string[]): Promise<string> {
    const records = await recordRepo.listByApp(appId)
    const header = fieldNames.join(',')
    const rows = records.map(r =>
      fieldNames.map(f => {
        const str = r.data[f] == null ? '' : String(r.data[f])
        return str.includes(',') || str.includes('\n') ? `"${str}"` : str
      }).join(','),
    )
    const body = [header, ...rows].join('\n')
    return `\uFEFF${body}`
  },
}
