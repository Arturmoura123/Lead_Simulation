import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getClaimsForUser from '@salesforce/apex/ClaimController.getClaimsForUser';


export default class CustomerArea extends NavigationMixin(LightningElement) {
    @track openClaims = [];
    @track closedClaims = [];
    @track showOpenClaims = true;
    @track showClosedClaims = false;

    @wire(getClaimsForUser)
    wiredClaims({ error, data }) {
        if (data) {
            console.log('Data received:', data);
            // Map and format claims, adding default Reason if needed
            this.openClaims = data.Open.map(claim => ({
                ...claim,
                Reason: claim.Reason ? claim.Reason : 'No Reason Specified',
                formattedDate: new Date(claim.CreatedDate).toLocaleDateString() // Only the date
            }));
            this.closedClaims = data.Closed.map(claim => ({
                ...claim,
                Reason: claim.Reason ? claim.Reason : 'No Reason Specified',
                formattedDate: new Date(claim.ClosedDate).toLocaleDateString() // Only the date
            }));
            console.log('Processed Open Claims:', this.openClaims);
            console.log('Processed Closed Claims:', this.closedClaims);
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }
    

    handleRowClick(event) {
        const recordId = event.currentTarget.dataset.id;
        console.log('Row clicked');
        if (recordId) {
            console.log('Navigating to record:', recordId); // Add this for debugging
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: `/case-detail-page?recordId=${recordId}`
                }
            });
        }
    }
    
    
    toggleOpenClaims() {
        this.showOpenClaims = !this.showOpenClaims;
    }

    toggleClosedClaims() {
        this.showClosedClaims = !this.showClosedClaims;
    }

    get openClaimsIcon() {
        return this.showOpenClaims ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get closedClaimsIcon() {
        return this.showClosedClaims ? 'utility:chevrondown' : 'utility:chevronright';
    }
}