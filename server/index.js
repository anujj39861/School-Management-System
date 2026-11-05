const express = require("express");
const app = express();
const port = process.env.PORT || 5001;
const cors = require("cors");
const path = require("path");
const axios = require('axios')
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://school-flow-a-real-time-educational-three.vercel.app", "https://school-flow-a-real-time-educational.vercel.app"],
    credentials: true,
  })
);
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });
app.use(express.json());

// // To prevent render server sleeping due to inactivity........
// //-------------------------------------------------------------------------
// const url = `https://schoolflow-a-real-time-educational.onrender.com/`;
// const interval = 600000;

// function reloadWebsite() {
//   axios
//     .get(url)
//     .then((response) => {
//       console.log("website reloded");
//     })
//     .catch((error) => {
//       console.error(`Error : ${error.message}`);
//     });
// }

// setInterval(reloadWebsite, interval);
// // -------------------------------------------------------------------


if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Define it in server/.env");
  process.exit(1);
}
if (!process.env.DB_PASSWORD) {
  console.warn(
    "WARN: DB_PASSWORD is not set. Using undefined may break DB connection."
  );
}

app.get("/", (req, res) => {
  res.send("Hello, it's the backend of School Master Pro");
});

// admin -- >>
app.use("/admin/api/auth", require("./routes/admin/auth.js")); // admin login
// app.use("/admin/classmanagement", require("./routes/admin/classmanagementpageRouter.js"));
app.use("/admin/api/teachers", require("./routes/admin/teacherRoute.js")); // for class management page
app.use(
  "/admin/schooluser",
  require("./routes/admin/User_School_admin_route.js")
);
app.use("/admin/student", require("./routes/admin/StudentRoute.js"));
app.use("/admin/fees", require("./routes/admin/FeesRoute.js"));
app.use("/admin/feeshistory", require("./routes/admin/FeesHistoryRoute.js"));
app.use("/admin/teacher", require("./routes/admin/teacherRoute.js"));
app.use("/admin/timetable", require("./routes/admin/timetableRoute.js"));
app.use("/admin/attendance", require("./routes/admin/attendanceRoute.js"));

// student -- >>>
app.use("/student/auth", require("./routes/student/auth.js")); // student login
app.use("/student/profile", require("./routes/student/studentroute.js")); // student profile and password update
app.use("/student/attendance", require("./routes/student/studentroute.js")); // student attendance routes
app.use("/student/timetable", require("./routes/student/timetableRoute.js")); // student timetable routes

// teacher -- >>>
app.use("/teacher/auth", require("./routes/teacher/auth.js")); // teacher login and authentication
app.use("/teacher", require("./routes/teacher/profile.js")); // teacher profile management
app.use("/teacher", require("./routes/teacher/timetableRoute.js")); // teacher timetable management
app.use("/teacher", require("./routes/teacher/teacherRoute.js")); // teacher student management
app.use("/teacher/attendance", require("./routes/teacher/attendanceRoute.js")); // teacher attendance management
app
  .listen(port, () => {
    console.info(
      `Server running on port ${port} in ${process.env.NODE_ENV} mode`
    );
  })
  .on("error", (err) => {
    console.error("Server failed to start:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Kill the process or use a different port.`
      );
    }
    process.exit(1);
  });
