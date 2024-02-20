var desiredLocationInput;

// app.js
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 15 // Set the map zoom level to 15
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(userLocation);

            var marker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Your Location'
            });

            // Use Google Places API to get the name of the location
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'location': userLocation }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        // Display the name of the location on the web page
                        var locationInfo = document.createElement('p');
                        locationInfo.innerHTML = 'Your current location: ' + results[0].formatted_address;
                        document.body.appendChild(locationInfo);
                    } else {
                        console.error('No results found');
                    }
                } else {
                    console.error('Geocoder failed due to: ' + status);
                }
            });

        }, function () {
            alert('Error: The Geolocation service failed.');
        });
    } else {
        alert('Error: Your browser does not support geolocation.');
    }
}
// app.js
// Initialize Firebase with the provided configuration
firebase.initializeApp(config.firebaseConfig);

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 15
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(userLocation);

            var marker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Your Location'
            });

            // Use Google Places API to get the name of the location
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'location': userLocation }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        // Display the name of the location on the web page
                        var locationInfo = document.createElement('p');
                        locationInfo.innerHTML = 'Your current location: ' + results[0].formatted_address;
                        document.body.appendChild(locationInfo);

                        // Save the location to Firebase
                        saveLocationToFirebase(userLocation, results[0].formatted_address);
                    } else {
                        console.error('No results found');
                    }
                } else {
                    console.error('Geocoder failed due to: ' + status);
                }
            });

        }, function () {
            alert('Error: The Geolocation service failed.');
        });
    } else {
        alert('Error: Your browser does not support geolocation.');
    }
}

function saveLocationToFirebase(location, formattedAddress) {
    // Get a reference to the Firebase database
    var database = firebase.database();

    // Create a new entry in the 'locations' node with the current timestamp
    var timestamp = new Date().getTime();
    var locationData = {
        latitude: location.lat,
        longitude: location.lng,
        address: formattedAddress,
        timestamp: timestamp
    };

    database.ref('Drivers_locations/' + timestamp).set(locationData)
        .then(function () {
            console.log('Location saved to Firebase!');
        })
        .catch(function (error) {
            console.error('Error saving location to Firebase: ', error);
        });
}

// Add this function to calculate the distance between two locations using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Modify the getRide function to filter and display only relevant ride details within 5 km
function getRide() {
    var database = firebase.database();
    var driversRef = database.ref('Drivers_locations');
    var rideDetailsRef = database.ref('RideDetails');

    // Assuming you have a function to get the user's location
    getUserLocation().then(function(userLocation) {
        // Check if the userLocation is defined
        if (userLocation && userLocation.lat && userLocation.lng) {
            driversRef.once('value').then(function (driversSnapshot) {
                var driversLocations = driversSnapshot.val();

                if (driversLocations) {
                    rideDetailsRef.once('value').then(function (ridesSnapshot) {
                        var rideDetails = ridesSnapshot.val();

                        if (rideDetails) {
                            // Display ride details on the web page
                            var rideDetailsList = document.createElement('ul');
                            rideDetailsList.id = 'ride-details-list';

                            Object.keys(rideDetails).forEach(function (rideKey) {
                                var ride = rideDetails[rideKey];

                                // Check if the ride is within 5 km
                                var driverLocation = driversLocations[rideKey];
                                if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
                                    var distance = calculateDistance(
                                        userLocation.lat,
                                        userLocation.lng,
                                        driverLocation.latitude,
                                        driverLocation.longitude
                                    );

                                    if (distance <= 5) {
                                        var rideItem = document.createElement('li');
                                        rideItem.innerHTML = `
                                            <strong>Ride ID:</strong> ${rideKey} <br>
                                            <strong>Current Location:</strong> ${ride.currentLocation} <br>
                                            <strong>Distance:</strong> ${ride.distance} <br>
                                            <strong>Duration:</strong> ${ride.duration} <br>
                                            <strong>Expected Fare:</strong> ${ride.expectedFare} <br>
                                            <strong>Mode:</strong> ${ride.mode} <br>
                                            <strong>Price:</strong> ${ride.price} <br>
                                            <strong>Second Location:</strong> ${ride.secondLocation}
                                        `;
                                        rideDetailsList.appendChild(rideItem);
                                    }
                                }
                            });

                            document.body.appendChild(rideDetailsList);
                        } else {
                            console.log('No ride details available.');
                        }
                    }).catch(function (error) {
                        console.error('Error getting ride details from Firebase: ', error);
                    });
                } else {
                    console.log('No driver locations available.');
                }
            }).catch(function (error) {
                console.error('Error getting driver locations from Firebase: ', error);
            });
        } else {
            console.error('User location is not available or invalid.');
        }
    }).catch(function (error) {
        console.error('Error getting user location: ', error);
    });
}


var rideToggle = false; // Initial state

function toggleRide() {
    rideToggle = !rideToggle; // Toggle the state

    // Enable or disable the desired location input based on the toggle state
    var desiredLocationInput = document.getElementById('desiredLocation');
    if (desiredLocationInput) {
        desiredLocationInput.disabled = !rideToggle;
        desiredLocationInput.readOnly = !rideToggle;
    }

    if (rideToggle) {
        // If toggled ON, start scanning for rides
        getRide();
    } else {
        // If toggled OFF, clear the displayed ride details and reset desired location input
        clearRideDetails();
        resetDesiredLocation();
    }
}

function clearRideDetails() {
    // Remove the list of ride details from the web page
    var rideDetailsList = document.getElementById('ride-details-list');
    if (rideDetailsList) {
        rideDetailsList.parentNode.removeChild(rideDetailsList);
    }
}
function resetDesiredLocation() {
    // Reset the desired location input field
    var desiredLocationInput = document.getElementById('desiredLocation');
    if (desiredLocationInput) {
        desiredLocationInput.value = '';
    }
}