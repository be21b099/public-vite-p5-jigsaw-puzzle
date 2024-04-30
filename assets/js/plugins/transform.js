// Acknowledgement to Thibault Coppex (@tcoppex) for the 3d-modelview-projection-math.
// See: https://editor.p5js.org/bohnacker/sketches/nUk3bVW7b on how to use it

// Disable friendly errors for p5.js
p5.disableFriendlyErrors = true;

// Function to add screenPosition to p5 instance
export function addScreenPositionFunction(p5Instance) {
    let p = p5Instance || this;

    p.disableFriendlyErrors = false;

    const R_2D = 0;
    const R_WEBGL = 1;
    let context = getObjectName(p._renderer.drawingContext).search("2D") >= 0 ? R_2D : R_WEBGL;

    if (context === R_2D) {
        p._renderer.matrixStack = [new p5.Matrix()];
    }

    // Override the draw function
    if (p.draw instanceof Function) {
        let drawNative = p.draw;
        p.draw = function (...args) {
            if (context === R_2D) p._renderer.matrixStack = [new p5.Matrix()];
            drawNative.apply(p, args);
        };
    }

    // Override the resetMatrix function
    if (p.resetMatrix instanceof Function) {
        let resetMatrixNative = p.resetMatrix;
        p.resetMatrix = function (...args) {
            if (context === R_2D) p._renderer.matrixStack = [new p5.Matrix()];
            resetMatrixNative.apply(p, args);
        };
    }

    // Override the translate function
    if (p.translate instanceof Function) {
        let translateNative = p.translate;
        p.translate = function (...args) {
            if (context === R_2D) last(p._renderer.matrixStack).translate(args);
            translateNative.apply(p, args);
        };
    }

    // Override the rotate function
    if (p.rotate instanceof Function) {
        let rotateNative = p.rotate;
        p.rotate = function (...args) {
            if (context === R_2D) {
                let rad = p._toRadians(args[0]);
                last(p._renderer.matrixStack).rotateZ(rad);
            }
            rotateNative.apply(p, args);
        };
    }

    // Override the rotateX function
    if (p.rotateX instanceof Function) {
        let rotateXNative = p.rotateX;
        p.rotateX = function (...args) {
            if (context === R_2D) {
                let rad = p._toRadians(args[0]);
                last(p._renderer.matrixStack).rotateX(rad);
            }
            rotateXNative.apply(p, args);
        };
    }

    // Override the rotateY function
    if (p.rotateY instanceof Function) {
        let rotateYNative = p.rotateY;
        p.rotateY = function (...args) {
            if (context === R_2D) {
                let rad = p._toRadians(args[0]);
                last(p._renderer.matrixStack).rotateY(rad);
            }
            rotateYNative.apply(p, args);
        };
    }

    // Override the rotateZ function
    if (p.rotateZ instanceof Function) {
        let rotateZNative = p.rotateZ;
        p.rotateZ = function (...args) {
            if (context === R_2D) {
                let rad = p._toRadians(args[0]);
                last(p._renderer.matrixStack).rotateZ(rad);
            }
            rotateZNative.apply(p, args);
        };
    }

    // Override the scale function
    if (p.scale instanceof Function) {
        let scaleNative = p.scale;
        p.scale = function (...args) {
            if (context === R_2D) {
                let m = last(p._renderer.matrixStack);
                let sx = args[0];
                let sy = args[1] || sx;
                let sz = context === R_2D ? 1 : args[2];
                m.scale([sx, sy, sz]);
            }
            scaleNative.apply(p, args);
        };
    }

    // Override the shearX function
    if (p.shearX instanceof Function) {
        let shearXNative = p.shearX;
        p.shearX = function (...args) {
            if (context === R_2D) {
                let rad = p._toRadians(args[0]);
                let stack = p._renderer.matrixStack;
                let m = last(stack);
                let sm = new p5.Matrix();
                sm.mat4[4] = Math.tan(rad);
                sm.mult(m);
                stack[stack.length - 1] = sm;
            }
            shearXNative.apply(p, args);
        };
    }

    // Override the shearY function
    if (p.shearY instanceof Function) {
        let shearYNative = p.shearY;
        p.shearY = function (...args) {
            if (context === R_2D) {
                let rad = p._toRadians(args[0]);
                let stack = p._renderer.matrixStack;
                let m = last(stack);
                let sm = new p5.Matrix();
                sm.mat4[1] = Math.tan(rad);
                sm.mult(m);
                stack[stack.length - 1] = sm;
            }
            shearYNative.apply(p, args);
        };
    }

    // Override the applyMatrix function
    if (p.applyMatrix instanceof Function) {
        let applyMatrixNative = p.applyMatrix;
        p.applyMatrix = function (...args) {
            if (context === R_2D) {
                let stack = p._renderer.matrixStack;
                let m = last(stack);
                let sm = new p5.Matrix();
                sm.mat4[0] = args[0];
                sm.mat4[1] = args[1];
                sm.mat4[4] = args[2];
                sm.mat4[5] = args[3];
                sm.mat4[12] = args[4];
                sm.mat4[13] = args[5];
                sm.mult(m);
                stack[stack.length - 1] = sm;
            }
            applyMatrixNative.apply(p, args);
        };
    }

    // Override the push function
    if (p.push instanceof Function) {
        let pushNative = p.push;
        p.push = function (...args) {
            if (context === R_2D) {
                let m = last(p._renderer.matrixStack);
                p._renderer.matrixStack.push(m.copy());
            }
            pushNative.apply(p, args);
        };
    }

    // Override the pop function
    if (p.pop instanceof Function) {
        let popNative = p.pop;
        p.pop = function (...args) {
            if (context === R_2D) p._renderer.matrixStack.pop();
            popNative.apply(p, args);
        };
    }

    // Function to get screen position
    p.screenPosition = function (x, y, z) {
        if (x instanceof p5.Vector) {
            let v = x;
            x = v.x;
            y = v.y;
            z = v.z;
        } else if (x instanceof Array) {
            let rg = x;
            x = rg[0];
            y = rg[1];
            z = rg[2] || 0;
        }
        z = z || 0;

        if (context === R_2D) {
            let m = last(p._renderer.matrixStack);
            let v = p.createVector(x, y, z);
            return multiplyMatrixVector(m, v);
        } else {
            let v = p.createVector(x, y, z);
            let mvp = (p._renderer.uMVMatrix.copy()).mult(p._renderer.uPMatrix);
            let vNDC = multiplyMatrixVector(mvp, v);
            let vCanvas = p.createVector();
            vCanvas.x = 0.5 * vNDC.x * p.width;
            vCanvas.y = 0.5 * -vNDC.y * p.height;
            vCanvas.z = 0;
            return vCanvas;
        }
    };

    // Helper function to get the last element of an array
    function last(arr) {
        return arr[arr.length - 1];
    }

    // Helper function to get the object name
    function getObjectName(obj) {
        let funcNameRegex = /function (.{1,})\(/;
        let results = funcNameRegex.exec(obj.constructor.toString());
        return results && results.length > 1 ? results[1] : "";
    }

    // Helper function to multiply a matrix by a vector
    function multiplyMatrixVector(m, v) {
        if (!(m instanceof p5.Matrix) || !(v instanceof p5.Vector)) {
            console.log('MultiplyMatrixVector: Invalid arguments');
            return;
        }

        let _dest = p.createVector();
        let mat = m.mat4;

        _dest.x = mat[0] * v.x + mat[4] * v.y + mat[8] * v.z + mat[12];
        _dest.y = mat[1] * v.x + mat[5] * v.y + mat[9] * v.z + mat[13];
        _dest.z = mat[2] * v.x + mat[6] * v.y + mat[10] * v.z + mat[14];
        let w = mat[3] * v.x + mat[7] * v.y + mat[11] * v.z + mat[15];

        if (Math.abs(w) > Number.EPSILON) {
            _dest.mult(1.0 / w);
        }

        return _dest;
    }
}
