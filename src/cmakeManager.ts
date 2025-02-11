import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export enum d2xxLibsType {
    none = '',
    d2xx = 'd2xx_dev',
    d2xx_rtos = 'd2xx_dev_rtos'
}

export class CMakeManager {
    private static instance: CMakeManager;
    private workspaceFolder: string;
    private cmakeTemplatePath: string;
    private _3rdLibraryInfo: {
        sourcePaths: string[];
        excludePaths: string[];
        destinationPaths: string[];
        includePaths: string[];
        definitions: string[];
    } | undefined;
    private containHwLibs: boolean = false;
    private containUsbLibs: boolean = false;
    private containDriverLibs: boolean = false;
    private containD2xxLibs: d2xxLibsType = d2xxLibsType.none;
    private customDefinitions: string[] = [];
    private customLinkerFlags: string[] = [];

    private constructor(workspaceFolder: string) {
        this.workspaceFolder = workspaceFolder;
        this.cmakeTemplatePath = path.join(this.getExtensionPath(), 'src', 'CMakeListsTemplate.cmake');
    }

    public static getInstance(workspaceFolder: string): CMakeManager {
        if (!CMakeManager.instance) {
            CMakeManager.instance = new CMakeManager(workspaceFolder);
        }
        return CMakeManager.instance;
    }

    public setWorkspaceFolder(workspaceFolder: string) {
        this.workspaceFolder = workspaceFolder;
    }

    private getExtensionPath(): string {
        return vscode.extensions.getExtension('Bridgetek.bridgetek-ft9xx')?.extensionPath || '';
    }

    public generateDefault(projectPath: string) {
        const cmakeListsPath = path.join(projectPath, 'CMakeLists.txt');
        if (fs.existsSync(cmakeListsPath)) {
            return;
        }

        const cmakeTemplate = fs.readFileSync(this.cmakeTemplatePath, 'utf8');
        fs.writeFileSync(cmakeListsPath, cmakeTemplate, 'utf8');
        vscode.window.showInformationMessage('CMakeLists.txt generated successfully.');
    }

    public save3rdLibsInfo(libraryInfo: {
        sourcePaths: string[],
        excludePaths: string[],
        destinationPaths: string[],
        includePaths: string[],
        definitions: string[]
    }) {
        this._3rdLibraryInfo = libraryInfo;
        this.regenerateCMakefiles();
    }

    private regenerateCMakefiles() {
        const sourcesString = this.genSourcesPart();
        const includesString = this.genIncludesPart();
        const definitionsString = this.genDefinitionsPart();
        const preBuildLibsString = this.genPreBuildLibsPart();
        const customDefinitionsString = this.genCustomDefinitionsPart();
        const customLinkerFlagsString = this.genCustomLinkerFlagsPart();

        const cmakeListsPath = path.join(this.workspaceFolder, 'CMakeLists.txt');
        if (fs.existsSync(cmakeListsPath)) {
            let cmakeContent = fs.readFileSync(cmakeListsPath, 'utf8');

            // Generate sources
            cmakeContent = cmakeContent.replace(
                /# GENERATED: SOURCES - DO NOT MODIFY - BEGIN[\s\S]*?# GENERATED: SOURCES - DO NOT MODIFY - END/,
                `${sourcesString}`
            );

            // Generate pre-build libs
            cmakeContent = cmakeContent.replace(
                /# GENERATED: PRE-COMPILE LIBS FT90X - DO NOT MODIFY - BEGIN[\s\S]*?# GENERATED: PRE-COMPILE LIBS FT93X - DO NOT MODIFY - END/,
                `${preBuildLibsString}`,
            );

            // Generate include paths
            cmakeContent = cmakeContent.replace(
                /# GENERATED: INCLUDES - DO NOT MODIFY - BEGIN[\s\S]*?# GENERATED: INCLUDES - DO NOT MODIFY - END/,
                `${includesString}`
            );

            // Generate definitions
            cmakeContent = cmakeContent.replace(
                /# GENERATED: DEFINITIONS - DO NOT MODIFY - BEGIN[\s\S]*?# GENERATED: DEFINITIONS - DO NOT MODIFY - END/,
                `${definitionsString}`
            );

            // Generate custom definitions
            cmakeContent = cmakeContent.replace(
                /# GENERATED: CUSTOM DEFINITIONS - DO NOT MODIFY - BEGIN[\s\S]*?# GENERATED: CUSTOM DEFINITIONS - DO NOT MODIFY - END/,
                `${customDefinitionsString}`
            );

            // Generate custom linker flags
            cmakeContent = cmakeContent.replace(
                /# GENERATED: CUSTOM LINKER FLAGS - DO NOT MODIFY - BEGIN[\s\S]*?# GENERATED: CUSTOM LINKER FLAGS - DO NOT MODIFY - END/,
                `${customLinkerFlagsString}`
            );

            fs.writeFileSync(cmakeListsPath, cmakeContent, 'utf8');
        }
    }

    private genCustomDefinitionsPart(): string {
        let result = '# GENERATED: CUSTOM DEFINITIONS - DO NOT MODIFY - BEGIN\n';
        if (this.customDefinitions.length) {
            result += `    ` + this.customDefinitions.join('\n    ') + '\n';
        }
        result += '    # GENERATED: CUSTOM DEFINITIONS - DO NOT MODIFY - END';
        return result;
    }

