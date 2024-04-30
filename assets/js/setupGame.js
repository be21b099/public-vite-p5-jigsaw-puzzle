// Declaring variables for the canvas, image, puzzle pieces, etc.
import {isEncoded, params, setupLinks} from "./setupMeta.js";
import {addScreenPositionFunction} from "./plugins/transform.js";
import {aspectRatio, cropX, cropY, cut, drawPuzzleSideShape, makeImage, makePuzzle} from "./jigsaw.js";


export let canvas;

// Monitor usage
let clicks = 0;
let deltaClick = [];
let deltaTime;

// Username
let username = "";
let usernameFlag;

// Feedback
let ratingValue, writtenText;

// Variables for placement and puzzle pieces
export let img, preview, frame;
export let pieces, placed, unplaced, puzzle, board;
export var tiles;

let color = "#ff0000", hintBlink = 'true', hint_weight = 2, preview_opacity = 255;

// Variables for puzzle dimensions, scaling, and loading status
export let cols, rows, aspect;
export let scl, s;

let imageName, reloadButton;

// Variables for meta data
export let loading = true, verifying = false, solved = false, error = false, previewing = -1, progress, o;

// Theme colors for the puzzle interface
export const Theme = {
    background: [255], board: [240], board_fill: [235], board_outline: [220]
}

// Settings for the puzzle
const Settings = {
    allowIncorrectPlacements: true, hintIncorrectPlacements: true
}

// Constants for piece states and orientations
export const NONE = 0, IN = -1, OUT = 1

// Variables for displaying
export const HORIZONTAL = 'horizontal', VERTICAL = 'vertical'

let prev

// Function to set up the initial configuration
export function setup() {
    reloadButton = createButton('Reload');
    reloadButton.addClass('disabled');
    reloadButton.attribute('type', 'button');
    reloadButton.attribute('id', 'reloadButton');
    reloadButton.attribute('margin-top', '20px');
    // https://i.imgur.com/4GqXJpx.jpeg
    const imageParam = params.get('image') || 'https://img.freepik.com/free-photo/vertical-shot-winter-landscape-with-northern-lights-reflection-frozen-lake-tromso_181624-54199.jpg'
    const imageURL = isEncoded(imageParam) ? decodeURIComponent(imageParam) : imageParam

    imageName = imageURL;
    canvas = createCanvas(windowWidth, windowHeight)

    addScreenPositionFunction(this)

    prev = millis()
    // Loading the image and handling GIF or regular image
    if (imageURL.endsWith('.gif')) {
        // Load GIF
        img = loadImage(imageURL, img2 => {
            // Load regular image
            img.resize(img.width * 2, img.height * 2)
            // console.log('load: ', millis() - prev)
            document.querySelector('.ui').classList.remove('disabled')
            loading = false
            start()
        }, failure => error = true);
    } else {
        createImg(imageURL, 'puzzle', null, event => {
            let element = event.elt
            img = new p5.Image(element.width, element.height, p5.instance)
            img.drawingContext.drawImage(element, 0, 0)
            img.modified = true

            document.querySelector('.ui').classList.remove('disabled')
            loading = false
            start()
        });
    }
    // Set a timeout for loading, and if loading fails within the time, set an error flag
    setTimeout(() => loading ? (error = true) : false, 5000);
}

