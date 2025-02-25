import * as path from 'path';
import * as fs from 'fs';

import { SerialPort } from 'serialport';

export function sortComPorts(ports: string[]): string[] {
    return ports.sort((a, b) => {
        const aNum = parseInt(a.replace('COM', ''), 10);
        const bNum = parseInt(b.replace('COM', ''), 10);
        return aNum - bNum;
    });
}

export async function scanComPorts(): Promise<string[]> {
    if (process.platform !== 'win32') {
        throw new Error('This function is only supported on Windows.');
    }

    return new Promise((resolve, reject) => {
        SerialPort.list()
            .then(ports => {
                const portNames = ports.map(port => port.path);
                const sortedPortNames = sortComPorts(portNames);
                resolve(sortedPortNames);
            })
            .catch(err => {
                console.error('Error listing COM ports:', err);
                resolve([]);
            });
    });
}

export function copyFolderRecursiveSync(source: string, target: string) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    const files = fs.readdirSync(source);

    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        // Skip copying the following files/folders
        if (file === '.cproject' || file === '.project' || file === '.settings' ||
            file === 'Makefile' || file === 'CMakeLists.txt') {
            return;
        }

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyFolderRecursiveSync(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}
