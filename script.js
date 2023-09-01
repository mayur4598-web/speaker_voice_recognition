
const displayString = document.getElementById('displayString');
const waveformContainer = document.getElementById('waveformContainer');

const waveformCanvas = document.getElementById('waveformCanvas');
const canvasContext = waveformCanvas.getContext('2d');
const audioPlayer = document.getElementById('audioPlayer');
const downloadLinks = document.getElementById('downloadLinks');
const image = document.getElementById("image");
let mediaRecorder;
let audioContext;
let analyser;
let dataArray;
let recognition;
let recordedChunks = [];
  let allRecordedChunks = [];
  let randomSentence;

const sentences = [
  'The sun is shining brightly.',
  'She walked along the sandy beach.',
  'The mountains are covered in snow.',
  'The coffee aroma filled the air.',
  'He played the guitar with skill.',
  'The river flowed gently downstream.',
  'They laughed until their sides hurt.',
  'The city lights twinkled at night.',
  'The old book had a worn cover.',
  'The children ran and played in the park.',
  'Stars sparkled in the clear night sky.',
  'She gazed at the full moon in wonder.',
  'The wind rustled through the leaves.',
  'The smell of fresh-baked bread wafted from the bakery.',
  'They sat by the campfire and told stories.',
  'The ancient ruins were a sight to behold.',
  'Raindrops tapped on the windowpane.',
  'The cat curled up on the cozy blanket.',
  'The smell of rain filled the air.',
  'They danced under the starlit sky.',
  'The butterfly landed on the flower petal.',
  'The sound of waves soothed her mind.',
  "The bird's song echoed through the forest.",
  'She painted a masterpiece on the canvas.',
  'The clock chimed midnight.',
  'The waterfall cascaded down the rocks.',
  'The scent of pine trees surrounded them.',
  'He explored the hidden cave with a flashlight.',
  'The warm soup was perfect for a chilly day.',
  'They hiked to the top of the mountain.',
  'The paper boat floated in the pond.',
  'The rainbow stretched across the horizon.',
  'The scent of freshly cut grass filled the air.',
  'She blew out the birthday candles.',
  'The hot air balloon soared above the landscape.',
  "The baby's laughter was infectious.",
  'The fog hung low over the meadow.',
  'They shared stories around the campfire.',
  'The sun dipped below the horizon.',
  'The street was lined with colorful flowers.',
  'The scent of blooming roses was enchanting.',
  'She picked up seashells on the shore.',
  'The old bridge spanned the river.',
  'The moonlight illuminated the path.',
  'They stargazed from the hilltop.',
  'The rain tapped on the window gently.',
  'The fire crackled and warmed their hands.',
  "The waterfall's roar could be heard from afar.",
  'The aroma of freshly brewed coffee filled the room.'
];

function generateRandomSentence() {
  const randomIndex = Math.floor(Math.random() * sentences.length);
  return sentences[randomIndex];
}

// Initialize SpeechRecognition
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const lastResultIndex = event.results.length - 1;
    const isFinal = event.results[lastResultIndex].isFinal;

    if (isFinal) {
      const transcript = event.results[lastResultIndex][0].transcript;
      if (transcript.toLowerCase().includes('hello')) {
        
        randomSentence = generateRandomSentence();
        displayString.innerHTML = randomSentence;
        displayString.style.fontSize = "1.9rem";
        startRecording();
        image.style.visibility = "visible";
      } else {
        stopRecording();
        displayString.innerHTML = 'Say "Hello" to start recording...';
        displayString.style.fontSize = "1rem";
        image.style.visibility = "hidden";
      }
    }
  };

  recognition.onerror = error => {
    console.error('Speech recognition error:', error);
  };

  recognition.start();
} else {
  console.error('Speech recognition not supported.');
}

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.fftSize);
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
allRecordedChunks.push(new Blob([event.data])); // Store individual chunks
updateChunkDisplay();
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioPlayer.src = audioUrl;
    };

    requestAnimationFrame(updateWaveformVisualization); // Start waveform visualization
  })
  .catch(error => {
    console.error('Error accessing microphone:', error);
  });

function startRecognition() {
  if (recognition) {
    recognition.start();
  }
}

function startRecording() {
  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
  updateChunkDisplay();
}

function updateWaveformVisualization() {
  analyser.getByteFrequencyData(dataArray);
  canvasContext.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
  canvasContext.strokeStyle = 'rgb(0, 255, 0)'; // Waveform color
  canvasContext.lineWidth = 2;
  canvasContext.beginPath();
  const sliceWidth = waveformCanvas.width / analyser.fftSize;
  let x = 0;
  for (let i = 0; i < analyser.fftSize; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * waveformCanvas.height) / 2;
    if (i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }
    x += sliceWidth;
  }
  canvasContext.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
  canvasContext.stroke();

  requestAnimationFrame(updateWaveformVisualization);
}
function updateChunkDisplay() {
  downloadLinks.innerHTML = ''; // Clear previous download links
  allRecordedChunks.forEach((chunkBlob, index) => {
    const chunkUrl = URL.createObjectURL(chunkBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = chunkUrl;
    downloadLink.download = `chunk_${index + 1}.wav`;
    downloadLink.style.color = "rgb(0, 255, 0)";
    downloadLink.textContent = `Download -- ${index + 1}`;
    downloadLink.classList.add('chunk-download-link');
    downloadLinks.appendChild(downloadLink);
  });
}

// Start the waveform visualization loop
updateWaveformVisualization();
