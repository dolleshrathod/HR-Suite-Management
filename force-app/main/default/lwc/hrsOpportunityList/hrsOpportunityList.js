/**
 * @author       salesforce-developer-agent
 * @created      2026-06-09
 * @description  Presentational child component. Renders a lightning-datatable of
 *               Opportunity records passed from the parent via @api records.
 *               Supports client-side column sorting.
 * @lastModified 2026-06-09
 */
import { LightningElement, api, track } from "lwc";

const COLUMNS = [
    {
        label: "Opportunity Name",
        fieldName: "opportunityUrl",
        type: "url",
        typeAttributes: {
            label: { fieldName: "name" },
            target: "_blank"
        },
        sortable: true
    },
    {
        label: "Account",
        fieldName: "accountName",
        type: "text",
        sortable: true
    },
    {
        label: "Stage",
        fieldName: "stageName",
        type: "text",
        sortable: true
    },
    {
        label: "Amount",
        fieldName: "amount",
        type: "currency",
        typeAttributes: {
            currencyCode: "USD",
            minimumFractionDigits: 0
        },
        sortable: true
    },
    {
        label: "Close Date",
        fieldName: "closeDate",
        type: "date-local",
        sortable: true
    }
];

export default class HrsOpportunityList extends LightningElement {
    @api records = [];
    @track sortedBy = "closeDate";
    @track sortedDirection = "asc";

    get columns() {
        return COLUMNS;
    }

    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortedBy = fieldName;
        this.sortedDirection = sortDirection;
        this.records = this._sortData([...this.records], fieldName, sortDirection);
    }

    _sortData(data, field, direction) {
        const multiplier = direction === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            const aVal = a[field] ?? "";
            const bVal = b[field] ?? "";
            if (aVal < bVal) return -1 * multiplier;
            if (aVal > bVal) return 1 * multiplier;
            return 0;
        });
    }
}
