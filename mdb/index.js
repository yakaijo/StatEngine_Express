const express = require('express')
const { ObjectId} = require('mongodb')
const { connectToDb,getDb} = require('./db')
const mongoose = require("mongoose");
const app = express()
app.use(express.json())
const Schema = mongoose.Schema;
const cors = require ('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { decode } = require('punycode');
app.use(cookieParser())

const passport = require('passport')
const session = require('express-session');
const passportSteam = require('passport-steam');
const { profile } = require('console');
const SteamStrategy = passportSteam.Strategy;
const axios = require('axios');


//Models
const User = require('./model/users.model');
const BugReport = require('./model/bugReport.model.js');
const UserResponse = require('./model/userResponse.model');

const FavoriteResponse = require('./model/favoriteResponse.model');



// import * as jwt from jsonwebtoken;


let db

//db connection
connectToDb((err) => {
    if(!err)
    {
        app.listen(3026, () =>
        {
            console.log("app listening on port 3026")
        })

        db=getDb()
    }
    
})

// Required to get data from user for sessions
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

   // Initiate Strategy
passport.use(new SteamStrategy({

    //production url
    returnURL: 'http://statengines.org:' + 3026 + '/api/auth/steam/return',


    //development url
    // returnURL: 'http://localhost:' + 3026 + '/api/auth/steam/return',


    realm: 'http://statengines.org:' + 3026 + '/',
    // realm: 'http://localhost:'+  3026 + '/',
    apiKey: ''
    }, function (identifier, profile, done) {
        process.nextTick(function () {
        profile.identifier = identifier;
        // console.log ("steam name: ", profile.displayName)
        // console.log("steam profile url:", profile.photos[0].value)
       
        // if(profile)
        // {
        //     console.log(profile.id)
        //     //console.log(identifier)
        //     database = db.collection("users").findOne({ steamID: profile.id })
        //     .then((user) => {
        //       if (!user) {
        //         console.log("no user")
        //         console.log(user)
        //         //console.log(profile)
        //         //getSteamId(profile)
        //       }
        //       else
        //       {
        //         console.log(profile)
        //         console.log(user)
        //         getSteamId(profile)
        //         db.collection('users').updateOne({steamID: profile.id}, {"$set": {steamID: profile.id}});
        //         //console.log(user)
        //     }
        //     });

        // }
      return done(null, profile);
     });
    }
));

app.use(session({
    secret: 'Our little secret',
    saveUninitialized: true,
    resave: false,
    cookie: {
     maxAge: 3600000
    }
}))

app.use(passport.initialize());

app.use(passport.session());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));



//creates a user
app.post('/api/createuser',(req,res)=>{
    const {username, password, email} = req.body
    // console.log("Username: ",username);
    // console.log("Password: ",password);
    // console.log("Email:",email);


    database = db.collection("users");




        database.findOne({ email } ).then((user) => {
          if (!user) {
              //if no user exist in the database with the same email, send the data to the database and return a sign up success notification
              const newUser = new User (username, email, password)
              
              database.insertOne(newUser);  
            //   console.log ("sign up success!")
              return res.json("Sign Up Success!")
  
          }else {
              //if user exist, return the user data back to the front end
            //   console.log ("username or email exist!")
              return res.json("Email has been used!")
          }

        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json({ message: err.message });
        });
        

})

//creates a user
app.post('/api/bugReport',(req,res)=>{
    // data = req.body;
    const {description, username} = req.body
    // console.log("Username: ",username);
    // console.log("Description: ",description);

    const newBugReport = new BugReport(description, username);
    database = db.collection("BugReports").insertOne(newBugReport);

  
    // console.log ("bug report sent!")
    return res.json("Bug report sent!").status(200)
        

})

//Resets password of user: TODO create email functionality, We may or may not do this function in the future
// app.post('/api/resetpassword',(req,res)=>{
//     data = req.body;
//     console.log("Username: ", data.username);
//     console.log("Password: ",data.password);
//     //TODO encrypt password
//     db.collection("users").updateOne({username: data.username}, {"$set": {password: data.password}});
//     console.log("User :" + data.username + " has had their password updated");
//     res.send("Password successfully modified");
// })

const RSA_PRIVATE_KEY = fs.readFileSync('./private.key');
const RSA_PUBLIC_KEY = fs.readFileSync('./public.key');

