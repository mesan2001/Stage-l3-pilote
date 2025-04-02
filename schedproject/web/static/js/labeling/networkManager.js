export class NetworkManager {
    constructor(app) {
        this.app = app;
        this.visNetwork = null;
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
        this.selectedNodes = new Set();
        this.lodLevels = [
            { distance: 0.1, nodeSize: 20, fontSize: 14 },
            { distance: 0.25, nodeSize: 15, fontSize: 12 },
            { distance: 0.5, nodeSize: 10, fontSize: 10 },
            { distance: 0.75, nodeSize: 5, fontSize: 8 },
            { distance: 1, nodeSize: 3, fontSize: 0 },
        ];
    }

    async init() {
        const container = document.getElementById("networkContainer");
        if (!container) {
            console.error("Network container element not found");
            return;
        }
        const data = {
            nodes: this.nodes,
            edges: this.edges,
        };
        const options = {
            nodes: {
                shape: "box",
                font: { size: 16, face: "Arial" },
            },
            edges: {
                arrows: "to",
                smooth: { type: "cubicBezier" },
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: "UD",
                    sortMethod: "directed",
                },
            },
            physics: {
                enabled: false,
                stabilization: false,
            },
            manipulation: { enabled: false },
        };
        try {
            this.visNetwork = new vis.Network(container, data, options);
            this.visNetwork.on("selectNode", (params) => {
                this.handleNodeSelection(params);
            });
            this.visNetwork.on("deselectNode", (params) => {
                this.handleNodeDeselection(params);
            });
            this.visNetwork.on("afterDrawing", () => this.updateVisibleNodes());
            console.log("Network initialized");
        } catch (error) {
            console.error("Error initializing network:", error);
        }
        return this;
    }

    clearNetwork() {
        console.log("Clearing network");
        this.nodes.clear();
        this.edges.clear();
        this.selectedNodes.clear();
        if (this.visNetwork) {
            this.visNetwork.setData({ nodes: this.nodes, edges: this.edges });
        }
    }

    async updateGraphWithFilteredData() {
        const selectedTables = this.app.filterManager.selectedTables;
        console.log("Updating graph with filtered data");
        this.clearNetwork();
        const currentData = await this.app.dataManager.getCurrentData();

        if (currentData && typeof currentData === "object") {
            console.log(
                "Number of tables in filtered data:",
                Object.keys(currentData).length,
            );

            let nodeId = 1;
            const nodeMap = new Map();

            selectedTables.forEach((tableName) => {
                if (!currentData.hasOwnProperty(tableName)) {
                    console.log(
                        `Selected table ${tableName} is not present in current data`,
                    );
                }
            });

            console.log("Current data: ", currentData);

            for (const [tableName, tableData] of Object.entries(currentData)) {
                console.log(tableName, tableData);
                console.log(selectedTables);
                if (Array.isArray(tableData) && selectedTables.has(tableName)) {
                    const tableSchema = this.app.dataManager.schema[tableName];
                    if (!tableSchema || !tableSchema.columns_info) {
                        console.error(
                            `Schema information not found for table: ${tableName}`,
                        );
                        continue;
                    }

                    const primaryKeyColumn = Object.keys(
                        tableSchema.columns_info,
                    ).find(
                        (column) =>
                            tableSchema.columns_info[column].is_primary_key,
                    );
                    const reprColumn = Object.keys(
                        tableSchema.columns_info,
                    ).find(
                        (column) =>
                            tableSchema.columns_info[column].repr_column,
                    );

                    tableData.forEach((item) => {
                        if (item && item[primaryKeyColumn] !== undefined) {
                            const id = nodeId++;
                            let label =
                                item[reprColumn] ||
                                item[primaryKeyColumn] ||
                                `Item ${id}`;

                            this.nodes.add({
                                id: id,
                                label: `${tableName}: ${String(label)}`,
                                group: tableName,
                                level: this.getTableLevel(tableName),
                            });

                            nodeMap.set(
                                `${tableName}-${item[primaryKeyColumn]}`,
                                id,
                            );
                        }
                    });
                }
            }

            for (const [tableName, tableData] of Object.entries(currentData)) {
                if (selectedTables.has(tableName)) {
                    const relationships =
                        this.app.dataManager.schema[tableName]?.relationships ||
                        [];
                    relationships.forEach((rel) => {
                        const foreignTable = rel.to;
                        if (selectedTables.has(foreignTable)) {
                            const foreignKey = rel.from;
                            const foreignKeyColumn = rel.foreign_key;

                            tableData.forEach((item) => {
                                const sourceNodeId = nodeMap.get(
                                    `${tableName}-${item[this.app.dataManager.getPrimaryKeyField(tableName)]}`,
                                );
                                const targetNodeId = nodeMap.get(
                                    `${foreignTable}-${item[foreignKey]}`,
                                );

                                if (sourceNodeId && targetNodeId) {
                                    this.edges.add({
                                        from: targetNodeId,
                                        to: sourceNodeId,
                                    });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            console.warn("currentData is not an object or is empty");
        }

        console.log("Total nodes added:", this.nodes.length);
        console.log("Total edges added:", this.edges.length);

        this.nodes.forEach((node) => {
            if (node.label) {
                const labelParts = node.label.split("\n");
                if (labelParts.length > 1) {
                    node.label = labelParts[0];
                    node.title = labelParts.slice(1).join("\n");
                }
            }
        });

        this.visNetwork.setData({ nodes: this.nodes, edges: this.edges });
        this.visNetwork.fit();
        this.updateVisibleNodes();
    }

    getTableLevel(tableName) {
        let level = 0;
        let currentTable = tableName;
        while (
            this.app.dataManager.schema[currentTable]?.relationships?.length > 0
        ) {
            level++;
            currentTable =
                this.app.dataManager.schema[currentTable].relationships[0].to;
        }
        return level;
    }

    handleNodeSelection(params) {
        params.nodes.forEach((nodeId) => {
            this.selectedNodes.add(nodeId);
        });
        this.updateNodeStyles();
    }

    handleNodeDeselection(params) {
        params.previousSelection.nodes.forEach((nodeId) => {
            this.selectedNodes.delete(nodeId);
        });
        this.updateNodeStyles();
    }

    updateNodeStyles() {
        this.nodes.forEach((node) => {
            if (this.selectedNodes.has(node.id)) {
                this.nodes.update({
                    id: node.id,
                    color: { background: "#FFA500" },
                });
            } else {
                this.nodes.update({
                    id: node.id,
                    color: null,
                });
            }
        });
    }

    updateWithLabels(labeledData) {
        labeledData.forEach((labeledNode) => {
            const node = this.nodes.get(labeledNode.id);
            if (node) {
                this.nodes.update({
                    id: labeledNode.id,
                    label: `${node.label}\n${labeledNode.label}`,
                    title: labeledNode.description,
                    color: { background: labeledNode.color },
                });
            }
        });
    }

    getSelectedNodes() {
        return Array.from(this.selectedNodes);
    }

    updateVisibleNodes() {
        const visibleNodes = this.getVisibleNodes();
        this.nodes.update(visibleNodes);
    }

    getVisibleNodes() {
        const viewPosition = this.visNetwork.getViewPosition();
        const scale = this.visNetwork.getScale();
        const canvasSize =
            this.visNetwork.canvas.frame.canvas.getBoundingClientRect();
        const visibleRect = {
            left: viewPosition.x - canvasSize.width / 2 / scale,
            right: viewPosition.x + canvasSize.width / 2 / scale,
            top: viewPosition.y - canvasSize.height / 2 / scale,
            bottom: viewPosition.y + canvasSize.height / 2 / scale,
        };

        return this.nodes
            .get()
            .filter(
                (node) =>
                    node.x >= visibleRect.left &&
                    node.x <= visibleRect.right &&
                    node.y >= visibleRect.top &&
                    node.y <= visibleRect.bottom,
            );
    }
}
