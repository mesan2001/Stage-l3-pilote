import { API } from "./api.js";

export class DataManager {
    constructor(app) {
        this.app = app;
        this.tableData = {};
        this.db = null;
        this.dbName = "LabelingAppDB";
        this.storeName = "tableData";
        this.dbVersion = 1;
        this.schema = null;
        this.previousFilters = null;
        this.watcher = new Set();
    }

    async init() {
        try {
            this.schema = await API.fetchSchema();
            await this.initIndexedDB();
            await this.clearCache();

            console.log("DataManager initialization completed successfully");
            return this;
        } catch (error) {
            console.error("Error during DataManager initialization:", error);
            throw error;
        }
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error(
                    "IndexedDB initialization failed:",
                    event.target.error,
                );
                reject("IndexedDB initialization failed");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("IndexedDB initialized successfully");
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, {
                        keyPath: ["tableName", "id"],
                    });
                    console.log("IndexedDB object store created");
                }
            };
        });
    }

    getReprField(tableName) {
        return this.schema?.[tableName]?.columns_info
            ? Object.keys(this.schema[tableName].columns_info).find(
                  (col) => this.schema[tableName].columns_info[col].repr_column,
              )
            : null;
    }

    getFieldType(tableName, fieldName) {
        return (
            this.schema?.[tableName]?.columns_info?.[fieldName]?.type || null
        );
    }

    isPrimaryKey(tableName, fieldName) {
        return (
            this.schema?.[tableName]?.columns_info?.[fieldName]
                ?.is_primary_key || false
        );
    }

    isForeignKey(tableName, fieldName) {
        return (
            this.schema?.[tableName]?.relationships?.some(
                (rel) => rel.from === fieldName,
            ) || false
        );
    }

    getForeignKeyField(tableName, parentTable) {
        const relationship = this.schema?.[tableName]?.relationships?.find(
            (rel) => rel.to === parentTable,
        );
        return relationship ? relationship.from : null;
    }

    getForeignKeyTable(tableName, field) {
        const relationship = this.schema?.[tableName]?.relationships?.find(
            (rel) => rel.from === field,
        );
        return relationship ? relationship.to : null;
    }

    getPrimaryKeyField(tableName) {
        return Object.keys(this.schema[tableName].columns_info).find(
            (field) =>
                this.schema[tableName].columns_info[field].is_primary_key,
        );
    }

    clearWatcher() {
        this.watcher.clear();
    }

    async cacheData(tableName, data) {
        return new Promise((resolve, reject) => {
            console.log("Requesting data caching...");
            console.log("Table name: ", tableName);
            console.log("Data: ", data);

            if (!this.db) {
                console.warn(
                    "IndexedDB not initialized. Skipping cache operation.",
                );
                resolve();
                return;
            }

            const primaryKey = this.getPrimaryKeyField(tableName);
            if (!primaryKey) {
                reject(
                    `Unable to cache data for ${tableName}: No primary key found`,
                );
                return;
            }

            const transaction = this.db.transaction(
                [this.storeName],
                "readwrite",
            );
            const store = transaction.objectStore(this.storeName);

            const clearRequest = store.delete(
                IDBKeyRange.bound([tableName], [tableName, []]),
            );
            clearRequest.onerror = (event) => {
                console.error(
                    "Error clearing existing data:",
                    event.target.error,
                );
                reject("Error clearing existing data");
            };

            clearRequest.onsuccess = () => {
                console.log(
                    `Existing data for ${tableName} cleared successfully`,
                );

                let successCount = 0;
                let errorCount = 0;

                data.forEach((item) => {
                    if (item[primaryKey] === undefined) {
                        console.warn(
                            `Item missing primary key (${primaryKey}), skipping:`,
                            item,
                        );
                        errorCount++;
                        return;
                    }
                    const request = store.add({
                        ...item,
                        tableName,
                        id: item[primaryKey],
                    });
                    request.onsuccess = () => {
                        successCount++;
                    };
                    request.onerror = (event) => {
                        console.error(
                            "Error caching item:",
                            event.target.error,
                            item,
                        );
                        errorCount++;
                    };
                });

                transaction.oncomplete = () => {
                    console.log(
                        `Data for ${tableName} cached. Success: ${successCount}, Errors: ${errorCount}`,
                    );
                    this.app.emit("cacheChanged", tableName);
                    resolve();
                };
                transaction.onerror = (event) => {
                    console.error(
                        "Error in caching transaction:",
                        event.target.error,
                    );
                    reject("Error caching data");
                };
            };
        });
    }

    async fecthFilteredAndCacheData(filters) {
        console.log("Fetching filtered data ... ");
        try {
            const filteredData = await API.fetchFilteredData(filters);
            for (const [tableName, data] of Object.entries(filteredData)) {
                await this.setTableData(tableName, data);
            }
            console.log("Done.");

            return filteredData;
        } catch (error) {
            console.error(
                "An error occured during fecthing filtered data",
                error,
            );
        }
    }

    async getCurrentTableData(tableName) {
        return this.getCachedData(tableName);
    }

    async setTableData(tableName, data) {
        this.watcher.add(tableName);
        await this.cacheData(tableName, data);
    }

    async getCurrentData() {
        const allData = {};
        for (const tableName of Object.keys(this.schema)) {
            allData[tableName] = await this.getCurrentTableData(tableName);
        }
        return allData;
    }

    async getCachedData(tableName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.warn(
                    "IndexedDB not initialized. Returning empty array.",
                );
                resolve([]);
                return;
            }

            const transaction = this.db.transaction(
                [this.storeName],
                "readonly",
            );
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll(
                IDBKeyRange.bound([tableName], [tableName, []]),
            );

            request.onerror = () => {
                console.error("Error fetching cached data:", request.error);
                reject("Error fetching cached data");
            };

            request.onsuccess = () => {
                console.log(`Retrieved cached data for ${tableName}`);
                resolve(request.result);
            };
        });
    }

    clearCache() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["tableData"], "readwrite");
            const store = transaction.objectStore("tableData");
            const request = store.clear();

            request.onsuccess = () => {
                console.log("Cache cleared successfully");
                resolve();
            };
            request.onerror = () => {
                console.error("Error clearing cache");
                reject("Error clearing cache");
            };
        });
    }
}
