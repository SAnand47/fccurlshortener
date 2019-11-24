// 'use strict';

const express = require("express");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");
// const url = require('url');
const cors = require("cors");

const app = express();

/** this project needs a db !! **/

mongoose.connect(process.env.MONGOLAB_URI);
//mongoose.connect("mongodb://localhost:27017/urltest");


console.log(mongoose.connection.readyState);
const Schema = mongoose.Schema;


//--assign a schema

const urlSchema = new Schema({
  url: String,
  num: Number
});
const Urlshrt = mongoose.model("Urlshrt", urlSchema);

//initialize a shortNum count and its value from the total documents using count
var shortNum = 0;

Urlshrt.count({}, (err, count) => {
  if (err) console.log("error in counting total documents");
  // console.log(count); //-- initial number of documents
  shortNum = count;
});

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// console.log(process.cwd())//-- for testing
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

//--post data from from API endpoint
app.post("/api/shorturl/new", function(req, res) {
  //-- check for validity of the url
  var userUrl = req.body.url;

  //-- if not starting with http:// or https:// give out the error Json

  if (!userUrl.startsWith("https://") && !userUrl.startsWith("http://")) {
    return res.json({ error: "invalid URL" });
  }

  //-- to get the host from the url and give out error when the site is actually not here. For eg. https://www.google1.com
  try {
    var givenUrl = new URL(userUrl);
  } catch (error) {
    if (error) return res.json({ error: "invalid URL" });
  }
  dns.lookup(givenUrl.host, (err, address) => {
    //  console.log(err);
    if (err && err.code == "ENOTFOUND") {
      return res.json({ error: "invalid URL" });
    } else {
      //-- its valid. check for url matches and if not add a number and url and send to webpage
      Urlshrt.findOne({ url: userUrl }, (err, data) => {
        if (err) return res.send("error with the query");
        if (data) {
          return res.json({ original_url: userUrl, short_url: data.num });
        } else {
          shortNum = shortNum + 1;
          var urlShort = new Urlshrt({
            url: userUrl,
            num: shortNum
          });
          urlShort.save((err, data) => {
            if (err) return res.send("error in saving to database");
            return res.json({ original_url: userUrl, short_url: shortNum });
          });
        }
      });
    }
  });
});

//--get API for shortcut url

app.get("/api/shorturl/:new", function(req, res) {
  // res.send(req.params.new) //-- for testing
  Urlshrt.findOne({ num: req.params.new }, (err, data) => {
    if (err) return res.json({ error: "error in finding the data" });
    // console.log(data.url); //--for testing
    if (data) {
      return res.redirect(data.url);
    } else {
      return res.json({ error: "No short url found for given input" });
    }
  });
});

//-- assign listening port
const port = process.env.PORT || 3000;

//-- use below for final submission
app.listen(port, function () {
  console.log('Node.js listening ...');
}); 
