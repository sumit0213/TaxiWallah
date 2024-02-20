var map;
var directionsService;
var directionsDisplay;
var marker1 = null;
var marker2 = null;
var marketPrice;
var distance;
var duration;
var selectedMode;
var driverDetailsArray = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 10,
    });

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        provideRouteAlternatives: true,
    });

    initAutocomplete('location1');
    initAutocomplete('location2');

    map.addListener('click', function (event) {
        handleMapClick(event.latLng);
    });

    document.getElementById('location1').addEventListener('change', function () {
        handlePlaceChanged('location1');
    });

    document.getElementById('location2').addEventListener('change', function () {
        handlePlaceChanged('location2');
    });

    marker1 = new google.maps.Marker({
        map: map,
        draggable: true,
        title: 'Current Location',
    });

    marker2 = new google.maps.Marker({
        map: map,
        draggable: true,
        title: 'Enter Second Location',
    });

    marker1.setMap(map);
    marker2.setMap(map);

    google.maps.event.addListener(marker1, 'dragend', function () {
        handleMarkerDrag('location1', marker1.getPosition());
    });

    google.maps.event.addListener(marker2, 'dragend', function () {
        handleMarkerDrag('location2', marker2.getPosition());
    });

    setCurrentLocation();
}

function initAutocomplete(inputId) {
    var input = document.getElementById(inputId);
    var autocomplete = new google.maps.places.Autocomplete(input, { types: ['geocode'] });

    autocomplete.addListener('place_changed', function () {
        handlePlaceChanged(inputId);
    });
}

function handlePlaceChanged(inputId) {
    var location1Input = document.getElementById('location1');
    var location2Input = document.getElementById('location2');

    if (location1Input && location2Input) {
        var geocoder = new google.maps.Geocoder();

        geocodeLocation(geocoder, location1Input.value, function (origin) {
            geocodeLocation(geocoder, location2Input.value, function (destination) {
                calculateDistanceAndTime(origin, destination);
                updateMarkersAndRoute(origin, destination);
            });
        });
    } else {
        document.getElementById('result').innerHTML = '';
    }
}

function geocodeLocation(geocoder, location, callback) {
    geocoder.geocode({ 'address': location }, function (results, status) {
        if (status === 'OK') {
            var coordinates = results[0].geometry.location;
            callback(coordinates);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function calculateDistanceAndTime(origin, destination) {
    var service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
    }, function (response, status) {
        if (status === 'OK') {
            distance = response.rows[0].elements[0].distance.text;
            duration = response.rows[0].elements[0].duration.text;

            document.getElementById('result').innerHTML = `
                <div>Distance: ${distance} | Duration: ${duration}</div>
            `;

            updateMarkersAndRoute(origin, destination);
        } else {
            alert('Error calculating distance and time. Please try again.');
        }
    });
}

function updateMarkersAndRoute(origin, destination) {
    removeMarkers();
    addOrUpdateMarker('location1', origin, marker1);
    addOrUpdateMarker('location2', destination, marker2);
    displayRoute(origin, destination);
}

function addOrUpdateMarker(inputId, position, marker) {
    if (!marker) {
        marker = new google.maps.Marker({
            position: position,
            map: map,
            title: inputId === 'location1' ? 'Current Location' : 'Enter Second Location',
            draggable: true,
        });

        google.maps.event.addListener(marker, 'dragend', function () {
            handleMarkerDrag(inputId, marker.getPosition());
        });

        if (inputId === 'location1') {
            marker1 = marker;
        } else if (inputId === 'location2') {
            marker2 = marker;
        }
    } else {
        marker.setPosition(position);
    }

    marker.setMap(map);
}

function removeMarkers() {
    if (marker1) {
        marker1.setMap(null);
    }

    if (marker2) {
        marker2.setMap(null);
    }
}

function displayRoute(origin, destination) {
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            alert('Error displaying route. Please try again.');
        }
    });
}

