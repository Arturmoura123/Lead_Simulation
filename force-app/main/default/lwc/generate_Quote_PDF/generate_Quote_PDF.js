import { LightningElement, wire, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import jsPDFLibrary from '@salesforce/resourceUrl/jsPDFLibrary';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
 
import POLICY_NAME_FIELD from "@salesforce/schema/Tis_Policy__c.Name";
import POLICY_STARTING_DATE_FIELD from "@salesforce/schema/Tis_Policy__c.Tis_Policy_Starting_Date__c";
import POLICY_EXPIRING_DATE_FIELD from "@salesforce/schema/Tis_Policy__c.TIS_Policy_Expiring_Date__c";
 
const fields = [POLICY_NAME_FIELD, POLICY_STARTING_DATE_FIELD, POLICY_EXPIRING_DATE_FIELD];
 
 
//////
export default class GeneratePDFCmp extends LightningElement {
 
   jsPDFInitialized = false;
 
   @api 
   recordId;
   policyName;
   tis_Policy_Starting_Date__c;
   tIS_Policy_Expiring_Date__c;
 
 
   @wire(getRecord, {
       recordId: "$recordId",
       fields
   })
 
   policyData({
       data,
       error
   }) {
       if (data) {
           console.log('data' + JSON.stringify(data))
           this.policyName = getFieldValue(data, POLICY_NAME_FIELD);
           this.tis_Policy_Starting_Date__c = getFieldValue(data, POLICY_STARTING_DATE_FIELD);
          this.tIS_Policy_Expiring_Date__c = getFieldValue(data, POLICY_EXPIRING_DATE_FIELD);
 
       } else if (error) {
           console.log('Error value parse ' + JSON.stringify(error));
       } //end else if
   }
   /////
   renderedCallback(){
       if (!this.jsPDFInitialized) {
           this.jsPDFInitialized = true;
           loadScript(this, jsPDFLibrary).then(() => {
                   console.log('jsPDFLibrary loaded successfully');
               }).catch((error) => {
                   console.error('Error loading jsPDFLibrary', error);
               });
       }
   }



 
    generatePDF() {
       if (this.jsPDFInitialized) {
           try {
               const {
                   jsPDF
               } = window.jspdf;
               const doc = new jsPDF();
 
               doc.text('Insurance Policy', 70, 20);
               doc.line(60, 24, 145, 24);
 
               doc.setLineWidth(2);
               doc.setFontSize(14)
               doc.setFont('arial black');
 
               doc.text('Policy Name:', 30, 60);
           doc.text('Policy Starting Date:', 30, 60);
             doc.text('Policy Expring Date:', 30, 60);
 
               doc.text(this.policyName, 70, 60);
             doc.text(this.tis_Policy_Starting_Date__c,toString(), 70, 60);
              doc.text(this.tIS_Policy_Expiring_Date__c,toString(), 70, 60);
 
           // Save the PDF.
           doc.save('Policy.pdf');
 
           } catch (error) {
               console.log('Error in generating PDF', JSON.stringify(error));
           }//end try ... catch
       } else {
           console.error('jsPDF library not initialised');
       }
   }
 
}