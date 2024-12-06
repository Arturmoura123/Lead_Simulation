import { LightningElement, wire, track } from 'lwc';
import getPoliciesForUser from '@salesforce/apex/PolicyController.getPoliciesForUser';
import { NavigationMixin } from 'lightning/navigation';

export default class MyPolicies extends NavigationMixin(LightningElement) {
    @track policies = [];
    @track error;

    @wire(getPoliciesForUser)
    wiredPolicies({ data, error }) {
        if (data) {
            console.log('Data received:', data);
            // Map boolean to Yes/No for IsActive__c with fallback handling
            this.policies = data.map(policy => {
                return {
                    ...policy,
                    policyStatus: policy.IsActive__c === true ? 'Active' : 'Not Active' // Handle true, false, or null
                };
            });
            this.error = undefined;
        } else if (error) {
            console.error('Error fetching policies:', error);
            this.policies = [];
            this.error = error;
        }
    }
    


    navigateToMyArea() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/customer-area'
            }
        });
    }
}
