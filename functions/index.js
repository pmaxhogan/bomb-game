const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

const settings = {timestampsInSnapshots: true};
db.settings(settings);

exports.setupNewUser = functions.auth.user().onCreate((user) => {
  return db.collection("users").doc(user.uid).set({username: Math.random() * Math.pow(10, 17) + ""});
});
