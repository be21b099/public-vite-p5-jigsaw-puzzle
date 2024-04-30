import './assets/css/style.css'
import './assets/js/plugins/transform.js'
import './assets/js/plugins/cors.js'
import './assets/js/jigsaw.js'
import './assets/js/setupMeta.js'


// Import the functions you need from your scripts
import {
    setup,
    draw,
    generate,
    onSolve,
    hideQuit,
    setFlag,
    changeIcon,
    hint,
    verify,
    toggleFullscreen,
    quit,
    puzzleSettings,
    hideSettings,
    submitFeedback,
    mouseReleased,
    mousePressed
} from './assets/js/setupGame.js'; // Adjust the path accordingly

import {
    windowResized
} from "./assets/js/jigsaw.js";

// Attach functions to the global scope for access from HTML
window.generate = generate;
window.setFlag = setFlag;
window.changeIcon = changeIcon;
window.hideQuit = hideQuit;
window.onSolve = onSolve;
window.hint = hint;
window.verify = verify;
window.toggleFullscreen = toggleFullscreen;
window.puzzleSettings = puzzleSettings;
window.hideSettings = hideSettings;
window.quit = quit;
window.setup = setup;
window.draw = draw;
window.submitFeedback = submitFeedback;
window.mouseReleased = mouseReleased;
window.mousePressed = mousePressed;
window.windowResized = windowResized;


document.addEventListener("DOMContentLoaded", function() {
    const body = document.body;
    const consentBanner = document.getElementById("consentBanner");
    const acceptBtn = document.getElementById("acceptBtn");
    const uiCont = document.querySelector(".ui-container");

    acceptBtn.addEventListener("click", function() {
        const reloadButton = document.querySelector('#reloadButton');
        // Set cookies or perform necessary actions upon acceptance
        consentBanner.style.display = "none";
        body.classList.remove("consent-pending");
        uiCont.classList.remove("disabled");
        reloadButton.classList.remove("disabled");
    });

    body.classList.add("consent-pending");
});


