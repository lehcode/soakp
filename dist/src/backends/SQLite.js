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
/**
 * Author: Lehcode
 * Copyright: (C)2023
 */
const StatusCode_enum_1 = require("../enums/StatusCode.enum");
const sqlite3_1 = require("sqlite3");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const Message_enum_1 = require("../enums/Message.enum");
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
    /**
     * @return {Promise<number | Error>}
     * @param dbName
     * @param tableName
     * @param dbFile
     */
    static createDatabase(dbName, tableName, dbFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.SQLITE_MEMORY_DB === 'no' && process.env.SQLITE_RESET === 'yes') {
                try {
                    yield fs_1.promises.unlink(path_1.default.resolve(dbFile));
                }
                catch (err) {
                    console.log(err);
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
              CHECK(LENGTH(token) <= 1024),
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
    /**
     *
     * @param dbName
     * @param tableName
     * @param dbFile
     */
    static getInstance(dbName, tableName, dbFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield SqliteStorage.createDatabase(dbName, tableName, dbFile);
            return new SqliteStorage(db, dbName, tableName, dbFile);
        });
    }
    /**
     *
     * @param jwtToken
     */
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
    /**
     *
     * @param row
     * @private
     */
    prepareRow(row) {
        row.createdAt = row.createdAt.toString();
        row.updatedAt = row.updatedAt.toString();
        row.lastAccess = row.lastAccess.toString();
        row.archived = row.archived === true ? '1' : '0';
        return row;
    }
    /**
     *
     * @param where
     * @param values
     */
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
    /**
     *
     * @param token
     */
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
    /**
     *
     * @param what
     * @param where
     * @param order
     * @param sort
     */
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
    /**
     * Close database connetion
     */
    close() {
        this.db.close(() => {
            console.error(Message_enum_1.Message.UNKNOWN_ERROR);
        });
    }
}
exports.default = SqliteStorage;
//# sourceMappingURL=SQLite.js.map