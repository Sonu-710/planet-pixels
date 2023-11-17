const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const axios = require("axios");
const { Schema } = mongoose;
const port=3000;

const app = express();
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

app.get("/signin",(req,res)=>
{
    res.render("sign_in");
})

app.post("/signin",(req,res)=>
{
        User.findOne({ email : req.body.email}).then(user => {
        if (user) {

            if(req.body.password==user.password)
            {
                id=req.body.email;
                call=0;
                quizScore=0;
                //console.log(call);
                User.updateOne({ email : req.body.email }, { $set: { age: 100 } })
                res.redirect("start");
                console.log(user);
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
    res.render("sign_up");
});

app.post("/signup",(req,res)=>
{
        User.findOne({ email: req.body.email}).then(user => {
        if (user) {
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
          //console.log(call);
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
    try {
        let scores = [];
        const user = await User.findOne({ email: id });
        if (user) {
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

app.listen(port, function() {
    console.log("Server started on port 3000");
});
