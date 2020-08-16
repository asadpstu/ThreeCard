const socket = io('https://threecardsocket.herokuapp.com:3001')
var p_table_fold = [];
function join()
{
    
    const data = JSON.parse(localStorage.getItem('loginInfo'));
    if(data)
    {
      const name = data.name;
      socket.emit('new-user', name)      
    }
    else
    {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        title: 'Warning!',
        text: "Please login to continue",
        icon: 'warning',
      })
    }
   


}


socket.on('user-list', userList => {
  
  document.getElementById('room-user-container').innerHTML = "";
  const userContainer = document.getElementById('room-user-container');
  var count = 0;
  for (var key in userList) {
      if (userList.hasOwnProperty(key)) {       
        var htmlContent = "<a href='#' class='list-group-item list-group-item-action' >" + userList[key] + "</a>";
        var CONTENT = document.createElement('div');
        CONTENT.className = 'list-group-item list-group-item-action';
        CONTENT.innerHTML = "<i class='fa fa-circle' style='color:green'></i> &nbsp;&nbsp;" + userList[key];

        userContainer.append(CONTENT)
        count++;
      }
  }
  $("#show").show();
  if(count >= 1)
  {
    $("#list-header").show();
  }

  if(count < 4)
  {
    document.getElementById("waiting").innerHTML = (4-count) + " more player needed!"
  }
  else
  {
    $("#waiting").hide();
  }

})




socket.on('user-connected', name => {
  if(name)
  {
    appendMessage(`${name} joined`)
  }
  
})

socket.on('message', message => {
  if(message)
  {
    if(message.status === "fail")
    {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        title: 'Error',
        text: message.message,
        icon: 'error',
      })
    }
    if(message.status === "success")
    {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        title: message.message,
        text: '',
        icon: 'success',
      })

      $("#join").hide();
      grabSeat()
    }
  }
  
})


socket.on('messageforothers', message => {
  if(message)
  {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      title: message.message,
      text: '',
      icon: 'info',
    })



  }
  
})

socket.on('user-disconnected', name => {
  if(name === 'undefined' || name =='undefined ')
  {
    appendMessage('Anonymus user left')
  }
  else
  {
    appendMessage(`${name} left`)
  }
   
})

function send()
{
    const message = document.getElementById('message-input').value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', message)
    document.getElementById('message-input').value = ''  ;
    $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
}


socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})






function appendMessage(message) {
  const messageContainer = document.getElementById('message-container')
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
  $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
    var audio = new Audio('sound.wav');
    audio.loop = false;
    audio.play(); 
}


function update(seatid)
{
  var amount = 50;
  for(var i=0;i<p_table_fold.length;i++)
  {
    if(p_table_fold[i] === seatid)
    { 
      amount = 0;
      updateAmount(amount,seatid)
    }
  }

  if(amount !== 0)
  {
    updateAmount(amount,seatid)
  }
  

}

function updateUndefined(seatid)
{
  const amount = 0;
  updateAmount(amount,seatid)
}

function updateAmount(message,seatid) 
{
  const localData = JSON.parse(localStorage.getItem('loginInfo'));
  try{

    //reading current balance
    const balance = document.getElementById('balance').innerHTML.replace(",","");
    if(Number(balance) > Number(message))
    {
      document.getElementById('balance').innerHTML = Number(balance) - Number(message);

      for(var i=0;i<shapeTable.length;i++)
      {
        if(shapeTable[i].tableName === seatid && localData.name === shapeTable[i].bookedBy)
        {
        localData["amount"] = Number(balance) - Number(message);
        localStorage.setItem('loginInfo', JSON.stringify(localData));  
        }
      }
      
      

    }


    const initial = document.getElementById('total').innerHTML;
    const totalNumber = Number(initial) + Number(message)
    document.getElementById("total").innerHTML = totalNumber
    socket.emit('update-amount', { "totalNumber" : totalNumber , "seatid" : seatid });
  }
  catch(e)
  {
    //no need to execute
  }
  
}

