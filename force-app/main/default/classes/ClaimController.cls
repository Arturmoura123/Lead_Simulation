public with sharing class ClaimController {
    @AuraEnabled(cacheable=true)
    public static Map<String, List<Case>> getClaimsForUser() {
        User currentUser = [SELECT Id, AccountId FROM User WHERE Id = :UserInfo.getUserId()];
        Map<String, List<Case>> result = new Map<String, List<Case>>();

        if (currentUser.AccountId != null) {
            List<Case> openCases = [SELECT Id, Reason, Subject, Status, CreatedDate, ClosedDate
                                    FROM Case 
                                    WHERE AccountId = :currentUser.AccountId AND Status = 'Open'
                                    ORDER BY CreatedDate DESC];
            List<Case> closedCases = [SELECT Id, Reason, Subject, Status, CreatedDate, ClosedDate 
                                      FROM Case 
                                      WHERE AccountId = :currentUser.AccountId AND Status = 'Closed'
                                      ORDER BY ClosedDate DESC];
            result.put('Open', openCases);
            result.put('Closed', closedCases);
        }
        return result;
    }


    @AuraEnabled(cacheable=true)
    public static Case getClaimDetails(Id claimId) {
        return [SELECT Id, Reason, Subject, Status, CreatedDate, ClosedDate, Account.Name, Contact.Name
                FROM Case
                WHERE Id = :claimId
                LIMIT 1];
    }
}
