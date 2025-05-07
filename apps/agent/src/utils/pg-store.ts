import { AsyncBatchedStore, BaseStore } from "@langchain/langgraph";
import type {
  Operation,
  OperationResults,
  GetOperation,
  PutOperation
} from "@langchain/langgraph";
import { Pool } from "pg";

// Type guards for Operation types
function isGetOperation(op: Operation): op is GetOperation {
    return (op as GetOperation).namespace !== undefined && (op as GetOperation).key !== undefined && (op as any).value === undefined;
}
function isPutOperation(op: Operation): op is PutOperation {
    return (op as PutOperation).namespace !== undefined && (op as PutOperation).key !== undefined && (op as PutOperation).value !== undefined;
}
// function isDeleteOperation(op: Operation): op is DeleteOperation {
//     return (op as DeleteOperation).namespace !== undefined && (op as DeleteOperation).key !== undefined && (op as any).value === undefined && (op as any).index === undefined;
// }

export class PostgresStore extends BaseStore {
    private pool: Pool;
    private tableName: string;

    constructor(connString: string, tableName = "langgraph_pg_store") {
        super();
        this.pool = new Pool({ connectionString: connString });
        this.tableName = tableName;
    }

    // Helper to create composite key
    private makeKey(namespace: string[], key: string): string {
        return namespace.length ? `${namespace.join(":")}:${key}` : key;
    }

    // BaseStore methods
    async batch<Op extends Operation[]>(operations: Op): Promise<OperationResults<Op>> {
        const results: Partial<OperationResults<Op>> = {};
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            // Type guards for operation types
            if (isGetOperation(op)) {
                results[i] = await this.get(op.namespace, op.key);
            } else if (isPutOperation(op)) {
                await this.put(op.namespace, op.key, op.value || {}, op.index);
                results[i] = undefined;
            // } else if (isDeleteOperation(op)) {
            //     await this.delete(op.namespace, op.key);
            //     results[i] = undefined;
            } else {
                results[i] = undefined;
            }
        }
        return results as OperationResults<Op>;
    }


    async get(namespace: string[], key: string): Promise<any> {
        const compositeKey = this.makeKey(namespace, key);
        const result = await this.batchLoad([compositeKey]);
        return result[compositeKey] ?? null;
    }

    async put(namespace: string[], key: string, value: Record<string, any>, index?: false | string[]): Promise<void> {
        const compositeKey = this.makeKey(namespace, key);
        await this.batchSave({ [compositeKey]: value });
    }

    async delete(namespace: string[], key: string): Promise<void> {
        const compositeKey = this.makeKey(namespace, key);
        await this.pool.query(
            `DELETE FROM ${this.tableName} WHERE key = $1`,
            [compositeKey]
        );
    }

    async getAll(namespace: string[]): Promise<Record<string, any>> {
        const prefix = namespace.length ? `${namespace.join(":")}:` : '';
        const { rows } = await this.pool.query(
            `SELECT key, value FROM ${this.tableName} WHERE key LIKE $1`,
            [`${prefix}%`]
        );
        const result: Record<string, any> = {};
        for (const row of rows) {
            result[row.key] = row.value;
        }
        return result;
    }

    async clear(namespace: string[]): Promise<void> {
        const prefix = namespace.length ? `${namespace.join(":")}:` : '';
        await this.pool.query(
            `DELETE FROM ${this.tableName} WHERE key LIKE $1`,
            [`${prefix}%`]
        );
    }

    async search(namespacePrefix: string[], options?: { filter?: Record<string, any>, limit?: number, offset?: number, query?: string }): Promise<{ key: string; value: any; namespace: string[]; createdAt: Date; updatedAt: Date }[]> {
        const prefix = namespacePrefix.length ? `${namespacePrefix.join(":")}:` : '';
        let queryStr = `SELECT key, value FROM ${this.tableName} WHERE key LIKE $1`;
        const params: any[] = [`${prefix}%`];
        if (options?.query) {
            queryStr += ` AND (key ILIKE $2 OR value::text ILIKE $2)`;
            params.push(`%${options.query}%`);
        }
        if (options?.limit) {
            queryStr += ` LIMIT $${params.length + 1}`;
            params.push(options.limit);
        }
        if (options?.offset) {
            queryStr += ` OFFSET $${params.length + 1}`;
            params.push(options.offset);
        }
        const { rows } = await this.pool.query(queryStr, params);
        return rows.map((row: any) => ({ key: row.key, value: row.value, namespace: namespacePrefix, createdAt: row.createdAt, updatedAt: row.updatedAt }));
    }

    async initialize() {
        await this.pool.query('SET search_path TO langgraph');
        await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          key TEXT PRIMARY KEY,
          value JSONB
        )
      `);
    }

    async batchLoad(keys: string[]): Promise<Record<string, any>> {
        if (!keys.length) return {};
        const { rows } = await this.pool.query(
            `SELECT key, value FROM ${this.tableName} WHERE key = ANY($1::text[])`,
            [keys]
        );
        const result: Record<string, any> = {};
        for (const row of rows) {
            result[row.key] = row.value;
        }
        return result;
    }

    async batchSave(pairs: Record<string, any>): Promise<void> {
        if (!Object.keys(pairs).length) return;
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const [key, value] of Object.entries(pairs)) {
                await client.query(
                    `INSERT INTO ${this.tableName} (key, value) VALUES ($1, $2)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
                    [key, value]
                );
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}
