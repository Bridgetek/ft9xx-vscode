import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { CMakeManager } from './cmakeManager';
import { ConfigurationManager } from './configurationManager';

export interface ThirdPartyLibraryInfo {
    sourcePaths: string[];
    excludePaths: string[];
    destinationPaths: string[];
    includePaths: string[];
    definitions: string[];
    supportedChipsets: string[];
};

export class ThirdPartyLibraryManager {
    private workspaceFolder: string;
    private cmakeManager: CMakeManager;
    private configManager: ConfigurationManager;

    constructor(workspacePath?: string) {
        if (workspacePath) {
            this.workspaceFolder = workspacePath;
        } else {
            this.workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        }
        this.cmakeManager = CMakeManager.getInstance(this.workspaceFolder);
        this.configManager = ConfigurationManager.getInstance(this.workspaceFolder);
        this.updateCMakeListsConfig();
    }

    public is3rdLibSupportChipset(ThirdPartyLibList: string[],chipset: string) : boolean {
        for (const lib of ThirdPartyLibList) {
            const libraryInfo = this.lookup3rdLibraryInfo(lib);
            if (!libraryInfo || !libraryInfo.supportedChipsets.includes(chipset)) {
                return false;
            }
        }
        return true;
    }

    public setWorkspaceFolder(workspacePath: string) {
        this.workspaceFolder = workspacePath;
    }

    public add3rdLibrariesToProject(libraryName: string) {
        const workspaceFolder = this.workspaceFolder;
        if (workspaceFolder) {
            const LibraryInfo = this.lookup3rdLibraryInfo(libraryName);
            if (LibraryInfo) {
                this.copy3rdLibraryToWorkspace(libraryName, LibraryInfo);
            } else {
                vscode.window.showErrorMessage(`Library info for ${libraryName} not found.`);
            }
            this.configManager.updateSettingsJson(libraryName);
            this.updateCMakeListsConfig();
            this.updateCppProperties(libraryName);
            vscode.window.showInformationMessage(`Successfully added the library ${libraryName} to the project.`);
        } else {
            vscode.window.showErrorMessage('Failed to add 3rdLib No workspace folder found.');
        }
    }

    private updateCMakeListsConfig() {
        const currentLibraries = this.getCurrentLibrariesList();
        const allLibraryInfo = currentLibraries.map(lib => this.lookup3rdLibraryInfo(lib)).filter(info => info !== undefined);
        const combinedLibraryInfo = {
            sourcePaths: Array.from(new Set(allLibraryInfo.flatMap(info => info.sourcePaths))),
            excludePaths: Array.from(new Set(allLibraryInfo.flatMap(info => info.excludePaths))),
            destinationPaths: Array.from(new Set(allLibraryInfo.flatMap(info => info.destinationPaths))),
            includePaths: Array.from(new Set(allLibraryInfo.flatMap(info => info.includePaths))),
            definitions: Array.from(new Set(allLibraryInfo.flatMap(info => info.definitions)))
        };
        this.cmakeManager.save3rdLibsInfo(combinedLibraryInfo);
    }

    private copy3rdLibraryToWorkspace(libraryName: string, libraryInfo: ThirdPartyLibraryInfo) {
        if (!libraryInfo) {
            vscode.window.showErrorMessage(`Library info for ${libraryName} not found.`);
            return;
        }

        const sdkPath = this.configManager.getSDKPath();
        if (!sdkPath) {
            vscode.window.showErrorMessage('SDK path is not configured.');
            return;
        }

        const srcThirdPartyLibPath = path.join(sdkPath, '3rdparty', libraryName);
        const destThirdPartyPath = path.join(this.workspaceFolder, 'libs', 'thirdPartyLibs', libraryName);

        this.copy3rdFolderRecursiveSync(srcThirdPartyLibPath, destThirdPartyPath, libraryInfo.excludePaths);
    }

    private copy3rdFolderRecursiveSync(source: string, target: string, excludedPaths: string[]) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        const files = fs.readdirSync(source);

        files.forEach(file => {
            const sourcePath = path.join(source, file);
            const targetPath = path.join(target, file);

            // Skip copying the following files/folders
            if (excludedPaths.includes(file)) {
                return;
            }

            if (fs.lstatSync(sourcePath).isDirectory()) {
                this.copy3rdFolderRecursiveSync(sourcePath, targetPath, excludedPaths);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        });
    }

