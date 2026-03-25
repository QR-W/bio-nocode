import { v4 as uuid } from 'uuid'
import { db } from './db'
import type { User } from '../../types/user'

function hashPassword(password: string): string {
    return btoa(encodeURIComponent(password))
}

export const userRepo = {

    async register(username: string, password: string): Promise<User> {
        const existing = await db.users.where('username').equals(username).first()
        if (existing) throw new Error('用户名已存在')

        const user: User = {
            id: uuid(),
            username,
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString(),
        }
        await db.users.add(user)
        return user
    },

    async login(username: string, password: string): Promise<User> {
        const user = await db.users.where('username').equals(username).first()
        if (!user) throw new Error('用户名不存在')
        if (user.passwordHash !== hashPassword(password)) throw new Error('密码错误')
        return user
    },
}