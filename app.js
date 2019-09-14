const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const Joi = require('joi');

const db = require("./db");
const collection = "results";
const collection2 = "login";

const app = express();

// schema used for data validation for our details document
const schema = Joi.object().keys({
    details : Joi.string().required()
});

// parses json data sent to us by the user 
app.use(bodyParser.json());

// serve static html file to user
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});


app.get('/firstyr',(req,res)=>{
    // get all Detaild documents within our details collection
    // send back to user as json
    db.getDB().collection(collection).aggregate({$project:{"length" : {$size:"$firstyr"}}}).toArray((err,documents)=>{
        if(err)
            console.log(err);
        else{
            res.json(documents);
        }
    });
});



// read
app.get('/getdetails',(req,res)=>{
    // get all Detaild documents within our details collection
    // send back to user as json
    db.getDB().collection(collection).find({}).toArray((err,documents)=>{
        if(err)
            console.log(err);
        else{
            res.json(documents);
        }
    });
});


// update
app.put('/:id',(req,res)=>{
    // Primary Key of Details Document we wish to update
    const detailsID = req.params.id;
    // Document used to update
    const userInput = req.body;
    // Find Document By ID and Update
    db.getDB().collection(collection).findOneAndUpdate({_id : db.getPrimaryKey(detailsID)},{$set : {details : userInput.details}},{returnOriginal : false},(err,result)=>{
        if(err)
            console.log(err);
        else{
            res.json(result);
        }      
    });
});


//create
app.post('/',(req,res,next)=>{
    // Document to be inserted
    const userInput = req.body;
    
    // Validate document
    // If document is invalid pass to error middleware
    // else insert document within details collection
    Joi.validate(userInput,schema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection(collection).insertOne(userInput,(err,result)=>{
                if(err){
                    const error = new Error("Failed to insert details Document");
                    error.status = 400;
                    next(error);
                }
                else
                    res.json({result : result, document : result.ops[0],msg : "Successfully inserted details!!!",error : null});
            });
        }
    })    
});

/*app.post('/',(req,res,next)=>{
    // Document to be inserted
    const userInput = req.body;
    
    // Validate document
    // If document is invalid pass to error middleware
    // else insert document within details collection
    Joi.validate(userInput,schema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection(collection).insertOne(userInput,(err,result)=>{
                if(err){
                    const error = new Error("Failed to insert details Document");
                    error.status = 400;
                    next(error);
                }
                else
                    res.json({result : result, document : result.ops[0],msg : "Successfully inserted details!!!",error : null});
            });
        }
    })    
});
*/

app.post('/',(req,res,next)=>{

    const userInput = req.body;
    Joi.validate(userInput,schema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
          db.getDb().collection(collection2).findOne({ name: req.body.name}, function(err, user) {
            if (user.name === req.body.name && user.pass === req.body.pass){
                 res.render('display',{profileData:user});
             } 
             else {
             console.log("Credentials wrong");
             res.end("Login invalid");
           }
    });
    }
 });
});



//delete
app.delete('/:id',(req,res)=>{
    // Primary Key of details Document
    const detailsID = req.params.id;
    // Find Document By ID and delete document from record
    db.getDB().collection(collection).findOneAndDelete({_id : db.getPrimaryKey(detailsID)},(err,result)=>{
        if(err)
            console.log(err);
        else
            res.json(result);
    });
});

// Middleware for handling Error
// Sends Error Response Back to User
app.use((err,req,res,next)=>{
    res.status(err.status).json({
        error : {
            message : err.message
        }
    });
})


db.connect((err)=>{
    // If err unable to connect to database
    // End application
    if(err){
        console.log('unable to connect to database');
        process.exit(1);
    }
    // Successfully connected to database
    // Start up our Express Application
    // And listen for Request
    else{
        app.listen(3000,()=>{
            console.log('connected to database, app listening on port 3000');
        });
    }
});