// Function to start the puzzle generation and setup
function start() {
    aspect = aspectRatio(round(img.width / 100) * 100, round(img.height / 100) * 100)

    if (aspect.x === 1 && aspect.y === 1) aspect = {x: 4, y: 4}
    while (aspect.x * aspect.y >= 50) aspect = {x: parseInt(aspect.x / 2), y: parseInt(aspect.y / 2)}
    while (aspect.x * aspect.y <= 9) aspect = {x: parseInt(aspect.x * 2), y: parseInt(aspect.y * 2)}

    cols = params.get('cols') > 0 ? params.get('cols') : aspect.x
    rows = params.get('rows') > 0 ? params.get('rows') : aspect.y
    scl = params.get('scale') > 0 ? params.get('scale') : 0.5

    progress = o = numFrames(img) * 2

    prev = millis()

    tiles = []
    for (let i = 0; i < numFrames(img); i++) {
        img.setFrame(i)
        tiles.push(cut(img, cols, rows, CENTER, CENTER))
        progress--
    }

    console.info('Generated Mask in: ', millis() - prev + "[ms]")

    prev = millis()

    // Generate puzzle pieces from the image
    tiles = makePuzzle(tiles);
    // console.log({tiles})
    console.info('Generated Puzzle in: ', millis() - prev + "[ms]")

    // Create a preview image and set up puzzle board
    preview = img.get(cropX / 2, cropY / 2, img.width - cropX, img.height - cropY);
    // console.log({preview});

    prev = millis()

    placed = []
    unplaced = []
    pieces = []
    let positionX, positionY
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let orientation = Math.random() < 0.5 ? HORIZONTAL : VERTICAL;
            let side = Math.random() < 0.5 ? -1 : 1;

            switch (orientation) {
                case HORIZONTAL:
                    positionX = side * preview.width / 2 * random(1.15, 1.90);
                    positionY = random(-preview.height / 2 * 1.15, preview.height / 2 * 1.15);
                    break;
                case VERTICAL:
                    positionX = random(-preview.width / 2 * 1.90, preview.width / 2 * 1.90);
                    positionY = side * preview.height / 2 * random(1.15, 1.45);
                    break;
            }

            const piece = new Piece(x, y, positionX, positionY);
            pieces.push(piece);
            unplaced.push(piece);
        }
    }

    // Generate the puzzle board with tilepieces
    board = (() => {
        let pg = createGraphics(parseInt(cols * tiles.sizeX + tiles.sizeX / 2 + 1), parseInt(rows * tiles.sizeY + tiles.sizeY / 2 + 1));
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                let tile = tiles[0][x][y];

                pg.image(tile.jigsaw, x * tiles.sizeX, y * tiles.sizeY);
            }
        }
        return makeImage(pg);
    })();

    console.info('Generated Tilepieces in : ', millis() - prev + "[ms]")

    // Create puzzle object with relevant information
    puzzle = {
        width: preview.width,
        height: preview.height,
        ratio: {original: aspectRatio(img.width, img.height), simplified: aspect},
        count: pieces.length,
        pieces: new Map()
    };

    setupLinks();
    deltaTime = Date.now();

    // Dispatch event indicating puzzle is loaded
    window.parent.document.dispatchEvent(new CustomEvent('puzzleLoaded', {puzzle}));
}

// Function to draw on the canvas continuously
export function draw() {
    let piece;
    if (loading) {
        background(255);

        noStroke();
        textAlign(CENTER, CENTER);
        textSize(50);

        if (error) {
            fill(255, 0, 0);
            text("Failed to load puzzle", width / 2, height / 2);
            reloadButton.position(width / 2 - 50, height / 2 + 30);
            reloadButton.mousePressed(() => {
                window.location = window.location.origin;
            });

            return;
        } else {
            fill(0);
            text("Loading puzzle", width / 2, height / 2);
        }

        stroke(0);
        strokeWeight(1);
        line(width * 0.25, height * 0.75, map(progress, 0, o, width * 0.25, width * 0.75), height * 0.75);

        return;
    }

    // Draw puzzle pieces, preview image, and board
    s = Math.min(width / img.width, height / img.height) * scl;
    frame = parseInt((0.5 * frameCount) % numFrames(img));

    background(Theme.background);

    translate(width / 2, height / 2);
    scale(s);

    let deltaPreviewing = millis() - previewing;
    let previewAlpha = map(sin((-(deltaPreviewing) * 0.002 + 1.5)), -1, 1, 0, 255);

    // change preview_opacity when you want to display the picture constantly (0 full visible - 255 not visible) does not change after the first draw
    if (deltaPreviewing > 3000 || previewing === -1) previewAlpha = preview_opacity;
    if (solved) previewAlpha = 0;

    img.setFrame(frame);
    image(img, -preview.width / 2, -preview.height / 2, preview.width, preview.height, cropX / 2, cropY / 2, img.width - cropX, img.height - cropY);

    rectMode(CENTER);
    noStroke();
    fill(...Theme.board, previewAlpha);
    rect(0, 0, puzzle.width, puzzle.height);

    if (!solved) {
        push();
        translate(-tiles.sizeX / 2 - img.width / 2 + cropX / 2, -tiles.sizeY / 2 - img.height / 2 + cropY / 2);
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                let tile = tiles[frame][x][y];

                let min = screenPosition(x * tiles.sizeX + tiles.sizeX * 0.5, y * tiles.sizeY + tiles.sizeY * 0.5);
                let max = screenPosition(x * tiles.sizeX + tiles.sizeX * 1.5, y * tiles.sizeY + tiles.sizeY * 1.5);

                if (mouseIsPressed && mouseX > min.x && mouseX < max.x && mouseY > min.y && mouseY < max.y) {
                    image(tile.jigsawFill, x * tiles.sizeX, y * tiles.sizeY);
                }
            }
        }
        image(board, 0, 0);
        pop();
    }

    for (let i = placed.length - 1; i >= 0; i--) {
        piece = placed[i];
        piece.update();
        piece.draw();
    }

    for (let i = placed.length - 1; i >= 0; i--) {
        piece = placed[i];
        piece.drawPost();
    }

    for (let i = unplaced.length - 1; i >= 0; i--) {
        piece = unplaced[i];
        piece.update();
        piece.draw();
    }
}

