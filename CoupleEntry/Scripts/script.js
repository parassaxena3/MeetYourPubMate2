
var map;
var lastMarker;
var mainModule = angular.module("mainModule", ["ngRoute"]);
var chat = $.connection.chatHub;
chat.client.foo = function () { };
$.connection.hub.start().done(function () {
});

mainModule.config(
    function ($routeProvider, $locationProvider) {
        $locationProvider.hashPrefix('');

        $routeProvider.when('/:userId', { templateUrl: baseUrl + 'templates/UserChatBox.html', controller: 'ChatBoxController' }).
            when('/', { templateUrl: baseUrl + 'templates/UserChatBox.html', controller: 'ChatBoxController' }).
            otherwise({ redirectTo: baseUrl + "templates/UserChatBox.html", controller: 'ChatBoxController' });
        //$locationProvider.html5Mode(true);
    }
);

mainModule.run(function ($http, $rootScope, $location, $timeout) {

    GetUserInfo($http, $rootScope);
    $rootScope.showMask = false;
    $rootScope.showModal = true;
    $rootScope.messageValue = "";
    $rootScope.signOut = function () {

        var x = document.cookie;
        var authTypeFromCookie = getCookie('AuthType');

        if (authTypeFromCookie !== '') {
            //Check if Fb
            if (authTypeFromCookie === 'fb') {
                facebookSignOut();
            }
            else {
                //Check if google
                googleSignOut();
            }
        }

        function facebookSignOut() {
            FB.getLoginStatus(function (response) {
                console.log('getLoginStatus in logout: ');

                if (response && response.status === 'connected') {
                    FB.logout(function (response) {
                        console.log('logout response: ');
                        window.location.href = baseUrl + "login/login";
                    });
                } else {
                    console.log('Please log in');
                }
            });
        }

        function googleSignOut() {
            console.log('sigonout');

            //gapi.auth2.init({
            //    client_id: '254132111059-vqf8bgnklrfrdq6b46pkbvjqaua2mo8l.apps.googleusercontent.com'
            //});
            gapi.auth2.init();
            gapi.load('auth2', function () {
                var auth2 = gapi.auth2.getAuthInstance();
                auth2.signOut().then(function () {
                    auth2.disconnect();
                    gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
                    console.log('User signed out.');
                    window.location.href = baseUrl + "login/login";
                });
            });
        }
    }
    $rootScope.ShowMyModal = function () {
        $rootScope.showModal = true;
        angular.element('#myLoginModal').addClass("block");
    }
    $rootScope.HideMyModal = function () {
        $rootScope.showModal = false;
    }
    $rootScope.msgCount = 0;
    chat.client.addNewMessageToPage = function (message) {
        // debugger;
        if (message) {
            if ($rootScope.ActiveChatUser && message.FromUserId == $rootScope.ActiveChatUser) {
                var temp = $rootScope.Messages;
                temp.push(message);
                $rootScope.$apply(function () {
                    $rootScope.Messages = temp;
                });
                $timeout(function () {
                    $(".chatBoxArea").animate({ scrollTop: $('.chatBoxArea').prop("scrollHeight") }, 500);
                }, 1000);
            }
            else if ($rootScope.ActiveChatUser && message.FromUserId != $rootScope.ActiveChatUser) {
                AddUnreadMsgCount($rootScope, message.FromUserId);
            }
            if (!$("#msgBox").is(":focus")) {
                $rootScope.$apply(function () {
                    $rootScope.msgCount++;
                });
                document.title = "(" + $rootScope.msgCount + ")ChatAdda!";
                document.getElementById('msgSound').play();
            }
        }
    }
});

