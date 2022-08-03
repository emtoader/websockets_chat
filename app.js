var fs = require('fs');
var app = require('http').createServer((req, response) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With, *', // 30 days
  }
 
});


var io = require('socket.io')(app);
const { parse } = require('querystring');
var sanitizer = require('sanitize')();
var connectedUsersID = [];
/**
var dependencies = require('./package-lock.json').dependencies;
var list = {};

for (var p of Object.keys(dependencies)) {
    list[p] = dependencies[p].version;
}
console.log(JSON.stringify(list, null, '  '));
*/
app.listen(3000);
console.log("App running...");
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    database : '',
    user     : '',
    password : '',
});

connection.connect(function(err) { 
		if (err) {
			console.error('Error connecting: ' + err.stack);
			return;
		}

		console.log('Connected as id ' + connection.threadId);
	});

function response(req, res) {
	
	if (req.method === 'POST') {
		let body = '';
		req.on('data', chunk => {
			body += chunk.toString(); // convert Buffer to string
		}); 
		req.on('end', async () => {
			
		
			let result =  parse_body( body );  
		 
			result.then( function(result){
				
				result = JSON.stringify( result );
				console.log(result);
				res.end( result );
			});
			
			
			
		});
		
	}else{
	
	
		var file = "";
		if (req.url == "/") {
			file = __dirname + '/index.html';
		} else {
			file = __dirname + req.url;
		}
		fs.readFile(file, function(err, data) {
			if (err) {
				res.writeHead(404);
				return res.end('Page or file not found');
			}
		res.writeHead(200);
			res.end(data);
		});
	
	}

}

