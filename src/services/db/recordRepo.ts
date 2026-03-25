import { v4 as uuid } from 'uuid'
import { db } from './db'
import type { DataRecord } from '../../types/AppConfig'

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

  async listByApp(appId: string): Promise<DataRecord[]> {
    return db.records
      .where('appId')
      .equals(appId)
      .reverse()
      .sortBy('createdAt')
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
      }).join(',')
    )
    return [header, ...rows].join('\n')
  },
}