const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const axios = require("axios");
const path = require("path");
const { Schema } = mongoose;
const port=3000;

const app = express();
const Admins = new Set(["sonu.2022ca104@mnnit.ac.in","riya.2022ca083@mnnit.ac.in","yashashwi.2022ca113@mnnit.ac.in"]);
var id;
var call=0;
var quizScore=0;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/user")

const userSchema = new Schema({
    FirstName : String,
    LastName: String,
    age: Number,
    email:String,
    password:String,
    score:[]
});


const User = mongoose.model('User', userSchema);

//Google Authentication
app.use(
    session({
      secret: "pixles-2023",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID:'312196478227-segok9fv6b9r117g18nd41jhlrpivhk7.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: "http://localhost:3000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value });
    
          if (!user) {
            
            const firstName = profile.name.givenName;
            const lastName = profile.name.familyName;
    
            // Create a new user in the database
            const newUser = new User({
              FirstName: firstName,
              LastName: lastName,
              email: profile.emails[0].value
            });
            id= profile.emails[0].value;
    
            // Save the new user to the database
            user = await newUser.save();
          }
    
          // Return the user object
          return cb(null, user);
        } catch (error) {
          return cb(error, null);
        }
      }
    )
  );

  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });
  
  passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
  });
  
  
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
      res.redirect("/start");
    }
  );

  app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/sign_in");
      }
    });
  });
  
  

//Login Manually

app.get("/signin",(req,res)=>
{
    res.render("sign_in");
})

app.post("/signin",(req,res)=>
{
        console.log(req.body);
        console.log(req.body.email);
        console.log(req.body.password);
        User.findOne({ email : req.body.email}).then(user => {
        if (user) {

            if(req.body.password==user.password)
            {
                id=req.body.email;
                //If its a Admin Redirect to Dashboard
                if(Admins.has(req.body.email))
                {
                    res.redirect("dashboard");
                }
                else
                {
                  call=0;
                  quizScore=0;
                  //console.log(call);
                  User.updateOne({ email : req.body.email }, { $set: { age: 100 } })
                  res.redirect("start");
                  console.log(user);
                }
            }
            else
            {
                res.redirect("/signin");
            }
        } else {
            console.log("user does not exists");
            res.redirect("/signup");
        }
        });
})

app.get("/signup",(req,res)=>
{
    console.log("request recieved")
    res.render("sign_up");
});

app.post("/signup",(req,res)=>
{
        User.findOne({ email: req.body.email}).then(user => {
        if (user) {
            console.log("User already Exists");
            res.redirect("/signin");
        } else {
        const newUser = new User({FirstName: req.body.FirstName,LastName: req.body.LastName,age: req.body.age,email: req.body.email,password: req.body.password,score: [0]})
        newUser.save()
        res.redirect("/signin");
        }
        });
})

app.get("/start",(req,res)=>
{
    res.render("start");
})

app.get("/quiz", async (req, res) => {
    axios
      .get("https://the-trivia-api.com/v2/questions?tags=space&limit=1", {
        responseType: "json",
      })
      .then(function (response) {
        //console.log(response.data);
        const arr = response.data;
          //console.log(arr);
          question = arr[0].question.text;
          let options = arr[0].incorrectAnswers;
          options.push(arr[0].correctAnswer);
          options.sort();
          if(call===4)
          {
            res.render("finish",{Question: question,
              option1: options[0],
              option2: options[1],
              option3: options[2],
              option4: options[3],
              correct_option: arr[0].correctAnswer})
          }
          else
          {
            res.render("quiz", {
              Question: question,
              option1: options[0],
              option2: options[1],
              option3: options[2],
              option4: options[3],
              correct_option: arr[0].correctAnswer
            });
          }
          call++;
      });
  });
  
  app.post('/sendData', (req, res) => {
    const dataFromFrontend = req.body;
    //console.log(dataFromFrontend.result);
    quizScore+=dataFromFrontend.result;
    //console.log('Data received from frontend:', dataFromFrontend);
    res.send('Data received successfully!');
  });

  app.get('/score', async (req, res) => {
    console.log("Score"+" "+id)
    
    try {
        let scores = [];
        const user = await User.findOne({ email: id });
        if (user) {
            console.log(user);
            scores = user.score;
            scores.push(quizScore);
            scores.sort();
            await User.updateOne({ _id: user._id }, { $set: { score : scores } });
            res.render("score", { current_score: quizScore, highest: scores[scores.length - 1] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/dashboard",async(req,res)=>
{
  const users = await User.find({});
  console.log(users.length);
  res.send("dashboard",);
})

app.use('/path/to/your/js/files', express.static('directory_containing_js_files', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    },
}));



app.listen(port, function() {
    console.log("Server started on port 3000");
});
