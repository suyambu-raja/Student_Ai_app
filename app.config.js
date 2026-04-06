import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    firebaseApiKey: process.env.FIREBASE_API_KEY,
  },
});