    private updateCppProperties(libraryName: string) {
        const cppPropertiesPath = path.join(this.workspaceFolder, '.vscode', 'c_cpp_properties.json');
        if (fs.existsSync(cppPropertiesPath)) {
            const cppPropertiesContent = JSON.parse(fs.readFileSync(cppPropertiesPath, 'utf8'));
            const libraryInfo = this.lookup3rdLibraryInfo(libraryName);
            if (libraryInfo) {
                cppPropertiesContent.configurations[0].defines.push(...libraryInfo.definitions);
                fs.writeFileSync(cppPropertiesPath, JSON.stringify(cppPropertiesContent, null, 4));
            }
        }
    }

    public getCurrentLibrariesList(): string[] {
        return this.configManager.getSetting('ft9xx.thirdPartyLibs');
    }

    private lookup3rdLibraryInfo(libraryName: string): ThirdPartyLibraryInfo | undefined {
        const libraries: { [key: string]: ThirdPartyLibraryInfo } = {
            'FatFs': {
                sourcePaths: ['libs/thirdPartyLibs/FatFS/*.c', 'libs/thirdPartyLibs/FatFS/option/*.c'],
                excludePaths: [],
                destinationPaths: ['libs/thirdPartyLibs/FatFS'],
                includePaths: ['libs/FatFs'],
                definitions: [],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'FreeRTOS': {
                sourcePaths: [
                    'libs/thirdPartyLibs/FreeRTOS/Source/portable/GCC/FT32/*.c',
                    'libs/thirdPartyLibs/FreeRTOS/Source/portable/GCC/FT32/*.S',
                    'libs/thirdPartyLibs/FreeRTOS/Source/portable/MemMang/*.c',
                    'libs/thirdPartyLibs/FreeRTOS/Source/*.c',
                ],
                excludePaths: [],
                destinationPaths: ['libs/thirdPartyLibs/FreeRTOS'],
                includePaths: [
                    'libs/thirdPartyLibs/FreeRTOS',
                    'libs/thirdPartyLibs/FreeRTOS/Source/include',
                    'libs/thirdPartyLibs/FreeRTOS/Source/portable/GCC/FT32'
                ],
                definitions: ['$<$<COMPILE_LANGUAGE:C>:-DFT32_FREERTOS -DFT32_PORT -DFT32_PORT_HEAP=4>'],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'tinyprintf': {
                sourcePaths: ['libs/thirdPartyLibs/tinyprintf/*c'],
                excludePaths: [],
                destinationPaths: ['libs/thirdPartyLibs/tinyprintf'],
                includePaths: ['libs/thirdPartyLibs/tinyprintf'],
                definitions: [],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'lwIP': {
                sourcePaths: [
                    'libs/thirdPartyLibs/lwIP/src/api/*.c',
                    'libs/thirdPartyLibs/lwIP/src/arch/*.c',
                    'libs/thirdPartyLibs/lwIP/src/core/*.c',
                    'libs/thirdPartyLibs/lwIP/src/core/ipv4/*.c',
                    'libs/thirdPartyLibs/lwIP/src/netif/*.c',
                    'libs/thirdPartyLibs/lwIP/src/netif/ppp/*.c',
                    'libs/thirdPartyLibs/lwIP/src/netif/ppp/polarssl/*.c'
                ],
                excludePaths: [
                    'lwIP/src/apps',
                    'lwIP/src/core/ipv6'
                ],
                destinationPaths: ['libs/thirdPartyLibs/lwIP'],
                includePaths: [
                    'libs/thirdPartyLibs/lwIP',
                    'libs/thirdPartyLibs/lwIP/src/arch',
                    'libs/thirdPartyLibs/lwIP/src/include'
                ],
                definitions: [],
                supportedChipsets: ['FT90x', 'FT93x']
            },
            'mbedtls': {
                sourcePaths: [
                    'libs/thirdPartyLibs/mbedtls/library/*.c',
                    'libs/lwIP/src/core/*.c'
                ],
                excludePaths: [
                    'mbedtls/programs',
                    'mbedtls/scripts',
                    'mbedtls/tests',
                    'mbedtls/visualc',
                    'mbedtls/library/aes.c',
                    'mbedtls/library/certs.c'
                ],
                destinationPaths: ['libs/thirdPartyLibs/lwIP'],
                includePaths: [
                    'libs/thirdPartyLibs/mbedtls',
                    'libs/thirdPartyLibs/mbedtls/include'
                ],
                definitions: ['-DMBEDTLS_CONFIG_FILE=\"mbedtls_config.h\"'],
                supportedChipsets: ['FT90x', 'FT93x']
            }
        };
        return libraries[libraryName];
    }
}
