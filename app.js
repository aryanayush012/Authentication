//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption"); 
//const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds =10;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret : "ThisisOurLittleSecret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://ayush:ayush1234@cluster0.k69e4v7.mongodb.net/userDB",{useNewUrlParser:true});
//mongoose.set("useCreateIndex",true);
const userSchema= new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    gender:{
        type:String
    },
    birth:{
        type:Date
    },
    age:{
        type:String
    },
    phone:{
        type:String
    },
    googleId:String

});


//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user,done){
    done(null,user.id); 
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});
passport.use(new GoogleStrategy({
    clientID: "1068062999509-5ho45mq5f73damc9pedah8na0ans7ut1.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/profile",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

  app.get("/auth/google/profile", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/profile");
  });

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register",{value:""});
});

app.get("/profile",function(req,res){
    if(req.isAuthenticated()){
        res.render("profile");
    }
    else{
        res.redirect("/login");
    }
});



app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err)console.log(err);
        else{

            res.redirect("/");
        }
    });
  });


app.post("/register",function(req,res){
    // bcrypt.hash(req.body.password,10,function(err,hash){

    //     const newUser = new User({
    //         name: req.body.name,
    //         email:req.body.username,
    //         password:hash
    //     });
    //     if(req.body.password === req.body.password2){
    //             newUser.save(function(err){
    //                 if(err){console.log(err);}
    //                 else{res.render("profile");}
    //             });
    //     }else{
    //         res.render("register",{value:"Password does not match try again!"});
    //     }
    // });
    if(req.body.password === req.body.password2){
        User.register({username:req.body.username},req.body.password,function(err,user){
            
            if(err){
                console.log(err);
                res.redirect("/register");
            }
            else{
                passport.authenticate("local")(req,res,function(){
                    res.render("profile");
                });
            }
        });
    }
    else{
        res.render("register",{value:"Password does not match try again!"});
    }


});

app.post("/login",function(req,res){
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email:username},function(err,foundUser){
    //     if(err){console.log(err);}
    //     else{
    //         if(foundUser){
    //             bcrypt.compare(password,foundUser.password,function(err,result){
    //                 if(result === true){

    //                     res.render("profile");
    //                 }
    //             });
    //         }
    //     }
    // });


    const user = new User({
        username:req.body.username,
        password :req.body.password
    });

    req.login(user,function(err){
        if(err){console.log(err);}
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/profile");
            });
        }
    });


});
app.post("/form",function(req,res){
    var email=req.body.email;
    var female=req.body.female;
    var male=req.body.male;
    var other=req.body.other;
    var gender=female||male||other;
    if(male)gender=male;
    if(female)gender=female
    if(other)gender=other;
    var age=req.body.age;
    var phone=req.body.phone;
    var birth=req.body.birth
    console.log(birth)
    console.log(gender);
   User.findOneAndUpdate(
    {username:email},{gender:gender,age:age,phone:phone,birth:birth},function(err,success){
        if(err)console.log(err);
        else{
           res.redirect("/profile")            
        }
    }
   )
})












app.listen(process.env.PORT || 3000,function(){
    console.log("server is running on post 3000");
});