function handleMarkerDrag(inputId, newPosition) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': newPosition.toJSON() }, function (results, status) {
        if (status === 'OK') {
            document.getElementById(inputId).value = results[0].formatted_address;
            handlePlaceChanged(inputId);

            var newLatLng = newPosition instanceof google.maps.LatLng ?
                newPosition :
                new google.maps.LatLng(newPosition.lat(), newPosition.lng());

            if (inputId === 'location1') {
                var location2Input = document.getElementById('location2');
                var destination = location2Input.value;
                calculateDistanceAndTime(newLatLng, destination);
                updateMarkersAndRoute(newLatLng, destination);
            } else if (inputId === 'location2') {
                var location1Input = document.getElementById('location1');
                var origin = location1Input.value;
                calculateDistanceAndTime(origin, newLatLng);
                updateMarkersAndRoute(origin, newLatLng);
            }
        } else {
            alert('Geocoder failed due to: ' + status);
        }
    });
}

function setCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var geocoder = new google.maps.Geocoder();
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            geocoder.geocode({ 'location': latLng }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        document.getElementById('location1').value = results[0].formatted_address;
                        handlePlaceChanged('location1');
                    } else {
                        alert('No results found');
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });

            map.setCenter(latLng);
            addOrUpdateMarker('location1', latLng, marker1);
        }, function () {
            alert('Error: The Geolocation service failed.');
        });
    } else {
        alert('Error: Your browser doesn\'t support geolocation.');
    }
}

function calculatePrice(mode) {
    var price;

    switch (mode) {
        case 'CAR':
            price = 20;
            break;
        case 'SUV':
            price = 30;
            break;
        case 'BIKE':
            price = 10;
            break;
        case 'INTER CITY':
            price = 35;
            break;
        default:
            alert('Invalid transportation mode');
            return;
    }

    var originInput = document.getElementById('location1').value;
    var destinationInput = document.getElementById('location2').value;

    if (originInput && destinationInput) {
        var geocoder = new google.maps.Geocoder();

        geocodeLocation(geocoder, originInput, function (origin) {
            geocodeLocation(geocoder, destinationInput, function (destination) {
                document.getElementById('result').innerHTML = '';
                calculateDistanceAndTimeWithPrice(origin, destination, mode, price);
            });
        });
    } else {
        document.getElementById('result').innerHTML = '';
    }
}

function calculateDistanceAndTimeWithPrice(origin, destination, mode, price) {
    var service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
    }, function (response, status) {
        if (status === 'OK') {
            distance = response.rows[0].elements[0].distance.text;
            duration = response.rows[0].elements[0].duration.text;
            selectedMode = mode;
            marketPrice = parseFloat(distance.replace(' km', '')) * price;

            document.getElementById('result').innerHTML += `
                <div style="display: flex; flex-direction: row;">
                    <div style="margin-right: 20px;">Selected Transportation: ${mode}</div>
                    <div style="margin-right: 20px;">Distance: ${distance} | Duration: ${duration}</div>
                    <div>Market Price: ${marketPrice.toFixed(2)} Rs</div>
                </div>
            `;

            document.getElementById('expected-fare').placeholder = `Expected Fare: ${marketPrice.toFixed(2)} Rs`;

            var driverDetails = {
                distance: distance,
                duration: duration,
                mode: selectedMode,
                price: marketPrice,
                expectedFare: parseFloat(document.getElementById('expected-fare').value),
                currentLocation: document.getElementById('location1').value,
                secondLocation: document.getElementById('location2').value
            };
            
            // driverDetailsArray.push(driverDetails);

            // console.log(driverDetailsArray);
        } else {
            alert('Error calculating distance and time. Please try again.');
        }
    });
}

window.onload = function () {
    initMap();
};

document.getElementById('location1').addEventListener('change', handleLocationChange);
document.getElementById('location2').addEventListener('change', handleLocationChange);

