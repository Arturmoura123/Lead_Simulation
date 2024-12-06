public with sharing class ProfileController {
    @AuraEnabled(cacheable=true)
    public static Account getUserProfile() {
        // If you want to get the AccountId associated with the logged-in user, you first need to retrieve the ContactId from the User object, then fetch the AccountId from the Contact. 
        String contactId = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()].ContactId;
    
        if (contactId == null) {
            throw new AuraHandledException('No Contact associated with this user.');
        }

        String accountId = [SELECT AccountId FROM Contact WHERE Id = :contactId].AccountId;
    
        if (accountId == null) {
            throw new AuraHandledException('No Account associated with this Contact.');
        }
    
        System.debug('Fetched Account ID: ' + accountId);
    
        return [SELECT Id, Name, PersonEmail, Phone, Address__c, TIS_NIF__c
                FROM Account 
                WHERE Id = :accountId LIMIT 1];
    }

    @AuraEnabled
    public static void updateUserProfile(Account updatedAccount) {
        try {
            System.debug('Received Account Data: ' + updatedAccount);
    
            if (String.isEmpty(updatedAccount.Id)) {
                throw new AuraHandledException('Account Id is missing. Cannot update.');
            }
    
            // Fetch the existing account from the database
            Account existingAccount = [SELECT PersonEmail, Phone, Address__c
                                        FROM Account
                                        WHERE Id = :updatedAccount.Id];
    
            // Perform custom mapping (exclude Name field)
            existingAccount.PersonEmail = updatedAccount.PersonEmail;
            existingAccount.Phone = updatedAccount.Phone;
            existingAccount.Address__c = updatedAccount.Address__c;
    
            System.debug('Updated Account Data: ' + existingAccount);
    
            // Update the account
            update existingAccount;
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            throw new AuraHandledException('Error updating profile: ' + e.getMessage());
        }
    }
}
