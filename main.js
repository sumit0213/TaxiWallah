// Initialize Firebase
var firebaseConfig = {
    apiKey: "AIzaSyD_OF-GCSb49quE1Jbs9vA7_cotXjQaPpk",
     authDomain: "urban-cab-2-96e07.firebaseapp.com",
     databaseURL: "https://urban-cab-2-96e07-default-rtdb.firebaseio.com",
     projectId: "urban-cab-2-96e07",
     storageBucket: "urban-cab-2-96e07.appspot.com",
     messagingSenderId: "655633876241",
     appId: "1:655633876241:web:e0db94634c06e34dcef8b0",
     measurementId: "G-CW48Z88FY3"
  };
  
  firebase.initializeApp(firebaseConfig);
  var database = firebase.database();
  
  // Initialize Google Maps
  var map;
  
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 0, lng: 0 },
      zoom: 8,
    });
  
    // Get and display the driver's location
    getDriverLocation();
  }
  
 // Get the driver's location every minute
function getDriverLocation() {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
  
      // Get the location name from the coordinates using reverse geocoding
      const locationName = await reverseGeocode(latitude, longitude);
  
      // Store the coordinates and address in Firebase Realtime Database
      const timestamp = new Date().toISOString();
      const driverData = {
        timestamp,
        coordinates: {
          latitude,
          longitude
        },
        address: locationName
      };
  
      database.ref('drivers').push(driverData);
  
      // Check available cab rides within 2-kilometer radius
      checkAvailableCabRides(driverData);
      
      // Update the map with the current location and display the location name
      updateMap({ lat: latitude, lng: longitude }, locationName);
  
      console.log('Data added to Firebase:', { latitude, longitude, address: locationName });
    });
  }
  
  // Check available cab rides within 2-kilometer radius
function checkAvailableCabRides(driverData) {
    console.log('Checking available cab rides...');
    database.ref('cabRides').once('value', (snapshot) => {
        const cabRides = snapshot.val();

        if (cabRides) {
            Object.keys(cabRides).forEach((rideKey) => {
                const ride = cabRides[rideKey];
                const rideLocation = ride.locationA;

                // Check if rideLocation is a string (address) or an object
                if (typeof rideLocation === 'string') {
                    // Handle the case where locationA is a string (address)
                    // You may want to perform geocoding to get the coordinates from the address
                    console.log('Ride Location (Address):', rideLocation);
                } else if (typeof rideLocation === 'object' && rideLocation.latLng) {
                    // Handle the case where locationA is an object with latLng property
                    const rideLat = rideLocation.latLng.lat;
                    const rideLng = rideLocation.latLng.lng;

                    // Calculate distance between driver and cab ride
                    const distance = calculateDistance(
                        driverData.coordinates.latitude,
                        driverData.coordinates.longitude,
                        rideLat,
                        rideLng
                    );

                    console.log('Distance between driver and cab ride:', distance);

                    // Check if the distance is within 2 kilometers
                    if (!isNaN(distance) && distance <= 2) {
                        // Display all values of the cab ride on the driver's page
                        displayCabRideInfo(ride);
                    }
                }
            });
        }
    });
}
  
  
  /// Calculate distance between two sets of coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
      return NaN;
    }
  
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }
  
  // Convert degrees to radians
  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  // Display all values of the cab ride on the driver's page
function displayCabRideInfo(ride) {
    // Replace this with your logic to display cab ride information on the driver's page
    const rideInfoDiv = document.getElementById('rideInfo');

    // Create a new div to hold the cab ride information
    const rideDiv = document.createElement('div');
    rideDiv.classList.add('cab-ride');

    // Add cab ride details to the new div
    rideDiv.innerHTML = `
        <p><strong>Cab:</strong> ${ride.cab}</p>
        <p><strong>Distance:</strong> ${ride.distance}</p>
        <p><strong>Duration:</strong> ${ride.duration}</p>
        <p><strong>Expected Fare:</strong> ${ride.expectedFair}</p>
        <p><strong>Start Location:</strong> ${getLocationString(ride.locationA)}</p>
        <p><strong>End Location:</strong> ${getLocationString(ride.locationB)}</p>
        <p><strong>Market Price:</strong> ${ride.marketPrice}</p>
    `;

    // Append the new div to the rideInfoDiv container
    rideInfoDiv.appendChild(rideDiv);
}

// Helper function to get a formatted string for a location
function getLocationString(location) {
    if (typeof location === 'string') {
        return location; // If location is a string (address), use it as is
    } else if (typeof location === 'object' && location.address) {
        return location.address; // If location is an object with an address property
    } else {
        return 'Unknown Location';
    }
}
  
        
  
    //  // Get the location name from the coordinates using reverse geocoding
    // const locationName = await reverseGeocode(latitude, longitude);

    // Update the map with the current location and display the location name
    // updateMap({ lat: latitude, lng: longitude }, locationName);

    // console.log('Data added to Firebase:', { latitude, longitude, address: locationName });
 
  // Update the map with the current location and display the location name
function updateMap(location, locationName) {
    map.setCenter(location);
    map.setZoom(15); // Adjust the zoom level as needed
  
    // Add a marker at the current location
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      title: 'Driver Location'
    });
  
    // Display the location name on the page
    document.getElementById('currentLocation').innerHTML = `Current Location: ${locationName}`;
  }
  
 // Function to get location name from coordinates using reverse geocoding
async function reverseGeocode(latitude, longitude) {
    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(latitude, longitude);
  
    return new Promise((resolve, reject) => {
      geocoder.geocode({ 'location': latLng }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject('No results found');
          }
        } else {
          reject(`Geocoder failed due to: ${status}`);
        }
      });
    });
  }