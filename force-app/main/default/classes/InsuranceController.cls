public with sharing class InsuranceController {


    @AuraEnabled(cacheable=true)
    public static List<Product2> getInsuranceProducts() {
        return [SELECT Id, Name FROM Product2 WHERE isActive = true];
    }


    @AuraEnabled(cacheable=true)
    public static String getActivePriceBookIdForProduct(String productId) {
        System.debug('Artur Fetching Price Book ID for Product ID: ' + productId);
        PricebookEntry activeEntry = [SELECT Pricebook2Id 
                                      FROM PricebookEntry 
                                      WHERE Product2Id = :productId 
                                      AND IsActive = true 
                                      LIMIT 1];
        if (activeEntry == null) {
            throw new AuraHandledException('No active PricebookEntry found for the given product.');
        }
        System.debug('Fetched Price Book ID: ' + activeEntry.Pricebook2Id);
        return activeEntry.Pricebook2Id;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static Decimal getBasePremium(String productId, String priceBookId) {
        System.debug('Product ID: ' + productId);
        System.debug('Price Book ID: ' + priceBookId);
    
        try {
            PricebookEntry entry = [SELECT UnitPrice 
                                    FROM PricebookEntry 
                                    WHERE Product2Id = :productId 
                                    AND Pricebook2Id = :priceBookId 
                                    AND IsActive = true 
                                    LIMIT 1];
            return entry != null ? entry.UnitPrice : 0;
        } catch (Exception e) {
            System.debug('Error in getBasePremium: ' + e.getMessage());
            throw new AuraHandledException('Error fetching base premium.');
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getLoggedInUserDetails() {
        User currentUser = [SELECT Id, AccountId FROM User WHERE Id = :UserInfo.getUserId()];
        
        if (currentUser.AccountId != null) {
            Account account = [
                SELECT Name, Phone, PersonEmail, Address__c, Gender__c, Age__c, TIS_NIF__c
                FROM Account
                WHERE Id = :currentUser.AccountId
                LIMIT 1
            ];
            
            return new Map<String, String>{
                'Name' => account.Name,
                'Phone' => account.Phone,
                'Email' => account.PersonEmail,
                'Street' => account.Address__c,
                'Gender' => account.Gender__c,
                'Age' => String.valueOf(account.Age__c),
                'NIF' => account.TIS_NIF__c
            };
        }
        
        return null;
    } 

    @AuraEnabled(cacheable=true)
    public static List<PaymentFrequency__mdt> getPaymentFrequencies() {
        return [SELECT DeveloperName, Frequency_Name__c, Frequency_Value__c 
                FROM PaymentFrequency__mdt];
    }


        @AuraEnabled(cacheable=true)
    public static String getLoggedInUserAccountId() {
        User currentUser = [SELECT AccountId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        return currentUser.AccountId;
    }

    
}