"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresStore = void 0;
const langgraph_1 = require("@langchain/langgraph");
const pg_1 = require("pg");
// Type guards for Operation types
function isGetOperation(op) {
    return op.namespace !== undefined && op.key !== undefined && op.value === undefined;
}
function isPutOperation(op) {
    return op.namespace !== undefined && op.key !== undefined && op.value !== undefined;
}
// function isDeleteOperation(op: Operation): op is DeleteOperation {
//     return (op as DeleteOperation).namespace !== undefined && (op as DeleteOperation).key !== undefined && (op as any).value === undefined && (op as any).index === undefined;
// }
class PostgresStore extends langgraph_1.BaseStore {
    constructor(connString, tableName = "langgraph_pg_store") {
        super();
        this.pool = new pg_1.Pool({ connectionString: connString });
        this.tableName = tableName;
    }
    // Helper to create composite key
    makeKey(namespace, key) {
        return namespace.length ? `${namespace.join(":")}:${key}` : key;
    }
    // BaseStore methods
    async batch(operations) {
        const results = {};
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            // Type guards for operation types
            if (isGetOperation(op)) {
                results[i] = await this.get(op.namespace, op.key);
            }
            else if (isPutOperation(op)) {
                await this.put(op.namespace, op.key, op.value || {}, op.index);
                results[i] = undefined;
                // } else if (isDeleteOperation(op)) {
                //     await this.delete(op.namespace, op.key);
                //     results[i] = undefined;
            }
            else {
                results[i] = undefined;
            }
        }
        return results;
    }
    async get(namespace, key) {
        var _a;
        const compositeKey = this.makeKey(namespace, key);
        const result = await this.batchLoad([compositeKey]);
        return (_a = result[compositeKey]) !== null && _a !== void 0 ? _a : null;
    }
    async put(namespace, key, value, index) {
        const compositeKey = this.makeKey(namespace, key);
        await this.batchSave({ [compositeKey]: value });
    }
    async delete(namespace, key) {
        const compositeKey = this.makeKey(namespace, key);
        await this.pool.query(`DELETE FROM ${this.tableName} WHERE key = $1`, [compositeKey]);
    }
    async getAll(namespace) {
        const prefix = namespace.length ? `${namespace.join(":")}:` : '';
        const { rows } = await this.pool.query(`SELECT key, value FROM ${this.tableName} WHERE key LIKE $1`, [`${prefix}%`]);
        const result = {};
        for (const row of rows) {
            result[row.key] = row.value;
        }
        return result;
    }
    async clear(namespace) {
        const prefix = namespace.length ? `${namespace.join(":")}:` : '';
        await this.pool.query(`DELETE FROM ${this.tableName} WHERE key LIKE $1`, [`${prefix}%`]);
    }
    async search(namespacePrefix, options) {
        const prefix = namespacePrefix.length ? `${namespacePrefix.join(":")}:` : '';
        let queryStr = `SELECT key, value FROM ${this.tableName} WHERE key LIKE $1`;
        const params = [`${prefix}%`];
        if (options === null || options === void 0 ? void 0 : options.query) {
            queryStr += ` AND (key ILIKE $2 OR value::text ILIKE $2)`;
            params.push(`%${options.query}%`);
        }
        if (options === null || options === void 0 ? void 0 : options.limit) {
            queryStr += ` LIMIT $${params.length + 1}`;
            params.push(options.limit);
        }
        if (options === null || options === void 0 ? void 0 : options.offset) {
            queryStr += ` OFFSET $${params.length + 1}`;
            params.push(options.offset);
        }
        const { rows } = await this.pool.query(queryStr, params);
        return rows.map((row) => ({ key: row.key, value: row.value, namespace: namespacePrefix, createdAt: row.createdAt, updatedAt: row.updatedAt }));
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
    async batchLoad(keys) {
        if (!keys.length)
            return {};
        const { rows } = await this.pool.query(`SELECT key, value FROM ${this.tableName} WHERE key = ANY($1::text[])`, [keys]);
        const result = {};
        for (const row of rows) {
            result[row.key] = row.value;
        }
        return result;
    }
    async batchSave(pairs) {
        if (!Object.keys(pairs).length)
            return;
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const [key, value] of Object.entries(pairs)) {
                await client.query(`INSERT INTO ${this.tableName} (key, value) VALUES ($1, $2)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [key, value]);
            }
            await client.query('COMMIT');
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
}
exports.PostgresStore = PostgresStore;
