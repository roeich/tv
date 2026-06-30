document.addEventListener("click",function(){
    document.getElementById("tv_video").muted=false;
});


const video = document.getElementById("tv_video");
const tick = document.getElementById("tickSound");

let autoplayDelay = 0;

const swiper = new Swiper(".channelSwiper", {

    slidesPerView:'auto',

    spaceBetween:20,

    centeredSlides:true,

    loop:true,

    grabCursor:true,

    freeMode:{
        enabled:true,
        momentum:true,
        momentumRatio:1.2
    },

    speed:6000,

    autoplay:{
        delay:0,
        disableOnInteraction:false
    }

});


//-------------------------------
// Click Channel
//-------------------------------

document.querySelectorAll(".channel_btn").forEach(btn=>{

    btn.addEventListener("click",function(e){

        e.preventDefault();

        video.src=this.href;

        video.load();

        video.play();

    });

});


//-------------------------------
// Speed Control
//-------------------------------

let currentSpeed=6000;

document.getElementById("speedUp").onclick=function(){

    currentSpeed=Math.max(1000,currentSpeed-1000);

    swiper.params.speed=currentSpeed;

    swiper.update();

}

document.getElementById("speedDown").onclick=function(){

    currentSpeed+=1000;

    swiper.params.speed=currentSpeed;

    swiper.update();

}


//-------------------------------
// Slot Machine Tick Sound
//-------------------------------

let lastIndex=0;

swiper.on("setTranslate",function(){

    let index=Math.round(swiper.translate/100);

    if(index!=lastIndex){

        lastIndex=index;

        tick.currentTime=0;
        tick.play();

    }

});