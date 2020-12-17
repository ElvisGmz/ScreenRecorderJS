const video = document.querySelector("#videoplayer");
const startBtn = document.querySelector("#start");
const stopBtn = document.querySelector("#stop");

let recorder;
let recordingData = [];

startBtn.onclick = async () => {
  recordingData = [];
  try {
    pcStream = await navigator.mediaDevices
      .getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 60 },
        audio: true,
      })
      .then((stream) => {
        let options = {
          audioBitsPerSecond: 1536000,
          videoBitsPerSecond: 32000000,
        };

        return new MediaRecorder(stream, options);
      });

    video.srcObject = pcStream.stream;
    recorder = new MediaRecorder(pcStream.stream, {
      mimeType: "video/webm",
    });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordingData.push(e.data);
      }
    };

    recorder.onStop = async () => {
      await pcStream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
  } catch (e) {
    console.log(e);
  }
};

function getFilename() {
  const now = new Date();
  const timestamp = now.toISOString();
  const room = new RegExp(/(^.+)\s\|/).exec(document.title);
  if (room && room[1] !== "") return `${room[1]}_${timestamp}`;
  else return `recording_${timestamp}`;
}

stopBtn.onclick = async () => {
  const a = document.createElement("a");
  let tracks = await video.srcObject.getTracks();
  let url;
  tracks.forEach((track) => track.stop());
  video.srcObject = null;
  await recorder.stop(pcStream.stream);

  await setTimeout(async () => {
    url = await window.URL.createObjectURL(
      new Blob(recordingData, { type: "video/webm" })
    );
    video.src = await url;
    await video.play();

    a.style.display = "none";
    a.href = url;
    a.download = `${getFilename()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }, 500);
};
