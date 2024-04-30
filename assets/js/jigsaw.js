// https://www.codeproject.com/Articles/395453/Html5-Jigsaw-Puzzle

// Define the shape coordinates for the jigsaw puzzle pieces
export let cropX, cropY

import {cols, rows, img, numFrames, makeProgress, IN, OUT, NONE, tiles, Theme} from "./setupGame.js";

const shape = [[0, 0, 35, 15, 37, 5], [37, 5, 40, 0, 38, -5], [38, -5, 20, -20, 50, -20], [50, -20, 80, -20, 62, -5], [62, -5, 60, 0, 63, 5], [63, 5, 65, 15, 100, 0]]

// Function to draw the mask for a puzzle side
function drawPuzzleSideMask(graphic, side, curve, width, height) {
    drawPuzzleSideShape(true, graphic, side, curve, width, height, () => {
        graphic.fill(0)
        graphic.stroke(0)
        graphic.strokeWeight(.8)
    })
}

// Function to draw a puzzle side
function drawPuzzleSide(graphic, side, curve, width, height) {
    drawPuzzleSideShape(false, graphic, side, curve, width, height, () => {
        graphic.noFill()
        graphic.stroke(Theme.board_outline)
        graphic.strokeWeight(.1)
    })
}

// Function to draw the shape of a puzzle side
export function drawPuzzleSideShape(shaped, graphic, side, curve, width, height, style) {
    let s = width / 100

    graphic.push()

    style()

    switch (side) {
        case BOTTOM:
            graphic.translate(0, width)
            graphic.rotate(PI)
            graphic.translate(-width, 0)
            break;
        case LEFT:
            graphic.rotate(-HALF_PI)
            graphic.translate(-width, 0)
            break;
        case RIGHT:
            graphic.rotate(HALF_PI)
            graphic.translate(0, -width)
            break;
    }

    graphic.beginShape()
    graphic.vertex(0, 0)

    if (curve !== NONE) {
        for (let bezier of shape) {
            graphic.bezierVertex(...bezier.map((value, i) => (curve === IN && i % 2 !== 0 ? -value : value) * s))
        }
    } else graphic.vertex(100 * s, 0)

    if (shaped) {
        graphic.vertex(150 * s, -50 * s)
        graphic.vertex(-50 * s, -50 * s)
    }

    if (shaped) graphic.endShape(CLOSE); else graphic.endShape();
    graphic.pop()
}

// Function triggered on window resize events
export function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
}

// Function to generate the puzzle pieces
export function makePuzzle(tiles) {
    let width = parseInt(tiles.sizeX), height = parseInt(tiles.sizeY)

    let cached = new Map()

    for (let i = 0; i < numFrames(img); i++) {
        img.setFrame(i)

        makeProgress(false);

        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                let xCurve = (x % 2 === 0 ? IN : OUT)
                let yCurve = (y % 2 !== 0 ? IN : OUT)

                let topCurve = y === 0 ? NONE : yCurve
                let bottomCurve = y === rows - 1 ? NONE : yCurve
                let leftCurve = x === 0 ? NONE : xCurve
                let rightCurve = x === cols - 1 ? NONE : xCurve

                let key = `${topCurve}, ${bottomCurve}, ${leftCurve}, ${rightCurve}`

                if (!cached.has(key)) {
                    let mask = (() => {
                        let pg = createGraphics(width * 2, height * 2)
                        pg.background(255)
                        pg.translate(width * 0.5, height * 0.5)
                        drawPuzzleSideMask(pg, TOP, topCurve, width, height)
                        drawPuzzleSideMask(pg, BOTTOM, bottomCurve, width, height)
                        drawPuzzleSideMask(pg, LEFT, leftCurve, width, height)
                        drawPuzzleSideMask(pg, RIGHT, rightCurve, width, height)
                        return makeMask(makeImage(pg))
                    })()

                    let jigsaw = (() => {
                        let pg = createGraphics(width * 2, height * 2)
                        pg.translate(width * 0.5, height * 0.5)
                        drawPuzzleSide(pg, TOP, topCurve, width, height)
                        drawPuzzleSide(pg, BOTTOM, bottomCurve, width, height)
                        drawPuzzleSide(pg, LEFT, leftCurve, width, height)
                        drawPuzzleSide(pg, RIGHT, rightCurve, width, height)
                        return makeImage(pg)
                    })()

                    let jigsawFill = (() => {
                        let pg = createGraphics(width * 2, height * 2)
                        pg.background(Theme.board_fill)
                        let img = makeImage(pg)
                        img.mask(mask)
                        return img
                    })()

                    cached.set(key, {mask, jigsaw, jigsawFill})
                }

                let tile = tiles[i][x][y]

                let {mask, jigsaw, jigsawFill} = cached.get(key)
                tile.mask(mask)

                tiles[i][x][y] = {
                    tile, jigsaw, jigsawFill, topCurve, bottomCurve, leftCurve, rightCurve
                }
            }
        }
    }
    return tiles
}

// Function to create a mask for an image
function makeMask(img) {
    img.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
        img.pixels[i + 3] = (img.pixels[i] + img.pixels[i] + img.pixels[i]) / 3;
    }
    img.updatePixels();

    return img
}

// Function to convert a graphics object to an image
export function makeImage(pg) {
    var img = pg.get()
    pg.remove()
    return img
}

// Function to cut an image into puzzle pieces
export function cut(img, cols, rows, alignX, alignY) {
    let squared = (alignX || alignY)

    let width = img.width
    let height = img.height

    let sizeX = width / cols
    let sizeY = height / rows

    cropX = 0
    cropY = 0

    if (squared) {
        let ratio = aspectRatio(sizeX, sizeY)

        if (ratio.y > ratio.x) sizeY *= ratio.x / ratio.y; else if (ratio.x > ratio.y) sizeX *= ratio.y / ratio.x;

        cropX = width - cols * sizeX
        cropY = height - rows * sizeY
    }

    var locTiles = []

    tiles.sizeX = sizeX
    tiles.sizeY = sizeY

    let pg = createGraphics(img.width + sizeX * 2, img.height + sizeY * 2)
    pg.image(img, sizeX, sizeY)
    img = makeImage(pg)

    for (let x = 0; x < cols; x++) {
        let col = []
        for (let y = 0; y < rows; y++) {
            let offset = {x: 0, y: 0}

            if (squared) {
                switch (alignX) {
                    case LEFT:
                        offset.x = 0;
                        break;
                    case CENTER:
                        offset.x = cropX / 2;
                        break;
                    case RIGHT:
                        offset.x = cropX;
                        break;
                }

                switch (alignX) {
                    case TOP:
                        offset.y = 0;
                        break;
                    case CENTER:
                        offset.y = cropY / 2;
                        break;
                    case BOTTOM:
                        offset.y = cropY;
                        break;
                }
            }

            let sliced = img.get((x + 1) * sizeX + offset.x - sizeX / 2, (y + 1) * sizeY + offset.y - sizeY / 2, sizeX * 2, sizeY * 2)
            col.push(sliced)
        }
        locTiles.push(col)
    }
    return locTiles
}

// Function to calculate the greatest common divisor
function calcGcd(a, b) {
    if (b === 0) return a
    return calcGcd(b, a % b)
}

// Function to calculate the aspect ratio of an image
export function aspectRatio(w, h) {
    let gcd = calcGcd(w, h)
    return {x: w / gcd, y: h / gcd}
}