/**
 *
 */

var app = require('express')();
var fs = require('fs');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var listenerCount = 0;
var supremeLeaderCount = 0;
var maxPatchCount = 0;

var controllerSocketID;

//this is embarrassing; fix for the future...
var currentState = [0.667,5,7,0.7,1,0.9,1.1,,,,0.667,0.7,1,0.9,1.1,,,,0,0];


app.get('/', function(req, res){
	  res.sendFile(__dirname + '/waterIndex.html');
});

app.get('/controller', function(req, res){
	res.sendFile(__dirname + '/waterCommand.html');
});

app.get('/max', function(req, res){
	res.sendFile(__dirname + '/waterMax.html');
});

//remember, this fun regular expression is what allows you to load resources by name (e.g., "scripts/IntermittentSound.js" from served html files
app.get(/^(.*)$/, function(req, res){
	//console.log(req.params[0]);
	res.sendFile(__dirname + req.params[0]);
});

io.on('connection', function(socket){
  //console.log('a user connected');
  socket.on('disconnect', function(){
	  if (socket.birdType == "listener") {
		  listenerCount--;
		  console.log('listener disconnected; listeners remaining: ' + listenerCount);
	  } else if (socket.birdType == "supreme leader") {
		  supremeLeaderCount--;
		  console.log('supreme leader disconnected; supreme leaders remaining: ' + supremeLeaderCount);
	  } else if (socket.birdType == "max patch") {
			maxPatchCount--;
			console.log('max patch disconnected; max patches remaining: ' + maxPatchCount);
		} else {
		  console.log('mystery user disconnected');
	  }
  });
  socket.on('control message', function(msg){
	//these are coming from the controller and going to all listeners
	console.log('control message: ' + msg);
	io.emit('control message', msg);
	var parsedMessage = msg.split(' ');
	//short-circuit evaluation means no risk of error if there is no parsedMessage[0]
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators
	if (parsedMessage.length >= 2 && parsedMessage[0] == '/water') {
		currentState = parsedMessage[1].split(',');
		console.log('currentState = ' + currentState);
		//console.log("currentState.length = " + currentState.length);
	}
  });
  //unused; this is from original chat demo
  socket.on('message', function(msg){
	    io.emit('message', msg);
	    console.log('message: ' + msg);
  });

	socket.on('max message', function(msg){
		console.log('max message: ' + msg);
		socket.broadcast.to(controllerSocketID).emit('max message', msg);
		/*
	  	var timeStamp = Date.now();
	  	var timeStampMessage = '/timeStamp ' + msg + ':' + timeStamp;
	  	//socket.emit(), not io.emit(), which sends to everybody
	  	socket.emit('sync message', timeStampMessage);

			*/
  });
  socket.on('i am', function(msg){
	    //io.emit('message', msg);
	  	//you could add a property that is name, so we can know who's disconnecting as well
	    if (msg == 'listener') {
	    	socket.birdType = msg;
	    	listenerCount++;
	    	console.log("listener connected; listeners: " + listenerCount);

				//stream + 36 drip sounds...
				var numberOfFilesToSend = 37;
				//can't send this here, will set values on objects that haven't been set up yet...
				//ok, added a check in client that says now you can; stores values until they can be used...
				socket.emit('control message', "/water " + currentState);
				socket.emit('sending audio', numberOfFilesToSend);
				var directoryPrefix = '/audio/compressed/';
				//fyi __dirname gives the directory of the currently running file
				//but I don't seem to need it.
				var fileToPush = __dirname + directoryPrefix + "stream.mp3";
				pushSoundToClient(fileToPush, 'stream', socket);

				for (var drop = 1; drop < 37; drop++) {
					var fileBufferName;
					if (drop < 10) {
						fileBufferName = 'drip00' + drop;
					} else {
						fileBufferName = 'drip0' + drop;
					}
					fileToPush = __dirname + directoryPrefix + fileBufferName + '.mp3';
					//fileToPush = "audio/drip01.ogg";
					pushSoundToClient(fileToPush, fileBufferName, socket);
				}
	    } else if (msg == 'supreme leader') {
	    	socket.birdType = msg;
	    	supremeLeaderCount++;
	    	console.log("supreme leader connected; supreme leaders: " + supremeLeaderCount);
				controllerSocketID = socket.id;
	    } else if (msg == 'max patch') {
	    	socket.birdType = msg;
				maxPatchCount++;
	    	console.log("max patch connected; max patches: " + maxPatchCount);
	    } else {
	    	console.log("mystery user connected");
	    }
  });

  socket.on('make dir', function(msg){
	  //io.emit('chat message', msg);
	  fs.mkdir(msg, function(err) {
		  if(err) {
			  console.log(err);
		  } else {
			  console.log('new directory: ' + msg);
		  }
	  });
  });

  socket.on('post audio', function(msg){
	  console.log(Date.now());
	  //io.emit('chat message', msg);
	  var fileName = msg[1] + "/Birds" + msg[2] + ".wav";
	  fs.writeFile(birdFileName, msg[0], 'base64', function(err) {
		  if(err) {
			  console.log("FOOL! " + err);
		  } else {
			  console.log(Date.now());
			  console.log('posting file ' + birdFileName);
			  //loadSound(msg[2], socket);
			  //io.emit('chat message', msg[2]);
		  }
	  });
	  //console.log('posting file...');
  });
  //socket.emit('audio', { audio: true, buffer: referenceTone, index: 0 });
  socket.emit('get type', 'because you just connected!');
});

function pushSoundToClient(filename, bufferIndex, socket) {
	//console.log('Pushing ' + filename + ' to buffer index ' + bufferIndex + ' on socket ' + socket);
	fs.readFile(filename, function(err, buf){
		if (err) {
			console.log("Error: " + err);
		} else {
			//console.log('audio index:' + bufferIndex);
		  socket.emit('audio', { audio: true, buffer: buf, index: bufferIndex });
		}
	});
}

/*
var referenceTone;
var fileToRead = __dirname + '/sounds/Fl_G4b.wav';
fs.readFile(fileToRead, function(err, buf){
	// loading pitch reference/test file
	if (err) {
		console.log("Error: " + err);
	} else {
		referenceTone = buf;
		console.log('pitch reference loaded');
	}
});
*/

// is it possible that we could start listening and someone could connect before referenceTone is loaded?
http.listen(8300, function(){
  console.log('listening on *:8300');
});