function checkIfAuthenticated(token){
    try{
        const decodeToken = jwt.verify(token, RSA_PUBLIC_KEY, {algorithms:['RS256']});
        const tokenExpirationTime = decodeToken.exp
        return {authenticated: true, error: null};

    } catch (err){
        if (err.name=="TokenExpiredError"){
            // console.error("token expired")
            return {authenticated: false, error: err.name};
        } else {
            // console.error("Error verifying token: ",err)
            return {authenticated: false, error: err.message};
        }

    }
    
}

// api to call when trying to authenticate user.
app.get('/api/authenticate', (req,res)=>{
    authHeader = req.headers.authorization;
    // console.log ("Auth header",authHeader)
    token = authHeader && authHeader.split(' ')[1];
    // console.log("token is", token);

    const result =  checkIfAuthenticated(token);
    if (result.authenticated){
        // console.log("Authentication success!")
        res.send({value: true, error: null}).status(200);
    } else {

        // console.log("Authentication failed!")
        res.send({value: false, error: result.error}).status(500);
    }
})




//calls loginsearch and returns an object that it has found if it found something
app.post('/api/login', async (req,res)=>{
    search_result = await loginSearch(req.body.username, req.body.password);


    if (search_result===null) { //if an account is not found with matching credentials
        return await res.status(500).json({error: "No user exist!"});



    } else { //an account is found with matching credentials
        // console.log("ACCOUNT FOUND!")
        const jwtBearerToken = await jwt.sign({}, RSA_PRIVATE_KEY, {
            algorithm:'RS256',
            expiresIn: '2h', 
            subject: search_result._id.toString()
        })
        search_result.token = jwtBearerToken;
        const userResponse = new UserResponse(search_result._id, search_result.username, search_result.steamID, search_result.token, search_result.favorite_list)
        return await res.send({data: userResponse});

    }

})

//searches the database for entries with the same username/password combination
async function loginSearch(username, password) {
    try{

        const user = await db.collection('users').findOne({
            username: username, 
            password: password,
        })
            return user; 
    }catch (error) {
        throw error;
    }

}


app.delete('/api/deleteAccount', (req,res)=> {


    const token = req.query.token
    const userid = req.query.userid
    // console.log ("userid:", userid)
    const result = checkIfAuthenticated(token)
    if (result.authenticated){
        db.collection('users').findOne({_id: new ObjectId (userid)})
        .then((user) => {
          if (!user) {
               
            //if there is no such user exist in the database return nothing back to the frontend
            return res.status(500).json({error: "Cannot find the user data in the database"});
          }
          else{
            //if found the user exist in the database, delete that user and send message back to frontend
              db.collection('users').deleteOne({ _id: new ObjectId (userid) })
              return res.status(200).json({message: "Delete Successfully!"});
            }
            
            })
            .catch((err) => {
            // console.log(err);
            return res.status(500).json({ error: err.message });
            });
    }
    else {
        return res.status(500).json({error: result.error})
    }


})

app.put('/api/updatePassword/:username', (req,res)=> {
    const {token, userid, oldpass, newpass} = req.body
    
    // console.log ("uid: ", userid)
    // console.log ("username", req.params.username)
    const result =  checkIfAuthenticated(token);

    if (result.authenticated){
        db.collection('users').findOne({ _id: new ObjectId (userid), username: req.params.username })
          .then((user) => {
            if (!user) {
                 
              //if there is no such user exist in the database return error
            //   console.log("Error in finding user");
              return res.status(500).json({error: "Error in finding user"});
            }
            else{
              //if found the user exist in the database, check if the oldpass sent from the frontend is match with the password in the database
                if (user.password == oldpass) {
                    //   console.log("User found. tried to update")
                    db.collection('users').updateOne({_id: new ObjectId (userid.toString())}, {"$set": {password: newpass}});
                    return res.status(200).json({message: "Updated password Successfully!"});
                }
                else{
                    return res.status(500).json({error: "Old Password does not match"})
                }
            }
            
          })
          .catch((err) => {
            // console.log(err);
            return res.status(500).json({ error: err.message });
          });
        }
        else {
            return res.status(500).json({error: result.error})
        }



})




//This is derek's api key. please replaec before production
//const API_KEY = ''
//this is johnnies api key, dont put it on craigslist  please
const API_KEY =''