document.querySelector('#app').innerHTML = `
  <div touch-action="none" unresolved>
    <div class="ui disabled">
        <div class="ui-popup-container disabled">
            <div class=ui-popup>
                <div class="section">
                    <h2>Generate new puzzle</h2>
                    <label for="url"><input id="url" placeholder="Image link" type="text"/></label>
                    <label for=cols><input id=cols min=2 placeholder="Columns" type="number"></label> x
                    <label for=rows><input id=rows min=2 placeholder="Rows" type="number"></label>
                    <br><br>
                    <div>
                        <button onclick="window.location.href = generate()" type="button">Generate</button>
                        <a class="tooltip" id=again>
                            <button type="button">Play again</button>
                            <span class=tooltip-content>Pieces times 2</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <div class="ui-popup-container-report disabled">
            <div class="ui-popup">
                <div class="section"><h2>Thank you for playing!</h2></div>
                <div class="section">
                    <h4>How was your overall experience with the puzzle?</h4>
                    <label for="username"><input id="username" onchange="setFlag()" placeholder="Username:" type="text"/></label>
                    <div class="rating-container">
                        <label>
                            <input id="rating1" name="rating" onclick="changeIcon(this)" type="radio" value="1">
                            <span class="material-symbols-rounded" style="color: #45AE34; font-size: 56px;">sentiment_very_satisfied</span>
                        </label>

                        <label>
                            <input id="rating2" name="rating" onclick="changeIcon(this)" type="radio" value="2">
                            <span class="material-symbols-rounded" style="color: #8F8100; font-size: 56px;">sentiment_satisfied</span>
                        </label>

                        <label>
                            <input id="rating3" name="rating" onclick="changeIcon(this)" type="radio" value="3">
                            <span class="material-symbols-rounded" style="color: #e1d356; font-size: 56px;">sentiment_neutral</span>
                        </label>

                        <label>
                            <input id="rating4" name="rating" onclick="changeIcon(this)" type="radio" value="4">
                            <span class="material-symbols-rounded" style="color: #EC9938; font-size: 56px;">sentiment_dissatisfied</span>
                        </label>

                        <label>
                            <input id="rating5" name="rating" onclick="changeIcon(this)" type="radio" value="5">
                            <span class="material-symbols-rounded" style="color: #A22828; font-size: 56px;">sentiment_sad</span>
                        </label>
                    </div>
                    <div><span class="textarea" contenteditable role="textbox"></span></div>
                    <button class="submit-button" disabled onclick="submitFeedback()" style="margin-top: 10px; font-size: 18px" type="button">Send Feedback</button>
                </div>
            </div>
        </div>
        
        <div class="ui-popup-container-settings disabled">
            <div class="ui-popup">
                <div class="functionality" onclick="hideSettings()" style="position: absolute; right: 10px; height: 35px; width: 35px"><span class="material-icons">close</span></div>
                <div class="section"><h2>Settings</h2></div>
                <div class="section">
                    <label for="colorpicker">Color Picker:</label>
                    <input type="color" id="colorpicker" value="#ff0000" style="height: 2.5vh">
                </div>
                <div class="section">
                    <label>
                        <input id="display_blink" name="display" type="radio" value="true" checked>
                        <span>Blinking Boarder</span>
                    </label>
                    <label>
                        <input id="display_constant" name="display" type="radio" value="false">
                        <span>Constant Boarder</span>
                    </label>
                </div>
                <div class="section">
                    <label for="hint_weight">Hint Weight (between 1 and 6):</label>
                    <input type="number" id="hint_weight" name="hint_weight" min="1" max="6" step=".5" value="2" style="height: 3vh; font-size: 1.5vh;">
                </div>
            </div>
        </div>
        
        <div class="ui-popup-container-quit disabled">
            <div class="ui-popup">
                <div class="section">Are you sure you want to quit?</div>
                <div class="section">
                    <button onclick="onSolve()" type="button" style="background-color: #A22828">Yes</button>
                    <button onclick="hideQuit()" type="button">No</button>
                </div>
            </div>
        </div>

        <div class="ui-container disabled">
            <div class=tooltip>
                <span class=tooltip-content>Preview</span>
                <div class=functionality onclick="hint()">
                    <span class="material-icons">visibility</span>
                </div>
            </div>
            <div class=tooltip>
                <span class=tooltip-content>Verify</span>
                <div class=functionality onclick="verify()">
                    <span class="material-icons">task_alt</span>
                </div>
            </div>
            <div class=tooltip>
                <span class=tooltip-content>Fullscreen</span>
                <div class=functionality onclick="toggleFullscreen(this)">
                    <span class="material-icons">fullscreen</span>
                </div>
            </div>
            <div class="tooltip">
                <span class="tooltip-content">Settings</span>
                <div class="functionality" onclick="puzzleSettings()">
                    <span class="material-icons">settings</span>
                </div>
            </div>
            <div class=tooltip>
                <span class=tooltip-content>Quit</span>
                <div class=functionality onclick="quit()">
                    <span class="material-icons">close</span>
                </div>
            </div>
        </div>
    </div>
    <!-- Consent banner -->
    <div class="consent-banner" id="consentBanner">
        <div class="center">
            <div>We are tracking your moves and display inputs for studying cognitive ability with a serious game.<br>The values tracked will be:</div>
            <ul>
                <li>Anonymous Username - will not be included in the study</li>
                <li>Completion time</li>
                <li>Number of clicks</li>
                <li>The difficulty of the game - how many rows and columns the puzzle have</li>
                <li>Input position and time taken between moves</li>
                <li>Feedback at the end of the game</li>
            </ul>
            <div>If you aren't sure you want these values to be tracked, please close this page.</div>
            <br>
            <button id="acceptBtn" type="button">Accept</button>
        </div>
    </div>
    <!-- Choosing Game -->
    <!-- TODO: Implement Choosing ROWS & COLS at the beginning -->
</div>
`