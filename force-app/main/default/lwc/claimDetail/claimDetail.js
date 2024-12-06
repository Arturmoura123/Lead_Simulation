import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getClaimDetails from '@salesforce/apex/ClaimController.getClaimDetails';


export default class ClaimDetail extends NavigationMixin(LightningElement) {
    @api recordId;
    claim;
    error;
    @track isLoading = true;

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
        this.isLoading = false;
    }
    

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Use 24-hour format
        };
        return date.toLocaleString('en-US', options);
    }

    get formattedCreatedDate() {
        return this.formatDateTime(this.claim?.CreatedDate);
    }

    get formattedClosedDate() {
        return this.formatDateTime(this.claim?.ClosedDate);
    }

    get policyName() {
        return this.claim && this.claim.TIS_PolicyID__r ? this.claim.TIS_PolicyID__r.Name : 'N/A';
    }

    get errorMessage() {
        return this.error && this.error.body ? this.error.body.message : 'Unknown error';
    }

    handleBackToClaims() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/my-claims' // The URL path for your "My Area" page
            }
        });
    }
    
}