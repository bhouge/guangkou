/**
 * Drips
 * by Ben Houge
 * adapted from IntermittentSound object
 *
 *
 *
 * IntermittentSound encapsulates the functionality of a sound that repeats intermittently, appropriately enough.
 * It's a technique I've used in many of my pieces (dating back to graphic score 'A Reading from _____' in 2003):
 * Specify a buffer of PCM data, min/max repeats, and min/max pause between repeats.
 * Note that we're talking repeats, not plays; when you press play, it will always play at least once.
 */

// creating an intermittentSound object with an object constructor
function Drips(buffers, density, volMin, volMax, pitchMin, pitchMax, startWithPause) {
	//alert(this);
	this.buffers = buffers;
  this.density = density;
	this.volMin = volMin;
	this.volMax = volMax;
  this.pitchMin = pitchMin;
  this.pitchMax = pitchMax;
  this.startWithPause = startWithPause;

	this.isPlaying = false;

  this.outputNode;

	// private variables
	var timerID;
	// Douglas Crockford told me to do this: http://www.crockford.com/javascript/private.html
	// It's a convention that allows private member functions to access the object
	// due to an error in the ECMAScript Language Specification
	var that = this;

	function playBuffer(buffer, volume, pitch) {
		//somewhere in here we should probably error check to make sure an outputNode with an audioContext is connected
		//var newNow = that.outputNode.context.currentTime + 0.1;
		var audioBufferSource = that.outputNode.context.createBufferSource();
		audioBufferSource.buffer = buffer;
		audioBufferSource.playbackRate.value = pitch;
		audioBufferGain = that.outputNode.context.createGain();
    audioBufferGain.gain.value = volume;
		//audioBufferGain.gain.setValueAtTime(0., newNow);
		//audioBufferGain.gain.setValueAtTime(0., that.outputNode.context.currentTime);
		audioBufferSource.connect(audioBufferGain);
		audioBufferGain.connect(that.outputNode);


		try {
			//audioBufferSource.start(newNow, that.startTime, that.dur);

			//alert(that.outputNode.context.currentTime);
			//audioBufferGain.gain.linearRampToValueAtTime(volume, newNow + 0.05);

			//audioBufferGain.gain.linearRampToValueAtTime(0.0, that.outputNode.context.currentTime);
			//audioBufferGain.gain.linearRampToValueAtTime(volume, that.outputNode.context.currentTime + 0.05);
			//audioBufferGain.gain.linearRampToValueAtTime(volume, that.outputNode.context.currentTime + that.dur - 0.05);
			//audioBufferGain.gain.linearRampToValueAtTime(0.0, that.outputNode.context.currentTime + that.dur);

			//audioBufferSource.start(that.outputNode.context.currentTime, that.startTime, that.dur);
      audioBufferSource.start(that.outputNode.context.currentTime);
		} catch(e) {
			alert(e);
		}
	}

	// making this a private member function
	function tickDownIntermittentSound() {
		var volume = (that.volMax - that.volMin) * Math.random() + that.volMin;
    //ought to make this exponential, such that halfway between 0.25 and 4.0 is 1.0
		var pitch = (that.pitchMax - that.pitchMin) * Math.random() + that.pitchMin;
    //pick a buffer
    //Math.floor(Math.random() * that.pitchArray.length);
    var bufferKeys = Object.keys(that.buffers);
    var bufferToPlay = bufferKeys[Math.floor(Math.random() * bufferKeys.length)];
    console.log("playing buffer " + bufferToPlay);
		playBuffer(that.buffers[bufferToPlay], volume, pitch);
		if (that.isPlaying) {
      var pauseDur = ((2.0 / that.density) * Math.random()) * 1000;
      timerID = window.setTimeout(tickDownIntermittentSound, pauseDur);
		}
	}

	this.play = function() {
		this.isPlaying = true;
		if (this.startWithPause) {
			var pauseDur = ((2.0 / that.density) * Math.random()) * 1000;
			timerID = window.setTimeout(tickDownIntermittentSound, pauseDur);
		} else {
			tickDownIntermittentSound();
		}
	}

	this.stop = function() {
		if (this.isPlaying) {
			window.clearTimeout(timerID);
			this.isPlaying = false;
		}
	}

	this.connect = function(nodeToConnectTo) {
		try {
			if (nodeToConnectTo.destination) {
				this.outputNode = nodeToConnectTo.destination;
			} else {
				this.outputNode = nodeToConnectTo;
			}
		} catch(e) {
			alert("It seems you have not specified a valid node.");
		}
	}

}
