// Copyright (c) Microsoft. All rights reserved.

import AuthenticationContext from 'adal-angular/dist/adal.min.js'
import ApiService from './apiService';

function isDisabled() {
  return authEnabled === false;
}

function isEnabled() {
  return !isDisabled();
}

function onLoad() {
  if (isDisabled()) {
    console.debug("Skipping Auth onLoad because Auth is disabled");
    return
  };

  // Note: "window.location.hash" is the anchor part attached by
  //       the Identity Provider when redirecting the user after
  //       a successful authentication.
  if (authContext.isCallback(window.location.hash)) {
    console.debug("Handling Auth Window callback");
    // Handle redirect after authentication
    authContext.handleWindowCallback();
    var error = authContext.getLoginError();
    if (error) {
      throw new Error('Authentication Error: ' + error);
    }
  } else {
    getUserName(user => {
      if (user) {
        console.log('Signed in as ' + user.Name + ' with ' + user.Email);
      } else {
        console.log('The user is not signed in');
        authContext.login();
      }
    });
  }
}

function getUserName(callback) {
  if (isDisabled()) return;

  if (authContext.getCachedUser()) {
    ApiService.getCurrentUser().then(data => {
      if (data) {
        callback({ Name: "", Email: "" });
      } else {
        callback(null);
      }
    });
  } else {
    console.log('The user is not signed in');
    authContext.login();
  }
}

function logout() {
  if (isDisabled()) return;

  authContext.logOut();
  authContext.clearCache();
}

/**
 * Acquires token from the cache if it is not expired.
 * Otherwise sends request to AAD to obtain a new token.
 */
function getAccessToken(callback) {
  if (isDisabled()) {
    if (callback) callback("client-auth-disabled");
    return;
  }

  authContext.acquireToken(
    appId,
    function (error, accessToken) {
      if (error || !accessToken) {
        console.log('Authentication Error: ' + error);
        authContext.login();
        return;
      }
      if (callback) callback(accessToken);
    }
  );
}

let authEnabled = true;
let tenantId = '00000000-0000-0000-0000-000000000000';
let clientId = '00000000-0000-0000-0000-000000000000';
let appId = '00000000-0000-0000-0000-000000000000';
let aadInstance = '';

if (typeof global.DeploymentConfig === 'undefined') {
  alert('The dashboard configuration is missing.\n\nVerify the content of webui-config.js.');
  throw new Error('The global configuration is missing. Verify the content of webui-config.js.');
}

if (typeof global.DeploymentConfig.authEnabled !== 'undefined') {
  authEnabled = global.DeploymentConfig.authEnabled;
  if (!authEnabled) {
    console.warn('Auth is disabled! (see webui-config.js)');
  }
}

// Add "endsWith" function, not supported by IE (without touching String.prototype)
// TODO: clean up IoT Suite and remove this "workaround"
//       https://github.com/Azure/pcs-remote-monitoring-webui/issues/700
function stringEndsWith(haystack, needle) {
  return haystack.substr(haystack.length - needle.length, needle.length) === needle;
};

tenantId = global.DeploymentConfig.aad.tenant;
clientId = global.DeploymentConfig.aad.appId;
appId = global.DeploymentConfig.aad.appId;
aadInstance = global.DeploymentConfig.aad.instance;

// TODO: remove this code - https://github.com/Azure/pcs-remote-monitoring-webui/issues/700
if (aadInstance && stringEndsWith(aadInstance, '{0}')) {
    aadInstance = aadInstance.substr(0, aadInstance.length - 3);
}

// TODO: support multiple types/providers
if (isEnabled() && global.DeploymentConfig.authType !== 'aad') {
  throw new Error('Unknown auth type: ' + global.DeploymentConfig.authType);
}

let authContext = new AuthenticationContext({
  instance: aadInstance,
  tenant: tenantId,
  clientId: clientId,
  redirectUri: window.location.origin,
  postLogoutRedirectUri: window.location.origin
});

export default {
  onLoad,
  getAccessToken,
  logout
};
