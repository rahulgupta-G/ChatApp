import React from 'react';
import * as firebase from 'firebase';

var firebaseConfig = {
    apiKey: "AIzaSyBBHnrE3LOF5zUJ_JOhRmAwzhL8-0ulKMs",
    authDomain: "webapp-cd905.firebaseapp.com",
    databaseURL: "https://webapp-cd905.firebaseio.com",
    projectId: "webapp-cd905",
    storageBucket: "webapp-cd905.appspot.com",
    messagingSenderId: "322707307356",
    appId: "1:322707307356:web:8e82a3a90641344e7e1f99"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase;