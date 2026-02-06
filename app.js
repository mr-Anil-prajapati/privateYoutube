const player=document.getElementById("player");
const list=document.getElementById("list");

let currentIndex=0;

const videos=[

{title:"Video 1",id:"10TolCt3cCNhbfbnRqfOp8dcRu2vnTz45"},
{title:"Video 2",id:"1FVz-Y-jnOrFiQFTurRoZ5VS_zObhSdQT"},
{title:"Video 3",id:"1l2_iT7GoXs8Solhtk_SZOAnxvKQ-q6RD"},
{title:"Video 4",id:"1eiclMj2CN2MUTYgOUsYn3UXOF4kV0TlF"}

];

function getUrl(id){

return `https://drive.google.com/uc?export=download&id=${id}`;

}

function render(){

list.innerHTML="";

videos.forEach((v,i)=>{

let div=document.createElement("div");

div.className="item";

div.innerHTML=`
<img class="thumb" src="https://drive.google.com/thumbnail?id=${v.id}">
<div>${v.title}</div>
`;

div.onclick=()=>playVideo(i);

list.appendChild(div);

});

highlight();

}

function playVideo(i){

currentIndex=i;

player.src=getUrl(videos[i].id);

player.play();

highlight();

}

function highlight(){

document.querySelectorAll(".item").forEach((el,idx)=>{

el.classList.toggle("active",idx===currentIndex);

});

}

/* REAL AUTO NEXT */

player.addEventListener("ended",()=>{

currentIndex=(currentIndex+1)%videos.length;

playVideo(currentIndex);

});

document.getElementById("nextBtn").onclick=()=>{

currentIndex=(currentIndex+1)%videos.length;

playVideo(currentIndex);

};

/* SPEED CONTROL */

document.getElementById("speed").onchange=(e)=>{

player.playbackRate=parseFloat(e.target.value);

};

render();
playVideo(0);

