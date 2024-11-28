import { LightningElement, track, wire, api } from 'lwc';
import getInsuranceProducts from '@salesforce/apex/InsuranceController.getInsuranceProducts';
import getBasePremium from '@salesforce/apex/InsuranceController.getBasePremium';
import getActivePriceBookIdForProduct from '@salesforce/apex/InsuranceController.getActivePriceBookIdForProduct';
import { createRecord } from 'lightning/uiRecordApi';
import LEAD_OBJECT from '@salesforce/schema/Lead';
import GENDER_FIELD from '@salesforce/schema/Lead.TIS_Gender__c';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import Id from '@salesforce/user/Id';
import getLoggedInUserDetails from '@salesforce/apex/InsuranceController.getLoggedInUserDetails';
import getPaymentFrequencies from '@salesforce/apex/InsuranceController.getPaymentFrequencies';
import getLoggedInUserAccountId from '@salesforce/apex/InsuranceController.getLoggedInUserAccountId';


export default class LeadSimulation extends LightningElement {
    @api userId=Id;
    @track name = '';
    @track nif = '';
    @track licensePlate = '';
    @track gender = ''; 
    @track carValue = '';
    @track age = '';
    @track productId = '';
    @track priceBookId = '';
    @track phone = '';
    @track email = '';
    @track street = '';
    @track basePremium = 0;
    @track finalPremium = 0;
    @track discountPercentage = 0;
    @track submissionMessage = '';
    @track selectedProduct = '';
    @track totalPremiumDisplay = '';
    @track monthlyEquivalentDisplay = '';

    @track showLicensePlateScreen = true;
    @track showPriceScreen = false;
    @track showNameNIFScreen = false;
    @track showDetailsForm = false;
    @track showPriceDisplay = false;
    @track renderFlow = false; 
    @track isModalOpen = false;
    @track isLoading = true;
    @track isFieldDisabled = true;
    @track isLoggedInUser = false;
    
    @api flowApiName = 'fetch_Premium_in_Leads_AutoLaunchFlow';
    @track genderOptions = [];
    @track productOptions = [];
    @track priceResults = [];
    @track paymentFrequencyOptions = [];
    recordTypeId;

    connectedCallback() {
        console.log('connectedCallback invoked');
        this.fetchUserDetails();
    }

