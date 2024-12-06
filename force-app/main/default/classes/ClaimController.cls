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
        try {
            return [SELECT Id, Reason, Subject, Status, CreatedDate, ClosedDate, 
                    Account.Name, Contact.Name, Owner.Name, Priority, Description, 
                    Type, TIS_PolicyID__r.Name 
                    FROM Case
                    WHERE Id = :claimId
                    LIMIT 1];
        } catch (Exception e) {
            System.debug('Error in getClaimDetails: ' + e.getMessage());
            throw new AuraHandledException('Failed to retrieve case details: ' + e.getMessage());
        }
    } 
    

    @AuraEnabled(cacheable=true)
    public static Account getUserDetails(String userId) {
        User user = [SELECT ContactId FROM User WHERE Id = :userId LIMIT 1];

        if (user.ContactId == null) {
            throw new AuraHandledException('No Contact is associated with the logged-in user.');
        }

        Account personAccount = [SELECT Id, Name, Phone, PersonEmail, PersonContactId
                                 FROM Account
                                 WHERE PersonContactId = :user.ContactId LIMIT 1];
        return personAccount;
    }
    
    @AuraEnabled
public static void attachPDF(List<String> pdfContents, String oppId) {
    // Validate input
    if (pdfContents == null || pdfContents.isEmpty()) {
        throw new AuraHandledException('No PDF content provided.');
    }

    List<ContentVersion> contentVersions = new List<ContentVersion>();
    List<ContentDocumentLink> contentDocumentLinks = new List<ContentDocumentLink>();

    // Prepare ContentVersion records
    for (String pdfContent : pdfContents) {
        Blob pdfBlob = EncodingUtil.base64Decode(pdfContent);
        ContentVersion contVerFile = new ContentVersion();
        contVerFile.VersionData = pdfBlob;
        contVerFile.Title = 'title'; 
        contVerFile.ContentLocation = 'S'; // Standard Salesforce content location
        contVerFile.PathOnClient = 'title.pdf';
        contentVersions.add(contVerFile);
    }

    // Insert ContentVersion records in bulk
    insert contentVersions;

    // Query ContentDocument IDs for the inserted ContentVersion records
    List<Id> contentVersionIds = new List<Id>();
    for (ContentVersion cv : contentVersions) {
        contentVersionIds.add(cv.Id);
    }
    Map<Id, ContentVersion> contentVersionMap = new Map<Id, ContentVersion>(
        [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id IN :contentVersionIds]
    );

    // Prepare ContentDocumentLink records
    for (ContentVersion cv : contentVersions) {
        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = contentVersionMap.get(cv.Id).ContentDocumentId;
        cdl.LinkedEntityId = oppId; // Replace with dynamic record ID
        cdl.ShareType = 'I';
        cdl.Visibility = 'AllUsers';
        contentDocumentLinks.add(cdl);
    }

    // Insert ContentDocumentLink records in bulk
    insert contentDocumentLinks;
}
}