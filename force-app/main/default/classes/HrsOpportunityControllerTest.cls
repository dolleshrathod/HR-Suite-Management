/**
 * @author       salesforce-developer-agent
 * @created      2026-06-09
 * @description  Test class for HrsOpportunityController. Targets 90%+ coverage.
 * @lastModified 2026-06-09
 */
@IsTest
private class HrsOpportunityControllerTest {

    // ─── Test Data Factory ────────────────────────────────────────────────────

    private static Account createTestAccount(String name) {
        Account acc = new Account(Name = name);
        insert acc;
        return acc;
    }

    private static List<Opportunity> createTestOpportunities(Id accountId) {
        List<Opportunity> opps = new List<Opportunity>{
            new Opportunity(
                Name        = 'Test Opp 1',
                StageName   = 'Prospecting',
                CloseDate   = Date.today().addDays(30),
                Amount      = 10000,
                AccountId   = accountId
            ),
            new Opportunity(
                Name        = 'Test Opp 2',
                StageName   = 'Closed Won',
                CloseDate   = Date.today().addDays(60),
                Amount      = 25000,
                AccountId   = accountId
            ),
            new Opportunity(
                Name        = 'Test Opp 3',
                StageName   = 'Needs Analysis',
                CloseDate   = Date.today().addDays(90),
                Amount      = 5000,
                AccountId   = accountId
            )
        };
        insert opps;
        return opps;
    }

    // ─── Tests: getOpportunities ──────────────────────────────────────────────

    @IsTest
    static void testGetOpportunities_returnsRecords() {
        Account acc = createTestAccount('Test Account');
        List<Opportunity> inserted = createTestOpportunities(acc.Id);

        Test.startTest();
        List<HrsOpportunityController.OpportunityWrapper> result =
            HrsOpportunityController.getOpportunities();
        Test.stopTest();

        System.assert(result.size() >= 3, 'Should return at least 3 opportunities');

        HrsOpportunityController.OpportunityWrapper found = null;
        for (HrsOpportunityController.OpportunityWrapper w : result) {
            if (w.name == 'Test Opp 1') {
                found = w;
                break;
            }
        }

        System.assertNotEquals(null, found, 'Test Opp 1 should be present in results');
        System.assertEquals('Prospecting', found.stageName, 'StageName should be Prospecting');
        System.assertEquals(10000, found.amount, 'Amount should be 10000');
        System.assertEquals('Test Account', found.accountName, 'Account name should be populated');
        System.assertNotEquals(null, found.opportunityId, 'opportunityId should be populated');
        System.assertNotEquals('', found.opportunityUrl, 'opportunityUrl should be populated');
        System.assert(
            found.opportunityUrl.contains('/lightning/r/Opportunity/'),
            'opportunityUrl should be a valid Lightning record URL'
        );
        System.assertNotEquals('', found.closeDate, 'closeDate should be populated');
    }

    @IsTest
    static void testGetOpportunities_emptyOrg_returnsEmptyList() {
        Test.startTest();
        List<HrsOpportunityController.OpportunityWrapper> result =
            HrsOpportunityController.getOpportunities();
        Test.stopTest();

        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(0, result.size(), 'Should return empty list when no Opportunities exist');
    }

    @IsTest
    static void testGetOpportunities_nullAccountHandled() {
        Opportunity opp = new Opportunity(
            Name      = 'No Account Opp',
            StageName = 'Qualification',
            CloseDate = Date.today().addDays(15),
            Amount    = 1000
        );
        insert opp;

        Test.startTest();
        List<HrsOpportunityController.OpportunityWrapper> result =
            HrsOpportunityController.getOpportunities();
        Test.stopTest();

        HrsOpportunityController.OpportunityWrapper found = null;
        for (HrsOpportunityController.OpportunityWrapper w : result) {
            if (w.name == 'No Account Opp') {
                found = w;
                break;
            }
        }

        System.assertNotEquals(null, found, 'No Account Opp should be in results');
        System.assertEquals('', found.accountName, 'accountName should be empty string when no Account');
    }

    // ─── Tests: getStagePicklistValues ────────────────────────────────────────

    @IsTest
    static void testGetStagePicklistValues_returnsNonEmptyList() {
        Test.startTest();
        List<Map<String, String>> options = HrsOpportunityController.getStagePicklistValues();
        Test.stopTest();

        System.assertNotEquals(null, options, 'Options should not be null');
        System.assert(options.size() > 0, 'Should return at least one picklist value');
    }

    @IsTest
    static void testGetStagePicklistValues_containsExpectedStage() {
        Test.startTest();
        List<Map<String, String>> options = HrsOpportunityController.getStagePicklistValues();
        Test.stopTest();

        Boolean foundClosedWon = false;
        for (Map<String, String> opt : options) {
            if (opt.get('value') == 'Closed Won') {
                foundClosedWon = true;
                System.assertEquals('Closed Won', opt.get('label'), 'Label should match value for Closed Won');
                break;
            }
        }
        System.assert(foundClosedWon, 'Picklist values should contain Closed Won');
    }

    @IsTest
    static void testGetStagePicklistValues_eachEntryHasLabelAndValue() {
        Test.startTest();
        List<Map<String, String>> options = HrsOpportunityController.getStagePicklistValues();
        Test.stopTest();

        for (Map<String, String> opt : options) {
            System.assertNotEquals(null, opt.get('label'), 'Each option should have a label');
            System.assertNotEquals(null, opt.get('value'), 'Each option should have a value');
            System.assertNotEquals('', opt.get('label'), 'Label should not be empty');
            System.assertNotEquals('', opt.get('value'), 'Value should not be empty');
        }
    }
}