socket.on('received-amount-update', data => {
  document.getElementById("total").innerHTML = data.amount
  
  $("#"+data.seatid).removeAttr("class","pulse1");
  $("#"+data.seatid).removeAttr("onclick");


  const localData = JSON.parse(localStorage.getItem('loginInfo'));
  var userName = localData.name;


  //As this game is defined as Four person game
  document.getElementById("t1_label").innerHTML = "";
  document.getElementById("t2_label").innerHTML = "";
  document.getElementById("t3_label").innerHTML = "";
  document.getElementById("t4_label").innerHTML = "";

  var ReshapeTable = [{},{},{},{}];
  console.log(ReshapeTable)
  var tableInfo = data.tableInfo;
  for(var sort=0;sort < tableInfo.length;sort++)
  {
    switch(tableInfo[sort].tableName){
      case "t1" : 
      ReshapeTable[0] = tableInfo[sort];
      break;

      case "t2" : 
      ReshapeTable[1] = tableInfo[sort];
      break;

      case "t3" : 
      ReshapeTable[2] = tableInfo[sort];
      break;

      case "t4" : 
      ReshapeTable[3] = tableInfo[sort];
      break;
    }
  }

  var toCheckValidUser = "";
  if(data.seatid === 't1')
  {
    $("#t2").addClass("pulse1");
    $("#t2").removeAttr("onclick");

    clearTimeout(downloadTimer_2);
    
    
    for(var i=0;i<data.tableInfo.length;i++)
    {
      if(data.tableInfo[i].tableName === 't2' && data.tableInfo[i].bookedBy === userName)
      {
        toCheckValidUser = data.tableInfo[i].bookedBy;
        $("#t2").attr("onclick","update('t2')");
      }     
    }

    //For labeling
    if(ReshapeTable[1].bookedBy !== userName)
    {
      if(!ReshapeTable[1].bookedBy)
      {
        updateUndefined('t2');
        return;
      }
      document.getElementById("t2_label").innerHTML = ReshapeTable[1].bookedBy+"'s turn";
    }
    else
    {
      document.getElementById("t2_label").innerHTML = "Your turn";
    }

    calltimer('t2',toCheckValidUser);


  }
  if(data.seatid === 't2')
  {
    $("#t3").addClass("pulse1");
    $("#t3").removeAttr("onclick");
    clearTimeout(downloadTimer_2);
    
    for(var i=0;i<data.tableInfo.length;i++)
    {
      if(data.tableInfo[i].tableName === 't3' && data.tableInfo[i].bookedBy === userName)
      {
        toCheckValidUser = data.tableInfo[i].bookedBy;
        $("#t3").attr("onclick","update('t3')");
      }    
    }

    //For labeling
    if(ReshapeTable[2].bookedBy !== userName)
    {
      if(!ReshapeTable[2].bookedBy)
      {
        updateUndefined('t3');
        return;
      }
      document.getElementById("t3_label").innerHTML = ReshapeTable[2].bookedBy+"'s turn";
    }
    else
    {
      document.getElementById("t3_label").innerHTML = "Your turn";
    }
    calltimer('t3',toCheckValidUser);

  }
  if(data.seatid === 't3')
  {
    $("#t4").addClass("pulse1");
    $("#t4").removeAttr("onclick");
    clearTimeout(downloadTimer_2);
    
    for(var i=0;i<data.tableInfo.length;i++)
    {
      if(data.tableInfo[i].tableName === 't4' && data.tableInfo[i].bookedBy === userName)
      {
        toCheckValidUser = data.tableInfo[i].bookedBy;
        $("#t4").attr("onclick","update('t4')");
      }
    }

    //For labeling
    if(ReshapeTable[3].bookedBy !== userName)
    {
      if(!ReshapeTable[3].bookedBy)
      {
        updateUndefined('t4');
        return;
      }
      document.getElementById("t4_label").innerHTML = ReshapeTable[3].bookedBy+"'s turn";
    }
    else
    {
      document.getElementById("t4_label").innerHTML = "Your turn";
    }

    calltimer('t4',toCheckValidUser);
  }
  if(data.seatid === 't4')
  {
    $("#t1").addClass("pulse1");
    $("#t1").removeAttr("onclick");
    clearTimeout(downloadTimer_2);
    
    for(var i=0;i<data.tableInfo.length;i++)
    {
      if(data.tableInfo[i].tableName === 't1' && data.tableInfo[i].bookedBy === userName)
      {
        toCheckValidUser = data.tableInfo[i].bookedBy;
        $("#t1").attr("onclick","update('t1')");
      }
    }
    
    
    //For labeling
    if(ReshapeTable[0].bookedBy !== userName)
    {
      if(!ReshapeTable[0].bookedBy)
      {
        updateUndefined('t1');
        return;
      }
      document.getElementById("t1_label").innerHTML = ReshapeTable[0].bookedBy+"'s turn";
    }
    else
    {
      document.getElementById("t1_label").innerHTML = "Your turn";
    }

    calltimer('t1',toCheckValidUser);
  }
})