    fetchUserDetails() {
        getLoggedInUserDetails()
            .then(data => {
                console.log("This is the json" + JSON.stringify(data));
                if (data) {
                    this.isLoggedInUser = true; // User is logged in
                    this.isFieldDisabled = true; // Disable fields
                    this.name = data.Name || '';
                    this.phone = data.Phone || '';
                    this.email = data.Email || '';
                    this.gender = data.Gender || '';
                    this.street = data.Street || '';
                    this.age = data.Age || '';
                    this.nif = data.NIF || '';
                    console.log("Logged-in user details loaded. Skipping gender fetch.");
                } else {
                    this.isLoggedInUser = false; // User is not logged in
                    this.isFieldDisabled = false; // Enable fields
                    
                    // Fetch gender options only if the user is not logged in
                    console.log("No logged-in user detected. Fetching gender options...");
                    this.fetchGenderOptions();
                }
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
                this.isLoggedInUser = false; // Assume not logged in on error
                this.isFieldDisabled = false; // Enable fields
                this.isLoading = false;
            });
        
        getLoggedInUserAccountId()
            .then(accountId => {
                this.accountId = accountId || null;
                console.log("Fetched AccountId:", this.accountId);
            })
            .catch(error => {
                console.error('Error fetching AccountId:', error);
                this.accountId = null;
            });
    }
    
    
    get randomPrice() {
        // Generate and return a random integer between 21 and 29
        return Math.floor(Math.random() * (29 - 21 + 1)) + 21;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    validateFields(selector) {
        const inputs = this.template.querySelectorAll(selector);
        let isFormValid = true;
    
        inputs.forEach(input => {
            if (!input.reportValidity()) {
                isFormValid = false;
            }
        });
    
        return isFormValid;
    }
    

    backToLicensePlate() {
        console.log('Navigating back to the license plate input screen');
        this.showPriceScreen = false;
        this.showLicensePlateScreen = true;
    }
    
    checkPrice() {
        if (this.validateFields('lightning-input[data-id="licensePlate"]')) {
            this.showLicensePlateScreen = false;
            this.showPriceScreen = true;
        } else {
            console.log('License plate input is invalid. Please correct the input.');
        }
    }

    backToPriceScreen() {
        this.showNameNIFScreen = false;
        this.showPriceScreen = true;
    }

    backToNameNIF() {
        this.showDetailsForm = false;
        this.showNameNIFScreen = true;
    }

    nextToNameNIF() {
        console.log('Navigating to name and NIF screen');
        this.showPriceScreen = false;
        this.showNameNIFScreen = true;
    }

    backToDetails() {
        this.showPriceDisplay = false;
        this.showDetailsForm = true;
    }

    nextToDetails() {
        if (this.validateFields('lightning-input[data-id="name"], lightning-input[data-id="phone"], lightning-input[data-id="email"], lightning-combobox[data-id="gender"], lightning-input[data-id="street"]')) {
            console.log('Personal information is valid. Navigating to details form.');
            this.showNameNIFScreen = false;
            this.showDetailsForm = true;
        } else {
            console.log('Form is invalid. Please correct the errors before proceeding.');
        }
    }

    resetSimulation() {
    this.name = '';
    this.nif = '';
    this.licensePlate = '';
    this.gender = '';
    this.carValue = '';
    this.age = '';
    this.productId = '';
    this.priceBookId = '';
    this.basePremium = 0;
    this.finalPremium = 0;
    this.discountPercentage = 0;
    this.submissionMessage = '';
    this.selectedProduct = '';
    this.street = '';
    this.email = '';
    this.phone = '';

    this.showLicensePlateScreen = true;
    this.showPriceScreen = false;
    this.showNameNIFScreen = false;
    this.showDetailsForm = false;
    this.showPriceDisplay = false;
    this.isModalOpen = false;
    this.renderFlow = false;
    this.priceResults = [];
    }
    
    handleInputChange(event) {
        const field = event.target.dataset.id;
        this[field] = event.target.value;
        console.log(`Updated ${field} to`, this[field]);
    }

    
    // Fetch Lead
    @wire(getObjectInfo, { objectApiName: LEAD_OBJECT })
    wiredObjectInfo({ data, error }) {
        if (data) {
            this.recordTypeId = data.defaultRecordTypeId;
            console.log('Fetched Record Type ID:', this.recordTypeId);
        } else if (error) {
            console.error('Error fetching record type info:', error);
        }
    }

    // Fetch Gender
    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: GENDER_FIELD })
    wiredGenderOptions({ data, error }) {
        if (data) {
            this.genderOptions = data.values;
            console.log('Fetched Gender Options:', this.genderOptions);
        } else if (error) {
            console.error('Error fetching gender picklist values:', error);
        }
    }


    // Fetch Products
    @wire(getInsuranceProducts)
    wiredProductOptions({ error, data }) {
        if (data) {
            this.productOptions = data.map(product => ({
                label: product.Name,
                value: product.Id
            }));
            console.log('Product Options:', JSON.stringify(this.productOptions));
        } else if (error) {
            console.error('Error fetching products:', error);
        }
    }

    @wire(getPaymentFrequencies)
    wiredPaymentFrequencies({ data, error }) {
        if (data) {
            this.paymentFrequencyOptions = data.map(option => ({
                label: option.Frequency_Name__c,
                value: option.Frequency_Value__c
            }));
            console.log('Fetched Payment Frequency Options from Metadata:', JSON.stringify(this.paymentFrequencyOptions));
        } else if (error) {
            console.error('Error fetching payment frequencies:', error);
        }
    }


    seePrices() {
        if (this.validateFields('lightning-input[data-id="nif"], lightning-input[data-id="age"], lightning-input[data-id="carValue"]')) {
            this.showDetailsForm = false;
            this.processAllProducts();
        } else {
            console.log('Form is invalid. Please correct the errors before proceeding.');
        }
    }
    

    async processAllProducts() {
        console.log('Starting the process for all products');
        this.priceResults = [];
    
        for (const product of this.productOptions) {
            console.log(`Processing product: ${product.label}`);
            this.productId = product.value;
            this.productName = product.label;
            this.priceBookId = '';
            this.basePremium = 0;
    
            this.productDescription = this.getProductDescription(this.productName);
            this.productCharacteristics = this.getProductCharacteristics(this.productName);
    
            try {
                await this.fetchPriceBookId();
                await this.fetchBasePremium();
    
                console.log('Product ID:', this.productId);
                console.log('Price BookD:', this.priceBookId);


                this.renderFlow = true;
                await this.waitForFlowCompletion()
    
            } catch (error) {
                console.error(`Error processing product ${product.label}:`, JSON.stringify(error));
            }
        }
    
        console.log('Completed processing all products');
        this.showPriceDisplay = true;
    }
    
    getProductDescription(productName) {
        console.log('Fetching Description for:', productName);
        if (productName === 'Third-Party') {
            return 'Essential protection for your vehicle';
        } else if (productName === 'Extended Third-Party') {
            return 'Comprehensive coverage for peace of mind';
        } else if (productName === 'Comprehensive') {
            return 'Maximum protection and benefits';
        } else {
            return 'Standard insurance plan with essential coverage.';
        }
    }
    
    getProductCharacteristics(productName) {
        console.log('Fetching Characteristics for:', productName);
        if (productName === 'Third-Party') {
            return [
                ' Liability Coverage',
                ' Collision Coverage',
                ' Personal Injury Protection',
                ' Roadside Assistance'
            ];
        } else if (productName === 'Extended Third-Party') {
            return [
                ' Everything in Third-Party',
                ' Comprehensive Coverage',
                ' Uninsured Motorist Coverage',
                ' Personal Accident Protection'
            ];
        } else if (productName === 'Comprehensive') {
            return [
                ' Everything in Extensive Third-Party',
                ' Gap Insurance',
                ' New Car Replacement',
                ' Windshield Repair/Replacement'
            ];
        } else {
            return [
                ' Essential coverage with basic protection',
                ' Meets legal requirements',
                ' Minimal personal vehicle damage protection'
            ];
        }
    }
    
    async fetchPriceBookId() {
        if (this.productId) {
            try {
                const priceBookId = await getActivePriceBookIdForProduct({ productId: this.productId });
                this.priceBookId = priceBookId;
                console.log('Fetched Price Book ID:', this.priceBookId);
            } catch (error) {
                console.error('Error fetching Price Book ID:', error.message);
            }
        } else {
            console.warn('No Product ID selected for fetching Price Book ID');
        }
    }

    async fetchBasePremium() {
        if (this.productId && this.priceBookId) {
            try {
                const basePremium = await getBasePremium({ productId: this.productId, priceBookId: this.priceBookId });
                this.basePremium = basePremium;
                console.log('Fetched Base Premium:', this.basePremium);
            } catch (error) {
                console.error('Error fetching base premium:', error.message);
            }
        } else {
            console.error('Missing Product ID or Price Book ID for fetching Base Premium');
        }
    }

    get flowInputVariables() {
        const inputVariables = [
            { name: 'CarValue_CustomerInput', type: 'Number', value: parseInt(this.carValue) || 0 },
            { name: 'Age_CustomerInput', type: 'Number', value: parseInt(this.age) || 0 },
            { name: 'ProductId', type: 'String', value: this.productId || '' },
            { name: 'ActivePriceBookId', type: 'String', value: this.priceBookId || '' }
        ];
    
        console.log('Input Variables for Flow:', JSON.stringify(inputVariables));
        return inputVariables;
    }

    async waitForFlowCompletion() {
        while (this.renderFlow) {
            await this.delay(50);
        }
    }

    
    
    handleFlowStatusChange(event) {
        console.log('Flow status changed:', event.detail.status);

        if (event.detail.status === 'FINISHED_SCREEN') {
            console.log('Flow finished, processing output variables:', event.detail.outputVariables);

            const outputVariables = event.detail.outputVariables;

            if (outputVariables && outputVariables.length > 0) {
                const finalPremium = (outputVariables.find(item => item.name === 'Final_Premium')?.value || 0).toFixed(2);
                const discountPercentage = (outputVariables.find(item => item.name === 'Discount_Percentage_Field')?.value || 0).toFixed(2);
                const monthlyPremium = (outputVariables.find(item => item.name === 'MonthlyPremium_Equivalent')?.value || 0).toFixed(2);
                const semiAnnualPremium = (outputVariables.find(item => item.name === 'SemiAnnualPremium_Equivalent')?.value || 0).toFixed(2);
                const annualPremium = (outputVariables.find(item => item.name === 'AnnualPremium_Equivalent')?.value || 0).toFixed(2);

                // Calculate semi-annual and annual total amounts
                const semiAnnualTotal = (semiAnnualPremium * 6).toFixed(2);
                const annualTotal = (annualPremium * 12).toFixed(2);

                // Log values for verification
                console.log('Final Premium:', finalPremium);
                console.log('Discount Percentage:', discountPercentage);
                console.log('Monthly Premium Equivalent:', monthlyPremium);
                console.log('Semi-Annual Premium Equivalent:', semiAnnualPremium);
                console.log('Annual Premium Equivalent:', annualPremium);
                console.log('Total Semi-Annual Amount:', semiAnnualTotal);
                console.log('Total Annual Amount:', annualTotal);

                // Store the result in the priceResults array
                this.priceResults.push({
                    productName: this.productName,
                    productDescription: this.productDescription,
                    productCharacteristics: this.productCharacteristics,
                    finalPremium: finalPremium,
                    discountPercentage: discountPercentage,
                    monthlyPremium: monthlyPremium,
                    semiAnnualPremium: semiAnnualPremium,
                    annualPremium: annualPremium,
                    semiAnnualTotalAmount: semiAnnualTotal,
                    annualTotalAmount: annualTotal,
                    displayedPremium: annualPremium, // Set default to monthly
                    selectedFrequency: 'Monthly'
                });

                // Hide the flow after completion
                this.renderFlow = false;
            } else {
                console.error('No output variables found from the flow');
            }
        } else {
            console.log('Flow status:', event.detail.status);
        }
    }
        
    // Change Premium when different Payment Frequency is selected
    handlePaymentFrequencyChange(event) {
        const selectedIndex = event.target.dataset.index;
        const selectedFrequency = event.target.value;
        const selectedPlan = this.priceResults[selectedIndex];
    
        if (selectedPlan) {
            let newPremium;
    
            if (selectedFrequency === 'Monthly') {
                newPremium = selectedPlan.monthlyPremium;
            } else if (selectedFrequency === 'Semi_Annual') {
                newPremium = selectedPlan.semiAnnualPremium;
            } else if (selectedFrequency === 'Annual') {
                newPremium = selectedPlan.annualPremium;
            } else {
                newPremium = selectedPlan.monthlyPremium;
            }
    

            this.priceResults[selectedIndex] = {
                ...selectedPlan,
                selectedFrequency: selectedFrequency || 'Annual', 
                displayedPremium: `${newPremium}`
            };
    
            console.log(`Updated plan ${selectedIndex} with ${selectedFrequency} premium: ${newPremium}€/month`);
        }
    }
    
    // Display Product Summary when Customer clicks on a Product
    handleProductClick(event) {
        if (event.target.tagName === 'SELECT') {
            return;
        }
    
        const index = event.currentTarget.dataset.index;
        const selectedPlan = this.priceResults[index];
    
        if (selectedPlan) {
            this.selectedProduct = selectedPlan.productName;
            this.selectedFrequency = selectedPlan.selectedFrequency;
    
            if (this.selectedFrequency === 'Monthly') {
                this.displayedPremium = `${selectedPlan.monthlyPremium}€/month`;
            } else if (this.selectedFrequency === 'Semi_Annual') {
                this.displayedPremium = `${selectedPlan.semiAnnualTotalAmount}€ (6 months)`;
            } else if (this.selectedFrequency === 'Annual') {
                this.displayedPremium = `${selectedPlan.annualTotalAmount}€ (12 months)`;
            } else {
                this.displayedPremium = `${selectedPlan.monthlyPremium}€/month`;
            }
    
            this.productId = this.productOptions.find(product => product.label === selectedPlan.productName)?.value || ''; // We need to get an Id, not a label as in SelectedProduct
    
            console.log('Selected Product:', this.selectedProduct);
            console.log('Selected Payment Frequency:', this.selectedFrequency);
            console.log('Displayed Premium:', this.displayedPremium);
    
            this.isModalOpen = true; // Show the modal
        } else {
            console.error('Selected plan not found at index:', index);
        }
    }
    
    
    
    closeModal() {
        this.isModalOpen = false; 
    }
    
    stopPropagation(event) {
        event.stopPropagation(); 
    }
    
    confirmQuote() {
        console.log(`Quote requested for: ${this.selectedProduct}`);
        this.isModalOpen = false; 
    }
    

    async createRecordBasedOnUser() {
        
        if (this.isLoggedInUser) {
            // Create an Opportunity for logged-in users
            const fields = {
                Name: this.name, // Use the product name as the Opportunity name
                CloseDate: new Date().toISOString().split('T')[0], // Set close date to today
                StageName: 'Prospecting', // Default stage for the Opportunity
                AccountId: this.accountId, // Use logged-in user's Account ID
                TIS_Insurance_ProductID__c: this.productId, // Custom field for Product ID
                TIS_Final_Premium_Amount__c: this.displayedPremium,
                TIS_Payment_Frequency_c__c: this.selectedFrequency,
                TIS_Car_Value__c: this.carValue,
                TIS__c: this.licensePlate,
                TIS_Email__c: this.email
            };
            const recordInput = { apiName: 'Opportunity', fields };
    
            try {
                await createRecord(recordInput);
                this.submissionMessage = 'Opportunity created successfully!';
                console.log('Opportunity created successfully');
    
                this.isModalOpen = false;
                this.isSuccessModalOpen = true;
            } catch (error) {
                // Check for the specific guest user access error
                if (
                    error.body &&
                    error.body.statusCode === 404 &&
                    error.body.message.includes('The requested resource does not exist')
                ) {
                    console.log(
                        'Known guest user access issue detected, treating it as a successful submission.'
                    );
                    this.submissionMessage = 'Opportunity created successfully!';
                    this.isModalOpen = false;
                    this.isSuccessModalOpen = true;
                } else {
                    // Handle actual errors
                    console.error('Error creating Opportunity record:', JSON.stringify(error));
                    this.submissionMessage = 'An error occurred while creating the Opportunity. Please try again.';
                    this.isModalOpen = false;
                }
            }
        } else {
            // Create a Lead for guest users
            const fields = {
                LastName: this.name,
                TIS_NIF__c: this.nif,
                TIS_License_Plate__c: this.licensePlate,
                TIS_Gender__c: this.gender,
                TIS_Age__c: this.age,
                TIS_Insurance_ProductID__c: this.productId,
                TIS_Car_Value__c: this.carValue,
                Phone: this.phone,
                Email: this.email,
                Street: this.street,
                TIS_Final_Premium_Amount__c: this.displayedPremium,
                TIS_Discount_Percentage__c: this.discountPercentage,
                TIS_Payment_Frequency__c: this.selectedFrequency,
                Status: 'Open'
            };
            const recordInput = { apiName: LEAD_OBJECT.objectApiName, fields };
    
            try {
                await createRecord(recordInput);
                this.submissionMessage = 'Lead created successfully!';
                console.log('Lead created successfully');
    
                this.isModalOpen = false;
                this.isSuccessModalOpen = true;
            } catch (error) {
                // Check for the specific guest user access error
                if (
                    error.body &&
                    error.body.statusCode === 404 &&
                    error.body.message.includes('The requested resource does not exist')
                ) {
                    console.log(
                        'Known guest user access issue detected, treating it as a successful submission.'
                    );
                    this.submissionMessage = 'Lead created successfully!';
                    this.isModalOpen = false;
                    this.isSuccessModalOpen = true;
                } else {
                    // Handle actual errors
                    console.error('Error creating Lead record:', JSON.stringify(error));
                    this.submissionMessage = 'An error occurred while creating the Lead. Please try again.';
                    this.isModalOpen = false;
                }
            }
        }
    }
    
    
    handleOkClick() {
        this.isSuccessModalOpen = false;
        this.resetSimulation();
    }
    
}