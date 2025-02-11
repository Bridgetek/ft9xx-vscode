import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ConfigurationManager } from './configurationManager';
import { copyFolderRecursiveSync } from './utils';

export interface ProjectConfig {
    hardwareLibs: string[];
    thirdPartyLibs: string[];
    layeredDrivers: string[];
    prebuildLibs: "d2xx" | "d2xx_rtos" | "";
    supportedChipsets: string[];
}

export interface ExternalProjectConfig {
    ProjectName: string;
    HwLibs: string[];
    ThirdPartyLibs: string[];
    LayeredLibs: string[];
    CustomDefineFlags: string[];
    CustomLinkerFlags: string[];
}

export class ProjectManager {
    private static instance: ProjectManager | null = null;
    private workspaceFolder: string;
    private configManager: ConfigurationManager;
    private extensionPath: string;
    private isSubWorkspace: boolean = false;

    private static exampleProjectCfgList: { [projectName: string]: ProjectConfig } = {
        'ADC Example 1': {
            hardwareLibs: ['ADC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'ADC Example 2': {
            hardwareLibs: ['ADC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'ADC Example 3': {
            hardwareLibs: ['ADC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'ADC Example 4': {
            hardwareLibs: ['ADC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'ADC Example 5': {
            hardwareLibs: ['ADC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'BCD Example 1': {
            hardwareLibs: ['ADC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'Camera Example 1': {
            hardwareLibs: ['CAM Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'CAN Example 1': {
            hardwareLibs: ['CAN Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'CAN Example 2': {
            hardwareLibs: ['CAN Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'CAN Example 3': {
            hardwareLibs: ['CAN Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'D2XX Example 1': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: 'd2xx',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'D2XX Example UART Bridge': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: 'd2xx',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'DAC Example 1': {
            hardwareLibs: ['DAC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'DAC Example 2': {
            hardwareLibs: ['DAC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'DAC Example 3': {
            hardwareLibs: ['DAC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'Ethernet Example 1': {
            hardwareLibs: ['DAC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'FreeRTOS D2XX Example': {
            hardwareLibs: [],
            thirdPartyLibs: ['FreeRTOS'],
            layeredDrivers: [],
            prebuildLibs: 'd2xx_rtos',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'FreeRTOS Example 1': {
            hardwareLibs: [],
            thirdPartyLibs: ['FreeRTOS'],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'FreeRTOS Example 2': {
            hardwareLibs: [],
            thirdPartyLibs: ['FreeRTOS'],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'FreeRTOS Example 3': {
            hardwareLibs: [],
            thirdPartyLibs: ['FreeRTOS'],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'FreeRTOS Example 4': {
            hardwareLibs: [],
            thirdPartyLibs: ['FreeRTOS'],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'FreeRTOS lwIP Example': {
            hardwareLibs: [],
            thirdPartyLibs: ['FreeRTOS', 'lwIP'],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'GPIO DFU Example': {
            hardwareLibs: ['GPIO Driver', 'DFU Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'GPIO Example 1': {
            hardwareLibs: ['GPIO Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'GPIO Example 2': {
            hardwareLibs: ['GPIO Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'GPIO Example 3': {
            hardwareLibs: ['GPIO Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'I2C Master Example 1': {
            hardwareLibs: ['I2C Master Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'I2C Master Example 2': {
            hardwareLibs: ['I2C Master Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'I2C Slave Example 3': {
            hardwareLibs: ['I2C Slave Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'I2S Master Example 1': {
            hardwareLibs: ['I2S Master Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'I2S Master Example 2': {
            hardwareLibs: ['I2S Master Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'PWM Example 1': {
            hardwareLibs: ['PWM and PCM Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'PWM Example 2': {
            hardwareLibs: ['PWM and PCM Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'PWM Example 3': {
            hardwareLibs: ['PWM and PCM Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'RTC Example 1': {
            hardwareLibs: ['RTC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'RTC Example 2': {
            hardwareLibs: ['RTC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'RTC External Example 1': {
            hardwareLibs: ['RTC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'RTC External Example 2': {
            hardwareLibs: ['RTC Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'SD Host Example 1': {
            hardwareLibs: ['SDHost Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'SPI Master Example 1': {
            hardwareLibs: ['SPI Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'SPI Master Example 2': {
            hardwareLibs: ['SPI Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'SPI Master Example 3': {
            hardwareLibs: ['SPI Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'SPI Slave Example 1': {
            hardwareLibs: ['SPI Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'Timer Example 1': {
            hardwareLibs: ['Timers Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'Timer Example 2': {
            hardwareLibs: ['Timers Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'Timer Example 3': {
            hardwareLibs: ['Timers Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'UART 9Bit Mode Example': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['UART Driver'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'UART Example 1': {
            hardwareLibs: ['UART Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'UART Example 2': {
            hardwareLibs: ['UART Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'UART Example 3': {
            hardwareLibs: ['UART Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'UART Example 4': {
            hardwareLibs: ['UART Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USBD Example BOMS to SDcard': {
            hardwareLibs: ['SDHost Driver'],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host BOMS'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USBD Example CDCACM': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host CDCACM'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USBD Example Composite': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host HID'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USBD Example HID': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host HID'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USBD Example HID Bridge': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host HID'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'USBH Example BOMS': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host BOMS'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'USBH Example CDCACM': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host CDCACM'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'USBH Example File System': {
            hardwareLibs: [],
            thirdPartyLibs: ['FatFs'],
            layeredDrivers: ['USB Host BOMS'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'USBH Example FT232': {
            hardwareLibs: ['USB Host Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'USBH Example HID': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host HID'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'USBH Example HID to UART': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: ['USB Host HID'],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'USBH Example Hub': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        },
        'Watchdog Example 1': {
            hardwareLibs: ['Watchdog Driver'],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x']
        }
    };

    private static templateProjectCfgList: { [projectName: string]: ProjectConfig } = {
        'BaseProject': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'D2xxProject': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: 'd2xx',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'DlogProject': {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        },
        'FreeRtosProject': {
            hardwareLibs: [],
            thirdPartyLibs: ['FreeRTOS'],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: ['FT90x', 'FT93x']
        }
    };

    private constructor(workspaceFolder: string, extensionPath: string) {
        this.workspaceFolder = workspaceFolder;
        this.extensionPath = extensionPath;
        this.configManager = ConfigurationManager.getInstance(this.workspaceFolder);
    }

    public static getInstance(workspaceFolder: string, extensionPath: string): ProjectManager {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager(workspaceFolder, extensionPath);
        }
        return ProjectManager.instance;
    }

    private isSubWorkspaceProject(): boolean {
        return this.isSubWorkspace;
    }

    public setSubWorkspaceProject(isSubWorkspace: boolean) {
        this.isSubWorkspace = isSubWorkspace;
    }

    public add3rdLibraryToProject(libraryName: string) {
        if (this.isSubWorkspaceProject()) {
            this.configManager.add3rdLibraryToProject(libraryName);
            return;
        } else {
            vscode.window.showErrorMessage('Adding third-party library is not allowed in base workspace.');
        }
    }

    public addHardwareLibraryToProject(libraryName: string) {
        if (this.isSubWorkspaceProject()) {
            this.configManager.addHardwareLibraryToProject(libraryName);
            return;
        } else {
            vscode.window.showErrorMessage('Adding hardware library is not allowed in base workspace.');
        }
    }

    public addLayeredDriverToProject(driverName: string) {
        if (this.isSubWorkspaceProject()) {
            this.configManager.addLayeredDriverToProject(driverName);
            return;
        } else {
            vscode.window.showErrorMessage('Adding layered driver is not allowed in base workspace.');
        }
    }

    public importProjectFromFolder(folderPath: string) {
        if (this.isSubWorkspaceProject()) {
            vscode.window.showErrorMessage('Importing project is not allowed in sub workspace.');
            return;
        }

        const projectName = this.generateProjectName(folderPath);
        const projectPath = path.join(this.workspaceFolder, projectName);

        copyFolderRecursiveSync(folderPath, projectPath);
        const dummy: ProjectConfig = {
            hardwareLibs: [],
            thirdPartyLibs: [],
            layeredDrivers: [],
            prebuildLibs: '',
            supportedChipsets: []
        };
        this.configManager.setWorkspaceFolder(projectPath);
        this.configManager.generateConfigs(projectPath, dummy, true);

        vscode.window.showInformationMessage(`Project imported: ${projectName}`);
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
    }

    public importExampleProject(projectName: string) {
        if (this.isSubWorkspaceProject()) {
            vscode.window.showErrorMessage('Importing example project is not allowed in sub workspace.');
            return;
        }

        try {
            const projectConfig = ProjectManager.exampleProjectCfgList[projectName];
            const cfgExampleFolderPath = path.join(vscode.workspace.getConfiguration().get<string>('ft9xx.sdkPath') || '', 'examples');
            const defaultExampleFolderPath = process.env.FT9XX_SDK || '';
            let srcExampleProjectPath;
            if (cfgExampleFolderPath === '') {
                srcExampleProjectPath = path.join(defaultExampleFolderPath, projectName);
            } else {
                srcExampleProjectPath = path.join(cfgExampleFolderPath, projectName);
            }
            const destPath = path.join(this.workspaceFolder, projectName);
            copyFolderRecursiveSync(srcExampleProjectPath, destPath);
            this.configManager.setWorkspaceFolder(destPath);
            this.configManager.generateConfigs(destPath, projectConfig, true);
            vscode.window.showInformationMessage(`Example project imported: ${projectName} successfully`);
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(destPath), true);
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to import example project: ${projectName}`);
            return;
        }
    }

    public importTemplateProject(projectType: string, projectName: string) {
        if (this.isSubWorkspaceProject()) {
            vscode.window.showErrorMessage('Importing template project is not allowed in sub workspace.');
            return;
        }

        try {
            const projectPath = path.join(this.workspaceFolder, projectName);
            const templatePath = path.join(this.extensionPath, 'src', 'ProjectTemplates', projectType);

            if (!fs.existsSync(templatePath)) {
                vscode.window.showErrorMessage(`Template path does not exist: ${templatePath}`);
                return;
            }

            if (fs.existsSync(projectPath)) {
                vscode.window.showErrorMessage(`Project path already exists: ${projectPath}`);
                return;
            }

            copyFolderRecursiveSync(templatePath, projectPath);
            const projectCfg = ProjectManager.templateProjectCfgList[projectType];
            this.configManager.setWorkspaceFolder(projectPath);
            this.configManager.generateConfigs(projectPath, projectCfg, true);

            vscode.window.showInformationMessage(`Template project imported: ${projectType}`);

            // Open the imported project in a new window
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to import template project: ${projectType}`);
            return;
        }
    }

    private generateProjectName(folderPath: string): string {
        const projectName = path.basename(folderPath);
        return this.checkDuplicateProject(projectName);
    }

    private checkDuplicateProject(projectName: string): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return projectName;
        }

        let newProjectName = projectName;
        let counter = 1;

        while (workspaceFolders.some(folder => {
            const projectPath = path.join(folder.uri.fsPath, newProjectName);
            return fs.existsSync(projectPath);
        })) {
            newProjectName = `${projectName} (${counter})`;
            counter++;
        }

        return newProjectName;
    }

    public getBuildOutputPath(): string {
        const outputFolder = path.join(this.workspaceFolder, this.configManager.getSetting('ft9xx.chipset') +
            "_" + this.configManager.getSetting('ft9xx.buildMode'));

        if (fs.existsSync(outputFolder)) {
            return outputFolder;
        } else {
            return '';
        }
    }

    public getProjectName() {
        return this.configManager.getSetting('ft9xx.projectName');
    }

    public ensureCmakeFileIsWorking() {
        this.configManager.ensureCmakeFileIsWorking(this.workspaceFolder);
    }

    public getProjectConfig() : ExternalProjectConfig {
        const prjConfig : ExternalProjectConfig = {
            ProjectName: this.getProjectName(),
            HwLibs: this.configManager.getSetting('ft9xx.hardwareLibs'),
            ThirdPartyLibs: this.configManager.getSetting('ft9xx.thirdPartyLibs'),
            LayeredLibs: this.configManager.getSetting('ft9xx.layeredDrivers'),
            CustomDefineFlags: this.configManager.getSetting('ft9xx.customDefinedFlags'),
            CustomLinkerFlags: this.configManager.getSetting('ft9xx.customLinkerFlags')
        };
        return prjConfig;
    }

    public setProjectConfig(prjConfig: ExternalProjectConfig) {
        try {
            this.configManager.setSetting('ft9xx.projectName', prjConfig.ProjectName);
            this.configManager.setSetting('ft9xx.hardwareLibs', prjConfig.HwLibs);
            this.configManager.setSetting('ft9xx.thirdPartyLibs', prjConfig.ThirdPartyLibs);
            this.configManager.setSetting('ft9xx.layeredDrivers', prjConfig.LayeredLibs);
            this.configManager.setSetting('ft9xx.customDefinedFlags', prjConfig.CustomDefineFlags);
            this.configManager.setSetting('ft9xx.customLinkerFlags', prjConfig.CustomLinkerFlags);
        } catch (e) {
            vscode.window.showErrorMessage(`Failed to set project configurations`);
            return;
        }
    }
}
