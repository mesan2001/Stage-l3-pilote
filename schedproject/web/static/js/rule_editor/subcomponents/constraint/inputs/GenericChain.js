import { BaseComponent } from "../../../../components/BaseComponent.js";

export class GenericChain extends BaseComponent {
    getDefaultOptions() {
        return {
            model: null,
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "",
            placeholder: "Search...",
            label: "",
            required: false,
            validators: [],
            data: [],
        };
    }

    async beforeRender() {
        this.value = this.options.data || [];
        this.items = [];
        this.searchInput = null;
        this.dropdown = null;
        this.listContainer = null;
        await this.loadInitialOptions();
    }

    async loadInitialOptions() {
        try {
            if (!this.options.model) {
                console.error("No model specified for GenericChain");
                this.items = [];
                return;
            }

            // Use the model's getAll method to fetch data
            const data = await this.options.model.getAll();
            this.items = data;
        } catch (error) {
            console.error("Error loading initial options:", error);
            this.items = [];
        }
    }

    async render() {
        const searchInputId = this.getId("search-input");
        const dropdownId = this.getId("dropdown");
        const listContainerId = this.getId("list-container");
        const searchContainerId = this.getId("search-container");

        this.container.innerHTML = `
            <div class="chain-container space-y-4">
                ${
                    this.options.label
                        ? `
                    <label class="block text-sm font-medium text-gray-700">
                        ${this.options.label}
                    </label>
                `
                        : ""
                }

                <div class="relative" id="${searchContainerId}">
                    <div class="relative">
                        <input type="text"
                               id="${searchInputId}"
                               class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="${this.options.placeholder}">
                        <div id="${dropdownId}" class="absolute w-full mt-1 bg-white border rounded-md shadow-lg hidden max-h-60 overflow-y-auto z-50"></div>
                    </div>
                </div>

                <div id="${listContainerId}" class="chain-list space-y-2">
                    ${this.renderItems()}
                </div>
            </div>
        `;
    }

