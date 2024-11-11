import { LightningElement, track, wire, api } from 'lwc';
import getInsuranceProducts from '@salesforce/apex/InsuranceController.getInsuranceProducts';
import getBasePremium from '@salesforce/apex/InsuranceController.getBasePremium';
import getActivePriceBookIdForProduct from '@salesforce/apex/InsuranceController.getActivePriceBookIdForProduct';
import { createRecord } from 'lightning/uiRecordApi';
import LEAD_OBJECT from '@salesforce/schema/Lead';
import GENDER_FIELD from '@salesforce/schema/Lead.TIS_Gender__c';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';

export default class LeadSimulation extends LightningElement {
    @track name = '';
    @track nif = '';
    @track licensePlate = '';
    @track gender = ''; 
    @track carValue = '';
    @track age = '';
    @track productId = '';
    @track priceBookId = '';
    @track basePremium = 0;
    @track finalPremium = 0;
    @track discountPercentage = 0;
    @track submissionMessage = '';

    @track showLicensePlateScreen = true;
    @track showPriceScreen = false;
    @track showNameNIFScreen = false;
    @track showDetailsForm = false;
    @track showPriceDisplay = false;
    @track renderFlow = false; // Flag to control flow rendering
    

    @api flowApiName = 'fetch_Premium_in_Leads_AutoLaunchFlow';
    @track genderOptions = [];
    @track productOptions = [];
    @track priceResults = [];
    @track paymentOptions = [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Biannual', value: 'biannual' },
        { label: 'Annual', value: 'annual' }
    ];
    recordTypeId;



    get randomPrice() {
        // Generate and return a random integer between 21 and 29
        return Math.floor(Math.random() * (29 - 21 + 1)) + 21;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    checkPrice() {
        console.log('Navigating to price screen');
        this.showLicensePlateScreen = false;
        this.showPriceScreen = true;
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
        console.log('Navigating to details form');
        this.showNameNIFScreen = false;
        this.showDetailsForm = true;
    }

    leaveSimulation() {
        this.showLicensePlateScreen = true;
        this.showPriceScreen = false;
        this.showNameNIFScreen = false;
        this.showDetailsForm = false;
        this.showPriceDisplay = false;
        this.renderFlow = false;
    }
    
    

    // Fetch gender options
    @wire(getObjectInfo, { objectApiName: LEAD_OBJECT })
    wiredObjectInfo({ data, error }) {
        if (data) {
            this.recordTypeId = data.defaultRecordTypeId;
            console.log('Fetched Record Type ID:', this.recordTypeId);
        } else if (error) {
            console.error('Error fetching record type info:', error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: GENDER_FIELD })
    wiredGenderOptions({ data, error }) {
        if (data) {
            this.genderOptions = data.values;
            console.log('Fetched Gender Options:', this.genderOptions);
        } else if (error) {
            console.error('Error fetching gender picklist values:', error);
        }
    }

    // Fetch insurance products
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

    handleInputChange(event) {
        const field = event.target.dataset.id;
        this[field] = event.target.value;
        console.log(`Updated ${field} to`, this[field]);
    }

    async processAllProducts() {
        console.log('Starting the process for all products');
        this.priceResults = [];
    
        for (const product of this.productOptions) {
            console.log(`Processing product: ${product.label}`);
            this.productId = product.value;
            this.productName = product.label;

            this.productDescription = this.getProductDescription(this.productName);
            this.productCharacteristics = this.getProductCharacteristics(this.productName);

            try {
                await this.fetchPriceBookId();
                await this.fetchBasePremium();
    
                console.log('Product ID:', this.productId);
                console.log('Price Book ID:', this.priceBookId);
    
                
                this.renderFlow = true;
                await this.delay(750); // Allow time for rendering
    
            } catch (error) {
                console.error(`Error processing product ${product.label}:`, JSON.stringify(error));
            }
        }
    
        console.log('Completed processing all products');
        this.showPriceDisplay = true;
        
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

    seePrices() {
        
        this.showDetailsForm = false;
        this.processAllProducts();
    
        console.log('Preparing to pass input variables to flow');
        console.log('Car Value:', this.carValue);
        console.log('Age:', this.age);
        console.log('Base Premium:', this.basePremium);
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
                    annualTotalAmount: annualTotal
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
        
        

    handleSelectMonthly(event) {
        const selectedIndex = event.target.dataset.index;
        const selectedPlan = this.priceResults[selectedIndex];
        console.log('Selected Monthly Plan:', selectedPlan);
        // Implement further actions here (e.g., update UI or save the choice)
    }

    handleSelectBiannual(event) {
        const selectedIndex = event.target.dataset.index;
        const selectedPlan = this.priceResults[selectedIndex];
        console.log('Selected Biannual Plan:', selectedPlan);
        // Implement further actions here (e.g., update UI or save the choice)
    }

    handleSelectAnnual(event) {
        const selectedIndex = event.target.dataset.index;
        const selectedPlan = this.priceResults[selectedIndex];
        console.log('Selected Annual Plan:', selectedPlan);
        // Implement further actions here (e.g., update UI or save the choice)
    }

    getProductDescription(productName) {
        console.log('Fetching Description for:', productName);
        if (productName === 'Comprehensive') {
            return 'Comprehensive coverage includes protection against a variety of incidents, providing peace of mind for full vehicle protection.';
        } else if (productName === 'Third-Party') {
            return 'Third-party insurance offers basic coverage, protecting against damage you may cause to others.';
        } else if (productName === 'Extended Third-Party') {
            return 'Extended third-party coverage includes additional benefits such as theft protection and fire damage.';
        } else {
            return 'Standard insurance plan with essential coverage.';
        }
    }

    getProductCharacteristics(productName) {
        console.log('Fetching Description for:', productName);
        if (productName === 'Comprehensive') {
            return [
                'Covers vehicle damage from natural disasters',
                'Includes protection against theft and vandalism',
                'Third-party liability coverage included',
                'Full peace of mind with extensive protection'
            ];
        } else if (productName === 'Third-Party') {
            return [
                'Basic coverage for third-party damage',
                'Affordable option for minimum protection',
                'Mandatory by law in most regions',
                'Limited coverage for personal vehicle damage'
            ];
        } else if (productName === 'Extended Third-Party') {
            return [
                'Additional coverage for theft and fire',
                'Includes third-party liability',
                'For those wanting more than basic protection',
                'Affordable extended protection'
            ];
        } else {
            return [
                'Essential coverage with basic protection',
                'Meets legal requirements',
                'Minimal personal vehicle damage protection'
            ];
        }
    }

    async createLead() {
        const fields = {
            LastName: this.name,
            TIS_NIF__c: this.nif,
            TIS_License_Plate__c: this.licensePlate,
            TIS_Gender__c: this.gender,
            TIS_Age__c: this.age,
            Product2Id: this.productId,
            TIS_Car_Value__c: this.carValue,
            TIS_Final_Premium_Amount__c: this.finalPremium,
            TIS_Discount_Percentage__c: this.discountPercentage
        };
        const recordInput = { apiName: LEAD_OBJECT.objectApiName, fields };
        try {
            await createRecord(recordInput);
            this.submissionMessage = 'Lead created successfully!';
            console.log('Lead created successfully');
        } catch (error) {
            console.error('Error creating Lead record:', error);
            this.submissionMessage = 'Por agora é tudo. Obrigado e volte sempre!';
        }
    }
}