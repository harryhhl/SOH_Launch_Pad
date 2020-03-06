var AzureAccessToken = "";
var AzureAccount = null;

var AzureAuthen = (function() 
{
    'use strict';
  
    var msalConfig = {
        auth: {
            clientId: "be8b9d83-8c3b-4292-ba74-c267439f1541",
            authority: "https://login.microsoftonline.com/common"
        },
        cache: {
            cacheLocation: "localStorage",
            storeAuthStateInCookie: true
        }
    };
    
    var requestObj = {
        scopes: ["user.read", "User.ReadBasic.All"]
    };

    var graphConfig = {
        getGroupEndpoint: "https://graph.microsoft.com/v1.0/users/{me}/getMemberGroups",
        getPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value"
    };

    var checkStepPass = 2;
    var checkSteps = 0;

    var myMSALObj = new Msal.UserAgentApplication(msalConfig);
    // Register Callbacks for redirect flow
    myMSALObj.handleRedirectCallback(authRedirectCallBack);

    var initCallbacks = null;

    function authRedirectCallBack(error, response) {
        if (error) {
            console.log(error);
        }
        else {
            if (response.tokenType === "access_token") {
                console.log("token type is:" + response.tokenType);
                AzureAccessToken = response.accessToken;
            } else {
                console.log("token type is:" + response.tokenType);
            }
        }
    }

    function acquireToken() {
        //Always start with acquireTokenSilent to obtain a token in the signed in user from cache
        myMSALObj.acquireTokenSilent(requestObj).then(function (tokenResponse) {
            AzureAccessToken = tokenResponse.accessToken;
            AzureAccount = myMSALObj.getAccount();
            // if(typeof AzureAccount.idToken.groups === "undefined" )
            //     callMSGraph(graphConfig.getGroupEndpoint.replace("{me}", AzureAccount.userName), tokenResponse.accessToken, graphAPICallback, graphConfig.getGroupEndpoint);
            // else
                checkSteps = checkSteps + 1;

            getUserPhoto(graphConfig.getPhotoEndpoint, tokenResponse.accessToken, graphAPICallback, graphConfig.getPhotoEndpoint, "GET");

        }).catch(function (error) {
            console.log(error);
            // Upon acquireTokenSilent failure (due to consent or interaction or login required ONLY)
            // Call acquireTokenRedirect
            if (requiresInteraction(error.errorCode)) {
                myMSALObj.acquireTokenRedirect(requestObj);
            }
        });
    }

    function callMSGraph(theUrl, accessToken, callback, endpoint, method="POST") {
        var xmlHttp = new XMLHttpRequest();

        const request = {
            securityEnabledOnly: true
          };

        xmlHttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200)
                callback(JSON.parse(this.responseText), endpoint);
        }
        xmlHttp.open(method, theUrl, true); // true for asynchronous
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xmlHttp.setRequestHeader('Content-Type', 'application/json;odata=verbose');
        xmlHttp.send(JSON.stringify(request));
    }

    function getUserPhoto(theUrl, accessToken, callback, endpoint, method="POST") {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.responseType = "blob";
        const request = {
            securityEnabledOnly: true
          };

        xmlHttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200)
                callback(this.response, endpoint);
            else if (this.readyState == 4)
                callback(null, endpoint);
        }
        xmlHttp.open(method, theUrl, true); // true for asynchronous
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xmlHttp.setRequestHeader('Content-Type', 'application/json;odata=verbose');
        xmlHttp.send(JSON.stringify(request));
    }

    function graphAPICallback(data, endpoint) {

        console.log(data);

        if(endpoint == graphConfig.getGroupEndpoint)
        {
            checkSteps = checkSteps + 1;
            if(data.value != "undefined")
            {
                AzureAccount.idToken.groups = data.value;
                CheckReady();
            }
        }
        else if(endpoint == graphConfig.getPhotoEndpoint)
        {
            checkSteps = checkSteps + 1;
            AzureAccount.Photo = data;
            CheckReady();
        }
    }

    function requiresInteraction(errorCode) {
        if (!errorCode || !errorCode.length) {
            return false;
        }
        return errorCode === "consent_required" ||
            errorCode === "interaction_required" ||
            errorCode === "login_required";
    }

    function CheckReady()
    {
        if(checkSteps >= checkStepPass)
            initCallbacks();
    }

    function signOut() {
        myMSALObj.logout();     
    }

    function getInitial() 
    {
        if(AzureAccount == null) return "";

        var words = AzureAccount.name.split(" ");
        if(words.length >= 2)
        {
            return words[0].substr(0, 1).toUpperCase() + words[1].substr(0, 1).toUpperCase();
        }
        else
        {
            return AzureAccount.name.substr(0, 2).toUpperCase();
        }
    }

    return {
      Init: function(callback, waitLoginCallback=null) {
        if (myMSALObj.getAccount() && !myMSALObj.isCallback(window.location.hash)) 
        {
            initCallbacks = callback;
            acquireToken();
        }
        else if(myMSALObj.isCallback(window.location.hash))
        {
            console.log("callbacks.");
        }
        else if(waitLoginCallback != null)
        {
            //myMSALObj.loginRedirect(requestObj);
            waitLoginCallback();
        }
      }
      ,
      SignIn: function() {
        myMSALObj.loginRedirect(requestObj);
      },
      SignOut: function() {
        AzureAccessToken = "";
        AzureAccount = null;
        signOut();
      }
      ,
      GetUserInitial: getInitial
    };
}());



// Browser check variables
var ua = window.navigator.userAgent;
var msie = ua.indexOf('MSIE ');
var msie11 = ua.indexOf('Trident/');
var msedge = ua.indexOf('Edge/');
var isIE = msie > 0 || msie11 > 0;
var isEdge = msedge > 0;