# Asteroid Watch – Real-Time Near Earth Object Monitoring Dashboard

## Overview

**Asteroid Watch** is a modern, real-time web application that monitors **Near-Earth Objects (NEOs)** using **NASA's NeoWs (Near Earth Object Web Service) API**. The application collects live asteroid data, analyzes multiple risk factors, calculates a custom threat score, and presents the information through an interactive dashboard, analytics, and orbital visualization.

The goal of this project is to make complex astronomical data understandable through intuitive visualizations while demonstrating modern frontend development techniques.

---

#  Features

*  Real-time asteroid monitoring using NASA API
*  Custom threat assessment algorithm
*  Interactive analytics dashboard
*  3D orbital visualization
*  Daily asteroid approach statistics
*  Velocity and distance comparison charts
*  Threat level classification
*  Search, filter, and sort asteroid data
*  Live refresh functionality
*  Responsive and modern UI

---

# Dashboard Sections

## Overview

Displays:

* Total Near Earth Objects tracked
* Potentially hazardous asteroids
* Critical threat count
* Closest approach distance
* Fastest moving asteroid

---

## Asteroid Tracking List

Each asteroid includes:

* Name
* Threat Level
* Velocity
* Lunar Distance
* Close Approach Date

Users can filter by:

* All
* Hazardous
* Critical

and sort by:

* Threat
* Distance
* Velocity
* Date

---

## Asteroid Details

Selecting an asteroid displays:

* Threat Score
* Threat Level
* Close Approach Date
* Miss Distance
* Lunar Distance
* Astronomical Unit Distance
* Relative Velocity
* Velocity (km/h)
* Estimated Diameter (Min)
* Estimated Diameter (Max)
* Absolute Magnitude

---

## 3D Orbital Visualization

Visual representation of:

* Sun
* Planetary orbits
* Near Earth Objects
* Relative orbital positions

Provides an intuitive understanding of asteroid movement.

---

## Analytics

Includes:

* Daily NEO approach count
* Distance vs Velocity visualization
* Threat level distribution
* Statistical insights

---

# Technologies Used

* React.js
* JavaScript (ES6+)
* HTML5
* CSS3
* NASA NeoWs API
* Recharts
* React Three Fiber / Three.js
* npm

---

# Software Engineering Concepts

This project demonstrates:

* Component-based architecture
* React Hooks
* State Management
* REST API Integration
* Asynchronous Programming
* Environment Variables
* Data Visualization
* Modular Design
* Responsive UI Design
* Error Handling
* Modern JavaScript

---

#  Project Structure

```
project
│
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── index.js
│
├── .env.example
├── package.json
└── README.md
```

---

# Installation


Install dependencies:

```bash
npm install
```

---

#  API Setup

Create a file named:

```
.env
```

Add your NASA API key:

```text
REACT_APP_NASA_API_KEY=YOUR_NASA_API_KEY
```

You can obtain a free API key from:

[https://api.nasa.gov/](https://api.nasa.gov/)

---

#  Run the Project

```bash
npm start
```

The application will start on:

```
http://localhost:3000
```

---

# Purpose

The objective of this project is to combine astronomy, data visualization, and modern web development into a single interactive application that allows users to explore Near-Earth Objects in an engaging and informative way.

---


