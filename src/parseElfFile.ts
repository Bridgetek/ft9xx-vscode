import * as fs from 'fs';

import { exec } from 'child_process';

/**
 * Represents a single symbol in the binary.
 */
export interface Symbol {
    /** Memory address of the symbol (as a hexadecimal string). */
    address: string;

    /** Visibility or linkage of the symbol (local, global, unique global, or neither). */
    flag: "l" | "g" | "u" | "!" | " " | "w" | "C" | "W" | "I" | "i" | "d" | "D" | "F" | "f" | "O";

    /** Type of the symbol (file, function, undefined, or section). */
    type: "d" | "F" | "u" | "df";

    /** Section where the symbol is located (e.g., `.text`, `.data`, `.bss`). */
    section: string;

    /** Size of the symbol in bytes (parsed from hexadecimal). */
    size: number;

    /** Indicates if the symbol is hidden. */
    hidden: boolean;

    /** Name of the symbol. */
    name: string;
}

/**
 * Represents a list of symbols extracted from the binary.
 */
export interface SymbolList {
    /** The name of the binary file being analyzed. */
    binaryFile: string;

    /** Map of section names to arrays of symbols in the binary. */
    sections: { [sectionName: string]: Symbol[] };
}

export class ElfParser {
    constructor(private elfPath: string) {
        this.elfPath = elfPath;
    }

    /**
     * Parses the ELF file to extract the list of symbols.
     * @returns A promise that resolves to the list of symbols.
     */
    public parse(): Promise<SymbolList> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(this.elfPath)) {
                reject(new Error(`File not found: ${this.elfPath}`));
                return;
            }

            exec(`ft32-elf-objdump.exe -t "${this.elfPath}"`, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Error: ${stderr}`));
                    return;
                }

                try {
                    const symbols = this.parseObjdumpOutput(stdout);
                    const sections = this.organizeSymbolsBySection(symbols);
                    resolve({ binaryFile: this.elfPath, sections });
                } catch (parseError) {
                    reject(parseError as Error);
                }
            });
        });
    }

    /**
     * Parses the output of the objdump command to extract symbols.
     * @param output The output of the objdump command.
     * @returns An array of symbols.
     */
    private parseObjdumpOutput(output: string): Symbol[] {
        const regex = /^([0-9a-fA-F]+)\s+([lg!u ]?)\s+([wCWIiDdFfO ]?)\s+(\S+)\s+([0-9a-fA-F]+)\s*(\.hidden\s+)?(\S+)/;
        const lines = output.trim().split('\n');
        const symbols: Symbol[] = [];

        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                symbols.push({
                    address: match[1],
                    flag: match[2] as "l" | "g" | "u" | "!" | " " | "w" | "C" | "W" | "I" | "i" | "d" | "D" | "F" | "f" | "O",
                    type: match[3] as "d" | "F" | "u" | "df",
                    section: match[4],
                    size: parseInt(match[5], 16),
                    hidden: !!match[6],
                    name: match[7]
                });
            }
        }

        return symbols;
    }

    /**
     * Sorts symbols in descending order by size.
     * @param symbols The array of symbols to sort.
     * @returns The sorted array of symbols.
     */
    private sortSymbolsBySize(symbols: Symbol[]): Symbol[] {
        return symbols.sort((a, b) => b.size - a.size);
    }

    /**
     * Sorts symbols in ascending order by address.
     * @param symbols The array of symbols to sort.
     * @returns The sorted array of symbols.
     */
    private sortSymbolsByAddress(symbols: Symbol[]): Symbol[] {
        return symbols.sort((a, b) => parseInt(a.address, 16) - parseInt(b.address, 16));
    }

    /**
     * Organizes symbols by section and sorts them in ascending order by address.
     * @param symbols The array of symbols to organize.
     * @returns A map of section names to arrays of symbols.
     */
    private organizeSymbolsBySection(symbols: Symbol[]): { [sectionName: string]: Symbol[] } {
        const sections: { [sectionName: string]: Symbol[] } = {};

        symbols.forEach(symbol => {
            if (!sections[symbol.section]) {
                sections[symbol.section] = [];
            }
            sections[symbol.section].push(symbol);
        });

        // Sort symbols in each section by address in ascending order
        Object.keys(sections).forEach(sectionName => {
            sections[sectionName] = this.sortSymbolsByAddress(sections[sectionName]);
        });

        return sections;
    }
}
