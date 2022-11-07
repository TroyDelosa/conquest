const canvas = document.querySelector('#app');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = "./map-new-half.png";
let grid;
let locationList;
const refreshRate = 50;
const territoryAlpha = '99';
const borderAlpha = 'FF';
const maxRange = 6;
let currentRegion = 0;
let currentColour = '#000000';
let regionList = new Array();
let landList;
let seaList;
let nextRegion;
const menuHeight = 30;
const angles = [0, 45, 90, 135, 180, -135, -90, -45];
const seaColour = 'lightblue';
const boatColour = 'purple';
// const angleMap = new Map([
//   [135,   { x: -1,   y: 1   }],     [90, { x: 0,    y: 1   }],      [45,  { x: 1,   y: 1  }],
//   [180,   { x: -1,   y: 0   }],                                     [0,   { x: 1,   y: 0  }],
//   [-135,  { x: -1,   y: -1  }],     [-90, { x: 0,   y: -1   }],     [-45, { x: 1,   y: -1 }]
// ]);

const angleMap = new Map([
  [3,   { x: -1,   y: 1   }],     [2, { x: 0,    y: 1   }],      [1,  { x: 1,   y: 1    }],
  [4,   { x: -1,   y: 0   }],                                    [0,   { x: 1,   y: 0   }],
  [-3,  { x: -1,   y: -1  }],     [-2, { x: 0,   y: -1  }],      [-1, { x: 1,   y: -1   }]
]);
//  +135    +90     +45       +3     +2     +1
//           |                        |
//  +180  ---+---    0        +4   ---+---   0
//           |                        |
//  -135    -90     -45       -3     -2     -1

let boats = new Array();

import regionMap from './data/map.js';

const offsets = [
  { x: -1,  y: -1 },    { x: 0,   y: -1 },    { x: 1,   y: -1 },
  { x: -1,  y: 0  },                          { x: 0,   y: 1  },
  { x: -1,  y: 1  },    { x: 1,   y: 0  },    { x: 1,   y: 1  }
]

let players = [
  {
    id: 0,
    colour: '#FF0000',
    landBorders: new Map(),
    seaBorders: new Map(),
    mp: 0,
    mpGrowth: 0,
    mpMax: 0,
    mpMultiplier: 1,
    isInvading: false,
    locationCount: 0
  }
]

let currentPlayer = players[0];

img.addEventListener("load", () => {
  canvas.width = img.width;
  canvas.height = img.height + menuHeight;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, menuHeight);
  
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height); 

  grid = new Map();

  //Initialise Grid Data
  for (let col = 0; col < canvas.width; col++) {
    for (let row = menuHeight; row < canvas.height; row++) {
      let pixelIndex = (col + row * canvas.width) * 4;
      let red = pixels.data[pixelIndex];
      let green = pixels.data[pixelIndex + 1];
      let blue = pixels.data[pixelIndex + 2];
      grid.set(`${col}:${row}`, {
        x: col,
        y: row,
        isLand: ((red + green + blue) / 3) === 0,
        controlledBy: -1,
        region: -1,
      });

      if(grid.get(`${col}:${row}`).isLand) {
        ctx.fillStyle = "white";
        ctx.fillRect(col, row, 1, 1);
      } 
      else {
        ctx.fillStyle = seaColour;
        ctx.fillRect(col, row, 1, 1);
      }
    }
  }

  locationList = Array.from(grid.values());

  regionMap.forEach(region => {
    let location = grid.get(`${region.x}:${region.y+menuHeight}`);
    location.region = region.region;
  })

  seaList = Array.from(grid.values()).filter(loc => !loc.isLand);

  // landList = Array.from(grid.values());
  // nextRegion = landList.filter(loc => (loc.isLand && loc.region === -1))[0];

  // currentColour = getRandomColour();
  // while (nextRegion) {
  //   nextRegion = checkRegion(nextRegion);
  // }

  animate();
});

//For Processing Regions.
//To be run when new maps added 
function checkRegion(loc) {

  loc.region = currentRegion;
  ctx.fillStyle = currentColour;
  ctx.fillRect(loc.x, loc.y, 1, 1);

  if(typeof regionList[currentRegion] === 'undefined') {
    regionList[currentRegion] = new Array();
  }

  offsets.forEach(({x, y}) => {
    let offsetX = loc.x + x;
    let offsetY = loc.y + y;

    if(grid.has(`${offsetX}:${offsetY}`)) {
      let locOffset = grid.get(`${offsetX}:${offsetY}`);
      if(locOffset.isLand) {
        regionList[currentRegion].push(locOffset)
      }
      
    }
  })

  let filteredList = regionList[currentRegion].filter(loc => loc.region !== currentRegion);

  if(filteredList.length > 0) {
    return filteredList[0];
  } 
  else {
    let nextLocList = landList.filter(loc => (loc.isLand && loc.region === -1));
    if(nextLocList.length > 0) {
      currentRegion++;
      currentColour = getRandomColour();
      return nextLocList[0];
    }
    else {
      console.log('done')
      return false;
    }
  }
}

