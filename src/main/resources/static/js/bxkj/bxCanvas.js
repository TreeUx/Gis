/*$(function () {
    var myimage =document.getElementById("img1");
    if (myimage.addEventListener) {
        // IE9, Chrome, Safari, Opera
        myimage.addEventListener("mousewheel", MouseWheelHandler, false);
        // Firefox
        myimage.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
    }
})

function MouseWheelHandler(e) {
//WebVideo为外层DIV，WebDiveoImg为DIV内img标签
    var myimage = document.getElementById("img1");
    var mydivWidth = parseInt(document.getElementById("img1_div").style.width);
    var mydivHeight = parseInt(document.getElementById("img1_div").style.height);
    var height = myimage.height;
    //if(height === 1080) return;
    var marLeft = parseInt( $('#img1').css('marginLeft'));
    var marRight = parseInt($('#img1').css('marginTop'));

    var e = window.event || e;
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    myimage.style.width = Math.max(mydivWidth, Math.min(2400, myimage.width + (32 * delta))) + "px";
    myimage.style.height = Math.max(mydivHeight, Math.min(1350, myimage.height + (18 * delta))) + "px";
    //
    if(delta >0 && height< 1350){
        //var left = document.getElementById("WebVideoImg").style.marginLeft;
        document.getElementById("img1").style.marginLeft = (marLeft-16)+"px";
        document.getElementById("img1").style.marginTop =(marRight-9)+"px";
//        document.getElementById("WebVideo").style.marginLeft = (marLeft-16)+"px";
//        document.getElementById("WebVideo").style.marginTop =(marRight-9)+"px";
    }else if(delta<0 && height > mydivHeight){
        document.getElementById("img1").style.marginLeft = (marLeft+16)+"px";
        document.getElementById("img1").style.marginTop =(marRight+9)+"px";
//        document.getElementById("WebVideo").style.marginLeft = (marLeft+16)+"px";
//        document.getElementById("WebVideo").style.marginTop =(marRight+9)+"px";
    }
    return false;

}*/

var posMoniCanvas;
var posMoniCtx;
var imgX=0,imgY=0,imgScale=1,minScale=1,maxScale=8,
    destWidth,destHeight;
var bgImg;
$(function () {
    posMoniCanvas = document.getElementById("canvid1");//画布
    posMoniCtx = posMoniCanvas.getContext("2d");;//画笔
    posMoniCtx.strokeStyle="#FF2E98";

    //chrome firefox浏览器兼容  滚轮事件
    posMoniCanvas.onmousewheel=posMoniCanvas.onwheel=function(e){
        e.wheelDelta=e.wheelDelta?e.wheelDelta:(e.deltaY*(-40));
        if(e.wheelDelta>0&&imgScale<maxScale){//放大
            imgScale*=2;
            imgX=imgX*2-mousePos.x;
            imgY=imgY*2-mousePos.y;
            drawAllComponent();
        }
        if(e.wheelDelta<0&&imgScale>minScale){//缩小
            imgScale*=0.5;
            imgX=imgX*0.5+mousePos.x*0.5;
            imgY=imgY*0.5+mousePos.y*0.5;
            drawAllComponent();
        }
    }
})

function drawAllComponent() {
    //清空面板
    posMoniCtx.clearRect(0,0,posMoniCanvas.width,posMoniCanvas.height);
    //重绘背景图
    destWidth=posMoniCanvas.width*imgScale;
    destHeight=posMoniCanvas.height*imgScale;
    posMoniCtx.drawImage(bgImg,0,0,bgImg.width,bgImg.height,imgX,imgY,destWidth,destHeight);
}