async function parse_body( body ){
	
	//body = parse(body);
	
	if(body.action === 'getMessages'){
		
		var result = await getMessages( body.userChatID, body.roomID );
		
		return result;
		
	}
	
	if(body.action === 'getRooms'){
				
		var results = await getRooms( body.userChatID );
		
		let data = [];
		
		const start = async () => {
		  await asyncForEach(results, async (roomData) => {
			userData = await getUserData(roomData.userID);
		
				
			var format = { userData :userData, roomID : roomData.roomID, userChatID: body.userChatID, courseName: roomData.courseName };
			
		
			data.push(format);
				
		  });
		  
		  return data;
		}
		
		
		await start();
		
		
		return data;
		
		
		
	}
	
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getMessages(userChatID, roomID, offset = 0){
	 
	
	var userID = userChatID;
	
	var sql = 'SELECT *, profile_image as image_url FROM messages INNER JOIN users ON users.ID = ? LEFT JOIN images ON images.ID = users.profile_image WHERE ( sender_id = ? OR reciever_id = ? ) AND roomID = ? ORDER BY messages.ID DESC LIMIT 10 OFFSET ?';
	
	var result = new Promise(function(resolve, reject) {
		
			connection.query(sql, [userID, userID, userID, roomID, offset], function (error, results, fields){
				
				if (error){
					throw error;
				}
				
				var messages = [];
				
				results.forEach(function(messageData){
					
					messages.push( { ID : messageData.ID, sender_id : messageData.sender_id, reciever_id: messageData.reciever_id, message: messageData.message, activeUserID : userID, image : messageData.image_url, datetime: messageData.datetime } );
					
				});
				
				
				 resolve( messages );
				 
			});
			
	});
	
	result = result.then(function(value) {
		  return value;
	});
	
	return result;
	
	
	
	
}

async function getRooms(userChatID){
	 
	
	var userID = userChatID;
	
	console.log(userChatID);
	
	var sql = 'SELECT * FROM message_rooms WHERE user1 = ? OR user2 = ?';
	
	var result = new Promise( async function(resolve, reject) {  
		
			connection.query(sql, [userID, userID], async function (error, results, fields){
				if (error){
					console.log(error);
					throw error;
				}
				
				var rooms = [];
				
				var users = [];
				
				for (const roomData of results){
					
					
					if( roomData.user2 != userChatID ){
						var userID = roomData.user2;
					}else{
						var userID = roomData.user1;
					} 
					
					 const course_name = await getCourseName( roomData.course_type, roomData.course_id );
					 
						users.push( roomData.userID );
					  rooms.push( { roomID : roomData.ID, userID : userID, courseName : course_name } );
					
					
				}
					console.log(rooms);
				 resolve( rooms );
				 
			});
			
	});
	
	result = result.then(function(value) {
		  return value;
	});
	
	return result;
	
	
}

async function getCourseName( course_type, course_id ){
	
	course_type = course_type.replace('pro', '_pro');
	
	
	
	var sql = 'SELECT * FROM published_courses WHERE ID = ? AND type = ?';
	
	var result = new Promise(function(resolve, reject) {
		
			connection.query(sql, [course_id, course_type], function (error, results, fields){
				if (error){
					console.log(error);
					throw error;
				}
				
				var course_title = [];
				
				results.forEach(function(courseData){
					
					course_title = courseData.title;
					
				});
				
				 resolve( course_title );
				 
			});
			
	});
	
	result = result.then(function(value) {
		  return value;
	});
	
	return result;
	
}

async function getUserData(userID){
	
	var sql = 'SELECT users.ID as ID, first_name, name, profile_image as image FROM users LEFT JOIN images ON images.ID = users.profile_image WHERE users.ID = ?';
	
	var result = new Promise(function(resolve, reject) {
		
			connection.query(sql, [userID], function (error, results, fields){
				if (error){
					throw error;
				}
				
				 resolve( results );
				 
			});
			
	});
	
	result = result.then(function(value) {
		  return value;
	});
	
	return result;
	
	
}


async function getUserID( cookie ){
	
	console.log(cookie);
	
	
	var sql = 'SELECT ID FROM users WHERE msg_cookie = ?';
	
	var result; 
	
	var result = new Promise(function(resolve, reject) {
		
		 

			connection.query(sql, [cookie], function (error, results, fields){
				if (error){
					throw error;
				}
				
				result = results[0];
				
				 resolve(  result );
				 
			});

		  
	});
	
	
	
	return result;
	
}

function saveMessage( senderID, recieverID, message, roomid ){   
	
	var sql = "INSERT INTO `messages` (`reciever_id`, `sender_id`, `message`, `roomID`) VALUES (?, ?, ?, ?)"; 
	
	connection.query(sql, [recieverID, senderID, message, roomid], function (error, results, fields){
			if (error){
				throw error;
			}
			
			console.log(results);
			
		});
	
}

io.origins('*:*') // for latest version  

 io.on("connection", function(socket) {
	 
    socket.on("send message", function(msg_data, callback) {
		
		var sent_msg = msg_data.message;
		
		saveMessage( msg_data.senderID, msg_data.recieverID, msg_data.message, msg_data.roomid );
		
		let recieverData = getUserData(msg_data.recieverID);
		
		
		
		recieverData.then( function(recieverData){ 
		
			let senderData = getUserData(msg_data.senderID);
			
			senderData.then( function(senderData) {
				
				var sent_msg_data = { currentDate : getCurrentDate(), sent_msg: sent_msg, senderID: msg_data.senderID, recieverID: msg_data.recieverID, userChatID : msg_data.userChatID, roomid: msg_data.roomid, senderData : senderData,  recieverData : recieverData };
			
				io.sockets.emit("update messages", sent_msg_data);
				callback();
				
				
			});
		
			 
		});
		
		
    }); 
	
	socket.on("getRooms", function(data, callback) { 
		
		let result =  parse_body( data );  
		result.userChatID = data.userChatID;
		 
		result.then( function(result){ 
		
			 socket.emit("getRoomData", result);
			 callback();
			 
		});
		
   
	});
	
	socket.on("getRoomMessages", function(data, callback) {
		
		console.log(data);
		
		let result =  parse_body( data );  
		
		result.then( function(result){ 
			
			
				 socket.emit("getRoomMessages2", result);
				 callback();
		
			
		});
		
    });
	
	
	socket.on("recieveWhoOnline", function(data, callback) {
		
		console.log('online is');
		console.log(connectedUsersID);
		
		connectedUsersID.push(data.user_id);
		
		io.sockets.emit("sendWhoOnline", connectedUsersID);
		
		 callback();
		
    });
	
  

 });
 
  setInterval(function(){
	  
	connectedUsersID = [];

	io.sockets.emit("askWhoOnline");

  }, 10*1000);
	  
	

 function addCurrentUser( obj, userChatID ){
	 
	 obj.userChatID = userChatID;
	 
	 return obj
	 
 }

function getCurrentDate() {
    var currentDate = new Date();
    var day = (currentDate.getDate() < 10 ? '0' : '') + currentDate.getDate();
    var month = ((currentDate.getMonth() + 1) < 10 ? '0' : '') + (currentDate.getMonth() + 1);
    var year = currentDate.getFullYear();
    var hour = (currentDate.getHours() < 10 ? '0' : '') + currentDate.getHours();
    var minute = (currentDate.getMinutes() < 10 ? '0' : '') + currentDate.getMinutes();
    var second = (currentDate.getSeconds() < 10 ? '0' : '') + currentDate.getSeconds();
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}





