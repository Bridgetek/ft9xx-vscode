import { exec } from 'child_process';

interface BinarySize {
    text: number;
    data: number;
    bss: number;
    dec: number;
    hex: number;
    filename: string;
}

export function getBinarySize(binaryPath: string): Promise<BinarySize> {
    return new Promise((resolve, reject) => {
        exec(`ft32-elf-size.exe --format=berkeley -x "${binaryPath}"`, (error, stdout) => {
            if (error) {
                reject(new Error(`Error: ${error.message}`));
                return;
            }

            try {
                const binarySize = parseObjdumpOutput(stdout);
                resolve(binarySize);
            } catch (parseError) {
                reject(parseError as Error);
            }
        });
    });
}

function parseObjdumpOutput(output: string): BinarySize {
    const regex = /^\s*(0x[0-9a-fA-F]+)\s+(0x[0-9a-fA-F]+)\s+(0x[0-9a-fA-F]+)\s+([0-9]+)\s+([0-9a-fA-F]+)\s+(.*)$/;

    const lines = output.trim().split('\n');
    let match: RegExpMatchArray | null = null;

    for (const line of lines) {
        match = line.match(regex);
        if (match) {
            break;
        }
    }
    if (!match) {
        throw new Error('Failed to parse objdump output');
    }

    return {
        text: parseInt(match[1], 16),
        data: parseInt(match[2], 16),
        bss: parseInt(match[3], 16),
        dec: parseInt(match[4], 10),
        hex: parseInt(match[5], 16),
        filename: match[6]
    };
}
