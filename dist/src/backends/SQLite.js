"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StatusCode_enum_1 = require("../enums/StatusCode.enum");
const sqlite3_1 = require("sqlite3");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
/**
 * Database connection management class prototype.
 */
class StorageStrategy {
}
/**
 * SQLite storage class
 */
class SqliteStorage extends StorageStrategy {
    constructor(db, dbName, tableName, dbFile) {
        super();
        this.db = db;
        this.dbName = dbName;
        this.tableName = tableName;
        this.dbFile = dbFile;
    }
    static createDatabase(dbName, tableName, dbFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.SQLITE_MEMORY_DB === 'no' && process.env.SQLITE_RESET === 'yes') {
                try {
                    yield fs_1.promises.unlink(path_1.default.resolve(dbFile));
                }
                catch (e) {
                    console.log(e);
                }
            }
            const db = process.env.SQLITE_MEMORY_DB === 'yes' ? new sqlite3_1.Database(':memory:') : new sqlite3_1.Database(dbFile);
            if (process.env.SQLITE_MEMORY_DB === 'yes') {
                console.log('In-memory database initialized');
            }
            else {
                console.log(`Database '${path_1.default.resolve(dbFile)}' initialized`);
            }
            return new Promise((resolve, reject) => {
                db.run(`CREATE TABLE IF NOT EXISTS '${tableName}'
          (
            id INTEGER PRIMARY KEY,
            token TEXT UNIQUE
              CHECK(LENGTH(token) <= 255),
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            last_access INTEGER NOT NULL,
            archived INTEGER NOT NULL
              CHECK (archived IN (0, 1))
          );`, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log(process.env.RESET_DB === 'yes' ? `Table '${tableName}' created` : `Table '${tableName}' initialized`);
                        resolve(db);
                    }
                });
            });
        });
    }
    static getInstance(dbName, tableName, dbFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield SqliteStorage.createDatabase(dbName, tableName, dbFile);
            return new SqliteStorage(db, dbName, tableName, dbFile);
        });
    }
    insert(jwtToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const defaults = {
                id: null,
                token: jwtToken,
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                lastAccess: new Date().getTime(),
                archived: 0
            };
            const params = Object.values(this.prepareRow(defaults));
            const query = `INSERT INTO ${this.tableName} (
id, token, created_at, updated_at, last_access, archived
) VALUES (?, ?, ?, ?, ?, ?)`;
            return new Promise((resolve, reject) => {
                this.db.run(query, [...params], (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(StatusCode_enum_1.StatusCode.CREATED);
                    }
                });
            });
        });
    }
    prepareRow(row) {
        row.createdAt = row.createdAt.toString();
        row.updatedAt = row.updatedAt.toString();
        row.lastAccess = row.lastAccess.toString();
        row.archived = row.archived === true ? '1' : '0';
        return row;
    }
    update(where, values) {
        return __awaiter(this, void 0, void 0, function* () {
            const vals = [...values].join(',');
            const query = `UPDATE '${this.tableName}' SET ${vals} WHERE ${where.join(' AND ')}`;
            return new Promise((resolve, reject) => {
                this.db.run(query, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(StatusCode_enum_1.StatusCode.ACCEPTED);
                    }
                });
            });
        });
    }
    archive(token) {
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE '${this.tableName}' SET archived ='1' WHERE token =? AND archived ='0'`, [token], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(StatusCode_enum_1.StatusCode.SUCCESS);
                }
            });
        });
    }
    findAll(what = 'token', where = ['archived != 1'], order = 'last_access', sort = 'DESC', limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const qWhere = [...where].join(' AND ');
            let sql = `SELECT ${what} FROM ${this.tableName} WHERE ${qWhere}`;
            if (order)
                sql += ` ORDER BY ${order} ${sort}`;
            if (limit)
                sql += ` LIMIT ${limit}`;
            return new Promise((resolve, reject) => {
                this.db.all(sql, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows);
                    }
                });
            });
        });
    }
    findOne(what = 'token', where = ['archived !=1 '], order = 'last_access', sort = 'DESC') {
        return __awaiter(this, void 0, void 0, function* () {
            const qWhere = [...where].join(' AND ');
            let sql = `SELECT ${what} FROM ${this.tableName} WHERE ${qWhere}`;
            if (order)
                sql += ` ORDER BY ${order} ${sort} LIMIT 1`;
            return new Promise((resolve, reject) => {
                this.db.get(sql, (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(row);
                    }
                });
            });
        });
    }
}
exports.default = SqliteStorage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU1FMaXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JhY2tlbmRzL1NRTGl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDhEQUFzRDtBQUN0RCxxQ0FBbUM7QUFFbkMsMkJBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4Qjs7R0FFRztBQUNILE1BQWUsZUFBZTtDQXNEN0I7QUFFRDs7R0FFRztBQUNILE1BQXFCLGFBQWMsU0FBUSxlQUFlO0lBTXhELFlBQVksRUFBWSxFQUFFLE1BQWMsRUFBRSxTQUFpQixFQUFFLE1BQWM7UUFDekUsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFHRCxNQUFNLENBQU8sY0FBYyxDQUFDLE1BQWMsRUFBRSxTQUFpQixFQUFFLE1BQWM7O1lBQzNFLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEtBQUssS0FBSyxFQUFFO2dCQUMvRSxJQUFJO29CQUNGLE1BQU0sYUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ3ZDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2hCO2FBQ0Y7WUFDRCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxrQkFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJ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