/**
 * @author       salesforce-developer-agent
 * @created      2026-06-09
 * @description  Parent container component for the Opportunity Pipeline dashboard.
 *               Orchestrates imperative Apex calls, holds all reactive state, and
 *               passes data down to hrsOpportunityChart and hrsOpportunityList children.
 * @lastModified 2026-06-09
 */
import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getOpportunities from "@salesforce/apex/HrsOpportunityController.getOpportunities";
import getStagePicklistValues from "@salesforce/apex/HrsOpportunityController.getStagePicklistValues";

export default class HrsOpportunityDashboard extends LightningElement {
    @track allOpportunities = [];
    @track filteredOpportunities = [];
    @track stageOptions = [];

    selectedStage = "";
    isLoading = true;
    errorMessage = null;
    _dataLoaded = false;

    connectedCallback() {
        this.isLoading = true;
        this.errorMessage = null;
        this._loadData();
    }

    async _loadData() {
        try {
            const [opportunities, stages] = await Promise.all([
                getOpportunities(),
                getStagePicklistValues()
            ]);

            this.allOpportunities = opportunities ?? [];
            this.filteredOpportunities = [...this.allOpportunities];

            this.stageOptions = [
                { label: "All Stages", value: "" },
                ...(stages ?? [])
            ];

            this._dataLoaded = true;
        } catch (error) {
            this.errorMessage =
                error?.body?.message ?? error?.message ?? "An unexpected error occurred.";
            this._dispatchErrorToast(this.errorMessage);
        } finally {
            this.isLoading = false;
        }
    }

    get isReady() {
        return this._dataLoaded && !this.errorMessage;
    }

    get hasError() {
        return !!this.errorMessage;
    }

    get isEmpty() {
        return this._dataLoaded && this.filteredOpportunities.length === 0;
    }

    get totalCount() {
        return this.filteredOpportunities.length;
    }

    get totalAmount() {
        return this.filteredOpportunities.reduce(
            (sum, opp) => sum + (opp.amount ?? 0),
            0
        );
    }

    get chartData() {
        const countMap = {};
        for (const opp of this.allOpportunities) {
            const stage = opp.stageName ?? "Unknown";
            countMap[stage] = (countMap[stage] ?? 0) + 1;
        }
        const labels = Object.keys(countMap);
        const counts = labels.map((l) => countMap[l]);
        return {
            labels,
            counts,
            totalCount: this.allOpportunities.length
        };
    }

    handleStageChange(event) {
        this.selectedStage = event.detail.value;
        this._applyStageFilter();
    }

    handleChartStageSelect(event) {
        this.selectedStage = event.detail ?? "";
        this._applyStageFilter();
    }

    _applyStageFilter() {
        if (this.selectedStage === "") {
            this.filteredOpportunities = [...this.allOpportunities];
        } else {
            this.filteredOpportunities = this.allOpportunities.filter(
                (opp) => opp.stageName === this.selectedStage
            );
        }
    }

    _dispatchErrorToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: "Error Loading Opportunities",
                message,
                variant: "error"
            })
        );
    }
}
