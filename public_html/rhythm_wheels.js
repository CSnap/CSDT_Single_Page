var context;
var gainNode;

var initialize = function() {
    // prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    // Hook up slider to gain node
    gainNode = context.createGain();

    var slider = document.getElementById('gain_slider');
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = gainNode.gain.value = 1;
    slider.oninput = function() {
        gainNode.gain.value = slider.value;
    }
}

var loadSound = function (req, res) {
    var request = new XMLHttpRequest();
    request.open('GET', req.url, true);
    request.responseType = 'arraybuffer';

    request.onload = function () {
        var success = function(buffer) {
            res({buffer: buffer})
        };

        var error = function(err) { 
            res(null, err);
        };

        context.decodeAudioData(request.response, success, error);
    }

    request.send();
}

function playSound(buffer) {
    var source = context.createBufferSource(); 
    source.buffer = buffer;                    
    source.connect(gainNode);
    gainNode.connect(context.destination);   
    source.start(0);
}

(function () {
    initialize();
    loadSound({url: "sax.wav"}, function (res, err) {
        if(err) {
            console.error("Error loading sound");
            return;
        }
           
        playSound(res.buffer);
        setInterval(function() {
            playSound(res.buffer);
        }, 51742);
    });
})();