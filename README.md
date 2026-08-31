# 🅿️ Kalki — Real-Time IoT Smart Parking System

Kalki is a full-stack smart parking solution that pairs a **React + Vite web console** with an **ESP32/Arduino sensor network** to track parking slot occupancy in real time. Drivers can view live slot availability, reserve a spot, and get automatic confirmation/expiration handling, while admins get a live diagnostics and analytics dashboard — all synced through **Firebase Realtime Database**.

Built by **Niraj Bhatta**, **Soniya Chand**, and **Ravi Yadav**.

---

## ✨ Features

- **Live Dashboard** — real-time slot occupancy (Vacant / Reserved / Occupied) driven by ultrasonic + IR sensor data
- **Slot Booking Flow** — reserve a slot with a 15-minute arrival deadline and a 5-minute safety confirmation window, with automatic expiration if you don't show up or confirm
- **Automatic State Transitions** — a background daemon (`server-timer.js`) reconciles sensor readings with booking state (reserved → occupied, occupied → vacant, spontaneous arrivals, expirations)
- **Admin Panel** — live device diagnostics (Wi-Fi RSSI, packet health, gas/temperature alarms), booking history/filtering, and usage analytics charts (via Recharts)
- **Sandbox Mode** — the app automatically falls back to an offline sandbox if Firebase authentication fails, so the UI stays usable without a live backend
- **Hardware Layer** — ESP32 + Arduino Uno reading ultrasonic distance sensors (per-slot + entry/exit), an MQ2 gas sensor, temperature/humidity, and gate control
- **Fare Metering** — per-slot session tracking with configurable rate (NPR) and interval-based billing
- **Developer/Team Page** — project credits and roles

---

## 🏗️ Tech Stack

| Layer          | Technology                                             |
|----------------|---------------------------------------------------------|
| Frontend       | React 19, React Router 7, Vite, Tailwind CSS            |
| Charts/Icons   | Recharts, lucide-react, @icons-pack/react-simple-icons  |
| Backend/Realtime | Firebase Realtime Database + Firebase Auth (anonymous) |
| Hardware       | ESP32, Arduino Uno, ultrasonic + IR sensors, MQ2 gas sensor |
| Tooling        | Oxlint, PostCSS, Autoprefixer                            |

---

## 📁 Project Structure