export function mousePressed() {
    if (!error && !solved) for (let piece of pieces) {
        if (piece.pressed()) {
            clicks++;
            let piecePosition = screenPosition(piece.x, piece.y);

            // console.log(piece);

            let data = {
                xMouse: mouseX, yMouse: mouseY,
                xPiece: piecePosition.x, yPiece: piecePosition.y,
                piece: JSON.parse(JSON.stringify(piece)),
                delta: Math.sqrt(Math.pow(mouseX - piecePosition.x, 2) + Math.pow(mouseY - piecePosition.y, 2)),
                deltaTime: Date.now() - deltaTime,
                move: "pressed",
            }

            // console.log(data);
            deltaClick.push(data);
            let index = pieces.indexOf(piece);
            pieces.splice(index, 1);
            pieces.splice(0, 0, piece);

            index = unplaced.indexOf(piece);
            unplaced.splice(index, 1);
            unplaced.splice(0, 0, piece);
            break;
        }
    }
}

export function mouseReleased() {
    if (!error && !solved) for (let piece of pieces) {
        piece.released(mouseX, mouseY);
    }
}

function onPieceRelease(piece) {
    if (piece.isInsidePuzzle()) {
        let coordX = Math.round((piece.x + (cols % 2 === 0 ? tiles.sizeX / 2 : 0)) / tiles.sizeX);
        let coordY = Math.round((piece.y + (rows % 2 === 0 ? tiles.sizeY / 2 : 0)) / tiles.sizeY);

        let x = Math.trunc(coordX + cols / 2 + (cols % 2 === 0 ? -1 : 0));
        let y = Math.trunc(coordY + rows / 2 + (rows % 2 === 0 ? -1 : 0));

        if (piece.matchesShape(x, y) && !puzzle.pieces.has(`${x},${y}`)) {

            piece.x = coordX * tiles.sizeX + (cols % 2 === 0 ? -1 : 0) * tiles.sizeX / 2;
            piece.y = coordY * tiles.sizeY + (rows % 2 === 0 ? -1 : 0) * tiles.sizeY / 2;
            piece.placement = {x, y};
            piece.placed = millis();

            puzzle.pieces.set(`${x},${y}`, piece);
            unplaced.splice(unplaced.indexOf(piece), 1);
            placed.push(piece);

            let index = pieces.indexOf(piece);
            pieces.splice(index, 1);
            pieces.push(piece);

            if (puzzle.pieces.size === puzzle.count) onComplete();
        }
    }
}

function onComplete() {
    for (const [key, value] of puzzle.pieces) {
        let coords = key.split(',');
        let x = parseInt(coords[0]);
        let y = parseInt(coords[1]);

        if (x !== value.index.x || y !== value.index.y) return;
    }
    onSolve();
}

export function onSolve() {
    document.querySelector('.ui-popup-container-quit').classList.add('disabled');

    deltaTime = Date.now() - deltaTime;
    solved = true;

    setTimeout(() => {
        document.querySelector('.ui-popup-container-report').classList.remove('disabled');
        document.querySelector('.ui-container').classList.add('disabled');
    }, 3000);
}

