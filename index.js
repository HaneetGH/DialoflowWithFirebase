// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {dialogflow, SignIn} = require('actions-on-google');
const axios = require('axios');
const WELCOME_INTENT = 'Default Welcome Intent';
const FALLBACK_INTENT = 'Default Fallback Intent';

const TABLET_RELATED_ISSUE = "tablet_related_issue";
const COMPANY_NAME = 'company_name';
const TABLET_NAME = 'tablet_name';

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
const YOUR_APPS_CLIENT_ID = '959287164059-d0112j3jp11o4h0pb9ur22d6r4icack0.apps.googleusercontent.com';
const app = dialogflow({
  clientId: YOUR_APPS_CLIENT_ID
});
 app.intent(WELCOME_INTENT, (agent) => {
    agent.add(`Welcome to my agent!`);
   agent.user.storage.session = false;
   agent.add(`Please Login Your self first`);
   agent.add(`Enter Your email`);
   
  });
 
  app.intent(FALLBACK_INTENT, (agent) => {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  });

  app.intent('tablet_related_issue', (agent) => {
    if(!agent.user.storage.session){
       agent.add(`Please Login Yourself first`);
       agent.add(`Enter Your email`);
      return;
    }
    let company_name = agent.parameters[COMPANY_NAME];
    let tablet_name = agent.parameters.tablet_name;
    agent.add(`What Happen to you `+tablet_name );
    // agent.add(`I got your account details, ${payload.name}. What do you want to do next?${tablet_name}`);
  });

app.intent('login_user', (agent) => {
 let email = agent.parameters.email;
  agent.add(email);
    return sendVerificationEmail(agent,email);
   
  });

  app.intent('vpn_issue', (agent) => {
    if(!agent.user.storage.session || agent.user.storage.email==""){
      agent.add(`Please Login Yourself first`);
      agent.add(`Enter Your email`);
     return;
   }

    return sendEmail(agent,agent.user.storage.email, "These are sample Text to reconnect with vpn");
     
     });

  app.intent('user_otp', (agent) => {
    let otp = agent.parameters.otp;
    
    //agent.add(`What Happen to you `+tablet_name+" "+agent.user.storage.someProperty +" " );
   if(otp==agent.user.storage.otp){
     agent.user.storage.email = agent.user.storage.email;
    agent.add(`Verified User `);
    agent.user.storage.session = true;
   }
   else {
    agent.user.storage.email = ``;
    agent.user.storage.session = false;
    agent.add(`Verified Fail `+otp+`--`+agent.user.storage.otp);
   }
    // agent.add(`I got your account details, ${payload.name}. What do you want to do next?${tablet_name}`);
  });



// Intent that starts the account linking flow.
app.intent('Start Signin', (conv) => {
  conv.ask(new SignIn('To get your account details'));
});
// Create a Dialogflow intent with the `actions_intent_SIGN_IN` event.
app.intent('Get Signin', (conv, params, signin) => {
  if (signin.status === 'OK') {
    const payload = conv.user.profile.payload;
    conv.ask(`I got your account details, ${payload.name}. What do you want to do next?`);
  } else {
    conv.ask(`I won't be able to save your data, but what do you want to do next?`);
  }
});


const BASEURL = 'https://us-central1-healthscore-4fcdf.cloudfunctions.net/api/v1/';
function sendVerificationEmail(agent,email) {

  
 return axios.get((BASEURL + "sendVerificationEmail?email="+email+"&code=12345"))
  .then(function (response) {
    // handle success
    console.log(response);
    agent.user.storage.otp = '12345';
   agent.user.storage.email = email;
   agent.add("Verification email send");
  })
  .catch(function (error) {
    // handle error
     agent.add("Verification email send  Fail");
  })
  .finally(function () {
    agent.add("Please check your email");
  });
}

function sendEmail(agent,email,msg) {

  
  return axios.get((BASEURL + "sendVerificationEmail?email="+email+"&msg="+msg))
   .then(function (response) {
     // handle success
  
    agent.add("Information share on your email");
   })
   .catch(function (error) {
     // handle error
      agent.add("email send  Fail");
   })
   .finally(function () {
     agent.add("Please check your email");
   });
 }
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
