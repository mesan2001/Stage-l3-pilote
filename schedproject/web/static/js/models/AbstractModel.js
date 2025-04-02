export class ModelRegistry {
    static #models = new Map();
    static #initializing = new Map();

    static async register(modelClass) {
        if (this.#initializing.has(modelClass.name)) {
            return this.#initializing.get(modelClass.name);
        }

        if (this.#models.has(modelClass.name)) {
            return this.#models.get(modelClass.name);
        }

        const initPromise = modelClass
            .initializeSchema()
            .then(() => {
                this.#models.set(modelClass.name, modelClass);
                this.#initializing.delete(modelClass.name);
                return modelClass;
            })
            .catch((error) => {
                this.#initializing.delete(modelClass.name);
                throw error;
            });

        this.#initializing.set(modelClass.name, initPromise);
        return initPromise;
    }

    static get(modelName) {
        return this.#models.get(modelName);
    }
}

export class AbstractModel {
    static tableName = null;
    static baseUrl = "/api";
    static schema = null;
    static _initializationPromise = null;
    static defaultConfig = {
        strict: true,
    };
    static _config = { ...AbstractModel.defaultConfig };

    static configure(options = {}) {
        this._config = { ...this.defaultConfig, ...options };
    }

    static getConfig() {
        return { ...this._config };
    }

    static async init() {
        return ModelRegistry.register(this);
    }

    static async initializeSchema() {
        if (this._initializationPromise) {
            return this._initializationPromise;
        }

        this._initializationPromise = (async () => {
            try {
                const response = await fetch(
                    `${this.baseUrl}/${this.tableName}/info`,
                );
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
                this.schema = await response.json();
                console.log(`Schema initialized for ${this.tableName}`);
            } catch (error) {
                console.error(
                    `Failed to initialize schema for ${this.tableName}:`,
                    error,
                );
                this._initializationPromise = null;
                throw error;
            }
        })();

        return this._initializationPromise;
    }

    static async create(data = {}) {
        const instance = new this(data);
        await instance.save();
        return instance;
    }

    constructor(data = {}) {
        if (this.constructor === AbstractModel) {
            throw new Error("AbstractModel cannot be instantiated directly");
        }

        if (!this.constructor.tableName) {
            throw new Error("Model must define a tableName");
        }

        if (!this.constructor.schema) {
            throw new Error(
                `Schema not initialized. Make sure model class ${this.constructor.name} is properly initialized.`,
            );
        }

        const baseObject = this;
        Object.keys(this.constructor.schema).forEach((key) => {
            baseObject[key] = data[key];
        });

        if (this.constructor.getConfig().strict) {
            Object.seal(baseObject);

            return new Proxy(baseObject, {
                get(target, prop, receiver) {
                    if (
                        typeof prop === "symbol" ||
                        prop in Object.getPrototypeOf(target) ||
                        prop === "constructor" ||
                        prop === "then" ||
                        prop === "toString" ||
                        prop === "toJSON"
                    ) {
                        return Reflect.get(target, prop, receiver);
                    }

                    if (!(prop in target.constructor.schema)) {
                        throw new Error(
                            `Property '${String(prop)}' does not exist in the schema for ${target.constructor.name} and therefore, in strict mode, it cannot be accessed/modified.`,
                        );
                    }

                    return Reflect.get(target, prop, receiver);
                },
            });
        }
    }

    static details(detailed = false) {
        if (!this.schema) {
            console.error(`Schema not initialized for ${this.name}`);
            return;
        }

        console.group(`Schema for ${this.name} (${this.tableName})`);

        Object.entries(this.schema).forEach(([key, definition]) => {
            if (detailed) {
                const typeInfo = definition.type || "unknown";
                const required = definition.required
                    ? "(required)"
                    : "(optional)";
                const defaultValue =
                    definition.default !== undefined
                        ? `default: ${JSON.stringify(definition.default)}`
                        : "";

                console.log(`${key}: ${typeInfo} ${required} ${defaultValue}`);

                if (definition.validation) {
                    console.group("Validation:");
                    Object.entries(definition.validation).forEach(
                        ([rule, value]) => {
                            console.log(`${rule}: ${JSON.stringify(value)}`);
                        },
                    );
                    console.groupEnd();
                }
            } else {
                console.log(key);
            }
        });

        console.groupEnd();
    }

    toString() {
        const id = this.id ? `#${this.id}` : "(unsaved)";
        return `${this.constructor.name} ${id}`;
    }

    async save() {
        const url = `${this.constructor.baseUrl}/${this.constructor.tableName}`;
        console.log(this.toJSON());
        const response = await fetch(this.id ? `${url}/${this.id}` : url, {
            method: this.id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.toJSON()),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.error || `HTTP error! status: ${response.status}`,
            );
        }

        const data = await response.json();

        console.log(data);
        Object.assign(this, data);
        return this;
    }

    async delete() {
        if (!this.id) throw new Error("Cannot delete unsaved model");

        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}`,
            { method: "DELETE" },
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.error || `HTTP error! status: ${response.status}`,
            );
        }

        return true;
    }

    toJSON() {
        const data = {};
        Object.keys(this.constructor.schema).forEach((key) => {
            if (this[key] !== undefined) {
                data[key] = this[key];
            }
        });
        return data;
    }

    static async getById(id) {
        const response = await fetch(`${this.baseUrl}/${this.tableName}/${id}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.error || `HTTP error! status: ${response.status}`,
            );
        }

        const data = await response.json();
        return this.fromJSON(data);
    }

    static async getAll() {
        const response = await fetch(`${this.baseUrl}/${this.tableName}/`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.error || `HTTP error! status: ${response.status}`,
            );
        }

        const data = await response.json();
        return data.map((item) => this.fromJSON(item));
    }

    static async filter(filters) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/filter`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(filters),
            },
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.error || `HTTP error! status: ${response.status}`,
            );
        }

        const data = await response.json();
        return data.map((item) => this.fromJSON(item));
    }

    static fromJSON(data) {
        return new this(data);
    }
}

export async function initializeModels(models) {
    await Promise.all(models.map((model) => model.init()));
}
