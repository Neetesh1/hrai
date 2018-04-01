var express = require('express');
var request = require('request');
var config = require('config');
var router = express.Router();
var app = express();
global.temp={};  //store session data
/* GET Session Check page. */

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
  console.log('stepo1');
  console.log('https://' + req.headers.host + '/leaves/getleaves');
   if (temp.sessionData) {
    console.log('stepo2');
    console.log('https://' + req.headers.host + req.url);
      res.redirect('https://' + req.headers.host + '/leaves/getleaves');
      // res.redirect('/leaves/getleaves');
   } else {
    console.log('stepo3');
      next();
   }    
};

router.post('/', sessionChecker, (req, res) => {
  console.log('stepo4');
  //res.redirect('/leaves/login');
  console.log(req.headers.host);
  res.redirect('https://' + req.headers.host + '/leaves/login');
});

router.post('/getleaves', function(req, res, next) {
  console.log('getleaves');
  console.log('stepo8');
  var slack_message = 'Sorry! some technical error from our end. Please try again later';
  if (config.has('GetEmpLeaveBalancesUrl')) { //check config has these json veriable
    var bodyJson = { "loginData":
                      { "DeviceID":config.get("loginCred.DeviceID"), 
                        "SessionID":temp.sessionData.SessionID,
                      }, 
                      "empID":temp.sessionData.LoggedInUser.EmpID
                    };
    
    request.post({url:config.get('GetEmpLeaveBalancesUrl'), body: bodyJson, json:true}, function optionalCallback(err, httpResponse, body) {
    if (err) {
       console.log('Error while posting GetEmpLeaveBalancesUrl:', err);
    }
    
    if(body.GetEmpLeaveBalancesResult.ErrorCode == 0)
    {
      data = body.GetEmpLeaveBalancesResult.leavesBalanceList;
      slack_message = "You have \n";
      for(var i = 0; i < data.length; i++) {
        slack_message += data[i].Leave + " Balance: " + data[i].Balance + "Consumed: "+ data[i].Consumed + "\n";
      }
      return res.json({
        speech: "speech",
        displayText: "speech",
        source: "hrai",
        data: {
          slack: slack_message
        }
      });
    }else{
        console.log('Error in post response:', body.GetEmpLeaveBalancesResult.ErrorMessage);
      }
    });
  }
  else{
    console.log('GetEmpLeaveBalancesUrl not found');
  }
  
});

router.post('/login', function(req, res, next) {
  console.log('stepo6');
  console.log('login');
  if (config.has('loginCred')) { //check config has these json veriable
    // let userName = req.body.userName;
    // let password = req.body.password;
    var bodyJson = { 'loginCred':config.get('loginCred') };
    request.post({url:config.get('loginUrl'), body: bodyJson, json:true}, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('Error while posting:', err);
      }
      
      if(body.LogInUserResult.ErrorCode === 0 && body.LogInUserResult.IsLoggedIn === true && body.LogInUserResult.SessionID)
      {
        temp.sessionData = body.LogInUserResult; // setting this temp parametter]
        console.log('stepo7');
       // res.redirect('/leaves/getleaves');
        res.redirect('https://' + req.headers.host + '/leaves/getleaves');
      }else{
        console.log('Error in post response:', body.LogInUserResult.ErrorMessage);
      }
    });
  }
  else{
    console.log('credentails not defined');
  }
});



module.exports = router;

