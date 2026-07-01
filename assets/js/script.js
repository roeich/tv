document.addEventListener("click", () => {
    document.getElementById("tv_video").muted = false;
}, { once: true });

const video = document.getElementById("tv_video");

const track = document.getElementById("channelTrack");

//--------------------------
// Duplicate Items
//--------------------------

const originalHTML = track.innerHTML;

// 5 copies
track.innerHTML =
originalHTML +
originalHTML +
originalHTML +
originalHTML +
originalHTML;

//--------------------------
// Variables
//--------------------------

let speed = 1;
let position = 0;
let isDragging = false;

// width of one original set

const originalCount = track.children.length / 5;

let itemWidth = 0;
let loopWidth = 0;

let lastSoundPosition = 0;

//--------------------------
// Measure
//--------------------------

function calculate(){

    itemWidth = track.children[0].offsetWidth + 20;

    loopWidth = itemWidth * originalCount;

}

window.addEventListener("resize",calculate);

calculate();

//--------------------------
// Render
//--------------------------

function render(){

    let x = position;

    while(x <= -loopWidth){

        x += loopWidth;

    }

    while(x > 0){

        x -= loopWidth;

    }

    gsap.set(track,{
        x
    });

}

//--------------------------
// Auto Scroll
//--------------------------

gsap.ticker.add(() => {

    if (!isDragging) {

        position -= speed;

        // inertia
        if (Math.abs(velocity) > 0.01) {

            position += velocity * 16;

            velocity *= 0.95;

        }

    }

    render();

});

//------------------------------------------
// Drag Variables
//------------------------------------------

let startPointerX = 0;
let startPosition = 0;
let velocity = 0;
let lastPointerX = 0;
let lastTime = 0;

//------------------------------------------
// Draggable
//------------------------------------------

Draggable.create(track, {

    type: "x",

    onPress(e) {

        isDragging = true;

        velocity = 0;

        startPointerX = this.pointerX;

        startPosition = position;

        lastPointerX = this.pointerX;

        lastTime = performance.now();

    },

    onDrag() {

        const dx = this.pointerX - startPointerX;

        position = startPosition + dx;

        const now = performance.now();

        const dt = now - lastTime;

        if (dt > 0) {

            velocity = (this.pointerX - lastPointerX) / dt;

        }

        lastPointerX = this.pointerX;
        lastTime = now;


        const moved = Math.abs(position - lastSoundPosition);

        const distance = Math.max(10,40-speed*6);

        if(moved >= distance){

            playTick();

            lastSoundPosition = position;

        }

        render();

    },

    onRelease() {

        isDragging = false;

    }

});


//------------------------------------------
// Audio Pool
//------------------------------------------

const audioPool = [];

for (let i = 0; i < 15; i++) {

    const audio = new Audio("assets/audio/scroll.mp3");

    audio.preload = "auto";

    audio.volume = 0.35;

    audioPool.push(audio);

}

let audioIndex = 0;

function playTick() {

    const audio = audioPool[audioIndex];

    audio.currentTime = 0;

    audio.play().catch(()=>{});

    audioIndex++;

    if(audioIndex >= audioPool.length){

        audioIndex = 0;

    }

}


const speedValue = document.getElementById("speedValue");

function updateSpeed(){

    speedValue.innerHTML = speed.toFixed(1) + "x";

}

updateSpeed();

document.getElementById("speedUp").onclick = ()=>{

    speed += .5;

    if(speed > 10){

        speed = 10;

    }

    updateSpeed();

}

document.getElementById("speedDown").onclick = ()=>{

    speed -= .5;

    if(speed < .5){

        speed = .5;

    }

    updateSpeed();

}
document.querySelectorAll(".channel_btn").forEach(btn=>{

    btn.onclick=function(e){

        e.preventDefault();

        video.pause();

        video.src=this.href;

        video.load();

        video.play();

    }

});