mainModule.controller('indexController', function ($scope, $http, $rootScope, $interval) {
    Initialize($scope, $http, $rootScope);
    $scope.SetMyPosition = function (position) {
        $scope.myLat = position.coords.latitude;
        $scope.myLong = position.coords.longitude;
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 14,
            center: { lat: $scope.myLat, lng: $scope.myLong }
        });
        ShowOnMap($scope.myLat, $scope.myLong, "You");
        UpsertUserPosition(position, $http);
    }

    GetMyLocation($scope);
    $interval(function () {
        GetMyLocation($scope);
    }, 120000);

    $scope.GetOtherUsers = function () {
        $rootScope.showMask = true;
        $http.get(baseUrl + "Home/GetOtherUsers")
            .then(function successCallback(response) {
                if (response.status == 200) {
                    FindNearbyPeople($scope, response.data, $rootScope);
                }
                else {
                    location.reload();
                }

            }, function errorCallback(response) {
                console.log("Unable to perform get request");
            });
    }

    $scope.GetGenderClass = function (gender) {
        var cls = "panel cursorPointer tile panel-";
        if (gender == "Male")
            return cls + "info";
        else
            return cls + "danger";
    }

    $scope.GetLikeClass = function (UserId) {
        if ($rootScope.MyInfo.Likes.indexOf(UserId.toString()) > -1)
            return "pull-right glyphicon glyphicon-heart heartIcon";
        else
            return "pull-right glyphicon glyphicon-heart-empty heartIcon";
    }

    $scope.callback = function (response, status) {
        $scope.yourAddress = "Your Address:" + response.originAddresses[0];
        if (response.rows.length > 0) {

            $scope.usersOnline.forEach(AddGeoData);

            function AddGeoData(person, index) {
                person.Address = response.destinationAddresses[index];
                person.Distance = response.rows[0].elements[index].distance;
                person.Duration = response.rows[0].elements[index].duration;
                person.LastSeen = CalculateLastSeen(parseInt(person.LastSeenDiff));
                person.ShowInNearby = false;
                if (person.Distance && person.Distance.value / 1000 <= $scope.distanceFilter && ($scope.genderFilter == "Both" || $scope.genderFilter == person.Gender)) {
                    person.ShowInNearby = true;
                }
                person.ShowInMatched = false;
                if ($rootScope.MyInfo.Matches.indexOf(person.UserId.toString()) > -1) {
                    person.ShowInMatched = true;
                    $scope.HaveMatches = true;
                }
            }

            $scope.peopleList = $scope.usersOnline;

        }
        $rootScope.showMask = false;
        $scope.$apply();
    }

    $scope.ShowPersonOnMap = function (person) {
        if (lastMarker)
            lastMarker.setMap(null);
        ShowOnMap(person.Latitude, person.Longitude, person.Name, person.Address);
    }

    $scope.ShowUserChat = function (person) {
        window.location.href = baseUrl + "home/chat#/" + person.UserId;
        // window.location.href = baseUrl + "home/chat";
    }

    $scope.LikeUnlike = function (person, objSender) {
        var element = angular.element(objSender.target);
        var liked = element.hasClass("glyphicon-heart-empty");
        AddOrRemoveNewLike(person, liked, $http, $scope, $rootScope);
    }

    $scope.FindUsers = function (event) {
        if (event.keyCode == 13)
            $scope.GetOtherUsers();
    }

});

mainModule.controller("ChatController", function ($scope, $routeParams, $route, $http, $location, $rootScope, $interval) {
    $rootScope.showMask = true;
    $scope.GetMatchedUsers = function () {
        $http.get(baseUrl + "Home/GetMatchedUsers")
            .then(function successCallback(response) {
                if (response.status == 200) {
                 //   debugger;
                    response.data.sort(CompareLastSeen);
                    $rootScope.MatchedUsers = response.data;
                    if ($location.$$url == "/" && $rootScope.MatchedUsers.length > 0)
                        $location.path($rootScope.MatchedUsers[0].UserId);
                    else if ($location.$$url != "/" && $rootScope.MatchedUsers.length > 0 && !InMatchedUsers($rootScope.MatchedUsers, parseInt($location.$$url.substr(1)))) {
                        $location.path($rootScope.MatchedUsers[0].UserId);
                    }
                    else
                        $rootScope.showMask = false;
                }
                else {
                    location.reload();
                }

            }, function errorCallback(response) {
                console.log("Unable to perform get request");
                $rootScope.showMask = false;
            });
    }

    $interval(function () {
        $scope.GetMatchedUsers();
    }, 30000);
    $scope.ShowChatOfUser = function (person) {
        person.UnreadMsgCount = 0;
        $rootScope.ActiveChatUser = person.UserId;
        $rootScope.ActiveChatUserName = person.Name;
        $location.path(person.UserId);
    }
    $rootScope.ResetMessageCount = function () {
        document.title = "ChatAdda!";
        $rootScope.msgCount = 0;
    }

});

mainModule.controller("ChatBoxController", function ($scope, $routeParams, $route, $http, $location, $rootScope, $timeout) {

    if ($routeParams.userId) {
         if ($rootScope.MatchedUsers && $rootScope.MatchedUsers.length > 0 && !InMatchedUsers($rootScope.MatchedUsers, $routeParams.userId)) {
            $location.path($rootScope.MatchedUsers[0].UserId);
        }
        $rootScope.ActiveChatUser = $routeParams.userId;
        $rootScope.showMask = true;
        $http.get(baseUrl + "Home/GetMessages?otherUserId=" + $routeParams.userId)
             .then(function successCallback(response) {
                 if (response.status == 200) {
                     $rootScope.Messages = response.data;
                     $rootScope.showMask = false;
                     $timeout(function () {
                         var objDiv = document.getElementsByClassName("chatBoxArea")[0];
                         objDiv.scrollTop = objDiv.scrollHeight;
                     }, 500);

                 }
                 else {
                     location.reload();
                 }

             }, function errorCallback(response) {
                 console.log("Unable to perform get request");
                 $rootScope.showMask = false;
             });
    }
    else {
        $rootScope.ActiveChatUser = "";
        $rootScope.ActiveChatUserName = "";
        $rootScope.Messages = "";
    }

    $scope.GetMessageClass = function (fromUserId) {
        if (fromUserId == $rootScope.MyInfo.UserId)
            return "mymsg";
        else
            return "hismsg";
    }
    $scope.GetMessageTextClass = function (fromUserId) {
        if (fromUserId == $rootScope.MyInfo.UserId)
            return "mymsgText";
        else
            return "hismsgText";
    }

    $scope.SendMessage = function () {
        //debugger;
        if ($rootScope.messageValue) {
            SendMessage($http, $scope, $rootScope, $rootScope.ActiveChatUser, $timeout);
        }
    }
    $scope.CheckEnter = function (event) {
        if (event.keyCode == 13)
            $scope.SendMessage();
    }
    $("#msgBox").focus();
});
