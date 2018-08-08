var express = require('express');
var app = express();

app.get('/',function(req,res){
  res.send('Hello from new application!!!');
});

app.listen(3000,function(){
  console.log('app is running, and it is very good!');
})