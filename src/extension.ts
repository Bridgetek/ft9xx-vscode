import * as vscode from 'vscode';
import * as fs from 'fs';

import { updateStatusBarItems } from './statusBar';
import { Ft9xxTreeDataProvider } from './Ft9xxTreeDataProvider';
import { registerCommandsList } from './CommandList';
import { ProjectManager } from './ProjectManager';

function isSubWorkspace(): boolean {
    const config = vscode.workspace.getConfiguration().get('ft9xx');
    if (config === undefined) {
        return false;
    }
    const isSubWorkspace = (config as any)?.['subWorkspace'];
    return isSubWorkspace === true;
}

function prepareWorkspace(extensionPath: string): void {
    // This project manager is start from there, the 1st initialization due to this is singleton
    const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);

    if (isSubWorkspace()) {
        // Allow extension to work with sub-workspace projects
        // It mean we only allow to work with one workspace at a time
        // The feature add library is allow
        projectManager.setSubWorkspaceProject(true);
        // Ensure CMakeLists.txt is working by scan and regenerate it
        projectManager.ensureCmakeFileIsWorking();
    } else {
        // Allow extension to work with mother workspace
        // It mean we allow to work with multiple workspace at a time
        // The feature add library is disable
        // Only support to add project to workspace
        projectManager.setSubWorkspaceProject(false);
    }
}

/**
 * Make sure the environment variables are set correctly
 * @param context - The extension context
 */
function setupExtension(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration().get('ft9xx', vscode.ConfigurationTarget.Global);
    if (!config || !(config as any)['toolchainPath'] || !(config as any)['sdkPath']) {
        vscode.window.showInformationMessage('FT9xx configuration is missing. Please set ft9xx.toolchainPath and ft9xx.sdkPath in your user settings.');
    } else {
        return;
    }
    const toolchainPath = process.env.FT9XX_TOOLCHAIN;
    const sdkPath = process.env.FT9XX_SDK;

    if (toolchainPath && fs.existsSync(toolchainPath) && fs.lstatSync(toolchainPath).isDirectory()) {
        vscode.workspace.getConfiguration().update('ft9xx.toolchainPath', toolchainPath, vscode.ConfigurationTarget.Global);
    } else {
        vscode.window.showErrorMessage('FT9XX_TOOLCHAIN path is invalid or does not exist.');
    }

    if (sdkPath && fs.existsSync(sdkPath) && fs.lstatSync(sdkPath).isDirectory()) {
        vscode.workspace.getConfiguration().update('ft9xx.sdkPath', sdkPath, vscode.ConfigurationTarget.Global);
    } else {
        vscode.window.showErrorMessage('FT9XX_SDK path is invalid or does not exist.');
    }
}

export function activate(context: vscode.ExtensionContext) {
    vscode.window.registerTreeDataProvider('BridgeTekProjectView', new Ft9xxTreeDataProvider());
    setupExtension(context);
    registerCommandsList(context, context.extensionPath);
    updateStatusBarItems(context);
    prepareWorkspace(context.extensionPath);
}

export function deactivate() { }
