const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dw-kit-tracker-default-rtdb.firebaseio.com"
});

const db = admin.database();
const ref = db.ref('kitTracker');

ref.once('value', (snapshot) => {
  const data = snapshot.val();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});
