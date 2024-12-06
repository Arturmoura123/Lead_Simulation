import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class Poli_and_claim extends NavigationMixin(LightningElement) {
    navigateToClaims() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/my-claims'
            }
        });
    }


    navigateToPolicies() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/my-policies' 
            }
        });
    }
}

