var http = require('http');
var express = require('express');
var app = express();

var server = http.createServer(app);
// Pass a http.Server instance to the listen method
var io = require('socket.io').listen(server);

// The server should start listening
server.listen(80);
app.use('/static', express.static('node_modules'));

app.use(express.static(__dirname + '/'));
app.get('/', function(req, res) {
  res.sendFile('index.html');
});

const users = {};
var table = [];
var cummulativeTable = [];
var p_table_id_list = [];
var p_table_id_list_fold = [];

io.on('connection', socket => {
  
    socket.on('new-user', name => {

    //checking available seat and then join
    var count = 0;
    for (var key in users) {
      if (users.hasOwnProperty(key)) {       
        count++;
      }
    }
     
    /*
      *
      *
      This table is only for 4 person
      *
      *
    */
     if(count < 4)
     {
      users[socket.id] = name
      socket.broadcast.emit('user-connected', name)
      
      //Update user List
      socket.emit('user-list', users)
      socket.broadcast.emit('user-list', users)   
      socket.emit('message', {"status" : "success","message" : "You have joined in the table."})
      socket.broadcast.emit('messageforothers', {"status" : "success","message" : name + " has joined just now."})
      

      //
      cummulativeTable = [];
      p_table_id_list = [];
      p_table_id_list_fold = [];

     }
     else
     {
     socket.emit('user-list', users)
     socket.emit('message', {"status" : "fail","message" : "Table Full with 4 Gambler Right now."})
       
     }

      
    })    



  socket.on('send-chat-message', message => {
    if(users[socket.id])
    {
      socket.broadcast.emit('chat-message', { message: message, name: users[socket.id] })
    }
    else
    {
      socket.broadcast.emit('chat-message', { message: message, name: "Anonymus" })
    }
    
  })
  socket.on('disconnect', () => {
    
    delete users[socket.id]
    socket.emit('user-list', users)
    socket.broadcast.emit('user-list', users)
    table = table.filter(item => item.id !== socket.id)
    socket.emit('table-view',table);
    socket.broadcast.emit('table-view',table);
 
  })

  socket.on('update-amount', message => {
    socket.emit('received-amount-update', { amount: message.totalNumber, name: users[socket.id] , seatid : message.seatid, tableInfo : table });
    socket.broadcast.emit('received-amount-update', { amount: message.totalNumber, name: users[socket.id] , seatid : message.seatid, tableInfo : table });
  })

  socket.on('grab-seat',loginInfo =>{

    //which chair is empty
    if(table.length === 0)
    {
      table.push({"tableName" : "t1", "bookedBy" : loginInfo.name, "photo" : loginInfo.photo , "userId" : loginInfo.userId , "id" : socket.id});
      socket.emit('table-view',table);
      socket.broadcast.emit('table-view',table);
      return;
    }
    if(table.length > 0)
    {
      var alreadyInTable = false;
      var notAvailableTable = ['t1','t2','t3','t4'];
      var newArr = [];
      for(var i=0; i < table.length;i++)
      {
        notAvailableTable = notAvailableTable.filter(e => e !== table[i].tableName)
        // check user in already in table
        if(table[i].userId === loginInfo.userId)
        {
          alreadyInTable = true;
        }
      }

      

      if(alreadyInTable === false)
      {
        table.push({"tableName" : notAvailableTable[0], "bookedBy" : loginInfo.name, "photo" : loginInfo.photo , "userId" : loginInfo.userId , "id" : socket.id});
        socket.emit('table-view',table);
        socket.broadcast.emit('table-view',table);
        return;
      }
    }
    

    
    


  })


  socket.on("Broadcast-warning",()=>{
    cummulativeTable = [];
    p_table_id_list = [];
    p_table_id_list_fold = [];

    socket.emit("received-game-start-warning",{"second" : 20, "tableInfo" : table })
    socket.broadcast.emit("received-game-start-warning",{"second" : 20, "tableInfo" : table })
  })

  socket.on("send-to-server", (data)=>{
    cummulativeTable.push(data);
    socket.emit("receive-to-client",cummulativeTable);
    socket.broadcast.emit("receive-to-client",cummulativeTable);
  });

  
  socket.on("show-request",(p_table_id)=>{
    p_table_id_list.indexOf(p_table_id) === -1 ? p_table_id_list.push(p_table_id) : console.log("This item already exists");
    socket.emit('show-request-received',p_table_id_list);
    socket.broadcast.emit('show-request-received',p_table_id_list);
  })


  socket.on("show-request-fold",(p_table_id)=>{
    p_table_id_list_fold.indexOf(p_table_id) === -1 ? p_table_id_list_fold.push(p_table_id) : console.log("This item already exists");
    p_table_id_list.indexOf(p_table_id) === -1 ? p_table_id_list.push(p_table_id) : console.log("This item already exists");
    socket.emit('show-request-fold-received',p_table_id_list_fold);
    socket.broadcast.emit('show-request-fold-received',p_table_id_list_fold);

    socket.emit('show-request-received',p_table_id_list);
    socket.broadcast.emit('show-request-received',p_table_id_list);
  })

  socket.on("winner",(data)=>{
      
      socket.emit("listen-winner", data )
      socket.broadcast.emit("listen-winner",data)

  });

  socket.on("clear",()=>{
    p_table_id_list = [];
    p_table_id_list_fold = [];
    socket.emit('show-request-received',p_table_id_list);
    socket.broadcast.emit('show-request-received',p_table_id_list);
  })



})









