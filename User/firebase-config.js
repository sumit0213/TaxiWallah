// firebase-config.js

// Your Firebase configuration here
var firebaseConfig = {
    apiKey: "AIzaSyD_OF-GCSb49quE1Jbs9vA7_cotXjQaPpk",
    authDomain: "urban-cab-2-96e07.firebaseapp.com",
    databaseURL: "https://urban-cab-2-96e07-default-rtdb.firebaseio.com",
    projectId: "urban-cab-2-96e07",
    storageBucket: "urban-cab-2-96e07.appspot.com",
    messagingSenderId: "655633876241",
    appId: "1:655633876241:web:e0db94634c06e34dcef8b0",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database
var database = firebase.database();
