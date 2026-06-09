/**
 * @author       salesforce-developer-agent
 * @created      2026-06-09
 * @description  Apex controller for the hrsOpportunityDashboard LWC. Provides
 *               cacheable methods to retrieve Opportunity records (with cross-object
 *               Account.Name) and the active StageName picklist values.
 * @lastModified 2026-06-09
 */
public with sharing class HrsOpportunityController {

    // GOVERNOR LIMIT RISK: getOpportunities queries all Opportunities without a LIMIT.
    // In production orgs with >50,000 records this will hit the SOQL row limit.
    // For v1 (scratch org / sandbox demo) this is acceptable.
    // Future story: add pagination or LIMIT + offset pattern.
    @AuraEnabled(cacheable=true)
    public static List<OpportunityWrapper> getOpportunities() {
        List<OpportunityWrapper> result = new List<OpportunityWrapper>();
        try {
            for (Opportunity opp : [
                SELECT Id, Name, StageName, Amount, CloseDate, AccountId, Account.Name
                FROM Opportunity
                ORDER BY CloseDate ASC
            ]) {
                OpportunityWrapper w = new OpportunityWrapper();
                w.opportunityId = opp.Id;
                w.name         = opp.Name;
                w.stageName    = opp.StageName;
                w.amount       = opp.Amount;
                w.closeDate    = opp.CloseDate != null ? String.valueOf(opp.CloseDate) : '';
                w.accountName  = opp.Account != null ? opp.Account.Name : '';
                w.opportunityUrl = '/lightning/r/Opportunity/' + opp.Id + '/view';
                result.add(w);
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'HrsOpportunityController.getOpportunities error: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getStagePicklistValues() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        try {
            Schema.DescribeFieldResult fieldResult = Opportunity.StageName.getDescribe();
            for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
                if (entry.isActive()) {
                    options.add(new Map<String, String>{
                        'label' => entry.getLabel(),
                        'value' => entry.getValue()
                    });
                }
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'HrsOpportunityController.getStagePicklistValues error: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        return options;
    }

    public class OpportunityWrapper {
        @AuraEnabled public String  opportunityId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  stageName;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public String  closeDate;
        @AuraEnabled public String  accountName;
        @AuraEnabled public String  opportunityUrl;
    }
}