function grabSeat()
{
  const data = JSON.parse(localStorage.getItem('loginInfo'));
  socket.emit('grab-seat',{"name" : data.name, "photo" : data.picture.data.url , "userId" : data.id});
  $("#grabSeat").hide();
}

socket.on('table-view',players =>{
  document.getElementById('t1').src = "image/face/1.jpg";
  document.getElementById('t2').src = "image/face/2.jpg";
  document.getElementById('t3').src = "image/face/3.jpg";
  document.getElementById('t4').src = "image/face/4.jpg";
  
  for(var i=0;i<players.length;i++)
  {     
      document.getElementById(players[i].tableName).src = players[i].photo;
  }

  if(players.length === 4)
  {
    socket.emit("Broadcast-warning");
  }

})

var shapeTable = [{},{},{},{}];
socket.on("received-game-start-warning",data=>{

  //Reshape table for temporary purpose later code will refactored
  
  console.log(shapeTable)
  var tableInfo = data.tableInfo;
  for(var sort=0;sort < tableInfo.length;sort++)
  {
    switch(tableInfo[sort].tableName){
      case "t1" : 
      shapeTable[0] = tableInfo[sort];
      break;

      case "t2" : 
      shapeTable[1] = tableInfo[sort];
      break;

      case "t3" : 
      shapeTable[2] = tableInfo[sort];
      break;

      case "t4" : 
      shapeTable[3] = tableInfo[sort];
      break;
    }
  }


  if(data.second === 20)
  {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 10000,
      title: 'Dealer Distributing Card.',
      text: "Game starting in 10 second ",
      icon: 'info',
    })

    $("#loading").show();
    var timeleft = 10;
    var tempValue = "";
    var downloadTimer = setInterval(function(){
      if(timeleft <= 0){
        clearInterval(downloadTimer);
        document.getElementById("loading").innerHTML = "Finished";
        $("#loading").hide();
        $("#t1").addClass("pulse1");
        clearTimeout(downloadTimer_2);
        
        

        //assigning function start
        const localData = JSON.parse(localStorage.getItem('loginInfo'));
        var userName = localData.name;
        for(var i=0;i<data.tableInfo.length;i++)
        {
          if(data.tableInfo[i].tableName === 't1' && data.tableInfo[i].bookedBy === userName)
          {
            tempValue = data.tableInfo[i].bookedBy;
            $("#t1").attr("onclick","update('t1')");
          }
        }

      //For labeling
      if(shapeTable[0].bookedBy !== userName)
      {
        if(!shapeTable[0].bookedBy)
        {
          updateUndefined('t1');
          return;
        }
        document.getElementById("t1_label").innerHTML = shapeTable[0].bookedBy+"'s turn";
      }
      else
      {
        document.getElementById("t1_label").innerHTML = "Your turn";
      }

      calltimer('t1',tempValue);
        //assigning function End

        distribute(data.tableInfo);


      } else {
        
        document.getElementById("loading").innerHTML = `<img src='image/number/${timeleft}.png'  style='height:100px;position: fixed;top: 50%;left: 50%;transform: translate(-50%, -50%);'  />`;
      }
      timeleft -= 1;
    }, 1000);


  }

  $("#t1_fold_game").show();
  $("#t2_fold_game").show();
  $("#t3_fold_game").show();
  $("#t4_fold_game").show();
})

