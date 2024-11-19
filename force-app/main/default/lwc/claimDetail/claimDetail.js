import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getClaimDetails from '@salesforce/apex/ClaimController.getClaimDetails';

export default class ClaimDetail extends LightningElement {
    @api recordId;
    claim;
    error;

    connectedCallback() {
        if (!this.recordId) {
            const urlParams = new URL(window.location.href).searchParams;
            this.recordId = urlParams.get('recordId');
            console.log('Manually Retrieved Record ID:', this.recordId);
        }
    }

    @wire(getClaimDetails, { claimId: '$recordId' })
    wiredClaim({ error, data }) {
        if (data) {
            this.claim = data;
            this.error = undefined;
            console.log('Record ID:', this.recordId);
            console.log('Claim Data:', JSON.stringify(this.claim));
        } else if (error) {
            console.error('Error fetching claim data:', error);
            console.log('Detailed error:', JSON.stringify(error));
            this.error = error;
            this.claim = undefined;
        }
    }

    get accountName() {
        return this.claim && this.claim.Account ? this.claim.Account.Name : 'N/A';
    }

    get contactName() {
        return this.claim && this.claim.Contact ? this.claim.Contact.Name : 'N/A';
    }

    get ownerName() {
        return this.claim && this.claim.Owner ? this.claim.Owner.Name : 'N/A';
    }

    get policyName() {
        return this.claim && this.claim.TIS_PolicyID__r ? this.claim.TIS_PolicyID__r.Name : 'N/A';
    }

    get errorMessage() {
        return this.error && this.error.body ? this.error.body.message : 'Unknown error';
    }
}
