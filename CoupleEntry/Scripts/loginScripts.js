
//---------------------FB------------------------
window.fbAsyncInit = function () {
    FB.init({
        appId: '2102340003319821',
        cookie: true,
        xfbml: true,
        version: 'v2.7'
    });

    FB.AppEvents.logPageView();
    FB.Event.subscribe('auth.login', function (response) {
    });
    FB.Event.subscribe('auth.logout', function (response) {
    });
    //FB.getLoginStatus(function (response) {
    //    console.log('getLoginStatus from fbAsyncInit');
    //    statusChangeCallback(response);
    //});
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    //js.src = 'https://connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v2.12&appId=2102340003319821&autoLogAppEvents=1';
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
    console.log('fb sdk');
}(document, 'script', 'facebook-jssdk'));

function checkLoginState() {
    console.log('checkLoginState');

    FB.getLoginStatus(function (response) {
        console.log('getLoginStatus: ');
        statusChangeCallback(response);
    });
    //FB.login(function (response) {
    //    // handle the response
    //    statusChangeCallback(response);
    //}, { scope: 'public_profile,email' });
}

function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);

    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        console.log('Logged In');
        OnSuccessfullFBLogin(response);
    } else {
        console.log('Please log in');
    }

}

function OnSuccessfullFBLogin(callbackResponse) {
    console.log('OnSuccessfullFBLogin');
    console.log('CallbackResponse: ' + callbackResponse);
    console.log('Welcome!  Fetching your information.... ');
    var auth = callbackResponse.authResponse.accessToken;
    var expiresIn = callbackResponse.authResponse.expiresIn;

    FB.api('/me', { locale: 'en_US', fields: 'name, email' },
        function (response) {
            console.log('Fetching your details');
            var imageUrl = "http://graph.facebook.com/" + response.id + "/picture?type=normal";
            var loginModel = { Name: response.name, Email: response.email, ImageUrl: imageUrl, Token: auth, Expiry: expiresIn, AuthType: "fb" };
            LoginCommon(loginModel);
        });
}

//--------------------------------GOOGLE-----------------------

function onSignIn(googleUser) {
    // debugger;
    console.log('sigin google USer');
    console.log('gapi.auth2.getAuthInstance(): ' + gapi.auth2.getAuthInstance());
    var profile = googleUser.getBasicProfile();
    var id = profile.getId(); // Do not send to your backend! Use an ID token instead.
    var name = profile.getName();
    var imageUrl = profile.getImageUrl();
    var emailId = profile.getEmail(); // This is null if the 'email' scope is not present.
    var id_token = googleUser.getAuthResponse().id_token;
    var expiryTime = googleUser.getAuthResponse().expires_in;
    gapi.load('auth2', function () {
        //var auth2 = gapi.auth2.getAuthInstance();
        //auth2.signOut();
        //console.log('Logged out.');
        gapi.auth2.init();
    });


    var loginModel = { Name: name, Email: emailId, ImageUrl: imageUrl, Token: id_token, Expiry: expiryTime, AuthType: "google" };
    $http = angular.injector(["ng"]).get("$http");
    var res = $http.post(baseUrl + 'Login/Login', loginModel).then(function successCallback(response) {
        if (response.data.result == 'Error') {
            //show error
        }
        else if (response.data.result == 'Redirect') {
            window.location = response.data.url;
        }
        else if (response.data.result == "Add") {
            window.location.href = response.data.url;
        }
    }, function errorCallback(response) {
        console.log("Unable to perform get request");
    });

}
//----------------------------COMMON----------------------

function LoginCommon(loginModel) {
    $http = angular.injector(["ng"]).get("$http");
    var res = $http.post(baseUrl + 'Login/Login', loginModel).then(function successCallback(response) {
        if (response.data.result == 'Error') {
            //show error
        }
        else if (response.data.result == 'Redirect') {
            window.location = response.data.url;
        }
        else if (response.data.result == "Add") {
            window.location.href = response.data.url;
        }
    }, function errorCallback(response) {
        console.log("Unable to perform get request");
    });
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