    async bindEvents() {
        // Get fresh references to DOM elements after render
        this.searchInput = this.container.querySelector(
            `#${this.getId("search-input")}`,
        );
        this.dropdown = this.container.querySelector(
            `#${this.getId("dropdown")}`,
        );
        this.listContainer = this.container.querySelector(
            `#${this.getId("list-container")}`,
        );

        // Check if elements exist before binding events
        console.log("DOM elements search:", {
            container: this.container,
            searchInputId: this.getId("search-input"),
            dropdownId: this.getId("dropdown"),
            listContainerId: this.getId("list-container"),
            searchInput: this.searchInput,
            dropdown: this.dropdown,
            listContainer: this.listContainer,
        });

        if (!this.searchInput || !this.dropdown || !this.listContainer) {
            console.error("GenericChain: Required DOM elements not found:", {
                container: this.container.innerHTML,
                searchInput: this.getId("search-input"),
                dropdown: this.getId("dropdown"),
                listContainer: this.getId("list-container"),
            });
            return;
        }

        // Use this.searchInput consistently (not this.input)
        this.searchInput.addEventListener("input", () => {
            if (this.searchInput.value) {
                this.filterOptions(this.searchInput.value);
            } else {
                this.renderDropdownOptions();
                this.dropdown.classList.remove("hidden");
            }
        });

        document.addEventListener("click", (e) => {
            if (!this.searchInput.parentElement.contains(e.target)) {
                this.dropdown.classList.add("hidden");
            }
        });

        this.searchInput.addEventListener("focus", () => {
            this.renderDropdownOptions();
            this.dropdown.classList.remove("hidden");
        });

        this.listContainer.addEventListener("dragstart", (e) => {
            if (e.target.classList.contains("chain-item")) {
                e.target.classList.add("opacity-50");
                e.dataTransfer.setData("text/plain", e.target.dataset.index);
            }
        });

        this.listContainer.addEventListener("dragend", (e) => {
            if (e.target.classList.contains("chain-item")) {
                e.target.classList.remove("opacity-50");
            }
        });

        this.listContainer.addEventListener("dragover", (e) => {
            e.preventDefault();
            const draggingItem =
                this.listContainer.querySelector(".opacity-50");
            const targetItem = e.target.closest(".chain-item");

            if (targetItem && draggingItem !== targetItem) {
                const rect = targetItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                const insertAfter = e.clientY > midY;

                if (insertAfter) {
                    targetItem.parentNode.insertBefore(
                        draggingItem,
                        targetItem.nextSibling,
                    );
                } else {
                    targetItem.parentNode.insertBefore(
                        draggingItem,
                        targetItem,
                    );
                }
            }
        });

        this.listContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            this.updateOrder();
        });

        this.listContainer.addEventListener("click", (e) => {
            if (e.target.closest(".remove-btn")) {
                const item = e.target.closest(".chain-item");
                const index = parseInt(item.dataset.index);
                this.removeItem(index);
            }
        });
    }

    filterOptions(query) {
        const filteredOptions = this.options.customFilter
            ? this.options.customFilter(this.items, query)
            : this.items.filter((option) => {
                  const searchValue =
                      option[this.options.searchColumn]?.toLowerCase() || "";
                  const infoValue = this.options.infoColumn
                      ? option[this.options.infoColumn]?.toLowerCase() || ""
                      : "";
                  const queryLower = query.toLowerCase();

                  return (
                      searchValue.includes(queryLower) ||
                      (infoValue && infoValue.includes(queryLower))
                  );
              });

        this.renderDropdownOptions(filteredOptions);
        this.dropdown.classList.remove("hidden");
    }

    addItem(item) {
        if (!this.value.some((existingItem) => existingItem.id === item.id)) {
            this.value.push(item);
            this.refresh();
        }
    }

    removeItem(index) {
        this.value.splice(index, 1);
        this.refresh();
    }

    updateOrder() {
        const newOrder = Array.from(this.listContainer.children).map((item) => {
            return this.value[parseInt(item.dataset.index)];
        });
        this.value = newOrder;
        this.refresh();
    }

    refresh() {
        if (this.listContainer) {
            this.listContainer.innerHTML = this.renderItems();
        }
        if (this.options.required) {
            this.validate();
        }
    }

    getValue() {
        return this.value.map((item) => item.id);
    }

    setValue(value) {
        this.value = value;
        this.refresh();
    }

    validate() {
        if (this.options.required && this.value.length === 0) {
            return false;
        }
        return this.options.validators.every((validator) =>
            validator(this.value),
        );
    }

    renderDropdownOptions(displayOptions = this.items) {
        if (!this.dropdown) return;

        if (!displayOptions.length) {
            this.dropdown.innerHTML = `
                <div class="p-2 text-gray-500">No options found</div>
            `;
            return;
        }

        this.dropdown.innerHTML = displayOptions
            .map(
                (option) => `
                <div class="p-2 hover:bg-gray-100 cursor-pointer" data-value="${option.id}">
                    <div class="font-medium">${option[this.options.displayColumn] || ""}</div>
                    ${
                        this.options.infoColumn &&
                        option[this.options.infoColumn]
                            ? `
                        <div class="text-sm text-gray-500">${option[this.options.infoColumn] || ""}</div>
                    `
                            : ""
                    }
                </div>
            `,
            )
            .join("");

        this.dropdown
            .querySelectorAll("[data-value]")
            .forEach((optionElement) => {
                optionElement.addEventListener("click", () => {
                    const selectedOption = this.items.find(
                        (opt) =>
                            opt.id === parseInt(optionElement.dataset.value),
                    );
                    this.addItem(selectedOption);
                    this.searchInput.value = ""; // Use searchInput instead of input
                    this.dropdown.classList.add("hidden");
                });
            });
    }

    renderItems() {
        return this.value
            .map(
                (item, index) => `
            <div class="chain-item flex items-center p-2 bg-white border rounded-md shadow-sm"
                 draggable="true"
                 data-index="${index}">
                <div class="flex items-center flex-grow">
                    <div class="cursor-move px-2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                    <div>
                        <span class="font-medium">${item[this.options.displayColumn] || ""}</span>
                        ${
                            this.options.infoColumn &&
                            item[this.options.infoColumn]
                                ? `
                            <span class="text-sm text-gray-500">(${item[this.options.infoColumn]})</span>
                        `
                                : ""
                        }
                    </div>
                </div>
                <button class="remove-btn text-red-500 hover:text-red-700 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `,
            )
            .join("");
    }

    onDestroy() {
        // Clean up event listeners
        if (this.searchInput) {
            this.searchInput.removeEventListener("input", this.inputHandler);
            this.searchInput.removeEventListener("focus", this.focusHandler);
        }

        document.removeEventListener("click", this.documentClickHandler);
    }
}
