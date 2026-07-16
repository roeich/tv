//------------------------------------------
// Gather every TV instance on the page
// (1 in landscape, 2 stacked in portrait)
//------------------------------------------

const instances = Array.from(document.querySelectorAll(".tv_instance")).map((root) => {
    return {
        root,
        video: root.querySelector(".tv_video"),
        track: root.querySelector(".channel_track"),
        videoNameEl: root.querySelector(".tv_video_name"),
        channelNameEl: root.querySelector(".tv_channel_name"),
        playingEl: root.querySelector(".tv_video_playing"),
    };
});

// unmute every video on first user interaction (browser autoplay policy)
document.addEventListener("click", () => {
    instances.forEach(inst => { inst.video.muted = false; });
}, { once: true });

//------------------------------------------
// Set up the scrolling channel track for
// EACH instance independently (drag/inertia
// only affects the track the user touched)
//------------------------------------------

instances.forEach((inst) => {

    const track = inst.track;
    const originalHTML = track.innerHTML;

    // 5 copies for a seamless loop
    track.innerHTML =
        originalHTML +
        originalHTML +
        originalHTML +
        originalHTML +
        originalHTML;

    let speed = 1;
    let position = 0;
    let isDragging = false;

    const originalCount = track.children.length / 5;

    let itemWidth = 0;
    let loopWidth = 0;
    let lastSoundPosition = 0;

    function calculate() {
        itemWidth = track.children[0].offsetWidth + 20;
        loopWidth = itemWidth * originalCount;
    }

    window.addEventListener("resize", calculate);
    calculate();

    function render() {
        let x = position;

        while (x <= -loopWidth) x += loopWidth;
        while (x > 0) x -= loopWidth;

        gsap.set(track, { x });
    }

    let startPointerX = 0;
    let startPosition = 0;
    let velocity = 0;
    let lastPointerX = 0;
    let lastTime = 0;

    gsap.ticker.add(() => {
        if (!isDragging) {
            position -= speed;

            if (Math.abs(velocity) > 0.01) {
                position += velocity * 16;
                velocity *= 0.95;
            }
        }

        render();
    });

    Draggable.create(track, {

        type: "x",

        onPress() {
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
            const distance = Math.max(10, 40 - speed * 6);

            if (moved >= distance) {
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
    // Per-instance tick-sound pool
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
        audio.play().catch(() => {});
        audioIndex++;
        if (audioIndex >= audioPool.length) audioIndex = 0;
    }

});

//------------------------------------------
// Channel switching — clicking ANY channel
// button (in either instance) updates BOTH
// video tags to the same source, so the
// two TVs always play the same channel
//------------------------------------------

// same breakpoint used in style.css — keep these two in sync
const mobilePortraitQuery = window.matchMedia("(orientation: portrait) and (max-width: 768px)");

function isDualMode() {
    return mobilePortraitQuery.matches;
}

function switchChannel(href, meta = {}) {
    const { videoName, channelName, playing } = meta;

    instances.forEach((inst) => {
        inst.video.pause();
        inst.video.src = href;
        inst.video.load();

        if (videoName !== undefined && inst.videoNameEl) {
            inst.videoNameEl.textContent = videoName;
        }
        if (channelName !== undefined && inst.channelNameEl) {
            inst.channelNameEl.textContent = channelName;
        }
        if (playing !== undefined && inst.playingEl) {
            inst.playingEl.textContent = "PLAYING: " + playing;
        }
    });

    // play together once metadata is ready — but only the visible instance(s).
    // on tablets/desktops the 2nd TV is hidden (rotate hack takes over there),
    // so we don't start playing/muting audio on something the user can't see
    instances.forEach((inst, idx) => {
        if (idx > 0 && !isDualMode()) return;

        const tryPlay = () => inst.video.play().catch(() => {});
        if (inst.video.readyState >= 2) {
            tryPlay();
        } else {
            inst.video.addEventListener("loadeddata", tryPlay, { once: true });
        }
    });
}

document.querySelectorAll(".channel_btn").forEach((btn) => {
    btn.onclick = function (e) {
        e.preventDefault();
        switchChannel(this.getAttribute("href"), {
            videoName: this.dataset.videoName,
            channelName: this.dataset.channelName,
            playing: this.dataset.playing,
        });
    };
});

//------------------------------------------
// Load a default channel on first paint so
// both TVs start with something playing
//------------------------------------------

const firstChannelBtn = document.querySelector(".channel_btn");
if (firstChannelBtn) {
    switchChannel(firstChannelBtn.getAttribute("href"), {
        videoName: firstChannelBtn.dataset.videoName,
        channelName: firstChannelBtn.dataset.channelName,
        playing: firstChannelBtn.dataset.playing,
    });
}

//------------------------------------------
// Keep the two videos in sync over time.
// Instance 0 is the "master" — instance 1
// follows its play/pause state and snaps
// its position back if it drifts.
//------------------------------------------

if (instances.length > 1) {

    const master = instances[0].video;
    const follower = instances[1].video;

    setInterval(() => {
        if (!isDualMode()) return;

        if (Math.abs(follower.currentTime - master.currentTime) > 0.25) {
            follower.currentTime = master.currentTime;
        }

        if (master.paused && !follower.paused) follower.pause();
        if (!master.paused && follower.paused) follower.play().catch(() => {});
    }, 1000);

    // if the user manually uses the native controls to seek/pause
    // one of the videos, keep the follower matched to master immediately
    master.addEventListener("seeked", () => {
        if (!isDualMode()) return;
        follower.currentTime = master.currentTime;
    });

    // when the device flips between mobile-portrait (dual) and
    // tablet/landscape (single, rotated) modes, start/stop the
    // hidden 2nd TV's playback so it never plays sound off-screen
    function syncSecondaryToMode() {
        if (isDualMode()) {
            follower.currentTime = master.currentTime;
            if (!master.paused) follower.play().catch(() => {});
        } else {
            follower.pause();
        }
    }

    mobilePortraitQuery.addEventListener("change", syncSecondaryToMode);
    window.addEventListener("resize", syncSecondaryToMode);
    syncSecondaryToMode();

}
