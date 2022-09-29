//jshint esversion:6

const express = require("express"); //for nodejs
const bodyParser = require("body-parser"); //for parsing the body
const mongoose = require("mongoose"); //makes easy to work on mongoDB
const _ = require("lodash"); //for uppercase
//const date = require(__dirname + "/date.js");  changing to TODAY only


const app = express();
//app.set store and retrieve variable
app.set('view engine', 'ejs');  //for ejs file

app.use(bodyParser.urlencoded({
  extended: true  //register middleware (always use)
}));

app.use(express.static("public")); //middleware for express

mongoose.connect('mongodb+srv://ignite:12345@cluster0.h67lqwj.mongodb.net/todolistDB').then(() => {
  console.log("connected to database");
})  //to connect mongoose to database


const itemsSchema = {
  name: String //new schema for item(TODOs)
}; //all this are basic syntax

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + icon to add your TODOs"
});

const item3 = new Item({
  name: "<-- click this to Remove your TODOs"
});
//all 3 item are default TODOs

const defaultItems = [item1, item2, item3]; //store in this array

const listSchema = {  //new listSchema
  name: String,
  items: [itemsSchema]
};
//same default syntax
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {  //get request from URL

  Item.find({}, function(err, foundItems) {  //this are basic syntax for CRUD operation

    if (foundItems.length === 0) { //if there are no defaultItems it will insert that 3 item
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added to database");
        }
      });
      res.redirect("/"); //this is almost et every anything
    } else {
      res.render("list", {  //this will render list
        listTitle: "Today",  //title
        newListItems: foundItems  //new items now are found items
      });
    }
  });

});

//app.get get request from URL
app.get("/:customListName", function(req, res) { //this is for new list name
  const customListName = _.capitalize(req.params.customListName); //implementing lodash

//same as upper one
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();   //save
        res.redirect("/" + customListName)
      } else {
        //show existing list

        res.render("list", {listTitle: foundList.name,newListItems: foundList.items});
      }
    }
  });


});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName==="Today"){
    item.save(); //if today i.e. default

    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res) {  //to delete the TODOs the checkboxed item
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){  //syntax findByIdAndRemove
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect("/")
      }
    });
  } else{  //syntax findOneAndUpdate
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList){
       if(!err){
         res.redirect("/" + listName)
       }
      });
  }

});

//about section
app.get("/about", function(req, res) {
  res.render("about");
});


//heroku new port system so that anyone can access this
const port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started Successfully");
});
