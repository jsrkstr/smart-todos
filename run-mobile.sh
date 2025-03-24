#!/bin/bash

# Start Next.js app in production mode
cd smart-todos
npm run build
npm run start &

# Wait for Next.js to start
sleep 5

# Start Expo app
cd ../smart-todos-mobile
npx expo start 