    private genCustomLinkerFlagsPart(): string {
        let result = '# GENERATED: CUSTOM LINKER FLAGS - DO NOT MODIFY - BEGIN\n';
        if (this.customLinkerFlags.length) {
            result += `    ` + this.customLinkerFlags.join('\n    ') + '\n';
        }
        result += '    # GENERATED: CUSTOM LINKER FLAGS - DO NOT MODIFY - END';
        return result;
    }

    private genSourcesPart(): string {
        let result = '# GENERATED: SOURCES - DO NOT MODIFY - BEGIN\n';

        if (this.containHwLibs) {
            result += '    # Hardware libraries sources\n';
            result += '    hw/src/*.c\n';
        }

        if (this.containUsbLibs) {
            result += '    # USB libraries sources\n';
            result += '    usb/src/*.c\n';
        }

        if (this.containDriverLibs) {
            result += '    # Driver libraries sources\n';
            result += '    drivers/*.c\n';
        }

        if (this._3rdLibraryInfo?.sourcePaths.length) {
            result += '    # 3rd party libraries sources\n';
            result += '    ' + this._3rdLibraryInfo.sourcePaths.join('\n    ') + '\n';
        }

        result += '    # GENERATED: SOURCES - DO NOT MODIFY - END';
        return result;
    }

    private genIncludesPart(): string {
        let result = '# GENERATED: INCLUDES - DO NOT MODIFY - BEGIN\n';

        if (this.containHwLibs) {
            result += '    # Hardware libraries sources\n';
            result += '    hw/include\n';
        }

        if (this.containUsbLibs) {
            result += '    # USB libraries sources\n';
            result += '    usb/include\n';
        }

        if (this.containDriverLibs) {
            result += '    # Driver libraries sources\n';
            result += '    drivers\n';
        }

        if (this._3rdLibraryInfo?.sourcePaths.length) {
            result += '    # 3rd party libraries sources\n';
            result += '    ' + this._3rdLibraryInfo.includePaths.join('\n    ') + '\n';
        }

        result += '    # GENERATED: INCLUDES - DO NOT MODIFY - END';
        return result;
    }

    private genDefinitionsPart(): string {
        let result = '# GENERATED: DEFINITIONS - DO NOT MODIFY - BEGIN\n';

        if (this._3rdLibraryInfo?.definitions.length) {
            result += '    # 3rd party libraries sources\n';
            result += '    ' + this._3rdLibraryInfo.definitions.join('\n    ') + '\n';
        }

        result += '    # GENERATED: DEFINITIONS - DO NOT MODIFY - END';
        return result;
    }

    private genPreBuildLibsPart(): string {
        let result = '# GENERATED: PRE-COMPILE LIBS FT90X - DO NOT MODIFY - BEGIN\n';

        if (this.containD2xxLibs !== d2xxLibsType.none) {
            const postFix = this.containD2xxLibs === d2xxLibsType.d2xx ? 'dev' : 'dev_rtos';
            result += `        ft900_d2xx_${postFix}\n`;
            result += `        # GENERATED: PRE-COMPILE LIBS FT90X - DO NOT MODIFY - END\n`;
            result += `    )\n`;
            result += `else (\${TARGET} MATCHES ft93x)\n`;
            result += `    set(LIB_FILES\n`;
            result += `        # GENERATED: PRE-COMPILE LIBS FT93X - DO NOT MODIFY - BEGIN\n`;
            result += `        ft930_d2xx_${postFix}\n`;
        }
        else
        {
            result += `        # GENERATED: PRE-COMPILE LIBS FT90X - DO NOT MODIFY - END\n`;
            result += `    )\n`;
            result += `else (\${TARGET} MATCHES ft93x)\n`;
            result += `    set(LIB_FILES\n`;
            result += `        # GENERATED: PRE-COMPILE LIBS FT93X - DO NOT MODIFY - BEGIN\n`;
        }

        result += '        # GENERATED: PRE-COMPILE LIBS FT93X - DO NOT MODIFY - END';
        return result;
    }

    public saveHwLibsConfig(containHwLibs: boolean) {
        this.containHwLibs = containHwLibs;
        this.regenerateCMakefiles();
    }

    public saveUsbLibsConfig(containUsbLibs: boolean) {
        this.containUsbLibs = containUsbLibs;
        this.regenerateCMakefiles();
    }

    public saveDriverLibsConfig(containDriverLibs: boolean) {
        this.containDriverLibs = containDriverLibs;
        this.regenerateCMakefiles();
    }

    public saveContainD2xxLibsConfig(containD2xxLibs: d2xxLibsType) {
        this.containD2xxLibs = containD2xxLibs;
        this.regenerateCMakefiles();
    }

    public saveCustomDefinitions(definitions: string[]) {
        this.customDefinitions = definitions;
        this.regenerateCMakefiles();
    }

    public saveCustomLinkerFlags(linkerFlags: string[]) {
        this.customLinkerFlags = linkerFlags;
        this.regenerateCMakefiles();
    }
}
