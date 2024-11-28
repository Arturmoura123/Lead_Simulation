import { LightningElement, wire, track } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import CASE_OBJECT from '@salesforce/schema/Case'; // Case object schema
import REASON_FIELD from '@salesforce/schema/Case.Reason'; // Reason field schema
import { createRecord } from 'lightning/uiRecordApi';
import getUserDetails from '@salesforce/apex/ClaimController.getUserDetails';
import Id from '@salesforce/user/Id';
import { deleteRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';

export default class MakeClaim extends NavigationMixin(LightningElement) {
    @track formData = {
        licensePlate: '',
        caseReason: '',
        caseSubject: '',
        caseDescription: ''
    };

    @track uploadedFiles = [];
    @track caseReasonOptions = []; // Store picklist options dynamically
    @track recordId; // To store the created Case ID
    @track showModal = false;

    // Fetch picklist values for the Reason field
    @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
    caseObjectInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$caseObjectInfo.data.defaultRecordTypeId',
        fieldApiName: REASON_FIELD
    })
    wiredPicklistValues({ data, error }) {
        if (data) {
            this.caseReasonOptions = data.values.map(option => ({
                label: option.label,
                value: option.value
            }));
        } else if (error) {
            console.error('Error fetching picklist values:', error);
        }
    }

    // Handle input field changes
    handleInputChange(event) {
        const field = event.target.name;
        this.formData[field] = event.target.value;
    }

    handleFileUpload(event) {
        const newlyUploadedFiles = event.detail.files.map(file => ({
            name: file.name,
            documentId: file.documentId,
        }));
    
        // Append newly uploaded files to the existing array
        this.uploadedFiles = [...this.uploadedFiles, ...newlyUploadedFiles];
        console.log('Uploaded Files:', this.uploadedFiles);
    }
    

    connectedCallback() {
        getUserDetails({ userId: Id })
            .then((result) => {
                this.userDetails = result;
            })
            .catch((error) => {
                console.error('Error fetching user details:', error);
            });
    }

    async handleSubmit() {
        try {
            // Validate all fields, including license plate
            if (!this.validateFields()) {
                console.error('Validation failed.');
                return;
            }
    
            // Prepare the record fields for creation
            const fields = {
                License_Plate__c: this.formData.licensePlate,
                Reason: this.formData.caseReason,
                Subject: this.formData.caseSubject,
                Description: this.formData.caseDescription,
                Origin: 'Web',
                Status: 'Open',
                Priority: 'Medium',
                ContactId: this.userDetails.PersonContactId,
            };
    
            const recordInput = { apiName: CASE_OBJECT.objectApiName, fields };
    
            // Create the Case record
            const result = await createRecord(recordInput);
            this.recordId = result.id; // Store the created Case ID
            console.log('Case Created:', result.id);
    
            // Link uploaded files to the Case
            if (this.uploadedFiles.length > 0) {
                await this.linkFilesToCase();
            }
    
            this.showModal = true;
            this.resetForm();
        } catch (error) {
            console.error('Error creating Case:', error);
        }
    }
    

    // Link uploaded files to the Case using ContentDocumentLink
    async linkFilesToCase() {
        const promises = this.uploadedFiles.map(file => {
            const fields = {
                ContentDocumentId: file.documentId,
                LinkedEntityId: this.recordId,
                ShareType: 'V' // Viewer access
            };

            const recordInput = { apiName: 'ContentDocumentLink', fields };
            return createRecord(recordInput);
        });

        try {
            await Promise.all(promises);
            console.log('Files linked to Case successfully');
        } catch (error) {
            console.error('Error linking files to Case:', error);
        }
    }

    async deleteFile(event) {
        const documentId = event.target.dataset.id;
    
        try {
            await deleteRecord(documentId); // Use Lightning Data Service to delete the file
            this.uploadedFiles = this.uploadedFiles.filter(file => file.documentId !== documentId); // Update the list
            console.log('File deleted successfully');
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }
    
    // Reset the form after successful submission
    resetForm() {
        this.formData = {
            licensePlate: '',
            caseReason: '',
            caseSubject: '',
            caseDescription: ''
        };
        this.uploadedFiles = [];
        this.recordId = null; // Reset recordId
        this.template.querySelectorAll('lightning-input, lightning-textarea, lightning-combobox').forEach(input => {
            input.value = '';
        });
    }

    closeModal() {
        this.showModal = false;
    }

    navigateToMyArea() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/my-area' // Replace with the actual URL for the "My Area" page
            }
        });
    }


    validateFields() {
        let isFormValid = true;
    
        // Validate License Plate
        const licensePlateInput = this.template.querySelector('lightning-input[data-id="licensePlate"]');
        const licensePlatePattern = /^(\d{2}-\d{2}-[A-Z]{2})|([A-Z]{2}-\d{2}-\d{2})|(\d{2}-[A-Z]{2}-\d{2})|([A-Z]{2}-[A-Z]{2}-\d{2})|([A-Z]{2}-\d{2}-[A-Z]{2})|(\d{2}-[A-Z]{2}-[A-Z]{2})$/;
    
        if (!licensePlatePattern.test(this.formData.licensePlate)) {
            licensePlateInput.setCustomValidity('License plate must follow the format XX-XX-XX (e.g., 70-BT-05).');
            isFormValid = false;
        } else {
            licensePlateInput.setCustomValidity(''); // Clear any previous validation error
        }
        licensePlateInput.reportValidity(); // Ensure the error message shows up if invalid
    
        // Validate other fields
        this.template.querySelectorAll('lightning-input, lightning-combobox').forEach(input => {
            if (!input.reportValidity()) {
                isFormValid = false;
            }
        });
    
        return isFormValid;
    }
    
    
}
