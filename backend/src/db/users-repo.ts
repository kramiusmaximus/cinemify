import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { queryRows } from "./mysql.js";

export type UserRole = "admin" | "user";

export interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

function mapUserRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

export class UsersRepo {
  constructor(private readonly pool: Pool) {}

  async ensureUsersTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY users_email_unique (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await queryRows<UserRow>(
      this.pool,
      `SELECT id, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1`,
      [normalizedEmail],
    );

    if (!rows.length) {
      return null;
    }

    return mapUserRow(rows[0]);
  }

  async findById(id: number): Promise<UserRecord | null> {
    const rows = await queryRows<UserRow>(
      this.pool,
      `SELECT id, email, password_hash, role, created_at FROM users WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!rows.length) {
      return null;
    }

    return mapUserRow(rows[0]);
  }

  async createUser(params: { email: string; passwordHash: string; role?: UserRole }): Promise<UserRecord> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const role = params.role ?? "user";

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
      [normalizedEmail, params.passwordHash, role],
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error("Failed to load created user");
    }

    return created;
  }

  async ensureAdmin(params: { email: string; passwordHash: string }): Promise<UserRecord> {
    const existing = await this.findByEmail(params.email);

    if (!existing) {
      return this.createUser({
        email: params.email,
        passwordHash: params.passwordHash,
        role: "admin",
      });
    }

    if (existing.role !== "admin") {
      await this.pool.execute(`UPDATE users SET role = 'admin' WHERE id = ?`, [existing.id]);
      const updated = await this.findById(existing.id);
      if (!updated) {
        throw new Error("Failed to update admin user role");
      }
      return updated;
    }

    return existing;
  }
}
