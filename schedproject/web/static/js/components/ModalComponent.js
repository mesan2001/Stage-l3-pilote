import { BaseComponent } from "./BaseComponent.js";

export class ModalComponent extends BaseComponent {
    constructor(container, options = {}) {
        if (!container) {
            console.warn("Container not provided for ModalComponent");
            container = document.createElement("div");
            document.body.appendChild(container);
        }
        super(container, options);

        this.ensureInitialized();
    }

    getDefaultOptions() {
        return {
            title: "Modal",
            content: null,
            buttons: [],
        };
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    async render() {
        this.container.innerHTML = `
            <div class="modal-backdrop fixed inset-0 bg-black opacity-50 z-40 hidden"></div>
            <div class="modal-wrapper fixed inset-0 z-50 overflow-auto flex items-center justify-center hidden">
                <div class="modal-container bg-white w-full max-w-md mx-auto rounded shadow-lg">
                    <div class="modal-header flex justify-between items-center border-b p-4">
                        <h3 class="modal-title text-lg">${this.options.title}</h3>
                        <button type="button" class="modal-close" data-action="close">×</button>
                    </div>
                    <div class="modal-content p-4">
                        <!-- Content injected here -->
                    </div>
                    ${
                        this.options.buttons.length > 0
                            ? `
                        <div class="modal-footer border-t p-4 flex justify-end space-x-2">
                            ${this.options.buttons
                                .map(
                                    (button, index) => `
                                <button type="button" class="px-4 py-2 border rounded" data-button-index="${index}">
                                    ${button.text}
                                </button>
                            `,
                                )
                                .join("")}
                        </div>
                    `
                            : ""
                    }
                </div>
            </div>
        `;

        this.backdrop = this.container.querySelector(".modal-backdrop");
        this.modalWrapper = this.container.querySelector(".modal-wrapper");
        this.contentContainer = this.container.querySelector(".modal-content");

        if (this.options.content) {
            this.setContent(this.options.content);
        }
    }

    async bindEvents() {
        const closeButton = this.container.querySelector(
            '[data-action="close"]',
        );
        if (closeButton) {
            closeButton.addEventListener("click", () => this.close());
        }

        this.backdrop.addEventListener("click", () => this.close());

        this.escHandler = (e) => {
            if (e.key === "Escape") this.close();
        };
        document.addEventListener("keydown", this.escHandler);

        this.options.buttons.forEach((button, index) => {
            const buttonEl = this.container.querySelector(
                `[data-button-index="${index}"]`,
            );
            if (buttonEl && typeof button.handler === "function") {
                buttonEl.addEventListener("click", (e) =>
                    button.handler(e, this),
                );
            }
        });
    }

    async setContent(content) {
        await this.ensureInitialized();

        if (!this.contentContainer) {
            console.error("Content container not found in modal");
            return this;
        }

        this.contentContainer.innerHTML = "";

        if (content instanceof BaseComponent) {
            this.contentComponent = content;

            this.contentContainer.appendChild(content.getContainer());

            if (!content.initialized) {
                await content.init();
            }
        } else if (typeof content === "string") {
            this.contentContainer.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.contentContainer.appendChild(content);
        }

        return this;
    }

    getContentElement() {
        return this.contentContainer;
    }

    async open() {
        await this.ensureInitialized();

        if (!this.backdrop || !this.modalWrapper) {
            console.error("Modal elements not properly initialized");
            return this;
        }

        this.backdrop.classList.remove("hidden");
        this.modalWrapper.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");

        this.isOpen = true;
        this.notifyChange("modal:opened");
        return this;
    }

    close() {
        if (!this.isOpen) return this;

        if (!this.backdrop || !this.modalWrapper) {
            console.error("Modal elements not properly initialized");
            return this;
        }

        this.backdrop.classList.add("hidden");
        this.modalWrapper.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");

        this.isOpen = false;
        this.notifyChange("modal:closed");
        return this;
    }

    setTitle(title) {
        const titleEl = this.container.querySelector(".modal-title");
        if (titleEl) titleEl.textContent = title;
        return this;
    }

    destroy() {
        if (this.escHandler) {
            document.removeEventListener("keydown", this.escHandler);
        }

        if (this.contentComponent instanceof BaseComponent) {
            this.contentComponent.destroy();
        }

        if (this.isOpen) {
            document.body.classList.remove("overflow-hidden");
        }

        super.destroy();
    }
}
