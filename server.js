const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const axios = require("axios");
const path = require("path");
const bcrypt = require('bcrypt');
const { Schema } = mongoose;
const port=3000;
const apiKey = '6fca8b1dbfd32ae4eb4f41a1610981d2f2f4977a950ce0de551d763c3f03';
const API_KEY = '67DiXUuYN7cFgGKToh5e4Z4ljslckmLQEmFMZXqU';

const app = express();
const saltRounds = 10; // This defines the number of salt rounds for bcrypt
const Admins = new Set(["sonu.2022ca104@mnnit.ac.in","riya.2022ca083@mnnit.ac.in","yashashwi.2022ca113@mnnit.ac.in"]);
var id;
var call=0;
var quizScore=0;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/user")

const userSchema = new mongoose.Schema({
    FirstName : String,
    LastName: String,
    age: Number,
    email:String,
    password:String,
    score:[]
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});
const User = new mongoose.model('User', userSchema);


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

  passport.use(User.createStrategy())
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
          id=profile.emails[0].value;

          //Checking for Admin
          if(Admins.has(profile.emails[0].value))
          {
              res.redirect("dashboard");
          }


          if (!user) {
            
            const firstName = profile.name.givenName;
            const lastName = profile.name.familyName;
    
            // Create a new user in the database
            const newUser = new User({
              FirstName: firstName,
              LastName: lastName,
              email: profile.emails[0].value
            });
            //id= profile.emails[0].value;
    
            // Save the new user to the database
            user = await newUser.save();
            //console.log(id);
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
        res.redirect("/");
      }
    });
  });
  
  

//Login Manually

app.get("/signin",(req,res)=>
{
  res.render("signin");
})


// app.post("/signin", async (req, res) => {
//   try {
//       const user = await User.findOne({ email: req.body.email });
//       if (user) {
//           const match = await bcrypt.compare(req.body.password, user.password);
//           if (match) {
//               // Passwords match, proceed with login
//               id = req.body.email;
//               if(Admins.has(req.body.email))
//                 {
//                     res.redirect("dashboard");
//                 }
//                 else
//                 {
//                   res.redirect("start");
//                   console.log(user);
//                 }
//           } else {
//               // Passwords don't match
//               res.redirect("/signin");
//           }
//       } else {
//           // User not found
//           res.redirect("/signup");
//       }
//   } catch (error) {
//       console.error(error);
//       res.redirect("/signin");
//   }
// });

app.post("/signin", (req, res) => {
  passport.authenticate("local", {failureRedirect: "/signup"})(req, res, () => {
    res.redirect("/start");
  })
})

app.get("/signup",(req,res)=>
{
    //console.log("request recieved")
    res.render("signup");
});


// app.post("/signup", async (req, res) => {
//     try {
//         const emailToVerify = req.body.email;

//         // Send a GET request to the QuickEmailVerification API
//         const response = await axios.get(`https://api.quickemailverification.com/v1/verify?email=${emailToVerify}&apikey=${apiKey}`);

//         // Check the response from the API
//         if (response.data && response.data.result === 'valid') {
//             // If the email is valid, proceed with signup
//             const user = await User.findOne({ email: req.body.email });
//             if (user) {
//                 console.log("User already exists");
//                 return res.redirect("/signin");
//             }

//             // const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
//             const newUser = new User({
//                 FirstName: req.body.FirstName,
//                 LastName: req.body.LastName,
//                 age: req.body.age,
//                 email: req.body.email,
//                 password: hashedPassword,
//                 score: [0]
//             });

//             // =====================================================================

//             User.register({username:'username', active: false}, req.body.password , function(err, user) {
//               if (err) { res.status(402).json({error: err}) };
            
//               passport.authenticate("local", {failureRedirect: "/signup"}), () =>{
//                 res.redirect("/start");
//               }
//             });

//             // =====================================================================

//             await newUser.save();
//             return res.redirect("/signin");
//         } else {
//             // If the email is invalid or other status, handle accordingly
//             console.log('Invalid email');
//             return res.redirect("/signup");
//         }
//     } catch (error) {
//         console.error(error);
//         return res.redirect("/signup");
//     }
// });

app.post("/signup", (req, res) => {
  const {FirstName, email, LastName, age, password} = req.body;
  User.register({FirstName: FirstName, email: email, LastName: LastName, age: age}, req.body.password , function(err, user) {
      if (err) { return res.status(402).json({error: err}) }
      else{          
          passport.authenticate("local", {failureRedirect: "/signup"})(req, res, () => {
            res.redirect("/start");
          })
      }
        });
})
 
app.get("/",(req,res)=>
{
  res.render("home", {
    user: req.user
  });
});

app.get("/destination",(req,res)=>
{
  res.render("destination");
});


// app.get("/sdf", (req, res) => {
//   if(req.isAuthenticated()){

//   }
//   else{

//   }
// })

app.get("/start",(req,res)=>
{
    //if(req.isAuthenticated()) res.render("start");
    //else res.redirect("/signin");
    if(req.isAuthenticated()){
      call=0;
      quizScore=0;
      res.render("start");
    }
    else
    {
        res.redirect("/signin");
    }
    
})

app.get("/quiz", async (req, res) => {
  if(req.isAuthenticated()){
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
  }
  else{
    res.redirect("/signin");
  }
    
  });
  
  app.post('/sendData', (req, res) => {
    const dataFromFrontend = req.body;
    console.log(dataFromFrontend.result);
    quizScore+=dataFromFrontend.result;
    console.log('Data received from frontend:', dataFromFrontend);
    res.send('Data received successfully!');
  });

  app.get('/score', async (req, res) => {
    //console.log("Score"+" "+id)
    if(req.isAuthenticated()){
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
    }
    else{
        res.redirect("/signin");
    }
});

