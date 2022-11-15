/**
 * This file contains authentication parameters. Contents of this file
 * is roughly the same across other MSAL.js libraries. These parameters
 * are used to initialize Angular and MSAL Angular configurations in
 * in app.module.ts file.
 */


 import { LogLevel, Configuration, BrowserCacheLocation } from '@azure/msal-browser';
 import { environment } from 'src/environments/environment';

 const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;
 
 /**
  * Enter here the user flows and custom policies for your B2C application,
  * To learn more about user flows, visit https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview
  * To learn more about custom policies, visit https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-overview
  */
 export const b2cPolicies = {
     names: {
         signUpSignIn: "B2C_1_signupsignin"
     },
     authorities: {
         signUpSignIn: {
             authority: "https://musicvideobuilder.b2clogin.com/musicvideobuilder.onmicrosoft.com/B2C_1_signupsignin",
         }
     },
     authorityDomain: "musicvideobuilder.b2clogin.com"
 };
 
 /**
  * Configuration object to be passed to MSAL instance on creation. 
  * For a full list of MSAL.js configuration parameters, visit:
  * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md 
  */
  export const msalConfig: Configuration = {
     auth: {
         clientId: environment.clientId, // This is the ONLY mandatory field that you need to supply.
         authority: b2cPolicies.authorities.signUpSignIn.authority, // Defaults to "https://login.microsoftonline.com/common"
         knownAuthorities: [b2cPolicies.authorityDomain], // Mark your B2C tenant's domain as trusted.
         redirectUri: '/', // Points to window.location.origin. You must register this URI on Azure portal/App Registration.
     },
     cache: {
         cacheLocation: BrowserCacheLocation.LocalStorage, // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
         storeAuthStateInCookie: isIE, // Set this to "true" if you are having issues on IE11 or Edge
     },
     system: {
         loggerOptions: {
             loggerCallback(logLevel: LogLevel, message: string) {
                 console.log(message);
             },
             logLevel: LogLevel.Error,
             piiLoggingEnabled: false
         }
     }
 }

/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const protectedResources = {
  tagsApi: {
    endpoint: environment.apiEndpoint + "/Tags",
    scopes: ["https://musicvideobuilder.onmicrosoft.com/77a830ed-796d-4bed-be76-a163f5a3ee79/access_as_user"],
  },
  layerUploadApi: {
    endpoint: environment.apiEndpoint + "/LayerUpload",
    scopes: ["https://musicvideobuilder.onmicrosoft.com/77a830ed-796d-4bed-be76-a163f5a3ee79/access_as_user"],
  },
  layerFinderApi: {
    endpoint: environment.apiEndpoint + "/LayerFinders",
    scopes: ["https://musicvideobuilder.onmicrosoft.com/77a830ed-796d-4bed-be76-a163f5a3ee79/access_as_user"],
  },
  clipApi: {
    endpoint: environment.apiEndpoint + "/Clips",
    scopes: ["https://musicvideobuilder.onmicrosoft.com/77a830ed-796d-4bed-be76-a163f5a3ee79/access_as_user"],
  },
  videoApi: {
    endpoint: environment.apiEndpoint + "/Videos*",
    scopes: ["https://musicvideobuilder.onmicrosoft.com/77a830ed-796d-4bed-be76-a163f5a3ee79/access_as_user"],
  },
  userLayerApi: {
    endpoint: environment.apiEndpoint + "/UserLayers",
    scopes: ["https://musicvideobuilder.onmicrosoft.com/77a830ed-796d-4bed-be76-a163f5a3ee79/access_as_user"],
  },
}

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit: 
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: []
};