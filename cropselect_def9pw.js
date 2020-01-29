function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
window.caliperdraw = true;

context.font = "30px Arial";
context.textAlign = "center";
//context.fillText("hightlight the PHI and click", canvas.width / 2, canvas.height / 2);
var beginX, beginY;
canvas.addEventListener('mousedown', function(evt) {
  window.draw = true;
  var mousePos = getMousePos(canvas, evt);
  beginX = mousePos.x;
  beginY = mousePos.y;
  window.caliperdraw = true;
  //calipers(evt);
}, false);
canvas.addEventListener('mousemove', function(evt) {
  if (window.draw) {
    shade(evt, beginX, beginY);
  }
  if (window.caliperdraw) {
    calipers(evt);
  }
}, false);
canvas.addEventListener('mouseup', function(evt) {
  window.draw = false;
  if (window.cropW < 10 || window.cropH < 10) {
    window.caliperdraw = true;
    calipers(evt);
  }
  console.log(window.cropW, window.cropH, window.cropX, window.cropY);
});

function shade(evt, startX, startY) {
  var mousePos = getMousePos(canvas, evt);
  if (Math.abs(mousePos.x - startX) > 0 && Math.abs(mousePos.y - startY) > 0) {
    window.caliperdraw = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(135,206,250, 0.5)";
    context.fillRect(startX, startY, mousePos.x - startX, mousePos.y - startY);
    context.strokeStyle = "rgba(135,206,250, 1)";
    context.lineWidth = 2;
    context.strokeRect(startX, startY, mousePos.x - startX, mousePos.y - startY);
    context.fillStyle = "rgba(135,206,250, 0.5)";
    window.cropW = Math.round(mousePos.x - startX);
    window.cropH = Math.round(mousePos.y - startY);
    if (window.cropW > 0) {
      window.cropX = Math.round(startX);
    } else {
      window.cropX = Math.round(mousePos.x);
    }
    if (window.cropH > 0) {
      window.cropY = Math.round(startY);
    } else {
      window.cropY = Math.round(mousePos.y);
    }
    window.cropW = Math.abs(Math.round(mousePos.x - startX));
    window.cropH = Math.abs(Math.round(mousePos.y - startY));
  } else {
    //context.clearRect(0, 0, canvas.width, canvas.height);
    //calipers(evt);
    window.caliperdraw = true;

  }

  //context.fillText("hightlight the PHI and click", canvas.width / 2, canvas.height / 2);
}

function calipers(evt) {
  var mousePos = getMousePos(canvas, evt);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(135,206,250, 1)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, mousePos.y);
  context.lineTo(canvas.width, mousePos.y);
  context.closePath();
  context.stroke();
  context.beginPath();
  context.moveTo(mousePos.x,0);
  context.lineTo(mousePos.x, canvas.height);
  context.closePath();
  context.stroke();
}