Array.prototype.random = function (length) {
  return this[Math.floor((Math.random()*length))];
}


var tableSeat = [];
var emptyTable = [{},{},{},{}];
function distribute(table)
{
  const localData = JSON.parse(localStorage.getItem('loginInfo'));
  var userName = localData.name;
  var cards = ["2C.png","2D.png","2H.png","2S.png","3C.png","3D.png","3H.png","3S.png","4C.png","4D.png","4H.png","4S.png","5C.png","5D.png","5H.png","5S.png","6C.png","6D.png","6H.png","6S.png","7C.png","7D.png","7H.png","7S.png","8C.png","8D.png","8H.png","8S.png","9C.png","9D.png","9H.png","9S.png","10C.png","10D.png","10H.png","10S.png","AC.png","AD.png","AH.png","AS.png","JC.png","JD.png","JH.png","JS.png","KC.png","KD.png","KH.png","KS.png","QC.png","QD.png","QH.png","QS.png"]
  
  var seat_1 = [];
  var seat_2 = [];
  var seat_3 = [];
  var seat_4 = [];
  for(var i=1;i<=4;i++)
  {
    for(var j=0;j<3;j++)
    {
      var pickCard = cards.random(cards.length);
      cards = cards.filter(e => e !== pickCard)
      if(i=== 1)
      {
        seat_1.push(pickCard)
      }
      if(i=== 2)
      {
        seat_2.push(pickCard)
      }
      if(i=== 3)
      {
        seat_3.push(pickCard)
      }
      if(i=== 4)
      {
        seat_4.push(pickCard)
      }
      
    }
    if(i=== 1)
    {
      tableSeat.push(seat_1);
    }
    if(i=== 2)
    {
      tableSeat.push(seat_2);
    }
    if(i=== 3)
    {
      tableSeat.push(seat_3);
    }
    if(i=== 4)
    {
      tableSeat.push(seat_4);
    }
    
  }
  
  //sorting Table for sequence
 
  console.log(emptyTable)

  for(var sort=0;sort < table.length;sort++)
  {
    switch(table[sort].tableName){
      case "t1" : 
      emptyTable[0] = table[sort];
      break;

      case "t2" : 
      emptyTable[1] = table[sort];
      break;

      case "t3" : 
      emptyTable[2] = table[sort];
      break;

      case "t4" : 
      emptyTable[3] = table[sort];
      break;
    }
  }

  console.log(emptyTable)

  var tab1 = [];
  var tab2 = [];
  var tab3 = [];
  var tab4 = [];
  for(var k=0;k<4;k++)
  {
     for(var q=0;q<3;q++)
     {
       
       if(k === 0)
       {
          if(emptyTable[0].bookedBy === userName)
          {
            document.getElementById("one_"+(q+1)).src = "image/card/"+tableSeat[k][q];
            tab1.push(tableSeat[k][q])
          }
          else
          {
            document.getElementById("one_"+(q+1)).src = "image/Graphic/blue_back.png";
            $("#one_"+(q+1)).addClass("bg-image");
          }    
          
          if(q === 2 && emptyTable[0].bookedBy === userName) 
          {
            emptyTable[0]["cards"] = tab1;
            socket.emit("send-to-server", emptyTable[0])
          }
       }
       if(k === 1)
       {
         
         if(emptyTable[1].bookedBy === userName)
          {
            document.getElementById("two_"+(q+1)).src = "image/card/"+tableSeat[k][q];  
            tab2.push(tableSeat[k][q])         
          }
          else
          {
            document.getElementById("two_"+(q+1)).src = "image/Graphic/blue_back.png";
            $("#two_"+(q+1)).addClass("bg-image");
          }

          if(q === 2 && emptyTable[1].bookedBy === userName)
          {
            emptyTable[1]["cards"] = tab2;
            socket.emit("send-to-server", emptyTable[1])
          }
       }
       if(k === 2)
       {
        if(emptyTable[2].bookedBy === userName)
        {
          document.getElementById("three_"+(q+1)).src = "image/card/"+tableSeat[k][q]; 
          tab3.push(tableSeat[k][q])          
        }
        else
        {
          document.getElementById("three_"+(q+1)).src = "image/Graphic/blue_back.png";
          $("#three_"+(q+1)).addClass("bg-image");
        }

        if(q === 2 && emptyTable[2].bookedBy === userName)
          {
            emptyTable[2]["cards"] = tab3;
            socket.emit("send-to-server", emptyTable[2])
          }
       }
       if(k === 3)
       {
        if(emptyTable[3].bookedBy === userName)
        {
          document.getElementById("four_"+(q+1)).src = "image/card/"+tableSeat[k][q];    
          tab4.push(tableSeat[k][q])       
        }
        else
        {
          document.getElementById("four_"+(q+1)).src = "image/Graphic/blue_back.png";
          $("#four_"+(q+1)).addClass("bg-image");
        }

        if(q === 2 && emptyTable[3].bookedBy === userName)
        {
          emptyTable[3]["cards"] = tab4;
          socket.emit("send-to-server", emptyTable[3])
        }
       }
       
       
     }
  }
  
}


