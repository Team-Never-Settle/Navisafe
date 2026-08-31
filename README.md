# Tunnel-Aware Navigation System 🚗🚇

Welcome to the Tunnel-Aware Navigation System! This project was built for the Smart India Hackathon 2026.

## What is this project about? 🤔

Imagine you are driving your car using a GPS map (like Google Maps) on your phone. Have you ever noticed that when you enter a long tunnel (like the Atal Tunnel), your map suddenly freezes or jumps around? 

This happens because the **GPS signal** (from satellites in the sky) cannot reach your phone when you are underground or inside a mountain. We call this a **GNSS (Global Navigation Satellite System) Blackout**.

This project solves this problem using a clever guessing technique called **Dead Reckoning**. 

### How does "Dead Reckoning" work? (For First-Year Students) 📘

"Dead Reckoning" is a fancy term for a very simple concept: **Predicting where you are based on your last known speed and direction.**

Here is the simple math we use:
1. **Distance = Speed × Time**
2. **Time = Distance / Speed**

When your car is about to enter a tunnel:
1. **We know the Tunnel:** Our app already knows where all the major tunnels in India are and exactly how long they are (because we downloaded this data beforehand).
2. **We check your Speed:** Right before you enter the tunnel (before the GPS signal dies), our app checks how fast you are going. Let's say you are going 60 km/h.
3. **We guess your Location (Dead Reckoning):** While you are inside the tunnel with NO GPS, our app simply assumes you are still driving at 60 km/h. It uses a timer to calculate how far you must have traveled inside the tunnel and moves your car's "ghost" marker on the map so you don't get lost!
4. **We predict the Exit:** Because we know the tunnel length and your speed, we can calculate exactly when you should come out the other side. 

## How to Run the Demo 💻

This project is built using modern web tools: **React**, **TypeScript**, and **Vite**. We also use **Leaflet** to show the map.

### Step 1: Install Dependencies
Make sure you have Node.js installed. Open your terminal in this folder and run:
\`\`\`bash
npm install
\`\`\`

### Step 2: Run the Simulator
Start the local server by running:
\`\`\`bash
npm run dev
\`\`\`

Open the link shown in your terminal (usually \`http://localhost:5173\`) in your web browser. 

### What you will see 👀
- The map will automatically simulate a car driving towards the **Atal Tunnel**.
- The real GPS position is shown with a **Blue Marker**.
- When the car enters the tunnel (the red line), the GPS signal is "lost".
- The system automatically switches to the **Grey Ghost Marker** (Dead Reckoning).
- Look at the **Status Panel** in the top right! It shows your entry speed and counts down the seconds until you exit.
- When you exit the tunnel, the app will tell you how accurate its guess was (the "Exit Error" in meters).

## Code Structure 📂
- \`src/lib/tunnelDb.ts\`: Acts like a dictionary of all tunnels. It checks if the car is near an entrance.
- \`src/lib/gpsSimulator.ts\`: This fakes the GPS signal for the demo. It turns off the signal when we enter a tunnel.
- \`src/lib/deadReckoning.ts\`: The brain of the project! It uses `Distance = Speed × Time` to guess your location when the signal drops.
- \`src/components/MapView.tsx\`: Draws the map, the route, and the car markers using React-Leaflet.

## Known Limitations ⚠️
- We currently assume the car keeps a **constant speed** inside the tunnel. If there is a traffic jam inside, the car on the map might exit the tunnel too early. (In the future, we plan to add AI to learn traffic patterns inside tunnels!)
- This demo only works for pre-mapped tunnels. It does not magically fix GPS in unexpected places like underground parking lots.