function getRandomColour() {
  var letters = '0123456789ABCDEF';
  var colour = '#';
  for (var i = 0; i < 6; i++) {
    colour += letters[Math.floor(Math.random() * 16)];
  }
  return colour;
}

function calcAng(x1, y1, x2, y2) {
  // let centreX = Math.floor((x1+x2*1.2)/2.2);
  // let centreY = Math.floor((y1+y2*1.2)/2.2);
  // console.log(`${x1}:${x2}:${centreX}`);
  let angle = Math.round((Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI)/45);

  if(angle < -3) angle = 4
  if(angle > 4) angle = -3
  
  return angle;
}

// function nextBoatPos(x, y, angle) {
//   angleMap.get(angle);

// }

function calcDist(x1, y1, x2, y2) {
  let a = x1 - x2;
  let b = y1 - y2;
  
  return Math.sqrt( a*a + b*b );
}

// function getKey(index) {
//   keyParts = index.split(':');
//   key = {
//     x: keyParts[0], 
//     y: keyParts[1]
//   }
//   return key;
// }

//||||||||||||||||||||||||||||||||||||||||||
//||--------------------------------------||
//||-------------ON CLICK-----------------||
//||--------------------------------------||
//||||||||||||||||||||||||||||||||||||||||||
//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
canvas.addEventListener('mousedown', event => { 
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - Math.floor(rect.left);
  const y = event.clientY - Math.floor(rect.top);

  if(grid.has(`${x}:${y}`)) {
    let location = grid.get(`${x}:${y}`);

    if(location.isLand) {
      if(currentPlayer.locationCount === 0) {
        currentPlayer.landBorders.set(`${x}:${y}`, grid.get(`${x}:${y}`));
        currentPlayer.isInvading = true;
      } 
      else {
        let borders = Array.from(currentPlayer.landBorders.values());
        let hasRegion = typeof borders.find(borderLoc => borderLoc.region == location.region) !== 'undefined';

        if(hasRegion) {
          currentPlayer.isInvading = true;
        }
        else {
          let seaBorders = Array.from(currentPlayer.seaBorders.values());
          let smallestDist;
          let closestLoc;

          seaBorders.forEach(seaBorder => {
            let distance = calcDist(x, y, seaBorder.x, seaBorder.y);
            if(typeof smallestDist === 'undefined' || distance < smallestDist) {
              smallestDist = distance;
              closestLoc = seaBorder;
            }
            
          })


          if(typeof closestLoc !== 'undefined') {
            // let nextAngle = calcAng(closestLoc.x, closestLoc.y, location.x, location.y);
            let newBoat = {
              loc: {
                x: closestLoc.x, 
                y: closestLoc.y,
              },
              dest: {
                x: location.x, 
                y: location.y,
              },
              player: currentPlayer.id,
            };
            boats.push(newBoat);
            drawBoat(newBoat);

            // console.log(angleMap);

            // let angle = calcAng(newBoat.loc.x, newBoat.loc.y, newBoat.dest.x, newBoat.dest.y);
            // console.log(angle);
            // let angleOffset = angleMap.get(Number(angle));
            // console.log(angleOffset)

          }

          
          
        }
      }

    }
  }
});



function drawBoat(boat) {
  ctx.fillStyle = seaColour;
  ctx.fillRect(boat.loc.x-1, boat.loc.y-1, 2, 2);

  //Get next location
  let angle = calcAng(boat.loc.x, boat.loc.y, boat.dest.x, boat.dest.y);
  let angleOffset = angleMap.get(angle);

  boat.loc = {
    x: boat.loc.x + angleOffset.x,
    y: boat.loc.y + angleOffset.y,
  };

  ctx.fillStyle = boatColour;
  ctx.fillRect(boat.loc.x-1, boat.loc.y-1, 2, 2);
  
  let currentLoc = grid.get(`${boat.loc.x}:${boat.loc.y}`)
  if(currentLoc.isLand) {
    currentLoc.controlledBy = currentPlayer.id;
    currentPlayer.landBorders.set(`${currentLoc.x}:${currentLoc.y}`, currentLoc);
    ctx.fillStyle = currentPlayer.colour+territoryAlpha;
    ctx.fillRect(currentLoc.x, currentLoc.y, 1, 1);
    currentPlayer.mp -= 1;

    boats = boats.filter(b => {
      return b !== boat;
    })

  } 
  else {

  }
  
}

