# ft9xx-vscode
Demonstrate use of VSCode to compile and debug code for the FT9xx devices from Bridgetek.

## VSCODE files

The configuration files are in the .vscode directory:
- c_cpp_properties.json : includePath has path to FT9xx hardware library include file. This allows code completion and syntax checking by C/C++ Intellisense.
- tasks.json : Tasks for building using makefiles; programming FT9xx using the command line programming utility. 
- launch.json : Debugging launcher. This tells VSCode to open Bridgetek's python debugger bridge before starting gdb to perform the debugging.

### Building

The build process uses a Makefile in the top level directory. 
Build tasks are accessed through the "Terminal -> Run Task..." menu item.
This Makefile has 2 parameters which can be set during the call from the command line, TARGET and CONFIG. The default values are the name of the current directory for TARGET and DEBUG for the CONFIG. If the value of CONFIG is not DEBUG then a release build will be performed. For example to build with a targetname outfilename which is a debug build use the following command line:
> make TARGET=outputname CONFIG=DEBUG
The output binary file for the build will be in the file FT900_DEBUG/outputname.bin and the ELF file for debugging is FT900_DEBUG/outputname.elf.

### Debugging

To start debugging the "Run -> Start Debugging" menu item is used. This will ensure that the project is build and programmed into the FT9xx device before starting the debugger. The code can be programmed into either Flash Memory or Program Memory. 

The debugging progess requires that a bridge program is started before gdb is started. The bridge program part of FT9xxProg.exe and will program the device and then provide the bridge function. The gdb code is instructed to connect to the bridge program via a network socket (localhost:9998).
