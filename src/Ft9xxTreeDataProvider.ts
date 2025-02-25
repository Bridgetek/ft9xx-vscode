import * as vscode from 'vscode';

export class Ft9xxTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        if (!element) {
            const extensionConfigItem = new vscode.TreeItem('Extension config', vscode.TreeItemCollapsibleState.None);
            extensionConfigItem.iconPath = new vscode.ThemeIcon('settings-gear');
            extensionConfigItem.command = { command: 'bridgetek-ft9xx.showConfigPage', title: 'Show Extension Configuration' };

            const projectTemplateItem = new vscode.TreeItem('New Project Wizard', vscode.TreeItemCollapsibleState.Collapsed);
            projectTemplateItem.iconPath = new vscode.ThemeIcon('open-editors-view-icon');

            const importLibItem = new vscode.TreeItem('Project Utilities', vscode.TreeItemCollapsibleState.Collapsed);
            importLibItem.iconPath = new vscode.ThemeIcon('extensions-view-icon');

            const buildItem = new vscode.TreeItem('Build', vscode.TreeItemCollapsibleState.None);
            buildItem.iconPath = new vscode.ThemeIcon('symbol-property');
            buildItem.command = { command: 'bridgetek-ft9xx.buildProject', title: 'Build the project' };

            const cleanBuildItem = new vscode.TreeItem('Cleanup build', vscode.TreeItemCollapsibleState.None);
            cleanBuildItem.iconPath = new vscode.ThemeIcon('flame');
            cleanBuildItem.command = { command: 'bridgetek-ft9xx.cleanBuild', title: 'Clean the build' };

            const programmingItem = new vscode.TreeItem('Programming', vscode.TreeItemCollapsibleState.Collapsed);
            programmingItem.iconPath = new vscode.ThemeIcon('rocket');

            const debugItem = new vscode.TreeItem('Debug', vscode.TreeItemCollapsibleState.None);
            debugItem.iconPath = new vscode.ThemeIcon('watch-view-icon');
            debugItem.tooltip = 'Build and flashing the debug image, then start the debug section';
            debugItem.command = { command: 'bridgetek-ft9xx.startDebugging', title: 'Start Debugging for FT9xx' };

            const binaryAnalysisItem = new vscode.TreeItem('Binary Analysis', vscode.TreeItemCollapsibleState.None);
            binaryAnalysisItem.iconPath = new vscode.ThemeIcon('pie-chart');
            binaryAnalysisItem.command = { command: 'bridgetek-ft9xx.showBinarySizeChart', title: 'Show Binary Analysis' };

            const cleanupFLashItem = new vscode.TreeItem('Cleanup flash', vscode.TreeItemCollapsibleState.None);
            cleanupFLashItem.iconPath = new vscode.ThemeIcon('alert');
            cleanupFLashItem.tooltip = 'Recovery to the factory state';
            cleanupFLashItem.command = { command: 'bridgetek-ft9xx.cleanFlash', title: 'Cleanup the flash and put the chip to the factory reset state' };

            return [
                extensionConfigItem, projectTemplateItem, importLibItem, buildItem,
                cleanBuildItem, programmingItem, debugItem, binaryAnalysisItem,
                cleanupFLashItem
            ];
        } else if (element.label === 'New Project Wizard') {
            const templateProjectItem = new vscode.TreeItem('Template project', vscode.TreeItemCollapsibleState.None);
            templateProjectItem.command = { command: 'bridgetek-ft9xx.createTemplateProject', title: ' Create the template project' };

            const exampleProjectItem = new vscode.TreeItem('Import Example Project', vscode.TreeItemCollapsibleState.None);
            exampleProjectItem.command = { command: 'bridgetek-ft9xx.showExampleApps', title: 'Import the Example project in SDK package' };

            return [templateProjectItem, exampleProjectItem];
        } else if (element.label === 'Project Utilities') {
            const projectConfigItem = new vscode.TreeItem('Project Configuration', vscode.TreeItemCollapsibleState.None);
            projectConfigItem.command = { command: 'bridgetek-ft9xx.showProjectConfigPage', title: 'Show Project Configuration' };

            const regenerateTaskItem = new vscode.TreeItem('Regenerate tasks', vscode.TreeItemCollapsibleState.None);
            regenerateTaskItem.command = { command: 'bridgetek-ft9xx.regenerateTasks', title: 'Regenerate the tasks in case this file is corrupted' };

            const add3rdLibsItem = new vscode.TreeItem('Add Third party libraries', vscode.TreeItemCollapsibleState.None);
            add3rdLibsItem.command = { command: 'bridgetek-ft9xx.showAdd3rdLibraryWebview', title: 'Add Third party libraries to project' };

            const addLayeredDriverItem = new vscode.TreeItem('Add layered drivers', vscode.TreeItemCollapsibleState.None);
            addLayeredDriverItem.command = { command: 'bridgetek-ft9xx.showAddLayeredDriversWebview', title: 'Add the layered driver to project' };

            const addHardwareLibsItem = new vscode.TreeItem('Add hardware libraries', vscode.TreeItemCollapsibleState.None);
            addHardwareLibsItem.command = { command: 'bridgetek-ft9xx.showAddHardwareLibrariesWebview', title: 'Add the hardware libraries to project' };

            return [add3rdLibsItem, addLayeredDriverItem, addHardwareLibsItem, projectConfigItem, regenerateTaskItem];
        } else if (element.label === 'Programming') {
            const onewireProgItem = new vscode.TreeItem('Programming with One-wire', vscode.TreeItemCollapsibleState.None);
            onewireProgItem.command = { command: 'bridgetek-ft9xx.programmingOnewire', title: 'Programming board via One-wire interface' };
            onewireProgItem.iconPath = new vscode.ThemeIcon('rocket');

            const uartProgItem = new vscode.TreeItem('Programming with UART', vscode.TreeItemCollapsibleState.None);
            uartProgItem.command = { command: 'bridgetek-ft9xx.programmingUart', title: 'Programming board via UART interface' };
            uartProgItem.iconPath = new vscode.ThemeIcon('rocket');

            return [onewireProgItem, uartProgItem];
        }
    }
}
