import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { CMakeManager, d2xxLibsType } from './cmakeManager';

export class d2xxManager {
    private cmakeManager : CMakeManager;
    private workspaceFolder: string;

    constructor(projectPath?: string) {
        if (projectPath) {
            this.workspaceFolder = projectPath;
        } else {
            this.workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        }
        this.cmakeManager = CMakeManager.getInstance(this.workspaceFolder);
    }

    public setWorkspaceFolder(workspacePath: string) {
        this.workspaceFolder = workspacePath;
    }

    public addD2xxLibToProject(d2xxLibName: string) {
        const d2xxType = this.identifyD2xxType(d2xxLibName);
        this.cmakeManager.saveContainD2xxLibsConfig(d2xxType);
        this.saveSettingToFile(d2xxLibName);
    }

    private saveSettingToFile(d2xxLibName: string) {
        const settingsPath = path.join(this.workspaceFolder, '.vscode', 'settings.json');
        let settings: { [key: string]: any } = {};
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        settings['ft9xx.d2xxType'] = d2xxLibName;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
    }

    private identifyD2xxType(d2xxTypeString: string): d2xxLibsType {
        let result;
        if (d2xxTypeString === "d2xx") {
            result = d2xxLibsType.d2xx;
        } else if (d2xxTypeString === "d2xx_rtos") {
            result = d2xxLibsType.d2xx_rtos;
        } else {
            result = d2xxLibsType.none;
        }
        return result;
    }
}
