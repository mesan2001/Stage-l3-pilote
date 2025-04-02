import { UI } from "./ui.js";
import { DataManager } from "./dataManager.js";
import { FilterManager } from "./filterManager.js";
import { NetworkManager } from "./networkManager.js";

class App {
    constructor() {
        this.initApp();
    }

    async initApp() {
        try {
            this.dataManager = await new DataManager(this).init();
            this.filterManager = await new FilterManager(this).init();
            this.networkManager = await new NetworkManager(this).init();
            this.ui = await new UI(this).init();
            this.setupGlobalEventListeners();
            this.setupPerformanceMonitoring();
        } catch (error) {
            console.error("Error initializing app:", error);
            this.showFatalError(
                "Failed to initialize the application. Please refresh the page or contact support.",
            );
        }
    }

    setupGlobalEventListeners() {
        window.addEventListener("error", this.handleGlobalError.bind(this));
        window.addEventListener(
            "unhandledrejection",
            this.handleUnhandledRejection.bind(this),
        );
    }

    setupPerformanceMonitoring() {
        if ("PerformanceObserver" in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        console.log("Performance entry:", entry);
                    }
                });
                observer.observe({ entryTypes: ["resource", "navigation"] });
            } catch (error) {
                console.warn("PerformanceObserver setup failed:", error);
            }
        }
    }

    handleGlobalError(event) {
        console.error("Global error:", event.error);
        this.showErrorNotification(
            "An unexpected error occurred. Please try again.",
        );
    }

    handleUnhandledRejection(event) {
        console.error("Unhandled promise rejection:", event.reason);
        this.showErrorNotification(
            "An unexpected error occurred. Please try again.",
        );
    }

    showErrorNotification(message) {
        console.error(message);
    }

    showFatalError(message) {
        console.error(message);
        alert(message);
    }

    emit(eventName) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true,
            detail: { app: this },
        });
        console.log(`Emitting event ${eventName}`);
        window.dispatchEvent(event);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.app = new App();
});
