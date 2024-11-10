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
    @api carValue = '';
    @api age = '';
    @track productOptions = [];
    @track priceResults = [];
    @track showPriceDisplay = false;
    @api discountPercentage = 0;
    @api monthlyPremium = 0;
    @api semiAnnualPremium = 0;
    @api annualPremium = 0;
    @api finalPremium = 0;

    get semiAnnualPremiumPerMonth() {
        return (this.semiAnnualPremium / 6).toFixed(2);
    }

    get annualPremiumPerMonth() {
        return (this.annualPremium / 12).toFixed(2);
    }

    get randomPrice() {
        return Math.floor(Math.random() * (29 - 21 + 1)) + 21;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    @track showLicensePlateScreen = true;
    @track showPriceScreen = false;
    @track showNameNIFScreen = false;
    @track showDetailsForm = false;
    @track renderFlow = false;

    @api flowApiName = 'fetch_Premium_in_Leads_AutoLaunchFlow';
    @track genderOptions = [];
    recordTypeId;

    handleInputChange(event) {
        const field = event.target.dataset.id;
        this[field] = event.target.value;
        console.log(`Updated ${field}: ${this[field]}`);
    }

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

    @wire(getInsuranceProducts)
    wiredProductOptions({ error, data }) {
        if (data) {
            this.productOptions = data.map(product => ({
                label: product.Name,
                value: product.Id
            }));
            console.log('Fetched Product Options:', this.productOptions);
        } else if (error) {
            console.error('Error fetching products:', error);
        }
    }

    checkPrice() {
        console.log('Navigating to price screen');
        this.showLicensePlateScreen = false;
        this.showPriceScreen = true;
    }

    nextToNameNIF() {
        console.log('Navigating to Name and NIF input screen');
        this.showPriceScreen = false;
        this.showNameNIFScreen = true;
    }

    nextToDetails() {
        console.log('Navigating to additional details form');
        this.showNameNIFScreen = false;
        this.showDetailsForm = true;
    }

    seePrices() {
        console.log('Navigating to see prices screen and triggering product processing');
        console.log(`Car Value: ${this.carValue}`);
        console.log(`Age: ${this.age}`);
        this.showDetailsForm = false;
        this.processAllProducts();
    }

    async processAllProducts() {
        console.log('Starting the process for all products');
        this.priceResults = [];

        for (const product of this.productOptions) {
            console.log(`Processing product: ${product.label}`);
            this.productId = product.value;
            try {
                await this.fetchPriceBookId();
                await this.fetchBasePremium();

                console.log('Productid:' + this.productId);
                console.log('PricebookID:' + this.priceBookId);
                console.log('Basepremium:' + this.basePremium);

                const flowInputs = this.getFlowInputVariables(this.basePremium, this.productId, this.priceBookId);
                console.log('Triggering flow with inputs:', JSON.stringify(flowInputs));

                this.renderFlow = true;
                await this.delay(450);

            } catch (error) {
                console.error(`Error processing product ${product.label}:`, error);
            }
        }

        console.log('Completed processing all products');
        this.showPriceDisplay = true;
    }

    async fetchPriceBookId() {
        console.log(`Fetching price book ID for productId: ${this.productId}`);
        try {
            this.priceBookId = await getActivePriceBookIdForProduct({ productId: this.productId });
            console.log('Fetched Price Book ID:', this.priceBookId);
        } catch (error) {
            console.error('Error fetching Price Book ID:', error.message);
        }
    }

    async fetchBasePremium() {
        console.log(`Fetching base premium for productId: ${this.productId} and priceBookId: ${this.priceBookId}`);
        try {
            const basePremium = await getBasePremium({ productId: this.productId, priceBookId: this.priceBookId });
            this.basePremium = basePremium;
            console.log('Fetched Base Premium:', this.basePremium);
        } catch (error) {
            console.error('Error fetching base premium:', error.message);
        }
    }

    getFlowInputVariables(basePremium, productId, priceBookId) {
        console.log('Preparing flow input variables');

        const inputs = [
            { name: 'CarValue_CustomerInput', type: 'Number', value: this.carValue || 0 },
            { name: 'Age_CustomerInput', type: 'Number', value: this.age || 0 },
            { name: 'BasePremium', type: 'Number', value: basePremium || 0 },
            { name: 'ProductId', type: 'String', value: productId || '' },
            { name: 'ActivePriceBookId', type: 'String', value: priceBookId || '' }
        ];
        console.log('Input Variables for Flow:', JSON.stringify(inputs));
        return inputs;
    }

    handleFlowStatusChange(event) {
        console.log('Flow status changed:', event.detail.status);
    
        if (event.detail.status === 'FINISHED_SCREEN') {
            console.log('Flow finished, processing output variables:', event.detail.outputVariables);
    
            const outputVariables = event.detail.outputVariables;
    
            if (outputVariables && outputVariables.length > 0) {
                outputVariables.forEach((variable) => {
                    console.log(`Output Variable - Name: ${variable.name}, Value: ${variable.value}, Type: ${variable.dataType}`);
                });
    
                // Capture and assign output variable values
                this.monthlyPremium = outputVariables.find(item => item.name === 'MonthlyPremium_Equivalent')?.value || 0;
                this.semiAnnualPremium = outputVariables.find(item => item.name === 'SemiAnnualPremium_Equivalent')?.value || 0;
                this.annualPremium = outputVariables.find(item => item.name === 'AnnualPremium_Equivalent')?.value || 0;
                this.finalPremium = outputVariables.find(item => item.name === 'Final_Premium')?.value || 0;
                this.discountPercentage = outputVariables.find(item => item.name === 'Discount_Percentage_Field')?.value || 0;
                this.test_output_variable = outputVariables.find(item => item.name === 'test_output_variable')?.value || 0;
                
                // Calculate semi-annual and annual total amounts based on monthly equivalents
                const semiAnnualTotal = (this.semiAnnualPremium * 6).toFixed(2);
                const annualTotal = (this.annualPremium * 12).toFixed(2);

                // Log calculated values for verification
                console.log('Monthly Premium:', this.monthlyPremium);
                console.log('Semi-Annual Premium (per month):', this.semiAnnualPremium);
                console.log('Annual Premium (per month):', this.annualPremium);
                console.log('Total Semi-Annual Amount:', semiAnnualTotal);
                console.log('Total Annual Amount:', annualTotal);
                console.log('Final Premium:', this.finalPremium);
                console.log('Discount Percentage:', this.discountPercentage);
                console.log('Test variable:', this.test_output_variable);

                // Push results into priceResults or assign them to variables as needed
                this.priceResults.push({
                    productId: this.productId,
                    productName: this.productOptions.find(option => option.value === this.productId)?.label || 'Unknown Product',
                    monthlyPremium: this.monthlyPremium,
                    semiAnnualPremium: this.semiAnnualPremium,
                    annualPremium: this.annualPremium,
                    semiAnnualTotalAmount: semiAnnualTotal,
                    annualTotalAmount: annualTotal,
                    discountPercentage: this.discountPercentage
                });

    
                this.renderFlow = false;
                
            } else {
                console.error('No output variables found from the flow');
            }
        } else {
            console.log('Flow status:', event.detail.status);
        }
    }
    

    leaveSimulation() {
        console.log('Resetting simulation');
        this.showLicensePlateScreen = true;
        this.showPriceScreen = false;
        this.showNameNIFScreen = false;
        this.showDetailsForm = false;
        this.showPriceDisplay = false;
        this.renderFlow = false;
    }
}
