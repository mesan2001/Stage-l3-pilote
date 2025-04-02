export class BaseComponent {
    constructor(container, options = {}) {
        if (!(container instanceof HTMLElement)) {
            throw new Error(
                "BaseComponent constructor requires an HTMLElement container",
            );
        }

        this.container = container;
        this.options = { ...this.getDefaultOptions(), ...options };
        this.initialized = false;
        this._componentId = BaseComponent.generateUniqueId();
        this._elementIds = new Map();
    }

    getDefaultOptions() {
        return {};
    }

    async init() {
        if (this.initialized) {
            console.warn("Component already initialized");
            return;
        }

        try {
            await this.beforeRender();
            await this.render();
            await this.bindEvents();
            await this.afterRender();
            this.initialized = true;
        } catch (error) {
            console.error("Error during component initialization:", error);
            throw error;
        }
    }

    async beforeRender() {}

    async render() {
        throw new Error("Render method must be implemented by subclass");
    }

    async afterRender() {}

    async bindEvents() {}

    destroy() {
        this._elementIds.clear();

        if (this.container) {
            this.container.innerHTML = "";
        }

        this.onDestroy();

        this.initialized = false;
    }

    onDestroy() {}

    show() {
        if (this.container.firstElementChild) {
            this.container.firstElementChild.classList.remove("hidden");
        }
    }

    hide() {
        if (this.container.firstElementChild) {
            this.container.firstElementChild.classList.add("hidden");
        }
    }

    notifyChange(event = "change", data = null) {
        const detail = {
            component: this,
            data,
        };

        document.dispatchEvent(
            new CustomEvent(event, {
                bubbles: false,
                cancelable: true,
                detail,
            }),
        );
    }

    getContainer() {
        return this.container;
    }

    setOptions(options = {}) {
        this.options = { ...this.options, ...options };
        if (this.initialized) {
            this.render();
            this.bindEvents();
        }
    }

    getOptions() {
        return { ...this.options };
    }

    getId(suffix) {
        const key = suffix;

        if (!this._elementIds.has(key)) {
            const prefix = this.getIdPrefix();
            this._elementIds.set(
                key,
                `${prefix}-${suffix}-${this._componentId}`,
            );
        }

        return this._elementIds.get(key);
    }

    getIdPrefix() {
        const capitalLetters = this.constructor.name.match(/[A-Z]/g) || [];

        if (capitalLetters.length >= 2) {
            return capitalLetters.join("").toLowerCase();
        }

        return this.constructor.name.substring(0, 2).toLowerCase();
    }

    static generateUniqueId(prefix = "component") {
        return `${prefix}-${Math.random().toString(36).substring(2, 15)}`;
    }
}
