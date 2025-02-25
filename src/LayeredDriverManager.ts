import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ConfigurationManager } from './configurationManager';
import { CMakeManager } from './cmakeManager';

export interface LayeredDriverInfo {
    sourcePaths: string[];  // on SDK folder is 'SDK_Path/hardware/src/' to 'workspaceFolder/hw/src/'
    headerPaths: string[];  // on SDK folder is 'SDK_Path/hardware/include/' to 'workspaceFolder/hw/include/'
    supportedChipsets: string[];
}

export class LayeredDriverManager {
    private cfgManager : ConfigurationManager;
    private cmakeManager : CMakeManager;
    private workspaceFolder: string;
    private static layeredDriversTable: {
        [libraryName: string]: LayeredDriverInfo
    } = {
        'USB Header Files': {
            sourcePaths: [],
            headerPaths: [
                'ft900_usb_cdc.h',
                'ft900_usb_hid.h',
                'ft900_usb_boms.h',
                'ft900_usb_audio.h',
                'ft900_usb_uvc.h'
            ],
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USB Host CDCACM': {
            sourcePaths: ['usbh_cdcacm.c'],
            headerPaths: [
                'ft900_usb_cdc.h',
                'ft900_usbh_cdcacm.h'
            ],
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USB Host HID': {
            sourcePaths: ['usbh_hid.c'],
            headerPaths: [
                'ft900_usb_hid.h',
                'ft900_usbh_hid.h'
            ],
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USB Host BOMS': {
            sourcePaths: ['usbh_boms.c'],
            headerPaths: [
                'ft900_usb_boms.h',
                'ft900_usbh_boms.h'
            ],
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USB Host AOA': {
            sourcePaths: ['usbh_aoa.c'],
            headerPaths: [
                'ft900_usb_aoa.h',
                'ft900_usbh_aoa.h'
            ],
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USB Device RNDIS': {
            sourcePaths: ['usbd_rndis.c'],
            headerPaths: [
                'ft900_usb_rndis.h',
                'ft900_usbh_rndis.h'
            ],
            supportedChipsets: ['FT90x', 'FT93x']
        }
    };

    constructor(projectPath?: string) {
        if (projectPath) {
            this.workspaceFolder = projectPath;
        } else {
            this.workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        }
        this.cfgManager = ConfigurationManager.getInstance(this.workspaceFolder);
        this.cmakeManager = CMakeManager.getInstance(this.workspaceFolder);
    }

    public isLayeredDriverSupportChipset(layeredDriverList: string[], chipset: string) : boolean {
        for (const driver of layeredDriverList) {
            if (!LayeredDriverManager.layeredDriversTable[driver].supportedChipsets.includes(chipset)) {
                return false;
            }
        }
        return true;
    }

    public addLayeredDriverToProject(driverName: string) {
        if (false === this.copyLayeredDriverToWorkspace(driverName)) {
            vscode.window.showErrorMessage(`Layered Driver "${driverName}" failed to import to current project.`);
            return;
        }
        this.cfgManager.addLayeredDriver(driverName);
        this.cmakeManager.saveUsbLibsConfig(this.cfgManager.getNumberOfLayeredDrivers() > 0);
        vscode.window.showInformationMessage(`Layered Driver "${driverName}" is added to current project.`);
    }

    private copyLayeredDriverToWorkspace(layeredDriverName: string) : boolean {
        const layeredDriverInfo = LayeredDriverManager.layeredDriversTable[layeredDriverName];
        if (!layeredDriverInfo) {
            vscode.window.showErrorMessage(`Layered Driver "${layeredDriverName}" not found.`);
            return false;
        }

        const sdkPath = this.cfgManager.getSDKPath();
        if (!sdkPath) {
            vscode.window.showErrorMessage('SDK path not found.');
            return false;
        }

        // Copy source files
        const layeredDriverSrcPath = path.join(sdkPath, 'drivers');
        const layeredDriverDstPath = path.join(this.workspaceFolder, 'usb', 'src');
        layeredDriverInfo.sourcePaths.forEach(file => {
            this.copyFileSync(path.join(layeredDriverSrcPath, file), path.join(layeredDriverDstPath, file));
        });

        // Copy header files
        const layeredDriverSrcIncludePath = path.join(sdkPath, 'drivers');
        const layeredDriverDstIncludePath = path.join(this.workspaceFolder, 'usb', 'include');
        layeredDriverInfo.headerPaths.forEach(file => {
            this.copyFileSync(path.join(layeredDriverSrcIncludePath, file), path.join(layeredDriverDstIncludePath, file));
        });

        return true;
    }

    private copyFileSync(src: string, dest: string) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
    }
}