function handleLocationChange() {
    var location1Input = document.getElementById('location1');
    var location2Input = document.getElementById('location2');

    if (location1Input && location2Input) {
        var geocoder = new google.maps.Geocoder();

        geocodeLocation(geocoder, location1Input.value, function (origin) {
            geocodeLocation(geocoder, location2Input.value, function (destination) {
                calculateDistanceAndTime(origin, destination);
            });
        });
    }
}

// Initialize Firebase (replace these with your own Firebase project config)
var firebaseConfig = {
       
      // Your Firebase configuration here
      apiKey: "AIzaSyD_OF-GCSb49quE1Jbs9vA7_cotXjQaPpk",
      authDomain: "urban-cab-2-96e07.firebaseapp.com",
      databaseURL: "https://urban-cab-2-96e07-default-rtdb.firebaseio.com",
      projectId: "urban-cab-2-96e07",
      storageBucket: "urban-cab-2-96e07.appspot.com",
      messagingSenderId: "655633876241",
      appId: "1:655633876241:web:e0db94634c06e34dcef8b0",
      //measurementId: "G-CW48Z88FY3"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Get a reference to the database
  var database = firebase.database();
// var driverDetailsArray = [];

function checkExpectedFare() {
    var expectedFareInput = document.getElementById('expected-fare');

    if (!expectedFareInput.value.trim()) {
        alert('Please enter the expected fare.');
        return;
    }

    var enteredFare = parseFloat(expectedFareInput.value);

    if (isNaN(enteredFare)) {
        alert('Invalid input. Please enter a valid number for the expected fare.');
        return;
    }

    if (marketPrice !== undefined) {
        var lowerBound = marketPrice - 50;
        var upperBound = marketPrice + 200;

        if (enteredFare >= lowerBound && enteredFare <= upperBound) {
            disableButtons();
            showSearchingMessage();
            // Rest of your logic...

            var currentLocation = document.getElementById('location1').value;
            var secondLocation = document.getElementById('location2').value;

            var driverDetails = {
                distance: distance,
                duration: duration,
                mode: selectedMode,
                price: marketPrice,
                expectedFare: enteredFare,
                currentLocation: currentLocation,
                secondLocation: secondLocation
            };

             // Push data to Firebase
            storeDataInFirebase(driverDetails);

            driverDetailsArray.push(driverDetails);

            // console.log(driverDetailsArray);
        } else {
            alert('The entered fare is outside the acceptable range.');
        }
    } else {
        alert('Market price not available. Please calculate the price first.');
    }
}

function storeDataInFirebase(data) {
    // Assuming you have a "driverDetails" node in your Firebase database
    var driverDetailsRef = database.ref('driverDetails');

    // Push data to Firebase
    driverDetailsRef.push(data, function (error) {
        if (error) {
            console.error('Error storing data in Firebase:', error);
        } else {
            console.log('Data stored in Firebase successfully.');
        }
    });
}


function disableButtons() {
    var buttons = document.getElementsByClassName('transportation-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
    }

    document.getElementById('find-driver-button').disabled = true;
}

function showSearchingMessage(cancelCallback) {
    var overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(255, 255, 255, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    var messageContainer = document.createElement('div');
    messageContainer.innerHTML = '<div>Searching for Driver...</div><div class="spinner"></div>';
    
    var cancelButton = document.createElement('button');
    cancelButton.innerHTML = 'Cancel';
    cancelButton.addEventListener('click', function () {
        // Handle cancel action here
        overlay.style.display = 'none';
        if (cancelCallback && typeof cancelCallback === 'function') {
            cancelCallback();
        }
    });

    overlay.appendChild(messageContainer);
    overlay.appendChild(cancelButton);

    document.body.appendChild(overlay);
}

// Add an event listener for the "Find Driver" button
document.getElementById('find-driver-button').addEventListener('click', function() {
    showSearchingMessage(function() {
        // Enable all buttons or perform any other action on cancel
        enableButtons();
    });
});

// Function to enable all buttons
function enableButtons() {
    var buttons = document.getElementsByClassName('transportation-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = false;
    }

    document.getElementById('find-driver-button').disabled = false;
}