export function submitFeedback() {
    const apiUrl = import.meta.env.VITE_API_URL;

    // Get the selected radio button value
    let selectedRating = document.querySelector('input[name="rating"]:checked');
    ratingValue = selectedRating ? selectedRating.value : null;

    // Get the written text
    writtenText = document.querySelector('.textarea').innerText;
    username = document.getElementById('username').value;


    const postData = {
        "username": username,
        "image": imageName,
        "deltaTime": deltaTime.toString(),
        "clicks": clicks,
        "rows": parseInt(rows),
        "cols": parseInt(cols),
        "height": parseInt(tiles.sizeY),
        "width": parseInt(tiles.sizeX),
        "deltaClick": JSON.stringify(deltaClick, null, '  '),
        "rating": parseInt(ratingValue),
        "comment": writtenText,
    }


    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    }).then(response => {
        if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    }).then(data => {
        // console.log('Response from server: ', data);
    }).catch(error => {
        // Handle any errors that occurred during the fetch
        console.error('Error during fetch:', error);
    });


    document.querySelector('.ui-popup-container-report').classList.add('disabled');
    document.querySelector('.ui-popup-container').classList.remove('disabled');
}

export function setFlag() {
    usernameFlag = true;
}

export function changeIcon(radio) {
    // Reset all symbols to outlined
    document.querySelectorAll('.material-symbols-filled').forEach(function (el) {
        el.classList.remove('material-symbols-filled');
    });

    // Update the selected symbol to filled
    let selectedLabel = radio.closest('label');
    let selectedSymbol = selectedLabel.querySelector('.material-symbols-rounded');
    selectedSymbol.classList.add('material-symbols-filled');

    let submitButton = document.querySelector('.submit-button');
    if (!submitButton.hasAttribute('disabled')) {
        return;
    }
    if (usernameFlag) {
        submitButton.removeAttribute('disabled');
        submitButton.style.backgroundColor = '#45AE34';
    }
}

export function hint() {
    previewing = millis();
}

export function verify() {
    verifying = true;
    for (let piece of pieces) if (piece.placed !== -1) piece.placed = millis();
    verifying = false;
}

export function toggleFullscreen(self) {
    document.querySelector('.ui-popup-container-quit').classList.remove('disabled');
    const classList = self.querySelector('span').classList;
    classList.toggle('fullscreen');
    classList.toggle('fullscreen_exit');
    const tooltip = self.parentElement.querySelector('.tooltip-content');
    tooltip.innerText = tooltip.innerText === 'Fullscreen' ? 'Windowed' : 'Fullscreen';
    fullscreen(!fullscreen());
}

export function puzzleSettings() {
    document.querySelector('.ui-popup-container-settings').classList.remove('disabled');
}

export function hideSettings() {
    document.querySelector('.ui-popup-container-settings').classList.add('disabled');
    color = document.querySelector('#colorpicker').value;
    let hintValue = document.querySelector('input[name="display"]:checked');
    hintBlink = hintValue ? hintValue.value : null;
    hint_weight = document.querySelector('#hint_weight').value;
    // console.log({color, hintBlink, hint_weight, preview_opacity});
}

export function hideQuit() {
    document.querySelector('.ui-popup-container-quit').classList.add('disabled');
}

export function quit() {
    const classList = document.querySelector('.ui-popup-container-quit').classList;
    classList.remove('disabled')
}

export function generate() {
    const img = document.querySelector('#url').value;
    const cols = document.querySelector('#cols').value;
    const rows = document.querySelector('#rows').value;

    const url = new URL(window.location.origin + window.location.pathname);
    if (img) url.searchParams.set('image', img);
    if (cols) url.searchParams.set('cols', cols);
    if (rows) url.searchParams.set('rows', rows);
    return url.toString();
}




function drawJigsaw(x, y, weight, stroke) {
    let tile = tiles[frame][x][y];
    let width = tiles.sizeX;
    let height = tiles.sizeY;
    let graphic = canvas._pInst;

    let drawPuzzleSide = (side, curve) => {
        drawPuzzleSideShape(false, graphic, side, curve, width, height, () => {
            graphic.noFill();
            graphic.stroke(...stroke);
            graphic.strokeWeight(weight);
        });
    }

    push();
    translate(x * width + width / 2, y * height + height / 2);
    drawPuzzleSide(TOP, tile.topCurve);
    drawPuzzleSide(BOTTOM, tile.bottomCurve);
    drawPuzzleSide(LEFT, tile.leftCurve);
    drawPuzzleSide(RIGHT, tile.rightCurve);
    pop();
}

export function numFrames(img) {
    return img.numFrames() || 1;
}

export function makeProgress(boolean) {
    if (boolean)
        progress++;
    else
        progress--;
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
