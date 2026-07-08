require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req,res)=>{
  res.json({
    service:"AI Context Gateway",
    version:"0.1.0",
    status:"running"
  });
});

app.get("/health",(req,res)=>{
  res.json({
    status:"ok",
    service:"AI Context Gateway",
    version:"0.1.0",
    timestamp:new Date().toISOString()
  });
});

app.listen(PORT,()=>{
  console.log(
    `AI Context Gateway running on port ${PORT}`
  );
});