var downloadTimer_2;
function calltimer(arg,user)
{

  var nextTableFold = false;
  for(var i=0;i<p_table_fold.length;i++)
  {
    if(p_table_fold[i] === arg)
    { 
      nextTableFold = true;
      updateAmount(0,arg)
    }
  }

  if(nextTableFold === false)
  {
    const data = JSON.parse(localStorage.getItem('loginInfo'));
    var timeleft_2 = 20;
    downloadTimer_2 = setInterval(function(){
      if(timeleft_2 <= 1){
        clearInterval(downloadTimer_2);
        if(timeleft_2 === 1)
        {
          document.getElementById("timer").innerHTML = "";
          if(data.name === user)
          {
            update(arg);
          }
          
        }
      }
      document.getElementById("timer").innerHTML = `<img src='image/number/${timeleft_2}.png'  style='height:50px;'  />`;
      timeleft_2 -= 1;
    }, 1000);
  }
}
var receivedPacketAll = "";
socket.on("receive-to-client",receivedPacket=>{
  receivedPacketAll = receivedPacket;
})

function show()
{
  
  // tableSeat = [
  //   ["2S.png", "3S.png", "AS.png"],
  //   ["6S.png", "3C.png", "9H.png"],
  //   ["3D.png", "6D.png", "9D.png"],
  //   ["2C.png", "2D.png", "2K.png"]   
  // ]
  //console.log(receivedPacketAll);
  var onlyUniqueTableValue = uniqBy(receivedPacketAll, JSON.stringify)
  console.log(onlyUniqueTableValue)



  
  //console.log(tableSeat)
  var Specialrun = [3,6,9];
  var Exceptionrun = [2,3,14];
  var Result = [];

  for(var i=0;i<4;i++)
  {
      //console.log(emptyTable)
      //result Table1
      var T1_Color = false;
      var T1_Run = false;
      var T1_SpecialRun = false;
      var T1_ExceptionRun = false;
      var T1_Tray = false;
      var T1_PairArray = [];
      var T1_Pair = "";
      var T1_Pair_Available = false;

      var T1_numbers = [];
      var T1_1_First = checkCharecter(onlyUniqueTableValue[i].cards[0].slice(0, -5));
      var T1_2_First = checkCharecter(onlyUniqueTableValue[i].cards[1].slice(0, -5));
      var T1_3_First = checkCharecter(onlyUniqueTableValue[i].cards[2].slice(0, -5));
      
      T1_numbers.push(T1_1_First);
      T1_numbers.push(T1_2_First);
      T1_numbers.push(T1_3_First);
      

      console.log(T1_numbers);
      var sortT1 = T1_numbers.sort(function(a, b){return a-b});
      console.log(sortT1);

      var T1_1_Last = onlyUniqueTableValue[i].cards[0].substr(onlyUniqueTableValue[i].cards[0].length - 5);
      var T1_2_Last = onlyUniqueTableValue[i].cards[1].substr(onlyUniqueTableValue[i].cards[1].length - 5);
      var T1_3_Last = onlyUniqueTableValue[i].cards[2].substr(onlyUniqueTableValue[i].cards[2].length - 5);
      
      
      //checking color
      if( areEqual(T1_1_Last,T1_2_Last,T1_3_Last) === true)
      {
        T1_Color = true;
      }
      else
      {
        T1_Color = false;
      }

      //checking Sequence
      T1_Run = isSequential(sortT1);

      //Checking Sequence Exception
      if(JSON.stringify(sortT1) === JSON.stringify(Specialrun))
      {
        T1_SpecialRun = true;
      }

      //Check Run
      if(JSON.stringify(sortT1) === JSON.stringify(Exceptionrun))
      {
        T1_ExceptionRun = true;
      }


      //Check tray
      T1_Tray = tray(sortT1)


      //Check pair
      if(T1_Tray === false)
      {
        T1_PairArray = findDuplicates(sortT1);
        if(T1_PairArray.length > 0)
        {
          T1_Pair_Available = true;
          T1_Pair = T1_PairArray[0];
        }
        
        
      }



      
      // console.log("color : " , T1_Color)
      // console.log("Run : " , T1_Run)
      // console.log("Special Run : " , T1_SpecialRun)
      // console.log("Exception Run : " , T1_ExceptionRun)
      // console.log("Tray : " , T1_Tray)
      // console.log("Pair : " , T1_Pair_Available)
      // console.log("Pair Number : " , T1_Pair)

      var T1_Value1 = 0;
      var executingBlock = "";
      if(T1_Color === true && T1_Run===false && T1_ExceptionRun===false && T1_SpecialRun===false && T1_Tray===false && T1_Pair_Available===false)
      {
        executingBlock = "Color";
        T1_Value1 = (sortT1[0] + sortT1[1] + sortT1[2]) * 1000 ; //color
      }
      else if(T1_Color === false && T1_Run===true && T1_ExceptionRun===false && T1_SpecialRun===false && T1_Tray===false && T1_Pair_Available===false)
      {
        executingBlock = "Run";
        T1_Value1 = (sortT1[0] + sortT1[1] + sortT1[2]) * 10000 ;  //run  14,13,12 = 3900
      }
      else if(T1_Color === false && T1_Run===false && T1_ExceptionRun===true && T1_SpecialRun===false && T1_Tray===false && T1_Pair_Available===false)
      {
        executingBlock = "Exception run ";
        T1_Value1 = (2 + 3 + 1) * 10000 ;//exception run A,2,3
      }
      else if(T1_Color === false && T1_Run===false && T1_ExceptionRun===false && T1_SpecialRun===true && T1_Tray===false && T1_Pair_Available===false)
      {
        executingBlock = "Special Run";
        T1_Value1 = (sortT1[0] + sortT1[1] + sortT1[2])  * 10000 * 3 ;  //3,6,9 = 5400
      }
      else if(T1_Color === true && T1_Run===true && T1_ExceptionRun===false && T1_SpecialRun===false && T1_Tray===false && T1_Pair_Available===false)
      {
        executingBlock = "Normal Run Running";
        T1_Value1 = (sortT1[0] + sortT1[1] + sortT1[2])  * 1000 * 10000 ; //running normal run  2,3,4 = 12000 , 39000
      }
      else if(T1_Color === true && T1_Run===false && T1_ExceptionRun===true && T1_SpecialRun===false && T1_Tray===false && T1_Pair_Available===false)
      {
        executingBlock = "Exception Run Running";
        T1_Value1 = (2 + 3 + 1)  * 1000 * 10000  ; //running Exception run  1,2,3 = 6000
      }
      else if(T1_Color === true && T1_Run===false && T1_ExceptionRun===false && T1_SpecialRun===true && T1_Tray===false && T1_Pair_Available===false)
      {
        executingBlock = "Special Run running";
        T1_Value1 = (sortT1[0] + sortT1[1] + sortT1[2])  * 1000 * 10000 * 3 ; //running special run 54000
      }
      else if(T1_Color === false && T1_Run===false && T1_ExceptionRun===false && T1_SpecialRun===false && T1_Tray===true && T1_Pair_Available===false)
      {
        executingBlock = "Tray";
        T1_Value1 = (sortT1[0] + sortT1[1] + sortT1[2])  * 10000 * 10000 ; //Tray
      }
      else if(T1_Color === false && T1_Run===false && T1_ExceptionRun===false && T1_SpecialRun===false && T1_Tray===false && T1_Pair_Available===true)
      {
        executingBlock = "Pair";
        var tmp1 = 0;
        var tmp2 = 0;
        var tmp3 = 0;
        //Iterating one by one First Element
        if(sortT1[0] === T1_Pair) 
        {
          tmp1 = T1_Pair * T1_Pair * T1_Pair;
        }
        else
        {
          tmp1 = sortT1[0];
        }

        //Iterating one by one Second Element
        if(sortT1[1] === T1_Pair) 
        {
          tmp2 = T1_Pair * T1_Pair *  T1_Pair;
        }
        else
        {
          tmp2 = sortT1[1];
        }

        //Iterating one by one First Element
        if(sortT1[2] === T1_Pair) 
        {
          tmp3 = T1_Pair * T1_Pair * T1_Pair;
        }
        else
        {
          tmp3 = sortT1[2];
        }


        T1_Value1 =  tmp1 + tmp2 + tmp3;


      }
      else
      {
        executingBlock = "Normal card no type"
        T1_Value1 = sortT1[0] + sortT1[1] + sortT1[2]
      } 

      var obj = {"Player" : onlyUniqueTableValue[i].bookedBy, "Table" :onlyUniqueTableValue[i].tableName , "id" : onlyUniqueTableValue[i].id, "photo" : onlyUniqueTableValue[i].photo, "userId" : onlyUniqueTableValue[i].userId, "seqence" : onlyUniqueTableValue[i].cards, "Type" : executingBlock , "value" : T1_Value1}
      Result.push(obj);

      socket.emit("clear");
  }


  var winner = 0;
  var winnerObj = "";


  for(var j=0;j<Result.length;j++)
  {
     if( p_table_fold.indexOf(Result[j].Table ) === -1)
     {
        if(Result[j].value > winner)
        {
          winner = Result[j].value;
          winnerObj = Result[j];
        }       
     }

  }
  console.log(Result)
  console.log(winner)
  
  console.log("Winner=============================================>")
  console.log(winnerObj)

  socket.emit("winner", {"winnerObj" : winnerObj, "table" : Result } );


}

