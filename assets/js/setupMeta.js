// Extract query parameters from the window's URL
import {cols, rows} from "./setupGame.js";

export const params = new URLSearchParams(window.location.search);

// Disable passive event listener to prevent default touchmove behavior
document.addEventListener('touchmove', function (e) {
    e.preventDefault();
}, {passive: false});

// Prevent default gesturestart behavior
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

// Set up links by modifying the URL with doubled columns and rows parameters
export function setupLinks() {
    // Get the 'again' element from the document
    const again = document.querySelector('#again');

    // Create a new URL object based on the current window location
    const url = new URL(window.location.href);

    // Update the URL parameters for columns and rows (doubling them)
    url.searchParams.set('cols', cols * 2);
    url.searchParams.set('rows', rows * 2);

    // Set the 'again' link's href attribute to the modified URL
    again.href = url.toString();
}

// Check if a URI is encoded
export function isEncoded(uri) {
    // Default to an empty string if no URI is provided
    uri = uri || '';

    // Return true if the URI is encoded, false otherwise
    return uri !== decodeURIComponent(uri);
}
