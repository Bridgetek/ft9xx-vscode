import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { scanComPorts } from './utils';

export function updateStatusBarItems(context: vscode.ExtensionContext) {
    // Baudrate selector
    const baudrateStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    baudrateStatusBar.text = '$(terminal) 921600';
    baudrateStatusBar.tooltip = 'Select Baudrate';
    baudrateStatusBar.command = 'bridgetek-ft9xx.selectBaudrate';
    baudrateStatusBar.show();
    context.subscriptions.push(baudrateStatusBar);

    // Build mode selector
    const buildModeStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    buildModeStatusBar.text = '$(gear) Debug';
    buildModeStatusBar.tooltip = 'Select Build Mode';
    buildModeStatusBar.command = 'bridgetek-ft9xx.selectBuildMode';
    buildModeStatusBar.show();
    context.subscriptions.push(buildModeStatusBar);

    // Chipset selector
    const chipsetStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    chipsetStatusBar.text = '$(chip) FT90x';
    chipsetStatusBar.tooltip = 'Select Chipset';
    chipsetStatusBar.command = 'bridgetek-ft9xx.selectChipset';
    chipsetStatusBar.show();
    context.subscriptions.push(chipsetStatusBar);

    // COM port selector
    const oneWireStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    oneWireStatusBar.text = '$(ports-view-icon) No Port';
    oneWireStatusBar.tooltip = 'Select COM Port';
    oneWireStatusBar.command = 'bridgetek-ft9xx.selectComport';
    oneWireStatusBar.show();
    context.subscriptions.push(oneWireStatusBar);

    // Register baudrate selection command
    const selectBaudrateCommand = vscode.commands.registerCommand('bridgetek-ft9xx.selectBaudrate', async () => {
        const baudrates = ['115200', '921600'];
        const selected = await vscode.window.showQuickPick(baudrates, {
            placeHolder: 'Select Baudrate'
        });

        if (selected) {
            const config = vscode.workspace.getConfiguration();
            await config.update('ft9xx.baudrate', selected, vscode.ConfigurationTarget.Workspace);
            baudrateStatusBar.text = `$(terminal) ${selected}`;
        }
    });
    context.subscriptions.push(selectBaudrateCommand);

    // Register build mode selection command
    const selectBuildModeCommand = vscode.commands.registerCommand('bridgetek-ft9xx.selectBuildMode', async () => {
        const buildModes = ['Debug', 'Release'];
        const selected = await vscode.window.showQuickPick(buildModes, {
            placeHolder: 'Select Build Mode'
        });

        if (selected) {
            const config = vscode.workspace.getConfiguration();
            await config.update('ft9xx.buildMode', selected, vscode.ConfigurationTarget.Workspace);
            buildModeStatusBar.text = `$(gear) ${selected}`;

            const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
            if (workspaceFolder) {
                // Update settings.json
                const settingsJsonPath = path.join(workspaceFolder, '.vscode', 'settings.json');
                if (fs.existsSync(settingsJsonPath)) {
                    const settingsJson = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf8'));
                    settingsJson['ft9xx.buildMode'] = selected;
                    fs.writeFileSync(settingsJsonPath, JSON.stringify(settingsJson, null, 4));
                }

                // Update c_cpp_properties.json
                const cppPropertiesPath = path.join(workspaceFolder, '.vscode', 'c_cpp_properties.json');
                if (fs.existsSync(cppPropertiesPath)) {
                    const cppProperties = JSON.parse(fs.readFileSync(cppPropertiesPath, 'utf8'));
                    cppProperties.configurations.forEach((config: any) => {
                        if (selected === 'Debug') {
                            if (!config.defines.includes('_DEBUG')) {
                                config.defines.push('_DEBUG');
                            }
                        } else if (selected === 'Release') {
                            config.defines = config.defines.filter((define: string) => define !== '_DEBUG');
                        }
                    });
                    fs.writeFileSync(cppPropertiesPath, JSON.stringify(cppProperties, null, 4));
                }
            } else {
                vscode.window.showErrorMessage('Status bar: No workspace folder found.');
            }
        }
    });
    context.subscriptions.push(selectBuildModeCommand);

    // Register chipset selection command
    const selectChipsetCommand = vscode.commands.registerCommand('bridgetek-ft9xx.selectChipset', async () => {
        const chipsets = ['FT90x', 'FT93x'];
        const selected = await vscode.window.showQuickPick(chipsets, {
            placeHolder: 'Select Chipset'
        });

        if (selected) {
            const config = vscode.workspace.getConfiguration();
            await config.update('ft9xx.chipset', selected, vscode.ConfigurationTarget.Workspace);
            chipsetStatusBar.text = `$(chip) ${selected}`;

            const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
            if (workspaceFolder) {
                // Update settings.json
                const settingsJsonPath = path.join(workspaceFolder, '.vscode', 'settings.json');
                if (fs.existsSync(settingsJsonPath)) {
                    const settingsJson = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf8'));
                    settingsJson['ft9xx.chipset'] = selected;
                    fs.writeFileSync(settingsJsonPath, JSON.stringify(settingsJson, null, 4));
                }

                // Update c_cpp_properties.json
                const cppPropertiesPath = path.join(workspaceFolder, '.vscode', 'c_cpp_properties.json');
                if (fs.existsSync(cppPropertiesPath)) {
                    const cppProperties = JSON.parse(fs.readFileSync(cppPropertiesPath, 'utf8'));
                    cppProperties.configurations.forEach((config: any) => {
                        if (selected === 'FT90x') {
                            config.defines = config.defines.map((define: string) => define === '__FT930__' ? '__FT900__' : define);
                        } else if (selected === 'FT93x') {
                            config.defines = config.defines.map((define: string) => define === '__FT900__' ? '__FT930__' : define);
                        }
                    });
                    fs.writeFileSync(cppPropertiesPath, JSON.stringify(cppProperties, null, 4));
                }
            } else {
                vscode.window.showErrorMessage('Status bar: No workspace folder found.');
            }
        }
    });
    context.subscriptions.push(selectChipsetCommand);

    // Register COM port selection command
    const selectComportCommand = vscode.commands.registerCommand('bridgetek-ft9xx.selectComport', async () => {
        const ports = await scanComPorts();
        if (ports.length === 0) {
            vscode.window.showInformationMessage('No COM ports found');
            oneWireStatusBar.text = '$(ports-view-icon) No Port';
            return;
        }

        const selected = await vscode.window.showQuickPick(ports, {
            placeHolder: 'Select COM Port'
        });

        if (selected) {
            const config = vscode.workspace.getConfiguration();
            await config.update('ft9xx.comPort', selected, vscode.ConfigurationTarget.Workspace);
            oneWireStatusBar.text = `$(ports-view-icon) ${selected}`;
        }
    });
    context.subscriptions.push(selectComportCommand);

    // Initialize status bar items with saved values
    const config = vscode.workspace.getConfiguration();
    const savedBaudrate = config.get<string>('ft9xx.baudrate') || '912600';
    const savedBuildMode = config.get<string>('ft9xx.buildMode') || 'Debug';
    const savedChipset = config.get<string>('ft9xx.chipset') || 'FT90x';
    const savedComPort = config.get<string>('ft9xx.comPort');

    baudrateStatusBar.text = `$(terminal) ${savedBaudrate}`;
    buildModeStatusBar.text = `$(gear) ${savedBuildMode}`;
    chipsetStatusBar.text = `$(chip) ${savedChipset}`;
    if (savedComPort) {
        oneWireStatusBar.text = `$(ports-view-icon) ${savedComPort}`;
    }
}
