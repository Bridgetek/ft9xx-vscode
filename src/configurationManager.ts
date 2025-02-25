import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { CMakeManager } from './cmakeManager';
import { ThirdPartyLibraryManager } from './ThirdPartyLibraryManager';
import { HardwareLibraryManager } from './HardwareLibManager';
import { LayeredDriverManager } from './LayeredDriverManager';
import { ProjectConfig } from './ProjectManager';
import { d2xxManager } from './D2xxManager';

export class ConfigurationManager {
    private static instance: ConfigurationManager;
    private settings: any;
    private vscodeFolderPath: string;
    private cppPropertiesContent: any;
    private workspaceFolder: string;

    private constructor(workspaceFolder: string) {
        this.workspaceFolder = workspaceFolder;
        this.loadSettings();
        this.cppPropertiesContent = this.loadCppPropertiesJson();
        this.vscodeFolderPath = this.getSettingsJsonPath();
    }

    public isProjectSupportChipset(chipset: string): boolean {
        const hardwareLibManager = new HardwareLibraryManager();
        const thirdPartyLibManager = new ThirdPartyLibraryManager();
        const layeredDriverManager = new LayeredDriverManager();

        if (!hardwareLibManager.isHwListSupportChipset(this.getSetting('ft9xx.hardwareLibs'), chipset) ||
            !thirdPartyLibManager.is3rdLibSupportChipset(this.getSetting('ft9xx.thirdPartyLibs'), chipset) ||
            !layeredDriverManager.isLayeredDriverSupportChipset(this.getSetting('ft9xx.layeredDrivers'), chipset)) {
            return false;
        } else {
            return true;
        }
    }

    public createDefaultSettingsJson(
        vscodeFolderPath: string,
        projectPath: string,
        isSubWorkspace: boolean) {
        const settingsJsonPath = path.join(vscodeFolderPath, 'settings.json');
        try {
            if (!fs.existsSync(settingsJsonPath)) {
                let defaultProjectName = path.basename(projectPath);
                defaultProjectName = defaultProjectName.replace(/\s/g, '_');
                const settingsJsonContent = {
                    "ft9xx.projectName": defaultProjectName,
                    "ft9xx.baudrate": "921600",
                    "ft9xx.buildMode": "Debug",
                    "ft9xx.chipset": "FT90x",
                    "ft9xx.subWorkspace": isSubWorkspace,
                    "ft9xx.comPort": "",
                    "ft9xx.thirdPartyLibs": [],
                    "ft9xx.hardwareLibs": [],
                    "ft9xx.layeredDrivers": [],
                    "ft9xx.d2xxType": "",
                    "ft9xx.customDefinedFlags": [],
                    "ft9xx.customLinkerFlags": []
                };
                fs.writeFileSync(settingsJsonPath, JSON.stringify(settingsJsonContent, null, 4));
            }
        } catch (error) {
            const errorMessage = (error as Error).message;
            vscode.window.showErrorMessage(`Failed to create settings.json: ${errorMessage}`);
        }
    }

