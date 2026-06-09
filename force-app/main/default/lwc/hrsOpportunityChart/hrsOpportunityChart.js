/**
 * @author       salesforce-developer-agent
 * @created      2026-06-09
 * @description  Child component that wraps Chart.js and renders an Opportunity
 *               pipeline doughnut chart. Receives chartData and activeStage via
 *               @api setters and dispatches a stageselect event on segment click.
 * @lastModified 2026-06-09
 */
import { LightningElement, api } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import chartjs from "@salesforce/resourceUrl/chartjs";

const STAGE_COLOR_MAP = {
    Prospecting: "#0070d2",
    Qualification: "#1b96ff",
    "Needs Analysis": "#00aea9",
    "Value Proposition": "#f4bc25",
    "Id. Decision Makers": "#ff9a3c",
    "Perception Analysis": "#e66c37",
    "Proposal/Price Quote": "#dd7a01",
    "Negotiation/Review": "#ba0517",
    "Closed Won": "#4bca81",
    "Closed Lost": "#706e6b",
    default: "#dddbda"
};

const FULL_OPACITY = 1.0;
const DIM_OPACITY = 0.3;

export default class HrsOpportunityChart extends LightningElement {
    chartjsInitialized = false;
    chart = null;
    isLoading = true;
    _chartData = null;
    _activeStage = "";

    @api
    set chartData(value) {
        this._chartData = value;
        if (this.chart) {
            this._updateChart();
        }
    }
    get chartData() {
        return this._chartData;
    }

    @api
    set activeStage(value) {
        this._activeStage = value ?? "";
        if (this.chart) {
            this._highlightStage(this._activeStage);
        }
    }
    get activeStage() {
        return this._activeStage;
    }

    renderedCallback() {
        if (this.chartjsInitialized) {
            return;
        }
        this.chartjsInitialized = true;

        loadScript(this, chartjs)
            .then(() => {
                this.isLoading = false;
                this._initChart();
            })
            .catch((error) => {
                this.isLoading = false;
                this.dispatchEvent(
                    new CustomEvent("charterror", {
                        detail: error?.message ?? "Failed to load Chart.js",
                        bubbles: true,
                        composed: true
                    })
                );
            });
    }

    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    _initChart() {
        const canvas = this.template.querySelector("canvas.chart-canvas");
        if (!canvas) {
            return;
        }

        const data = this._chartData ?? { labels: [], counts: [], totalCount: 0 };
        const labels = data.labels ?? [];
        const counts = data.counts ?? [];

        // eslint-disable-next-line no-undef
        this.chart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels,
                datasets: [
                    {
                        data: counts,
                        backgroundColor: labels.map(
                            (l) => STAGE_COLOR_MAP[l] ?? STAGE_COLOR_MAP.default
                        ),
                        borderWidth: 2,
                        borderColor: "#fff"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            padding: 12,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = data.totalCount || 1;
                                const value = context.parsed ?? 0;
                                const pct = ((value / total) * 100).toFixed(1);
                                return ` ${context.label}: ${value} (${pct}%)`;
                            }
                        }
                    }
                },
                onClick: (_evt, elements) => {
                    if (elements && elements.length > 0) {
                        const idx = elements[0].index;
                        const stageName = this.chart.data.labels[idx];
                        this.dispatchEvent(
                            new CustomEvent("stageselect", {
                                detail: stageName,
                                bubbles: true,
                                composed: true
                            })
                        );
                    }
                }
            }
        });

        if (this._activeStage) {
            this._highlightStage(this._activeStage);
        }
    }

    _updateChart() {
        if (!this.chart || !this._chartData) {
            return;
        }
        const labels = this._chartData.labels ?? [];
        const counts = this._chartData.counts ?? [];

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = counts;
        this.chart.data.datasets[0].backgroundColor = labels.map(
            (l) => STAGE_COLOR_MAP[l] ?? STAGE_COLOR_MAP.default
        );
        this.chart.update();
        this._highlightStage(this._activeStage);
    }

    _highlightStage(stage) {
        if (!this.chart) {
            return;
        }
        const labels = this.chart.data.labels ?? [];
        if (!stage) {
            this.chart.data.datasets[0].backgroundColor = labels.map(
                (l) => STAGE_COLOR_MAP[l] ?? STAGE_COLOR_MAP.default
            );
        } else {
            this.chart.data.datasets[0].backgroundColor = labels.map((l) => {
                const hex = STAGE_COLOR_MAP[l] ?? STAGE_COLOR_MAP.default;
                return l === stage
                    ? this._hexWithOpacity(hex, FULL_OPACITY)
                    : this._hexWithOpacity(hex, DIM_OPACITY);
            });
        }
        this.chart.update();
    }

    _hexWithOpacity(hex, opacity) {
        const clean = hex.replace("#", "");
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
}
