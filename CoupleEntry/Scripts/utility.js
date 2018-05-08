
function SendMessage($http, $scope, $rootScope, otherUserId, $timeout) {
    //test
    $http.get(baseUrl + "Home/AddMessage?otherUserId=" + otherUserId + "&message=" + $rootScope.messageValue)
            .then(function successCallback(response) {
                if (response.status == 200 && response.data.success) {
                    chat.server.send(response.data.message);
                    $rootScope.Messages.push(response.data.message);
                    $rootScope.messageValue = "";
                    $timeout(function () {
                        $(".chatBoxArea").animate({ scrollTop: $('.chatBoxArea').prop("scrollHeight") }, 500);
                    }, 500);
                }
                else if (response.status == 200 && !response.data.success) {
                    alert(response.data.error);
                }
                else {
                    location.reload();
                }

            }, function errorCallback(response) {
                console.log("Unable to perform get request");
                $rootScope.showMask = false;
            });

}

function GetUserInfo($http, $rootScope) {
    $http.get(baseUrl + "Home/GetUserInfo")
        .then(function successCallback(response) {
            $rootScope.MyInfo = response.data;
        }, function errorCallback(response) {
            console.log("Unable to perform get request");
        });

}

function Initialize($scope, $http, $rootScope) {
    $scope.distanceFilter = 50;
    $scope.genderFilter = "Both";
    $scope.HaveMatches = false;
    $scope.peopleList = [];
    $scope.yourAddress = "";
    //GetUserInfo($http, $rootScope);
    gapi.load('auth2', function () {
        //gapi.auth2.init();
        console.log('auth2 init from script.js initialise');
        gapi.auth2.init({
            client_id: '254132111059-vqf8bgnklrfrdq6b46pkbvjqaua2mo8l.apps.googleusercontent.com'
        });
    });
}

function GetMyLocation($scope) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition($scope.SetMyPosition, ShowError, { maximumAge: Infinity, timeout: 60000, enableHighAccuracy: true });
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function ShowOnMap(lat, lon, label, address) {

    var latLng = new google.maps.LatLng(lat, lon);
    var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        label: label
    });

    map.setCenter(latLng)
    var infowindow = new google.maps.InfoWindow({
        content: address
    });
    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });
    if (label != "You")
        lastMarker = marker;
}

function UpsertUserPosition(position, $http) {
    $http.get(baseUrl + "Home/AddUserPositionToDB?latitude=" + position.coords.latitude + "&longitude=" + position.coords.longitude)
        .then(function successCallback(response) {

        }, function errorCallback(response) {
            console.log("Unable to perform get request");
        });
}

function FindNearbyPeople($scope, users, $rootScope) {

    var destinations = [], origins = [];
    var origin = new google.maps.LatLng($scope.myLat, $scope.myLong);
    users.sort(CompareLastSeen);
    $scope.usersOnline = users;
    origins[0] = origin;
    for (var i = 0; i < users.length; i++) {
        destinations[i] = new google.maps.LatLng(users[i].Latitude, users[i].Longitude);
    }

    if (origins.length > 0 && destinations.length > 0) {
        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
            {
                origins: origins,
                destinations: destinations,
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.METRIC,
            }, $scope.callback);
    }
    else {
        $rootScope.showMask = false;
        alert('Sorry, No one is nearby!');
    }
}

function CompareLastSeen(a, b) {
    if (parseInt(a.LastSeenDiff) < parseInt(b.LastSeenDiff))
        return -1;
    if (parseInt(a.LastSeenDiff) > parseInt(b.LastSeenDiff))
        return 1;
    return 0;
}

function CalculateLastSeen(difference) {

    var lastSeen = difference + " seconds ago.";
    if (difference > 59) {
        difference = Math.floor(difference / 60);
        lastSeen = difference + " minutes ago.";

        if (difference > 59) {
            difference = Math.floor(difference / 60);
            lastSeen = difference + " hours ago.";

            if (difference > 23) {
                difference = Math.floor(difference / 24);
                lastSeen = difference + " days ago.";

                if (difference > 29) {
                    difference = Math.floor(difference / 30);
                    lastSeen = difference + " months ago.";
                }
            }
        }
    }
    return lastSeen;
}

function ShowError(error) {
    var x = document.getElementById("error-div");
    switch (error.code) {
        case error.PERMISSION_DENIED:
            x.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            x.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML = "An unknown error occurred."
            break;
    }
}

function AddOrRemoveNewLike(person, liked, $http, $scope, $rootScope) {
    var targetId = person.UserId.toString();
    $http.get(baseUrl + "Home/AddOrRemoveLike?targetId=" + person.UserId + "&liked=" + liked)
        .then(function successCallback(response) {
            if (response.status != 200) {
                location.reload();
            }
            else {
                if (liked) {
                    $rootScope.MyInfo.Likes.push(targetId);
                    if (response.data) {
                        $rootScope.MyInfo.Matches.push(targetId);
                        person.ShowInMatched = true;
                        if ($rootScope.MyInfo.Matches.length == 1)
                            $scope.HaveMatches = true;
                        alert("YAY! Its a Match!");
                    }
                }
                else {
                    var index = $rootScope.MyInfo.Likes.indexOf(targetId);
                    if (index > -1) {
                        $rootScope.MyInfo.Likes.splice(index, 1);
                    }
                    index = $rootScope.MyInfo.Matches.indexOf(targetId);
                    if (index > -1) {
                        person.ShowInMatched = false;
                        $rootScope.MyInfo.Matches.splice(index, 1);
                        if ($rootScope.MyInfo.Matches.length == 0)
                            $scope.HaveMatches = false;
                    }
                }

            }
        }, function errorCallback(response) {
            console.log("Unable to perform get request");
        });


}

function InMatchedUsers(users, id) {

    for (var i = 0; i < users.length; i++) {
        if (users[i].UserId == id)
            return true;
    }
    return false;
}

function AddUnreadMsgCount($rootScope, id) {
    for (var i = 0; i < $rootScope.MatchedUsers.length; i++) {
        if ($rootScope.MatchedUsers[i].UserId == id) {
            $rootScope.MatchedUsers[i].UnreadMsgCount++;
            break;
        }
    }
}