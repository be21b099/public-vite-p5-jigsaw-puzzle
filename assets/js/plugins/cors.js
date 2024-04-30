// Add CORS (Cross-Origin Resource Sharing) support to the loadImage function in p5.js
function addCORSLoadImageFunction(p5Instance) {
    // Use the provided p5 instance or the global one
    let p = p5Instance || this;

    // Override the loadImage function in p5
    p.loadImage = function (path, mode, successCallback, failureCallback) {
        // Validate function parameters
        p5._validateParameters('loadImage', arguments);

        // Create a new p5 Image object
        const pImg = new p5.Image(1, 1, this);
        const self = this;

        // Create a new Request with CORS headers
        const req = new Request(path, {
            method: 'GET', mode: mode,
            headers: new Headers({
                'Access-Control-Allow-Origin': '*'
            })
        });

        // Fetch the image using the CORS-enabled Request
        fetch(path, req)
            .then(response => {
                // Check the content type of the response
                const contentType = response.headers.get('content-type');

                // Handle GIF images separately
                if (contentType && contentType.includes('image/gif')) {
                    response.arrayBuffer().then(arrayBuffer => {
                        if (arrayBuffer) {
                            const byteArray = new Uint8Array(arrayBuffer);
                            // Create GIF using custom function
                            _createGif(byteArray, pImg, successCallback, failureCallback, (pImg => {
                                self._decrementPreload();
                            }).bind(self));
                        }
                    }, e => {
                        // Handle failure for GIF loading
                        if (typeof failureCallback === 'function') {
                            failureCallback(e);
                        } else {
                            console.error(e);
                        }
                    });
                } else {
                    // For non-GIF images, use the standard Image object
                    const img = new Image();

                    // Event handler for successful image loading
                    img.onload = () => {
                        pImg.width = pImg.canvas.width = img.width;
                        pImg.height = pImg.canvas.height = img.height;

                        pImg.drawingContext.drawImage(img, 0, 0);
                        pImg.modified = true;

                        // Call success callback if provided
                        if (typeof successCallback === 'function') {
                            successCallback(pImg);
                        }

                        // Decrement preload counter
                        self._decrementPreload();
                    };

                    // Event handler for image loading error
                    img.onerror = e => {
                        p5._friendlyFileLoadError(0, img.src);

                        // Call failure callback if provided
                        if (typeof failureCallback === 'function') {
                            failureCallback(e);
                        } else {
                            console.error(e);
                        }
                    };

                    // Set crossOrigin property to handle CORS for non-data URL images
                    if (path.indexOf('data:image/') !== 0) {
                        img.crossOrigin = 'Anonymous';
                    }

                    // Set the source of the Image object to the specified path
                    img.src = path;
                }

                // Mark the p5 Image object as modified
                pImg.modified = true;
            })
            .catch(e => {
                // Handle fetch error
                p5._friendlyFileLoadError(0, path);

                // Call failure callback if provided
                if (typeof failureCallback === 'function') {
                    failureCallback(e);
                } else {
                    console.error(e);
                }
            });

        // Return the p5 Image object
        return pImg;
    };
}
