const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

exports.setupNewUser = functions.auth.user().onCreate((user) => {
  db.collection("users").doc(user.uid).set({username: Math.random() * Math.pow(10, 17) + ""});
});
