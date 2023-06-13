var caliperSize = 15;

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}


var painting, startX, startY, xOffset, yOffset, c, ctx;
c = document.getElementById("myCanvas");
c.addEventListener('mousedown', function(e) {
  // c = document.getElementById("myCanvas");
  ctx = c.getContext("2d");
  ctx.fillStyle = "rgb(128,128,128,0.6)";
  ctx.strokeStyle = "#ffff00";
  ctx.lineWidth = 2;
  xOffset = c.offsetLeft;
  yOffset = c.offsetTop;
  ctx.clearRect(0, 0, c.width, c.height);
  let rect = c.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  // console.log(xOffset,yOffset)
  painting = true;

});

document.addEventListener('mousemove', function(e) {
// $(document).mousemove(function(e) {
  if (painting) {
    ctx.clearRect(0, 0, c.width, c.height);
    var endX = e.pageX - xOffset;
    var endY = e.pageY - yOffset;
    if (endX > c.width) {
      endX = c.width-1;
    }
    if (e.pageX < xOffset) {
      endX = 1;
    }
    if (e.pageY < yOffset) {
      endY = 1;
    }
    if (endY > c.height) {
      endY = c.height-1;
    }
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.clearRect(startX, startY, endX - startX, endY - startY);
    drawcorners(startX, startY, endX, endY);

    window.cropW = round((endX - startX) / c.width, 4);
    window.cropH = round((endY - startY) / c.height, 4);
    if (window.cropW > 0) {
      window.cropX = round(startX / c.width, 4);
    } else {
      window.cropX = round(endX / c.width, 4);
    }
    if (window.cropH > 0) {
      window.cropY = round(startY / c.height, 4);
    } else {
      window.cropY = round(endY / c.height, 4);
    }
    window.cropW = Math.abs(round((endX - startX) / c.width, 4));
    window.cropH = Math.abs(round((endY - startY) / c.height, 4))

    //console.log(window.cropX,window.cropY, window.cropW, window.cropH);

  }
});

document.addEventListener('mouseup', function(e) {
  painting = false;
});

function drawcorners(x1, y1, x2, y2) {
  if (Math.abs(x2 - x1) < 30 || Math.abs(y2 - y1) < 30) {
    caliperSize = Math.min(Math.abs(x2 - x1)/2-1,Math.abs(y2 - y1)/2-1);
  } else {
    caliperSize=15;
  }
  if (x2 > x1 && y2 > y1) {
    drawline(x1, y1, caliperSize, caliperSize);
    drawline(x2, y2, -caliperSize, -caliperSize);
    drawline(x1, y2, caliperSize, -caliperSize);
    drawline(x2, y1, -caliperSize, caliperSize);
  }
  if (x1 > x2 && y2 > y1) {
    drawline(x1, y1, -caliperSize, caliperSize);
    drawline(x2, y2, caliperSize, -caliperSize);
    drawline(x1, y2, -caliperSize, -caliperSize);
    drawline(x2, y1, caliperSize, caliperSize);
  }
  if (x1 < x2 && y2 < y1) {
    drawline(x1, y1, caliperSize, -caliperSize);
    drawline(x2, y2, -caliperSize, caliperSize);
    drawline(x1, y2, caliperSize, caliperSize);
    drawline(x2, y1, -caliperSize, -caliperSize);
  }
  if (x1 > x2 && y2 < y1) {
    drawline(x1, y1, -caliperSize, -caliperSize);
    drawline(x2, y2, caliperSize, caliperSize);
    drawline(x1, y2, -caliperSize, caliperSize);
    drawline(x2, y1, caliperSize, -caliperSize);
  }
}

function drawline(x1, y1, xoff, yoff) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1, y1 + yoff);
  ctx.stroke();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + xoff, y1);
  ctx.stroke();
}

// $("#myCanvas").mouseout(function(e) {
// });
