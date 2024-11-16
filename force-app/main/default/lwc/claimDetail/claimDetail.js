import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getClaimsForUser from '@salesforce/apex/ClaimController.getClaimDetails';


export default class ClaimDetail extends LightningElement {
    @api recordId;
    claim;
    error;

    @wire(getClaimsForUser, { claimId: '$recordId' })
    wiredClaim({ error, data }) {
        if (data) {
            this.claim = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.claim = undefined;
        }
    }
}