function areEqual(){
  var len = arguments.length;
  for (var i = 1; i< len; i++){
     if (arguments[i] === null || arguments[i] !== arguments[i-1])
        return false;
  }
  return true;
}

function isSequential(myNumbers) {
 var isSeq =  myNumbers.find((e, i, a) => i != 0 && e - 1 != a[i - 1]);
 if(isSeq) return false;
 else return true;
}

function checkCharecter(arg)
{
  if(arg === "J") return 11;
  else if(arg === "Q") return 12;
  else if(arg === "K") return 13;
  else if(arg === "A") return 14;
  else return Number(arg);
}



function tray(arr) {
  return new Set(arr).size == 1;
}


const findDuplicates = (arr) => {
  let sorted_arr = arr.slice().sort(); 
  let results = [];
  for (let i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1] == sorted_arr[i]) {
      results.push(sorted_arr[i]);
    }
  }
  return results;
}


function uniqBy(a, key) {
  var seen = {};
  return a.filter(function(item) {
      var k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  })
}


//endgame Notification
function endgame(p_table_id)
{
  console.log(shapeTable);
  const data = JSON.parse(localStorage.getItem('loginInfo'));
  for(var i=0;i<shapeTable.length;i++){
    if(shapeTable[i].tableName === p_table_id && data.name === shapeTable[i].bookedBy)
    {
      var conf = confirm("Are you sure to send Board show Request?");
      if(conf === true)
      {
        socket.emit("show-request",p_table_id);
      }
      
    }
  }

}



