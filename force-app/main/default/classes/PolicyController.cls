public with sharing class PolicyController {
    @AuraEnabled(cacheable=true)
    public static List<Tis_Policy__c> getPoliciesForUser() {
        User currentUser = [SELECT Id, ContactId, AccountId FROM User WHERE Id = :UserInfo.getUserId()];
        System.debug('Current User ContactId: ' + currentUser.ContactId);

        if (currentUser.AccountId != null) {
            // Fetch all Policies associated with the Account
            List<Tis_Policy__c> policies = [
                SELECT Id, Name, Premium__c, TIS_Policy_Expiring_Date__c, TIS_AccountID__c, TIS_Insurance_ProductID__r.Name, IsActive__c, Contract_Link__c
                FROM Tis_Policy__c 
                WHERE TIS_AccountID__c = :currentUser.AccountId
            ];
            System.debug('Fetched Policies: ' + policies);

            return policies;
        } else {
            System.debug('No AccountId found for the current user. Cannot fetch policies.');
            return new List<Tis_Policy__c>();
        }
    }
}
