export class Toast {
    static options = {
        position: "top-right",
        duration: 5000,
        showInUI: true,
        logToConsole: true,
    };

    static container = null;

    static success(message) {
        this._notify(message, "success");
    }

    static info(message) {
        this._notify(message, "info");
    }

    static warning(message) {
        this._notify(message, "warning");
    }

    static error(message, error = null) {
        this._notify(message, "error", error);
    }

    static toggleUI(show) {
        this.options.showInUI =
            show !== undefined ? show : !this.options.showInUI;
    }

    static toggleConsole(show) {
        this.options.logToConsole =
            show !== undefined ? show : !this.options.logToConsole;
    }

    static configure(options = {}) {
        this.options = { ...this.options, ...options };

        if (this.container) {
            this._updateContainerPosition();
        }
    }

    static _ensureContainer() {
        if (!this.container) {
            this.container = document.createElement("div");
            this.container.className = "fixed z-50 flex flex-col gap-2";
            this._updateContainerPosition();
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    static _updateContainerPosition() {
        this.container.classList.remove(
            "top-4",
            "right-4",
            "bottom-4",
            "left-4",
        );

        if (this.options.position === "top-right") {
            this.container.classList.add("top-4", "right-4");
        } else if (this.options.position === "top-left") {
            this.container.classList.add("top-4", "left-4");
        } else if (this.options.position === "bottom-right") {
            this.container.classList.add("bottom-4", "right-4");
        } else if (this.options.position === "bottom-left") {
            this.container.classList.add("bottom-4", "left-4");
        } else {
            this.container.classList.add("top-4", "right-4");
        }
    }

    static _notify(message, type, error = null) {
        if (this.options.logToConsole) {
            this._logToConsole(message, type, error);
        }

        if (!this.options.showInUI) {
            return;
        }

        const container = this._ensureContainer();
        const notification = this._createNotificationElement(message, type);
        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add("opacity-0");
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, this.options.duration);
    }

    static _createNotificationElement(message, type) {
        const colors = {
            success: "bg-green-100 border-green-500 text-green-800",
            info: "bg-blue-100 border-blue-500 text-blue-800",
            warning: "bg-yellow-100 border-yellow-500 text-yellow-800",
            error: "bg-red-100 border-red-500 text-red-800",
        };

        const notification = document.createElement("div");
        notification.className = `${colors[type]} border-l-4 p-3 shadow-md rounded w-64 md:w-80 opacity-0 transition-opacity duration-300`;

        notification.innerHTML = `
            <div class="flex justify-between items-start">
                <p class="text-sm">${message}</p>
                <button class="text-gray-500 hover:text-gray-700 ml-2">&times;</button>
            </div>
        `;

        const dismissButton = notification.querySelector("button");
        dismissButton.addEventListener("click", () => {
            notification.classList.add("opacity-0");
            setTimeout(() => {
                notification.remove();
            }, 300);
        });

        setTimeout(() => {
            notification.classList.remove("opacity-0");
        }, 10);

        return notification;
    }

    static _logToConsole(message, type, error) {
        const prefix = `[${type.toUpperCase()}]`;

        if (type === "success" || type === "info") {
            console.log(`${prefix} ${message}`);
        } else if (type === "warning") {
            console.warn(`${prefix} ${message}`);
        } else if (type === "error") {
            if (error) {
                console.error(`${prefix} ${message}`, error);
            } else {
                console.error(`${prefix} ${message}`);
            }
        }
    }
}