function foldgame(p_table_id)
{
  console.log(shapeTable);
  const data = JSON.parse(localStorage.getItem('loginInfo'));
  for(var i=0;i<shapeTable.length;i++){
    if(shapeTable[i].tableName === p_table_id && data.name === shapeTable[i].bookedBy)
    {
      var conf = confirm("Are you sure to fold your card?");
      if(conf === true)
      {
        socket.emit("show-request-fold",p_table_id);
      }
      
    }
  }

}



socket.on("show-request-received",(p_table_id_list)=>{
  if(p_table_id_list.length > 0){
    $("#board-show").show();
  }
  for(var i=0;i<p_table_id_list.length;i++)
  {
    $("#"+p_table_id_list[i]+"_req_id").show();
    $("#"+p_table_id_list[i]+"_req_id").css("background" , "GREEN");
    $("#"+p_table_id_list[i]+"_end_game").hide();
  }

  console.log(p_table_id_list.length)
  if(p_table_id_list.length === 4)
  {
    show();
  }
})


socket.on("show-request-fold-received",(p_table_id_list_fold)=>{
  p_table_fold = p_table_id_list_fold;
  for(var i=0;i<p_table_id_list_fold.length;i++)
  {
    $("#"+p_table_id_list_fold[i]+"_fold_game").css("background" , "RED");
  }

  if(p_table_fold.length >= 3)
  {
    show();
  }

})

