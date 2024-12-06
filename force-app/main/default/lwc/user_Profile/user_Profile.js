import { LightningElement, wire, track } from 'lwc';
import getUserProfile from '@salesforce/apex/ProfileController.getUserProfile';
import updateUserProfile from '@salesforce/apex/ProfileController.updateUserProfile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class UserProfile extends LightningElement {
    @track userProfile = {};
    @track isEditable = false;
    @track error;

    @wire(getUserProfile)
    wiredUser({ data, error }) {
        console.log('getUserProfile wire service triggered');
        if (data) {
            console.log('Fetched user profile:', JSON.stringify(data));
            this.userProfile = { ...data };
            this.error = null;
        } else if (error) {
            console.error('Error fetching user profile:', error);
            this.error = error.body.message || 'Unknown error occurred';
        }
    }
 
    handleChange(event) {
        const field = event.target.name;
        this.userProfile[field] = event.target.value;
    }

    handleEdit() {
        this.isEditable = true;
    }

    get isNotEditable() {
        return !this.isEditable;
    }


    handleCancel() {
        this.isEditable = false;
        this.userProfile = { ...this.originalProfile };
    }


    handleSave() {
        // Exclude the 'Name' field from the userProfile object before sending to Apex
        const { Name, TIS_NIF__c, ...updatedProfile } = this.userProfile; // Exclude Name field
        console.log('User Profile Data to Save (custom-mapped):', JSON.stringify(updatedProfile));
    
        updateUserProfile({ updatedAccount: updatedProfile })
            .then(() => {
                this.isEditable = false;
                this.showToast('Success', 'Profile updated successfully!', 'success');
                this.originalProfile = { ...this.userProfile };
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                this.showToast('Error', 'Failed to update profile', 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
