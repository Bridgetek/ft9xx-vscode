import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectManager } from './ProjectManager';
import { getBinarySize } from './binarySizeChart';
import { ElfParser } from './parseElfFile';

export function registerCommandsList(context: vscode.ExtensionContext, extensionPath: string) {
    const createProjectCommand = vscode.commands.registerCommand('bridgetek-ft9xx.createTemplateProject', async () => {
        const projectType = ['BaseProject', 'D2xxProject', 'DlogProject', 'FreeRtosProject'];
        const selected = await vscode.window.showQuickPick(projectType, {
            placeHolder: 'Select a project template'
        });
        const projectName = await vscode.window.showInputBox({
            placeHolder: 'Write the project name',
        });

        if (selected && projectName) {
            const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
            projectManager.importTemplateProject(selected, projectName);
        }
    });
    context.subscriptions.push(createProjectCommand);

    const showExampleAppsCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showExampleApps', () => {
        const outputPath = path.join(context.extensionPath, 'html', 'ExampleApps.html');

        const panel = vscode.window.createWebviewPanel(
            'exampleApps',
            'FT9xx Example Apps',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));

        let finalHtml = fs.readFileSync(outputPath, 'utf-8');
        finalHtml = finalHtml
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString());

        panel.webview.html = finalHtml;

        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'importExampleProject') {
                const projectName = message.projectName;
                const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, context.extensionPath);
                projectManager.importExampleProject(projectName);
                panel.dispose();
            }
        });
    });
    context.subscriptions.push(showExampleAppsCommand);

    const showWelcomePageCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showWelcomePage', () => {
        const panel = vscode.window.createWebviewPanel(
            'welcomePage',
            'Welcome to BridgeTek Extension',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'resources'))
                ]
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');

        const htmlPath = path.join(context.extensionPath, 'html', 'welcome.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));
        const logoUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'brtlogo.png')));
        const gifUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'BuildProject.gif')));
        const binAnalysisGifUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'BinaryAnalysis.gif')));

        const finalHtml = htmlContent
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString())
            .replace('brtlogo.png', logoUri.toString())
            .replace('BuildProject.gif', gifUri.toString())
            .replace('BinaryAnalysis.gif', binAnalysisGifUri.toString());

        panel.webview.html = finalHtml;
    });
    context.subscriptions.push(showWelcomePageCommand);

    const showConfigPageCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showConfigPage', () => {
        const panel = vscode.window.createWebviewPanel(
            'configPage',
            'Extension Configs',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'resources'))
                ]
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');

        const htmlPath = path.join(context.extensionPath, 'html', 'ExtensionConfig.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));
        const logoUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'brtlogo.png')));

        const finalHtml = htmlContent
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString())
            .replace('brtlogo.png', logoUri.toString());

        panel.webview.html = finalHtml;

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'saveConfig') {
                const config = vscode.workspace.getConfiguration();
                await config.update('ft9xx.sdkPath', message.sdkPath, vscode.ConfigurationTarget.Global);
                await config.update('ft9xx.toolchainPath', message.toolchainPath, vscode.ConfigurationTarget.Global);
                await config.update('ft9xx.buildTool', message.buildTool, vscode.ConfigurationTarget.Global);

                const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
                projectManager.ensureCmakeFileIsWorking();
                vscode.window.showInformationMessage('FT9xx Configuration saved successfully.');
            } else if (message.command === 'requestConfig') {
                const sdkPath = vscode.workspace.getConfiguration('ft9xx', null).get<string>('sdkPath') || 'Unknown';
                const toolchainPath = vscode.workspace.getConfiguration('ft9xx', null).get<string>('toolchainPath') || 'Unknown';
                const buildTool = vscode.workspace.getConfiguration('ft9xx', null).get<string>('buildTool') || 'Unknown';
                panel.webview.postMessage({
                    command: 'loadConfig',
                    toolchainPath: toolchainPath,
                    sdkPath: sdkPath,
                    buildTool: buildTool
                });
            }
        });
    });
    context.subscriptions.push(showConfigPageCommand);

    const startDebugItem = vscode.commands.registerCommand('bridgetek-ft9xx.startDebugging', () => {
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        if (workspaceFolder) {
            const chipset = vscode.workspace.getConfiguration().get<string>('ft9xx.chipset') || 'FT90x';
            let debugConfig;
            if (chipset === 'FT90x') {
                debugConfig = 'Debug FT90x Application';
            }
            else if (chipset === 'FT93x') {
                debugConfig = 'Debug FT93x Application';
            }
            else {
                vscode.window.showErrorMessage('Invalid chipset selected.');
                return;
            }
            vscode.debug.startDebugging(workspaceFolder, debugConfig);
        } else {
            vscode.window.showErrorMessage('Debugging: No workspace folder found.');
        }
    });
    context.subscriptions.push(startDebugItem);

    const showAdd3rdLibraryWebviewCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showAdd3rdLibraryWebview', () => {
        const outputPath = path.join(context.extensionPath, 'html', 'ThirdPartyLibs.html');
        const panel = vscode.window.createWebviewPanel(
            'add3rdLibrary',
            'Add 3rd-party Library to project',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));

        let finalHtml = fs.readFileSync(outputPath, 'utf-8');
        finalHtml = finalHtml
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString());

        panel.webview.html = finalHtml;

        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'add3rdLib') {
                const libName = message.libraryName;
                const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
                projectManager.add3rdLibraryToProject(libName);
                panel.dispose();
            }
        });
    });
    context.subscriptions.push(showAdd3rdLibraryWebviewCommand);

    const importLayeredDriversCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showAddLayeredDriversWebview', () => {
        const panel = vscode.window.createWebviewPanel(
            'addHardwareLibs',
            'Add Layered Drivers to project',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');
        const htmlPath = path.join(context.extensionPath, 'html', 'LayeredLibs.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));

        let finalHtml = htmlContent
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString());

        panel.webview.html = finalHtml;

        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'addLayeredLib') {
                const driverName = message.layeredLibName;
                const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
                projectManager.addLayeredDriverToProject(driverName);
                panel.dispose();
            }
        });
    });
    context.subscriptions.push(importLayeredDriversCommand);

    const importHardwareLibsCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showAddHardwareLibrariesWebview', () => {
        const panel = vscode.window.createWebviewPanel(
            'addHardwareLibs',
            'Add Hardware Libraries to project',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');
        const htmlPath = path.join(context.extensionPath, 'html', 'HardwareLibs.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));

        let finalHtml = htmlContent
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString());

        panel.webview.html = finalHtml;

        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'addHardwareLib') {
                const libName = message.libraryName;
                const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
                projectManager.addHardwareLibraryToProject(libName);
                panel.dispose();
            }
        });
    });
    context.subscriptions.push(importHardwareLibsCommand);

    const showImageSizeChartCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showBinarySizeChart', () => {
        const panel = vscode.window.createWebviewPanel(
            'showImageSizeChart',
            'Binary analysis',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');
        const htmlPath = path.join(context.extensionPath, 'html', 'BinaryAnalysis.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));
        const doughnutUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'doughnut.js')));

        let finalHtml = htmlContent
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString())
            .replace('doughnut.js', doughnutUri.toString());

        panel.webview.html = finalHtml;

        panel.webview.onDidReceiveMessage(message => {
            const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
            const OutputPathNoExt = path.join(projectManager.getBuildOutputPath(), projectManager.getProjectName());
            const elfPath = `${OutputPathNoExt}.elf`;
            const chipsetName = vscode.workspace.getConfiguration().get<string>('ft9xx.chipset') || 'Unknown';

            if (message.command === 'getBinarySize') {
                getBinarySize(elfPath).then(binarySize => {
                    panel.webview.postMessage({ command: 'updateChart', data: binarySize, chipset: chipsetName });
                    console.log(binarySize);
                }).catch(error => {
                    console.error('Error getting binary size:', error);
                });
            }
            else if (message.command === 'getSymbolList') {
                const elfParser = new ElfParser(elfPath);
                elfParser.parse().then(symbolList => {
                    panel.webview.postMessage({ command: 'updateSymbolList', data: symbolList });
                    console.log(symbolList);
                });
            }
            else if (message.command === 'getFreeSpaceAnalysis') {
                // TODO: Implement free space analysis
            }
            else if (message.command === 'getBootloaderAnalysis') {
                // TODO: Implement bootloader analysis
            }
        });
    });
    context.subscriptions.push(showImageSizeChartCommand);

    const buildProjectCommand = vscode.commands.registerCommand('bridgetek-ft9xx.buildProject', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        if (workspaceFolder) {
            const chipset = vscode.workspace.getConfiguration().get<string>('ft9xx.chipset') || 'FT90x';
            const buildMode = vscode.workspace.getConfiguration().get<string>('ft9xx.buildMode') || 'Debug';
            let taskName;

            if (buildMode !== 'Debug' && buildMode !== 'Release') {
                vscode.window.showErrorMessage('Invalid build mode selected.');
                return;
            }

            if (chipset === 'FT90x') {
                taskName = `CMake create the FT90x ${buildMode.toLowerCase()} image`;
            } else if (chipset === 'FT93x') {
                taskName = `CMake create the FT93x ${buildMode.toLowerCase()} image`;
            } else {
                vscode.window.showErrorMessage('Invalid chipset selected.');
                return;
            }

            const tasks = await vscode.tasks.fetchTasks();
            const task = tasks.find(t => t.name === taskName);

            if (task) {
                await vscode.tasks.executeTask(task);
            } else {
                vscode.window.showErrorMessage(`Task '${taskName}' not found. The file tasks.json is corrupted.`);
            }
        } else {
            vscode.window.showErrorMessage('Build: No workspace folder found.');
        }
    });
    context.subscriptions.push(buildProjectCommand);

    const cleanBuildCommand = vscode.commands.registerCommand('bridgetek-ft9xx.cleanBuild', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        if (workspaceFolder) {
            const fsPromises = fs.promises;

            try {
                const foldersToDelete = ['build', 'FT90x_Debug', 'FT90x_Release', 'FT93x_Debug', 'FT93x_Release'];
                for (const folder of foldersToDelete) {
                    const folderPath = path.join(workspaceFolder.uri.fsPath, folder);
                    if (fs.existsSync(folderPath)) {
                        await fsPromises.rm(folderPath, { recursive: true, force: true });
                    }
                }
                vscode.window.showInformationMessage('Clean build directories removed successfully.');
            } catch (error) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(`Error cleaning build directories: ${error.message}`);
                } else {
                    vscode.window.showErrorMessage('Error cleaning build directories: Unknown error');
                }
            }
        } else {
            vscode.window.showErrorMessage('Clean build: No workspace folder found.');
        }
    });
    context.subscriptions.push(cleanBuildCommand);

    const cleanFlashCommand = vscode.commands.registerCommand('bridgetek-ft9xx.cleanFlash', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        if (workspaceFolder) {
            const taskName = 'Clean the FT9xx Flash';

            const tasks = await vscode.tasks.fetchTasks();
            const task = tasks.find(t => t.name === taskName);

            if (task) {
                await vscode.tasks.executeTask(task);
            } else {
                vscode.window.showErrorMessage(`Task '${taskName}' not found. The file tasks.json is corrupted.`);
            }
        } else {
            vscode.window.showErrorMessage('Build: No workspace folder found.');
        }
    });
    context.subscriptions.push(cleanFlashCommand);

    const programmingUartCommand = vscode.commands.registerCommand('bridgetek-ft9xx.programmingUart', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        if (workspaceFolder) {
            try
            {
                const chipset = vscode.workspace.getConfiguration().get<string>('ft9xx.chipset') || 'FT90x';
                const mode = vscode.workspace.getConfiguration().get<string>('ft9xx.buildMode') || 'Debug';
                const comport = vscode.workspace.getConfiguration().get<string>('ft9xx.comPort') || 'COM1';
                const baudrate = vscode.workspace.getConfiguration().get<string>('ft9xx.baudrate') || '921600';
                const projectName = vscode.workspace.getConfiguration().get<string>('ft9xx.projectName') || '';

                const taskDefinition: vscode.TaskDefinition = {
                    type: 'shell',
                    label: `Uart Programming ${chipset} ${mode.toLowerCase()} image`
                };

                const binPath = path.join(workspaceFolder.uri.fsPath, `${chipset}_${mode}`, `${projectName}.bin`);
                if (!fs.existsSync(binPath)) {
                    vscode.window.showErrorMessage(`Binary file not found: ${binPath}`);
                    return;
                }

                const task = new vscode.Task(
                    taskDefinition,
                    workspaceFolder,
                    `Uart Programming ${chipset} ${mode.toLowerCase()} image`,
                    'shell',
                    new vscode.ShellExecution('FT9xxProg.exe', [
                        '--loadflash',
                        `${binPath}`,
                        '-D',
                        chipset === 'FT90x' ? '0' : '1',
                        '--uart',
                        '-s',
                        comport,
                        '-A',
                        baudrate === '921600' ? '921600' : '115200'
                    ]),
                    ['$gcc']
                );

                task.group = vscode.TaskGroup.Build;

                vscode.tasks.executeTask(task);
            } catch (error) {
                vscode.window.showErrorMessage(`Error programming via UART: ${error}`);
            }
        } else {
            vscode.window.showErrorMessage('Programming: No workspace folder found.');
        }
    });
    context.subscriptions.push(programmingUartCommand);

    const projectInspectCommand = vscode.commands.registerCommand('bridgetek-ft9xx.showProjectConfigPage', async () => {
        const panel = vscode.window.createWebviewPanel(
            'projectInspect',
            'Project configs',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'resources'))
                ]
            }
        );
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'Bridgetek-Logo-1.png.svg');

        const htmlPath = path.join(context.extensionPath, 'html', 'ProjectInspect.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css')));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));
        const logoUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'brtlogo.png')));

        const finalHtml = htmlContent
            .replace('styles.css', stylesUri.toString())
            .replace('script.js', scriptUri.toString())
            .replace('brtlogo.png', logoUri.toString());

        panel.webview.html = finalHtml;

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'alert') {
                vscode.window.showErrorMessage(message.text);
            } else if (message.command === 'getProjectConfig') {
                const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
                const projectConfig = projectManager.getProjectConfig();
                panel.webview.postMessage({
                    command: 'loadProjectConfig',
                    projectConfig: projectConfig
                });
            } else if (message.command === 'saveProjectConfig') {
                const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
                projectManager.setProjectConfig(message.projectConfig);
                vscode.window.showInformationMessage('Project configuration saved successfully.');
            } else {
                console.error('Unknown message received:', message);
            }
        });
    });
    context.subscriptions.push(projectInspectCommand);

    const regenerateTasksCommand = vscode.commands.registerCommand('bridgetek-ft9xx.regenerateTasks', async () => {
        const projectManager = ProjectManager.getInstance(vscode.workspace.workspaceFolders![0].uri.fsPath, extensionPath);
        projectManager.ensureCmakeFileIsWorking();
        const buildFolderPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'build');
        if (fs.existsSync(buildFolderPath)) {
            await fs.promises.rm(buildFolderPath, { recursive: true, force: true });
        }
        vscode.window.showInformationMessage('Tasks regenerated successfully.');
    });
    context.subscriptions.push(regenerateTasksCommand);
}
