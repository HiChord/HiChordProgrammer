// Generic Strings
const root_url = "https://electro-smith.github.io/Programmer"

// Data object with only necessary properties
var data = { 
    no_device: true,
    blinkFirmwareFile: null,
    bootloaderFirmwareFile: null,
}

// Function to get the root URL
function getRootUrl() {
    var url = document.URL;
    return url;
}

// Function to read firmware files from the server
async function readServerFirmwareFile(path)
{
    return new Promise((resolve) => {
        var raw = new XMLHttpRequest();
        var fname = path;
    
        raw.open("GET", fname, true);
        raw.responseType = "arraybuffer"
        raw.onreadystatechange = function ()
        {
            if (this.readyState === 4 && this.status === 200) {
                resolve(this.response)
            }    
        }
        raw.send(null)
    })
}

var app = new Vue({
    el: '#app',
    template: 
    `
    <b-container class="app_body">
    <div align="center">
        <button id="detach" disabled="true" hidden="true">Detach DFU</button>
        <button id="upload" disabled="true" hidden="true">Upload</button>
        <b-form id="configForm">
            <p> <label for="transferSize"  hidden="true">Transfer Size:</label>
            <input type="number" name="transferSize"  hidden="true" id="transferSize" value="1024"></input> </p>
            <p> <span id="status"></span> </p>

            <p><label hidden="true" for="vid">Vendor ID (hex):</label>
            <input hidden="true" list="vendor_ids" type="text" name="vid" id="vid" maxlength="6" size="8" pattern="0x[A-Fa-f0-9]{1,4}">
            <datalist id="vendor_ids"> </datalist> </p>

            <div id="dfuseFields" hidden="true">
                <label for="dfuseStartAddress" hidden="true">DfuSe Start Address:</label>
                <input type="text" name="dfuseStartAddress" id="dfuseStartAddress"  hidden="true" title="Initial memory address to read/write from (hex)" size="10" pattern="0x[A-Fa-f0-9]+">
                <label for="dfuseUploadSize" hidden="true">DfuSe Upload Size:</label>
                <input type="number" name="dfuseUploadSize" id="dfuseUploadSize" min="1" max="2097152" hidden="true">
            </div>
        </b-form>
    </div>
    <b-row align="center" class="app_column">
        <div>
            <legend>HiChord Web Programmer</legend>
            <p> Connect your HiChord device - If this is your first time here, follow the steps in the Help section below </p>
            <p><b-button variant="es" id="connect"> Connect</b-button></p>
            <dialog id="interfaceDialog">
                Your device has multiple DFU interfaces. Select one from the list below:
                <b-form id="interfaceForm" method="dialog">
                    <b-button id="selectInterface" type="submit">Select interface</b-button>
                </b-form>
            </dialog>
            <div id="usbInfo" hidden="true" style="white-space: pre"></div>
            <div id="dfuInfo"  hidden="true" style="white-space: pre"></div>
            <div>
                <b-button variant="es" v-b-toggle.collapseHelp>Display Help</b-button>
                <b-collapse id="collapseHelp">
                    <div class="nested_list">
                        <h2>Usage:</h2>
                        <ol>
                            <li><p>Connect your HiChord device to the computer.</p></li>
                            <li><p>Enter the system bootloader by holding the BOOT button down, and then pressing, and releasing the RESET button.</p></li>
                            <li><p>Click the Connect button at the top of the page.</p></li>
                            <li><p>Select "DFU in FS Mode".</p></li>
                            <li><p>Click the "Flash HiChord Firmware!" button to load the firmware.</p></li>
                            <li><p>Click Program, and wait for the progress bar to finish.</p></li>
                            <li><p>If the program does not start immediately, pressing RESET on your device will cause the program to start running.</p></li>
                        </ol>
                        <p>
                            On Windows, you may have to update the driver to WinUSB.

                            To do this, you can download the free software, Zadig. Instructions for this can be found on the DaisyWiki in the Windows toolchain instructions page.
                        </p>
                    </div>
                </b-collapse>
                <b-collapse id="collapseHelp">
                    <div class="nested_list">
                        <h1>Requirements</h1>
                        <p>In order to use this, you will need:</p>
                        <ul>
                            <li>
                                <p>An up-to-date version of Chrome, at least version 61 or newer</p>
                            </li>
                            <li>
                                <p>A HiChord device or a compatible STM32 chip with a built-in DFU bootloader.</p>
                            </li>
                        </ul>
                    </div>
                </b-collapse>
            </div>
        </div>
        </b-row>
        <b-row align="center">
            <b-col align="center" class="app_column">
                <b-container>
                    <b-row class="p-2">
                        <legend>Getting Started? Flash the HiChord firmware!</legend>
                        <div><b-button variant="es" id="blink"  :disabled="no_device">Flash HiChord Firmware!</b-button></div>
                    </b-row>
                </b-container>
            </b-col>
        </b-row>
        <b-row>
        <b-col align="center" class="app_column">
        <b-container align="center">
            <legend>Programming Section</legend>
            <b-button id="download" variant='es' :disabled="no_device || !blinkFirmwareFile"> Program</b-button>

            <br> <br>
            <b-button variant="es" v-b-toggle.collapseAdvanced>Advanced...</b-button>
            <b-collapse id="collapseAdvanced">
                <br> <div> <b-button variant="es" id="bootloader"  :disabled="no_device">Flash Bootloader Image</b-button> </div>                        
            </b-collapse>

            <div class="log" id="downloadLog"></div>            
            <br><br>
            <div><div id = "readme"></div> </div>
        </b-container>
        </b-col>
        </b-row>
    </b-row>        
    
    </b-container>
    `,
    data: data,
    created() {
        console.log("Page Created")
    },
    mounted() {
        var self = this
        console.log("Mounted Page")

        // Load custom firmware file for the Flash HiChord Firmware! button
        var customFirmwareUrl = "https://raw.githubusercontent.com/HiChord/HiChordProgrammer/gh-pages/data/hichord_firmware.bin";

        // Read the custom firmware file
        readServerFirmwareFile(customFirmwareUrl).then(buffer => {
            blinkFirmwareFile = buffer;
        });

        // (Optional) Load the bootloader firmware file if needed
        var bootloaderUrl = "https://raw.githubusercontent.com/electro-smith/Programmer/gh-pages/data/dsy_bootloader_v5_4.bin";
        readServerFirmwareFile(bootloaderUrl).then(buffer => {
            bootloaderFirmwareFile = buffer;
        });
    },
    methods: {
        // No additional methods needed
    },
})