function animate() {
  setTimeout(() => {
    // seaList.forEach(seaLoc => {
    //   ctx.fillStyle = seaColour;
    //   ctx.fillRect(seaLoc.x, seaLoc.y, 1, 1);
    // })

    currentPlayer.locationCount = locationList.filter(loc => loc.controlledBy === currentPlayer.id).length;
    currentPlayer.mpGrowth = Math.round(100+currentPlayer.locationCount/500);
    currentPlayer.mpMax = currentPlayer.mpGrowth*1000;
    currentPlayer.mpMultiplier = (1 + Math.round((currentPlayer.mp/currentPlayer.mpMax)*10)/5).toFixed(1);


    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, menuHeight);
    ctx.fillStyle = "green";

    ctx.fillRect(canvas.width-200, 0, canvas.width, menuHeight);

    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(`Manpower: ${(Math.round(currentPlayer.mp/10)/10).toFixed(1)}/${(currentPlayer.mpMax/100).toFixed(1)}k`, canvas.width-100, 20);
    ctx.fillText(`Growth: ${(currentPlayer.mpGrowth*currentPlayer.mpMultiplier).toFixed(1)}k/day`, canvas.width-300, 20);

    if(currentPlayer.mp < currentPlayer.mpMax) {
      currentPlayer.mp += currentPlayer.mpGrowth*currentPlayer.mpMultiplier;
    }

    if(currentPlayer.mp < currentPlayer.landBorders.size) {
      currentPlayer.isInvading = false
    }

    boats.forEach(boat => {
      drawBoat(boat);
    });

    if(currentPlayer.isInvading) {

      let newBorders = new Map();

      currentPlayer.landBorders.forEach(loc => {

        offsets.forEach(offset => {
          if(grid.has(`${loc.x+offset.x}:${loc.y+offset.y}`)) {
            const offsetPos = grid.get(`${loc.x+offset.x}:${loc.y+offset.y}`);

            if(offsetPos.controlledBy != currentPlayer.id) {
              if(offsetPos.isLand) {
                if(Math.random() > 0.7) {
                  offsetPos.controlledBy = currentPlayer.id;
                  newBorders.set(`${loc.x+offset.x}:${loc.y+offset.y}`, offsetPos);
                  ctx.fillStyle = currentPlayer.colour+territoryAlpha;
                  ctx.fillRect(loc.x+offset.x, loc.y+offset.y, 1, 1);
                  currentPlayer.mp -= 1;
                } 
                else {
                  newBorders.set(`${loc.x}:${loc.y}`, loc);
                }
                
              }
              else {
                currentPlayer.seaBorders.set(`${loc.x}:${loc.y}`, loc);
                ctx.fillStyle = currentPlayer.colour+borderAlpha;
                ctx.fillRect(loc.x, loc.y, 1, 1);
              }

            }
          }
        })

      })

      // player.seaBorders.forEach(loc => {
      //   if(!loc.checked) {

      //     let squareOffsets = getSquareOffsets(2, maxRange);

      //     squareOffsets.forEach(offset => {
      //       const offsetPos = grid.get(`${loc.x+offset.x}:${loc.y+offset.y}`);
  
      //       if(offsetPos.controlledBy != id && loc.region !== offsetPos.region) {
      //         if(offsetPos.isLand) {
      //           if(Math.random() > 0.99) {
      //             loc.checked = true;
      //             newBorders.set(`${loc.x+offset.x}:${loc.y+offset.y}`, {x: loc.x+offset.x, y: loc.y+offset.y});
      //             offsetPos.controlledBy = id;
      //             ctx.fillStyle = player.colour+territoryAlpha;
      //             ctx.fillRect(loc.x+offset.x, loc.y+offset.y, 1, 1);
      //             player.manpower -= 1;
      //           }
      //           else {
      //             newBorders.set(`${loc.x}:${loc.y}`, {x: loc.x, y: loc.y});
      //           }
                
      //         }
  
      //       }

      //     })

      //     loc.checked = true;

      //   }
        
      // })

      currentPlayer.landBorders = newBorders;
    }

    window.requestAnimationFrame(animate);
  }, refreshRate);
}

// function invade(player, isLand) {
//   let newBorders = new Map();

//   player.landBorders.forEach(loc => {

//     offsets.forEach(offset => {
//       const offsetPos = grid.get(`${loc.x+offset.x}:${loc.y+offset.y}`);

//       if(offsetPos.controlledBy != id) {
//         if(offsetPos.isLand) {
//           if(Math.random() > 0.7) {
//             newBorders.set(`${loc.x+offset.x}:${loc.y+offset.y}`, {x: loc.x+offset.x, y: loc.y+offset.y});
//             offsetPos.controlledBy = id;
//             ctx.fillStyle = player.colour+territoryAlpha;
//             ctx.fillRect(loc.x+offset.x, loc.y+offset.y, 1, 1);
//             player.mp -= 1;
//           } 
//           else {
//             newBorders.set(`${loc.x}:${loc.y}`, {x: loc.x, y: loc.y});
//           }
          
//         }
//         else {
//           player.seaBorders.set(`${loc.x}:${loc.y}`, {x: loc.x, y: loc.y, checked: false});
//           ctx.fillStyle = player.colour+borderAlpha;
//           ctx.fillRect(loc.x, loc.y, 1, 1);
//         }

//       }

//     })

//   })
// }

function getSquareOffsets(minSize, maxSize) {
  let squareOffsets = [];

  for (let offset = minSize; offset < maxSize; offset++) {
    for (let offsetX = -offset; offsetX < offset; offsetX++) {
      squareOffsets.push({x: offsetX, y: offset})
      squareOffsets.push({x: offsetX, y: -offset})
    }
    for (let offsetY = -offset+1; offsetY < offset-1; offsetY++) {
      squareOffsets.push({x: offset, y: offsetY})
      squareOffsets.push({x: -offset, y: offsetY})
    }

  }

  return squareOffsets;
}