//This request is to fetch user game information from the Steam API given a user id and steamID
app.post('/api/getStats/:id', (req,res)=> {
    const id = req.params.id;
    const user = db.collection('users').findOne({ _id: new ObjectId(id.toString()) })
    .then((user) => {

        const username = user.username
        // console.log ("this user:", user)
        const steamID = user.steamID;
        // console.log ("the steamID is", steamID)
        // console.log("GET STATS")
        // console.log("Username: ",user.username);
        // console.log("SteamID: ",steamID);
        // console.log ("user KD", user.KD)
        if (steamID != '' && steamID !== null)  {
            var url = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v00002/?appid=730&key=${API_KEY}&steamid=${steamID}`;

            const request = require('request');
            request(url, { json: true }, (err, response, body) => {
                if (err) { return console.log(err); }
                // console.log("the body is: ", body)
                // Check if the user has no data
                if (!body || !body.playerstats || !body.playerstats.stats || body.playerstats.stats.length === 0) {
                    return res.status(500).json({ message: "No data available for this user" , username});
                }

                var dict = {"username": username}

            for (i = 0; i < body.playerstats.stats.length; i++) {
                // console.log(body.playerstats.stats[i].name, body.playerstats.stats[i].value)
                switch (body.playerstats.stats[i].name) {
                    case "total_kills":
                        dict["total_kills"] = body.playerstats.stats[i].value;
                            break;
                    case "total_deaths":
                        dict["total_deaths"] = body.playerstats.stats[i].value;
                            break;
                    case "total_damage_done":
                        dict["total_damage"] = body.playerstats.stats[i].value;
                        break;
                    case "total_rounds_played":
                        dict["total_rounds"] = body.playerstats.stats[i].value;
                            break;
                    case "total_kills_headshot":
                        dict["total_hs"] = body.playerstats.stats[i].value;
                            break;
                    case "last_match_kills":
                        dict["last_match_kills"] = body.playerstats.stats[i].value;
                            break;
                    case "last_match_deaths":
                        dict["last_match_deaths"] = body.playerstats.stats[i].value;
                        break;
                    case "last_match_damage":
                        dict["last_match_damage"] = body.playerstats.stats[i].value;
                            break;
                    case "last_match_rounds":
                        dict["last_match_rounds"] = body.playerstats.stats[i].value;
                            break;
                    case "last_match_wins":
                        dict["last_match_wins"] = body.playerstats.stats[i].value;
                        break;
                }
            }
            // console.log(dict);

            user.KD = Math.round(parseFloat(parseInt(dict.total_kills) / parseInt(dict.total_deaths))*100)/100
            db.collection('users').updateOne({_id: new ObjectId(id.toString())}, {"$set": {KD: user.KD}});

            // console.log ("user KD after", user.KD)
            overall = {"overall_kills": dict.total_kills,
                        "overall_deaths": dict.total_deaths,
                        "overall_kd": parseInt(dict.total_kills) / parseInt(dict.total_deaths),
                        "overall_damage": dict.total_damage,
                        "overall_rounds": dict.total_rounds,
                        "overall_adr": parseInt(dict.total_damage) / parseInt(dict.total_rounds),
                        "overall_hs": parseInt(dict.total_hs) / parseInt(dict.total_kills),
                        "overall_hsp": parseInt(dict.total_hs) / parseInt(dict.total_kills)
                            }
                // console.log("OVERALL: ",overall);
                if(parseInt(dict.last_match_wins)>=16 ) {var last_result = "Win"} else {var last_result="Loss"}
                last_match ={"last_match_kills": dict["last_match_kills"],
                            "last_match_deaths": dict["last_match_deaths"],
                            "last_match_kd": parseInt(dict["last_match_kills"]) / parseInt(dict["last_match_deaths"]),
                            "last_match_damage": dict.last_match_damage,
                            "last_match_rounds": dict.last_match_rounds,
                            "last_match_adr": parseInt(dict.last_match_damage) / parseInt(dict.last_match_rounds),
                            "last_match_result": last_result
                            }
                // console.log("LAST MATCH: ",last_match);




                // var getSteamUserBasicDataUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${steamID}`;






                return res.status(200).json({overall,last_match, body, username});
            });
        }
        else {
            return res.status(500).json({message:"This user does not have a steamID yet", username})
            // return res.json({error:"This user does not have a steamID yet"})
        }
    })
})