socket.on("listen-winner",(data)=>{
  
  clearTimeout(downloadTimer_2);
  $("#t1").removeClass("pulse1");
  $("#t2").removeClass("pulse1");
  $("#t3").removeClass("pulse1");
  $("#t4").removeClass("pulse1");
  document.getElementById("timer").innerHTML = "";

  const localData = JSON.parse(localStorage.getItem('loginInfo'));

  if(localData.name === data.winnerObj.Player)
  {
    var balance = document.getElementById('balance').innerHTML.replace(",","");
    var total = document.getElementById('total').innerHTML.replace(",","");
    balance = Number(balance) + Number(total);
    localData["amount"] = balance;
    localStorage.setItem('loginInfo', JSON.stringify(localData));  
  }

  $("#"+data.winnerObj.Table+"_congrats").show();
  document.getElementById(""+data.winnerObj.Table+"_congrats").src = "image/Graphic/winner.gif";

  console.log(data.table);

  for(var i=0;i<data.table.length;i++)
  {
    var tableName = data.table[i].Table;
    if(tableName === "t1")
    {
      for(var j=0;j<data.table[i].seqence.length;j++)
      {
        document.getElementById("one_"+(j+1)).src = "image/card/"+data.table[i].seqence[j];
        $("#one_"+(j+1)).removeClass("bg-image");
      }
    }

    if(tableName === "t2")
    {
      for(var j=0;j<data.table[i].seqence.length;j++)
      {
        document.getElementById("two_"+(j+1)).src = "image/card/"+data.table[i].seqence[j];
        $("#two_"+(j+1)).removeClass("bg-image");
      }
    }

    if(tableName === "t3")
    {
      for(var j=0;j<data.table[i].seqence.length;j++)
      {
        document.getElementById("three_"+(j+1)).src = "image/card/"+data.table[i].seqence[j];
        $("#three_"+(j+1)).removeClass("bg-image");
      }
    }

    if(tableName === "t4")
    {
      for(var j=0;j<data.table[i].seqence.length;j++)
      {
        document.getElementById("four_"+(j+1)).src = "image/card/"+data.table[i].seqence[j];
        $("#four_"+(j+1)).removeClass("bg-image");
      }
    }

  }


    Swal.fire({
      toast: true,
      position: 'center',
      showConfirmButton: false,
      timer: 5000,
      title: 'Game Winner : ',
      text: data.winnerObj.Player,
      icon: 'info',
    })

    var clearTime;
    var timeleft_2 = 10;
    clearTime = setInterval(function(){
      if(timeleft_2 <= 1){
        clearInterval(clearTime);
        if(timeleft_2 === 1)
        {
          Swal.fire({
            toast: true,
            position: 'center',
            showConfirmButton: false,
            timer: 10000,
            title: 'Game End',
            text: "Thanks for your Participation. Join Again!",
            icon: 'info',
          })
          window.location.reload();

        }
      }
      timeleft_2 -= 1;
    }, 1000);



});


