app.get("/dashboard",async(req,res)=>
{
  //if(req.isAuthenticated()){
    //if(Admins.has(id))
    //{
      const users = await User.find({});
      console.log(users.length);
      res.render("dashboard",({users:users}));
    /*}
    else
    {
      res.redirect("/signin")
    }
  }
  else{
    res.redirect("/signin");
  }*/
})

app.use('/path/to/your/js/files', express.static('directory_containing_js_files', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    },
}));

//Realtime updates


app.get("/launches/upcoming", async (req, res) => {
  axios
    .get("https://lldev.thespacedevs.com/2.2.0/launch/upcoming/"
    , {
      responseType: "json",
    })
    .then(function (response) {  
      const arr = response.data.results;
      res.render("rockets_upcoming",({array:arr}));
    });
});


app.get("/launches/previous", async (req, res) => {
  axios
    .get("https://lldev.thespacedevs.com/2.2.0/launch/previous/"
    , {
      responseType: "json",
    })
    .then(function (response) {
      const arr = response.data.results;
      res.render("rockets_launched",({arr:arr}));
    });
});

app.get("/astronauts/inspace", async (req, res) => {
  axios
    .get("https://lldev.thespacedevs.com/2.2.0/astronaut/?in_space=true"
    , {
      responseType: "json",
    })
    .then(function (response) {
      const arr = response.data.results;
      res.render("astronauts_in_space",({arr:arr}));
    });
});

app.get("/astronauts/previous",(req,res)=>{
  axios
    .get("https://ll.thespacedevs.com/2.2.0/astronaut/?date_of_death__lt=2023-11-01"
    , {
      responseType: "json",
    })
    .then(function (response) {
      const arr = response.data.results;
      console.log(arr.length);
      res.render("astronauts_previous",({arr:arr}));
    });
  });

  app.get("/astronauts/earth",(req,res)=>{
    axios
      .get("https://ll.thespacedevs.com/2.2.0/astronaut/?in_space=false"
      , {
        responseType: "json",
      })
      .then(function (response) {
  
        const arr = response.data.results;
        
        res.render("astronauts_on_earth",({array:arr}));
      });
  }
  )

  app.get("/events/upcoming",(req,res)=>{
    axios
      .get("https://lldev.thespacedevs.com/2.2.0/event/upcoming/"
      , {
        responseType: "json",
      })
      .then(function (response) {
  
        const arr = response.data.results;
        res.render("events_upcoming",({array:arr}));
      });
  }
  )

  app.get("/events/previous",(req,res)=>{
    axios
      .get("https://lldev.thespacedevs.com/2.2.0/event/previous/"
      , {
        responseType: "json",
      })
      .then(function (response) {
  
        const arr = response.data.results;
        res.render("events_previous",({array:arr}));
      });
  }
  )
  
  app.get("/news",(req,res)=>{
    axios
      .get("https://api.spaceflightnewsapi.net/v4/articles/"
      , {
        responseType: "json",
      })
      .then(function (response) {
  
        const arr = response.data.results;
        res.render("news",({array:arr}));
      });
  }
  )

    app.get("/search",(req,res)=>
    {
      res.render("search");
    })
    let query;
    app.post("/search",async(req,res)=>
    {
        query=req.body.searchQuery;
        console.log(req.body);
        res.redirect("/gallery");
    })

    app.get('/gallery', async (req, res) => {
      if(query!=null)
      {
        try {
          const apiUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`;
      
          const response = await axios.get(apiUrl);
      
          const imageData = response.data.collection.items;
          res.render('gallery', { imageData }); 
          query=null;
        } catch (error) {
          console.error('Error fetching ISS images:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      else
      {
        res.redirect("/search");
      }
    });
    

app.get("/chandrayan",(req,res)=>{
  res.render("chandrayan");
}
)

app.get("/iss",(req,res)=>
{
  res.render("iss");
})

app.get("/marsrover",(req,res)=>
{
  res.render("marsrover")
})

app.get("/iss/gallery",async(req,res)=>
{
  try {
    const apiUrl = `https://images-api.nasa.gov/search?q=iss&media_type=image`;

    const response = await axios.get(apiUrl);
    const imageData = response.data.collection.items;
    res.render('issgallery', { imageData }); // Send the image data as a JSON response
  } catch (error) {
    console.error('Error fetching ISS images:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})


app.get("/marsrover/gallery", async (req, res) => {
  try {
    const apiUrl = `https://images-api.nasa.gov/search?q=mars rover&media_type=image`;

    const response = await axios.get(apiUrl);
    const imageData = response.data.collection.items;
    res.render('issgallery', { imageData }); // Send the image data as a JSON response
  } catch (error) {
    console.error('Error fetching ISS images:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/chandrayan/gallery",(req,res)=>
{
   res.render("chandrayangallery");
})

app.get("/spacepedia",(req,res)=>
{
  res.render("spacepedia");
})


app.get("/astronauts",(req,res)=>
{
  res.render("astronauts");
})

app.get("/events",(req,res)=>
{
  res.render("events");
})

app.get("/rockets",(req,res)=>
{
  res.render("rockets");
})


app.listen(port, function() {
  console.log("Server started on port 3000");
});