app.post('/api/getSteamProfileUrl/:id', (req,res)=> {

    const id = req.params.id;
    // console.log ("from get SteamProfileUrl userid", id)
    const user = db.collection('users').findOne({ _id: new ObjectId(id.toString()) })
    .then((user) => {

        const username = user.username
        // console.log ("this user:", user)
        const steamID = user.steamID;
        // console.log("GET STATS")
        // console.log("Username: ",user.username);
        // console.log("SteamID: ",steamID);
        // console.log ("user KD", user.KD)
        if (steamID !== '' && steamID !== null)  {
            var getSteamUserBasicDataUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${steamID}`;

            const request = require('request');
            request(getSteamUserBasicDataUrl, { json: true }, (err, response, body) => {
                if (err) { return console.log(err); }
                
                const steam_profile_img_url = body.response.players[0].avatarfull
                // console.log("the body is: ", steam_profile_img_url)
                // Check if the user has no data
                if (!body || !body.response || !body.response.players === 0) {
                    return res.status(500).json({ message: "No data available for this user" , username});
                }
                return res.status(200).json(steam_profile_img_url);
            });
        }
        else {
            return res.status(500).json({message:"This user does not have a steamID yet", username})
            // return res.json({error:"This user does not have a steamID yet"})
        }
    })

})



//This request is to inject a steamID into the database for a specific user. 
app.post('/api/setSteamID', (req,res)=> {
    const {userid, steamID} = req.body
    // console.log (userid, steamID)
    db.collection('users').findOne({ _id: new ObjectId (userid) })
    .then((user) => {
        if (!user) {
            //if no user exist in the database, return nothing back to the frontend
            return res.status(500).json({message: "No user exist!"});
            
        }else {
            //if user exist, set the steamID for that user and return the user data back to the front end
            db.collection('users').updateOne({_id: new ObjectId (userid)}, {"$set": {steamID: steamID}});
            return res.json({message: "SteamID set!"});   
        }
      })
      .catch((err) => {
        // console.log(err);
        return res.status(500).json({ message: err.message });
      });

});


app.post('/api/updateFavoriteList', (req,res)=> {
    const {userid, token, favorite_list} = req.body
    const result = checkIfAuthenticated(token)

    if (result.authenticated){
        db.collection('users').findOne({_id: new ObjectId (userid)})
        .then((user) => {
            if (user) {

                //if user exist, set the steamID for that user and return the user data back to the front end
                db.collection('users').updateOne({_id: new ObjectId (userid)}, {"$set": {favorite_list: favorite_list}});
                return res.status(200).json({message: "Favorite list updated!"});  

            }else {
                //if no user exist in the database, return nothing back to the frontend
                return res.status(500).json({ error: "Cannot find the user data in the database"});
            }
        })
        .catch((err) => {
            // console.log(err);
            return res.status(500).json({ error: err.message });
        });
    }
    else {
        return res.status(500).json({error: result.error})
    }
});


app.get('/api/getFavoriteData/:userid', (req,res)=> {
    // authHeader = req.headers.authorization;
    // // console.log ("Auth header",authHeader)
    // token = authHeader && authHeader.split(' ')[1];
    // const result =  checkIfAuthenticated(token);

    const userid = req.params.userid

    // if (result.authenticated){
        db.collection('users').findOne({_id: new ObjectId (userid)})
        .then((user) => {
          if (!user) {
               
            //There is no such user exist in the database 
            return res.status(500).json({error: "Cannot find the user data in the database"});
          }
          else{
  
            //if found the user exist in the database
            const newFavoriteResponse = new FavoriteResponse (userid, user.username, user.introduction, user.KD, user.likes, user.dislikes, user.karmaRatio, user.profile_img_url)

            return res.status(200).json({data: newFavoriteResponse})
                
            //   db.collection('users').deleteOne({ _id: new ObjectId (userid) })
            //   return res.status(200).json({message: "Delete Successfully!"});
            }
            
            })
            .catch((err) => {
            // console.log(err);
            return res.status(500).json({ error: err.message });
            });
    // }
    // else {
    //     return res.status(500).json({error: result.error})
    // }

});

app.get('/api/getFavoriteList/:userid', (req,res)=> {
    // authHeader = req.headers.authorization;
    // // console.log ("Auth header",authHeader)
    // token = authHeader && authHeader.split(' ')[1];
    // const result =  checkIfAuthenticated(token);

    const userid = req.params.userid

    // if (result.authenticated){
        db.collection('users').findOne({_id: new ObjectId (userid)})
        .then((user) => {
          if (!user) {
               
            //There is no such user exist in the database 
            return res.status(500).json({error: "Cannot find the user data in the database"});
          }
          else{
            //if found the user exist in the database
                const user_favorite_data = user
                // console.log ("get favorite_list ", user_favorite_list.length)
                if ( user.favorite_list.length == 0){
                    return res.status(200).json({data: user.favorite_list});
                }
                else {
                    return res.status(200).json({data: user.favorite_list})
                }
            //   db.collection('users').deleteOne({ _id: new ObjectId (userid) })
            //   return res.status(200).json({message: "Delete Successfully!"});
            }
            
            })
            .catch((err) => {
            // console.log(err);
            return res.status(500).json({ error: err.message });
            });
    // }
    // else {
    //     return res.status(500).json({error: result.error})
    // }

});

app.get('/api/suggestions/:username', (req,res)=> {
    const searchString = req.params.username;
    userList =[];
    if (searchString == undefined){
        return res.json({data: "could not retrieve data"})
    }
    else{    
        db.collection('users').find({username: {$regex: new RegExp(searchString, 'i'), // Case-insensitive search
        },})
        .toArray().then((users) => {
            //    console.log('users found:', users);
            userList.push(users)
            // return res.json({data: userList})
            return res.json({users})
        })
        .catch((error) => {
            //   console.error('Error filtering users:', error);
            return res.json({data: "Error finding and filtering users "})
        })}


});



// Routes
app.get('/', (req, res) => {
    // console.log('roots');
    res.send(req.user);
    
    
   });


   //endpoint to initiate steam login
app.get('/api/auth/steam', passport.authenticate('steam', {failureRedirect: '/'}), function (req, res) {
    // res.redirect('http://localhost:4200/home')
    res.redirect('http://statengines.org:4200/home')
    
   });


   //endpoint for steam to redirect to after authentication
// app.get('/api/auth/steam/return', passport.authenticate('steam', {failureRedirect: '/'}), function (req, res) {
//     // console.log('login sucessful');
//     res.redirect('http://localhost:4200/myaccount')
//    });


app.post('/api/help/bssteam', (req, res) => {
    const userid = req.body.userid
    console.log("in bssteam")
    console.log(req)
    console.log(res)
    console.log(userid)

  });

app.get('/api/auth/steam/return', passport.authenticate('steam', {failureRedirect: '/'}), (req, res) => {
    const steamID = req.user.id;
    const updateInventoryUrl = 'http://20.193.159.130:3000/update_inventory?steam_id=' + steamID;

    // // Prepare your data to be sent (if needed)
    // const requestData = {
    //   // Your data here
    // };
    
 // Forward the POST request to another server
    axios.post(updateInventoryUrl)
      .then(response => {
        // Handle the response data
        console.log('Response:', response.data);
      })
      .catch(error => {
        // Handle errors
        console.error('Error:', error);
      });




    // res.redirect('http://localhost:4200/myaccount/'+ req.user.id)
    res.redirect('http://statengines.org:4200/myaccount/'+ req.user.id)
});

function getSteamId(userprofile) {
    console.log("hey")
    
   // console.log(userprofile)
}

app.post('/api/getid', async (req,res)=> {
    // console.log("GET INVENTORY")
    const userid = req.body
    // console.log(req.params.id)
    // console.log("SteamID: ",steamID);
    
 

})

app.get('/api/getUserInventory/:id', async (req,res)=> {
    //Two paths: if there is already a user inventory loaded in the user's database entry, return items from that list
    //If not, load the inventory from steam api, cache the prices, and return the items
    // console.log(userid)

    //**IMPORTANT** Right now this will redirect ALL users to the same inventory, for demonstration purposes
    const userid = req.params.id
    // const userid = "76561198168141707"
    const user = await db.collection('users').findOne({steamID: userid})
    return res.json(user["inventory"])
})

app.get('/api/getUserSteamID/:id', async (req,res)=> {
    const userid = req.params.id
    const user = await db.collection('users').findOne({_id: new ObjectId (userid)})
    // console.log(user)
    return res.json(user["steamID"])   
})


app.get('/api/getMarketData', async (req,res)=> {
    console.log("Loading Full Market Data")
    var items = await db.collection('itemData').find({}).toArray()
    return res.json(items)
});

app.get('/api/getMarketDataPreview', async (req,res)=> {
    console.log("Loading Preview Market Data")
    var items = await db.collection('itemData').find({}).limit(500).toArray()
    return res.json(items)
})