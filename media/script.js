
const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', () => {
    const actionButton = document.getElementById('actionButton');

    if (actionButton) {
        actionButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'performAction' });
        });
    }

    // Handle table row click
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const rowId = row.getAttribute('data-id');
            const rowName = row.cells[0].textContent;
            const rowDescription = row.cells[1].textContent;

            // Send a message to the VSCode plugin
            vscode.postMessage({
                command: 'rowClicked',
                id: rowId,
                name: rowName,
                description: rowDescription,
            });
        });
    });
});

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'updateContent':
            updateContent(message.content);
            break;
    }
});

function updateContent(content) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = content;
    }
}

function importExampleProject(projectName) {
    vscode.postMessage({ command: 'importExampleProject', projectName: projectName });
}

function addHardwareLib(libName) {
    vscode.postMessage({ command: 'addHardwareLib', libraryName: libName });
}

function add3rdLib(libName) {
    vscode.postMessage({ command: 'add3rdLib', libraryName: libName });
}

function addLayeredLib(layeredLibName) {
    vscode.postMessage({ command: 'addLayeredLib', layeredLibName: layeredLibName });
}

function getBinarySize() {
    vscode.postMessage({ command: 'getBinarySize' });
}

function getSymbolList() {
    vscode.postMessage({ command: 'getSymbolList' });
}

function updateAnalysisPage() {
    getBinarySize();
    getSymbolList();
}

function saveConfig() {
    const sdkPath = document.getElementById('sdkPath').value;
    const toolchainPath = document.getElementById('toolchainPath').value;
    const buildTool = document.getElementById('buildTool').value;
    vscode.postMessage({
        command: 'saveConfig',
        sdkPath: sdkPath,
        toolchainPath: toolchainPath,
        buildTool: buildTool
    });
}

function updateSymbolCard(symbolList) {
    const textSectionSymbols = document.querySelector('#textSectionSymbols tbody');
    const dataSectionSymbols = document.querySelector('#dataSectionSymbols tbody');
    const bssSectionSymbols = document.querySelector('#bssSectionSymbols tbody');

    const sortSymbolsByAddress = (symbols) => symbols.sort((a, b) => parseInt(a.address, 16) - parseInt(b.address, 16));

    if (textSectionSymbols) {
        textSectionSymbols.innerHTML = '';
        sortSymbolsByAddress(symbolList.sections['.text']).forEach(symbol => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${symbol.address}</td>
                <td>${symbol.name}</td>
                <td>${symbol.size}</td>
                <td>${symbol.type}</td>
            `;
            textSectionSymbols.appendChild(row);
        });
    }

    if (dataSectionSymbols) {
        dataSectionSymbols.innerHTML = '';
        sortSymbolsByAddress(symbolList.sections['.data']).forEach(symbol => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${symbol.address}</td>
                <td>${symbol.name}</td>
                <td>${symbol.size}</td>
                <td>${symbol.type}</td>
            `;
            dataSectionSymbols.appendChild(row);
        });
    }

    if (bssSectionSymbols) {
        bssSectionSymbols.innerHTML = '';
        sortSymbolsByAddress(symbolList.sections['.bss']).forEach(symbol => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${symbol.address}</td>
                <td>${symbol.name}</td>
                <td>${symbol.size}</td>
                <td>${symbol.type}</td>
            `;
            bssSectionSymbols.appendChild(row);
        });
    }
}

window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'loadConfig') {
        document.getElementById('sdkPath').value = message.sdkPath || '';
        document.getElementById('toolchainPath').value = message.toolchainPath || '';
        document.getElementById('buildTool').value = message.buildTool || '';
    } else if (message.command === 'updateChart') {
        updateChart(message.data, message.chipset);
    } else if (message.command === 'updateSymbolList') {
        updateSymbolCard(message.data);
    }
});

vscode.postMessage({ command: 'requestConfig' });
