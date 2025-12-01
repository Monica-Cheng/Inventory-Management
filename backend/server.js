const express = require("express");
const app = express();
const path = require("path");

// let public's file become accessible
app.use(express.static("public"));

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});