    public static getInstance(workspaceFolder: string): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager(workspaceFolder);
        }
        return ConfigurationManager.instance;
    }

    public setWorkspaceFolder(workspaceFolder: string) {
        this.workspaceFolder = workspaceFolder;
        this.loadSettings();
    }

    public add3rdLibraryToProject(libraryName: string) {
        const thirdPartyLibManager = new ThirdPartyLibraryManager();
        thirdPartyLibManager.add3rdLibrariesToProject(libraryName);
    }

    public addHardwareLibraryToProject(libraryName: string) {
        const hardwareLibManager = new HardwareLibraryManager();
        hardwareLibManager.addHwLibToProject(libraryName);
    }

    public addLayeredDriverToProject(driverName: string) {
        const layeredDriverManager = new LayeredDriverManager();
        layeredDriverManager.addLayeredDriverToProject(driverName);
    }

    private loadSettings() {
        const settingsJsonPath = this.getSettingsJsonPath();
        if (fs.existsSync(settingsJsonPath)) {
            this.settings = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf8'));
        }
    }

    private getSettingsJsonPath(): string {
        const workspaceFolder = this.workspaceFolder;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Config: No workspace folder found.');
            throw new Error('No workspace folder found.');
        }
        this.vscodeFolderPath = path.join(workspaceFolder, '.vscode');
        if (!fs.existsSync(this.vscodeFolderPath)) {
            fs.mkdirSync(this.vscodeFolderPath);
        }
        return path.join(this.vscodeFolderPath, 'settings.json');
    }

    public getSetting(key: string): any {
        this.loadSettings();
        return this.settings[key];
    }

    public setSetting(key: string, value: any) {
        this.settings[key] = value;
        this.saveSettings();
    }

    private saveSettings() {
        const settingsJsonPath = this.getSettingsJsonPath();
        fs.writeFileSync(settingsJsonPath, JSON.stringify(this.settings, null, 4));
    }

    public addHardwareLib(hwLibName: string) {
        const hwLibs = this.getSetting('ft9xx.hardwareLibs');
        if (hwLibs.includes(hwLibName)) {
            return;
        }

        if (!hwLibs.includes(hwLibName)) {
            hwLibs.push(hwLibName);
            this.setSetting('ft9xx.hardwareLibs', hwLibs);
            this.saveSettings();
        }
    }

    public addLayeredDriver(layeredDriverName: string) {
        const layeredDrivers = this.getSetting('ft9xx.layeredDrivers');
        if (layeredDrivers.includes(layeredDriverName)) {
            return;
        }

        if (!layeredDrivers.includes(layeredDriverName)) {
            layeredDrivers.push(layeredDriverName);
            this.setSetting('ft9xx.layeredDrivers', layeredDrivers);
            this.saveSettings();
        }
    }

    public getNumberOfLayeredDrivers(): number {
        return this.getSetting('ft9xx.layeredDrivers').length;
    }

    public getNumberOfHardwareLibs(): number {
        return this.getSetting('ft9xx.hardwareLibs').length;
    }

    public getSDKPath(): string {
        const config = vscode.workspace.getConfiguration().get('ft9xx', vscode.ConfigurationTarget.Global);
        return (config as any)['sdkPath'] || '';
    }

    public getToolchainPath(): string {
        const config = vscode.workspace.getConfiguration().get('ft9xx', vscode.ConfigurationTarget.Global);
        return (config as any)['toolchainPath'] || '';
    }

    public getBuildTool(): string {
        const config = vscode.workspace.getConfiguration().get('ft9xx', vscode.ConfigurationTarget.Global);
        return (config as any)['buildTool'] || '';
    }

    public generateDefaultCCppPropertiesJson(vscodeFolderPath: string) {
        const cCppPropertiesPath = path.join(vscodeFolderPath, 'c_cpp_properties.json');
        if (!fs.existsSync(cCppPropertiesPath)) {
            const cCppPropertiesContent = {
                configurations: [
                    {
                        name: 'Win32',
                        includePath: [
                            '${FT9XX_TOOLCHAIN}/hardware/include/**',
                            '${FT9XX_TOOLCHAIN}/hardware/include/private/**',
                            '${FT9XX_TOOLCHAIN}/hardware/include/registers/**',
                            '${workspaceFolder}/**'
                        ],
                        defines: [
                            '_DEBUG',
                            'UNICODE',
                            '_UNICODE',
                            '__CDT_PARSER__',
                            '__FT900__'
                        ],
                        compilerPath: '${env:FT9XX_TOOLCHAIN}\\tools\\bin\\ft32-elf-gcc.exe',
                        cStandard: 'c99',
                        cppStandard: 'c++17',
                        intelliSenseMode: 'gcc-x86'
                    }
                ],
                version: 4
            };
            fs.writeFileSync(cCppPropertiesPath, JSON.stringify(cCppPropertiesContent, null, 4));
        }
    }

    private loadCppPropertiesJson(): any {
        const cCppPropertiesPath = path.join(this.vscodeFolderPath, 'c_cpp_properties.json');
        if (fs.existsSync(cCppPropertiesPath)) {
            return JSON.parse(fs.readFileSync(cCppPropertiesPath, 'utf8'));
        }
        return null;
    }

    public updateCppPropertiesJson_DefinesSection(defineType: string, defineValue: string) {
        switch (defineType) {
            case 'Chipset':
                const defines = this.cppPropertiesContent.configurations[0].defines;
                const chipsetDefineIndex = defines.findIndex((define: string) => define.startsWith('__FT9'));
                if (chipsetDefineIndex !== -1) {
                    if (defines[chipsetDefineIndex] !== defineValue) {
                        defines[chipsetDefineIndex] = defineValue;
                    }
                } else {
                    defines.push(defineValue);
                }
                this.saveCppPropertiesJson(this.vscodeFolderPath, this.cppPropertiesContent);
                break;

            case 'BuildMode':
                break;
        }
    }

    public saveCppPropertiesJson(vscodeFolderPath: string, cppPropertiesContent: any) {
        const cCppPropertiesPath = path.join(vscodeFolderPath, 'c_cpp_properties.json');
        fs.writeFileSync(cCppPropertiesPath, JSON.stringify(cppPropertiesContent, null, 4));
    }

    public updateSettingsJson(libraryName: string) {
        const settingsJsonPath = path.join(this.vscodeFolderPath, 'settings.json');
        let settingsJson: { 'ft9xx.thirdPartyLibs'?: string[], 'ft9xx.sdkPath'?: string } = {};
        if (fs.existsSync(settingsJsonPath)) {
            settingsJson = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf8'));
        }

        let existingLibraries: string[] = settingsJson['ft9xx.thirdPartyLibs'] || [];
        if (existingLibraries.includes(libraryName)) {
            return;
        }

        existingLibraries.push(libraryName);
        const updatedLibraries = Array.from(new Set(existingLibraries));
        settingsJson['ft9xx.thirdPartyLibs'] = updatedLibraries;

        fs.writeFileSync(settingsJsonPath, JSON.stringify(settingsJson, null, 4));
    }

    private createVscodeConfig(projectPath: string, isSubWorkspace: boolean) {
        const vscodeFolderPath = path.join(projectPath, '.vscode');
        try {
            if (!fs.existsSync(vscodeFolderPath)) {
                fs.mkdirSync(vscodeFolderPath);
            }

            this.createDefaultSettingsJson( vscodeFolderPath, projectPath, isSubWorkspace);
            this.createLaunchJson(vscodeFolderPath, projectPath);
            this.generateDefaultCCppPropertiesJson(vscodeFolderPath);
            this.generateTasksJson(projectPath, this.getSetting('ft9xx.buildTool'), this.getSetting('ft9xx.projectName'));
            this.generateGitIgnore(vscodeFolderPath);
            const cmakeManager = CMakeManager.getInstance(projectPath);
            cmakeManager.generateDefault(projectPath);
        } catch (error) {
            const errorMessage = (error as Error).message;
            vscode.window.showErrorMessage(`Failed to create VS Code configuration: ${errorMessage}`);
        }
    }

    private createLaunchJson(vscodeFolderPath: string, projectPath: string) {
        const launchJsonPath = path.join(vscodeFolderPath, 'launch.json');

        let projectName = path.basename(projectPath);
        projectName = projectName.replace(/\s/g, '_');

        if (!fs.existsSync(launchJsonPath)) {
            const configurations = ['FT90x', 'FT93x'].map(chipset => ({
                name: `Debug ${chipset} Application`,
                type: 'cppdbg',
                request: 'launch',
                program: `\${workspaceFolder}/${chipset}_Debug/${projectName}.elf`,
                args: [],
                preLaunchTask: `Programming ${chipset} debug image`,
                stopAtEntry: false,
                cwd: '${workspaceFolder}',
                environment: [
                    {
                        name: 'Path',
                        value: '${env:Path};${env:FT9XX_TOOLCHAIN}/tools/bin'
                    }
                ],
                externalConsole: false,
                MIMode: 'gdb',
                miDebuggerPath: "ft32-elf-gdb.exe",
                miDebuggerServerAddress: "localhost:3333",
                debugServerPath: "FT9xxProg.exe",
                debugServerArgs: `--gdb --quiet`,
                setupCommands: [
                    {
                        description: 'Enable pretty-printing for gdb',
                        text: '-enable-pretty-printing',
                        ignoreFailures: true
                    },
                    {
                        description: "Set remote timeout in case the programming task takes a long time",
                        text: "set remotetimeout 20",
                        ignoreFailures: true
                    },
                    {
                        description: 'Set a breakpoint at main',
                        text: 'break main',
                        ignoreFailures: false
                    }
                ],
                logging: {
                    moduleLoad: true
                }
            }));

            const launchJsonContent = {
                version: '0.2.0',
                configurations
            };

            fs.writeFileSync(launchJsonPath, JSON.stringify(launchJsonContent, null, 4));
        }
    }

    private generateTasksJson(projectPath: string, buildTool: string = 'Ninja', ProjectName: string) {
        const vscodeFolderPath = path.join(projectPath, '.vscode');
        if (!fs.existsSync(vscodeFolderPath)) {
            fs.mkdirSync(vscodeFolderPath);
        }

        let projectName = ProjectName;
        projectName = projectName.replace(/\s/g, '_');

        const tasksJsonPath = path.join(vscodeFolderPath, 'tasks.json');
        const chipsets = ['FT90x', 'FT93x'];
        const buildModes = ['Debug', 'Release'];

        const tasks = [];

        tasks.push({
            label: "Show Binary Analysis",
            command: "${command:bridgetek-ft9xx.showBinarySizeChart}",
            problemMatcher: []
        });

        tasks.push({
            label: "Clean the FT9xx Flash",
            type: "shell",
            command: "FT9xxProg.exe",
            args: ["--restore"],
            problemMatcher: []
        });

        chipsets.forEach(chipset => {
            buildModes.forEach(mode => {
                tasks.push({
                    label: `CMake config project ${chipset} ${mode.toLowerCase()}`,
                    type: 'cppbuild',
                    command: 'cmake',
                    args: [
                        "-G",
                        `\"${buildTool}\"`,
                        "-S",
                        ".",
                        "-B",
                        "build",
                        `-DBUILD=${mode}`,
                        `-DTARGET=${chipset.toLowerCase()}`
                    ],
                    group: {
                        kind: 'build',
                        isDefault: true
                    },
                    problemMatcher: [
                        {
                            owner: "cmake",
                            fileLocation: ["relative", "${workspaceFolder}"],
                            pattern: {
                                "regexp": "^(.+):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
                                "file": 1,
                                "line": 2,
                                "column": 3,
                                "severity": 4,
                                "message": 5
                            }
                        }
                    ]
                });

                tasks.push({
                    label: `CMake create the ${chipset} ${mode.toLowerCase()} image`,
                    type: 'shell',
                    dependsOn: [
                        `CMake config project ${chipset} ${mode.toLowerCase()}`,
                        "CMake build project",
                        "Show Binary Analysis"
                    ],
                    dependsOrder: "sequence",
                    group: {
                        kind: 'build',
                        isDefault: true
                    },
                    problemMatcher: []
                });

                tasks.push({
                    label: `Programming ${chipset} ${mode.toLowerCase()} image`,
                    type: 'shell',
                    dependsOn: [
                        `CMake config project ${chipset} ${mode.toLowerCase()}`,
                        "CMake build project"
                    ],
                    dependsOrder: "sequence",
                    command: "FT9xxProg.exe",
                    args: [
                        "--loadflash",
                        `\"\${workspaceRoot}\\${chipset}_${mode}\\${projectName}.bin\"`,
                        "--onewire",
                        "--device",
                        chipset === 'FT90x' ? "0" : "1",
                        "--quiet"
                    ],
                    group: {
                        kind: "none",
                        isDefault: true
                    },
                    problemMatcher: [
                        {
                            owner: "${defaultBuildTask}",
                            fileLocation: ["relative", "${workspaceFolder}"],
                            pattern: {
                                regexp: "^(.+):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
                                file: 1,
                                line: 2,
                                column: 3,
                                severity: 4,
                                message: 5
                            }
                        }
                    ]
                });
            });
        });

        tasks.push({
            label: 'CMake build project',
            type: 'cppbuild',
            command: 'cmake',
            args: [
                "--build",
                "build"
            ],
            group: {
                kind: 'build',
                isDefault: true
            },
            problemMatcher: [
                {
                    owner: "cmake",
                    fileLocation: ["relative", "${workspaceFolder}"],
                    pattern: {
                        "regexp": "^(.+):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
                        "file": 1,
                        "line": 2,
                        "column": 3,
                        "severity": 4,
                        "message": 5
                    }
                }
            ]
        });

        const tasksJsonContent = {
            version: '2.0.0',
            tasks
        };

        fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJsonContent, null, 4));

    }

    private generateGitIgnore(vscodeFolderPath: string) {
        const gitIgnorePath = path.join(vscodeFolderPath, '..', '.gitignore');
        const gitIgnoreContent = [
            '# Ignore default build directories',
            'FT90x_Debug/',
            'FT90x_Release/',
            'FT93x_Debug/',
            'FT93x_Release/',
            '# Ignore default CMake build directory',
            'build',
            '# Add your own patterns here',
            ''
        ];

        try {
            fs.writeFileSync(gitIgnorePath, gitIgnoreContent.join('\n'));
        } catch (error) {
            const errorMessage = (error as Error).message;
            vscode.window.showErrorMessage(`Failed to create .gitignore: ${errorMessage}`);
        }
    }

    public generateConfigs(projectPath: string, projectCfg: ProjectConfig, isSubWorkspace: boolean) {
        this.createVscodeConfig(projectPath, isSubWorkspace);

        if (projectCfg) {
            const hardwareLibManager = new HardwareLibraryManager(projectPath);
            const thirdPartyLibManager = new ThirdPartyLibraryManager(projectPath);
            const layeredDriverManager = new LayeredDriverManager(projectPath);
            const d2xxMan = new d2xxManager(projectPath);
            const cmakeManager = CMakeManager.getInstance(projectPath);
            cmakeManager.setWorkspaceFolder(projectPath);

            projectCfg.hardwareLibs.forEach(hwLib => {
                hardwareLibManager.addHwLibToProject(hwLib);
            });
            projectCfg.thirdPartyLibs.forEach(lib => {
                thirdPartyLibManager.add3rdLibrariesToProject(lib);
            });
            projectCfg.layeredDrivers.forEach(driver => {
                layeredDriverManager.addLayeredDriverToProject(driver);
            });
            cmakeManager.saveCustomDefinitions(this.getSetting('ft9xx.customDefinedFlags'));
            cmakeManager.saveCustomLinkerFlags(this.getSetting('ft9xx.customLinkerFlags'));
            d2xxMan.addD2xxLibToProject(projectCfg.prebuildLibs);
        }
    }

    public ensureCmakeFileIsWorking(projectPath: string) {
        try {
            const cmakeManager = CMakeManager.getInstance(projectPath);
            cmakeManager.setWorkspaceFolder(projectPath);
            const hardwareLibManager = new HardwareLibraryManager(projectPath);
            const thirdPartyLibManager = new ThirdPartyLibraryManager(projectPath);
            const layeredDriverManager = new LayeredDriverManager(projectPath);
            const d2xxMan = new d2xxManager(projectPath);

            if (!fs.existsSync(path.join(this.workspaceFolder, 'CMakeLists.txt'))) {
                cmakeManager.generateDefault(projectPath);
            }
            this.getSetting('ft9xx.hardwareLibs').forEach((hwLib: string) => {
                hardwareLibManager.addHwLibToProject(hwLib);
            });
            this.getSetting('ft9xx.thirdPartyLibs').forEach((lib: string) => {
                thirdPartyLibManager.add3rdLibrariesToProject(lib);
            });
            this.getSetting('ft9xx.layeredDrivers').forEach((driver: string) => {
                layeredDriverManager.addLayeredDriverToProject(driver);
            });
            cmakeManager.saveCustomDefinitions(this.getSetting('ft9xx.customDefinedFlags'));
            cmakeManager.saveCustomLinkerFlags(this.getSetting('ft9xx.customLinkerFlags'));
            d2xxMan.addD2xxLibToProject(this.getSetting('ft9xx.d2xxType'));

            const buildTool = this.getBuildTool();
            const projectName = this.getSetting('ft9xx.projectName');
            this.generateTasksJson(projectPath, buildTool, projectName);
        } catch (error) {
            const errorMessage = (error as Error).message;
            vscode.window.showErrorMessage(`Failed to regenerate CMake file: ${errorMessage}`);
        }
    }
}
