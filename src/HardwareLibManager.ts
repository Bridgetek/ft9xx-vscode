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

export class HardwareLibraryManager {
    private cfgManager : ConfigurationManager;
    private static hardwareLibsTable: {
        [libraryName: string]: LayeredDriverInfo
    } = {
            'ADC Driver': {
                sourcePaths: ['adc.c'],
                headerPaths: ['ft900_adc.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'Bootstrap Driver': {
                sourcePaths: ['bootstrap.c'],
                headerPaths: [],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'CAM Driver': {
                sourcePaths: ['cam.c'],
                headerPaths: ['ft900_cam.h'],
                supportedChipsets: ['FT90x']
            },
            'CAN Driver': {
                sourcePaths: ['can.c'],
                headerPaths: ['ft900_can.h'],
                supportedChipsets: ['FT90x']
            },
            'DAC Driver': {
                sourcePaths: ['dac.c'],
                headerPaths: ['ft900_dac.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'Preset Delays': {
                sourcePaths: ['delay.c'],
                headerPaths: ['ft900_delay.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'Datalogging Driver': {
                sourcePaths: ['dlog.c'],
                headerPaths: ['ft900_dlog.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'Ethernet Driver': {
                sourcePaths: ['ethernet.c'],
                headerPaths: ['ft900_eth.h'],
                supportedChipsets: ['FT90x']
            },
            'GPIO Driver': {
                sourcePaths: ['gpio.c'],
                headerPaths: ['ft900_gpio.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'I2C Master Driver': {
                sourcePaths: ['i2cm.c'],
                headerPaths: ['ft900_i2cm.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'I2C Slave Driver': {
                sourcePaths: ['i2cs.c'],
                headerPaths: ['ft900_i2cs.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'I2S Driver': {
                sourcePaths: ['i2s.c'],
                headerPaths: ['ft900_i2s.h'],
                supportedChipsets: ['FT90x']
            },
            'Interrupt Driver': {
                sourcePaths: ['interrupt.c'],
                headerPaths: ['ft900_interrupt.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'MEMCTL Driver': {
                sourcePaths: ['memctl.c'],
                headerPaths: ['ft900_memctl.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'PWM and PCM Driver': {
                sourcePaths: ['pwm.c', 'pwm_pcm.c'],
                headerPaths: ['ft900_pwm.h', 'ft900_pwm_pcm.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'RTC Driver': {
                sourcePaths: ['rtc.c'],
                headerPaths: ['ft900_rtc.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'SDHost Driver': {
                sourcePaths: ['sdhost.c'],
                headerPaths: ['ft900_sdhost.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'SPI Driver': {
                sourcePaths: ['spi.c'],
                headerPaths: ['ft900_spi.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'DFU Driver': {
                sourcePaths: ['usbd_startup_dfu.c', 'usbd_dfu.c'],
                headerPaths: ['ft900_startup_dfu.h', 'ft900_usbd_dfu.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'SYS Driver': {
                sourcePaths: ['sys.c'],
                headerPaths: ['ft900_sys.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'Timers Driver': {
                sourcePaths: ['timers.c'],
                headerPaths: ['ft900_timers.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'UART Driver': {
                sourcePaths: ['uart_simple.c'],
                headerPaths: ['ft900_uart_simple.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'USB Device Driver': {
                sourcePaths: ['usbd.c', 'usbdx.c', 'usbd_hbw.c'],
                headerPaths: ['ft900_usbd.h', 'ft900_usbdx.h', 'ft900_usbd_hbw.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'USB Host Driver': {
                sourcePaths: ['usbh.c', 'usbhx.c'],
                headerPaths: ['ft900_usbh.h', 'ft900_usbhx.h', 'private/ft900_usbh_internal.h'],
                supportedChipsets: ['FT90x']
            },
            'Watchdog Driver': {
                sourcePaths: ['wdt.c'],
                headerPaths: ['ft900_wdt.h'],
                supportedChipsets: ['FT90x', 'FT93x']
            }
        };
    private workspaceFolder: string;
    private cmakeManager: CMakeManager;

    constructor(workspacePath?: string) {
        if (workspacePath) {
            this.workspaceFolder = workspacePath;
        } else {
            this.workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        }
        this.cfgManager = ConfigurationManager.getInstance(this.workspaceFolder);
        this.cmakeManager = CMakeManager.getInstance(this.workspaceFolder);
        this.cmakeManager.saveHwLibsConfig(this.cfgManager.getNumberOfHardwareLibs() > 0 ? true : false);
    }

    public isHwListSupportChipset(hardwareLibList: string[], chipset: string) : boolean {
        for (const lib of hardwareLibList) {
            if (!HardwareLibraryManager.hardwareLibsTable[lib].supportedChipsets.includes(chipset)) {
                return false;
            }
        }
        return true;
    }

    public setWorkspaceFolder(workspacePath: string) {
        this.workspaceFolder = workspacePath;
    }

    public addHwLibToProject(hwLibName: string) {
        if (false === this.copyHwLibToWorkspace(hwLibName)) {
            return;
        }
        this.cfgManager.addHardwareLib(hwLibName);
        const updateCMakeHwLib = this.cfgManager.getNumberOfHardwareLibs() > 0 ? true : false;
        this.cmakeManager.saveHwLibsConfig(updateCMakeHwLib);
    }

    private copyHwLibToWorkspace(hwLibName: string): boolean {
        const hwLibInfo = HardwareLibraryManager.hardwareLibsTable[hwLibName];
        if (!hwLibInfo) {
            vscode.window.showErrorMessage(`Hardware library ${hwLibName} not found.`);
            return false;
        }

        const sdkPath = this.cfgManager.getSDKPath();
        if (!sdkPath) {
            vscode.window.showErrorMessage('SDK path not found.');
            return false;
        }

        const hwLibSrcPath = path.join(sdkPath, 'hardware', 'src');
        const hwLibDstPath = path.join(this.workspaceFolder, 'hw', 'src');
        hwLibInfo.sourcePaths.forEach(file => {
            this.copyFileSync(path.join(hwLibSrcPath, file), path.join(hwLibDstPath, file));
        });

        const hwLibSrcIncludePath = path.join(sdkPath, 'hardware', 'include');
        const hwLibDstIncludePath = path.join(this.workspaceFolder, 'hw', 'include');
        hwLibInfo.headerPaths.forEach(file => {
            this.copyFileSync(path.join(hwLibSrcIncludePath, file), path.join(hwLibDstIncludePath, file));
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
