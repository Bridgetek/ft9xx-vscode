# BridgeTek FT9XX Extension

This is the README for the extension "bridgetek-ft9xx". This extension provides tools and utilities for working with Bridgetek FT9xx microcontrollers in Visual Studio Code.

## Features

Project creation:

- **Create Template Projects**: Easily create template projects for FT9xx microcontrollers.
- **Import Example Applications**: Import the example application form SDKs.

Project inspect:

- **Analyze Binary Size**: Analyze the binary size and display charts after build successfully.
- **Parse ELF Files**: Parse ELF files and display symbol information.

Customize the project via features:

- **Add Third-Party Libraries**: Add third-party libraries to your projects.
- **Add Layered Drivers**: Add layered drivers to your projects.
- **Add Hardware Libraries**: Add hardware libraries to your projects.
- **Start Debugging**: Start debugging FT9xx applications.

## Requirements

- Visual Studio Code
- CMake
- FT9xx SDK and toolchain installed on your system [Here][ft9xx-toolchain] (V2.9.0 or higher).

## Installation

1. Install Visual Studio Code from [here](https://code.visualstudio.com/) (V2.9.0 or newer).
2. Install the FT9xx SDK and toolchain on your system.
3. Install the `bridgetek-ft9xx` extension from the Visual Studio Code Marketplace or by using the VSIX package.

## Usage

Using the `Command Palette` (Ctrl + Shift + P)

- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) and select "My Extension Command".
- Or, click the status bar icon for quick access.
The extension provides several commands that can be accessed via the Command Palette (`Ctrl+Shift+P`)

![VSCode Command Palette](https://raw.githubusercontent.com/Bridgetek/ft9xx-vscode/development/images/CommandPalette.png)

Command list and explanation:

| Command Name                        | Explanation                                             |
|-------------------------------------|---------------------------------------------------------|
| Adding the hardware libraries       | Add hardware libraries to the project.                  |
| Adding the layered drivers          | Add layered drivers to the project.                     |
| Build Project                       | Build the current project with the configuration on status bar.|
| Clean Project Build                 | Clean the build files/folders of the current project.|
| Create a project template           | Create a new project template for FT9xx microcontrollers.|
| Focus on Project View View          | Focus on the project view in Visual Studio Code.        |
| Import the example projects from the SDK package | Import example projects from the FT9xx SDK package.|
| Import the hardware libraries project | Import hardware libraries project to current project workspace folder.|
| Programming via UART                | Program the FT9xx microcontroller via UART.             |
| Regenerate tasks.json               | Regenerate the tasks.json file for the project.         |
| Select Baudrate                     | Select the baudrate for UART programming.               |
| Select Build Mode                   | Select the build mode (Debug or Release).               |
| Select Chipset                      | Select the chipset (FT90x or FT93x).                    |
| Show Add Library Webview            | Show the webview for adding libraries.                  |
| Show Binary Size Chart              | Display a chart of the binary size after a build.       |
| Show Project Configuration          | Display the current project configuration.              |
| Show Welcome Page                   | Show the welcome page of the extension.                 |
| Start Debugging (FT9xx) program     | Start debugging the FT9xx program.                      |

If you wanna try the GUI:

Status bar:

![Status bar](https://raw.githubusercontent.com/Bridgetek/ft9xx-vscode/development/images/StatusBar.png)

In the status bar, users can configure the following:

- **Baudrate**: The baudrate used for programming the board via the UART protocol.
- **Build Mode**: Select between Debug or Release modes.
- **Chipset**: Choose between FT90x or FT93x chipsets.
- **COM Port**: The UART COM port connected to the FT9xx chip.

## Extension Settings

This extension contributes the following settings:

User configuration (Global configuration), we can go to user setting json file to configure it:

- `ft9xx.toolchainPath`: This setting specifies the path to the toolchain used for building the project. The toolchain includes the compiler, linker, and other tools necessary for converting your source code into executable binaries. You need to set this to the directory where your toolchain is installed.
- `ft9xx.sdkPath`: This setting defines the path to the Software Development Kit (SDK) for the FT9xx series. The SDK typically includes libraries, headers, and other resources required for developing applications for the FT9xx microcontrollers. Set this to the directory where your FT9xx SDK is located.
- `ft9xx.buildTool`: This setting indicates the specific build tool or script used to compile and link your project. It could be a makefile, a custom build script, or any other tool that orchestrates the build process. Set this to the path of the build tool or script you are using.

Alternative way is using the `Extension config`:
![Extension config](https://raw.githubusercontent.com/Bridgetek/ft9xx-vscode/development/images/ExtentionConfig.png)

Workspace configuration:

- `ft9xx.projectName`: Name of the FT9xx project.
- `ft9xx.baudrate`: Baudrate for FT9xx programming.
- `ft9xx.buildMode`: Build mode for the project (Debug or Release).
- `ft9xx.chipset`: Chipset for the project (FT90x or FT93x).
- `ft9xx.subWorkspace`: Sub-workspace folder for organizing project files.
- `ft9xx.comPort`: COM port for FT9xx programming.
- `ft9xx.thirdPartyLibs`: List of third-party libraries to include in the project.
- `ft9xx.hardwareLibs`: List of hardware libraries to include in the project.
- `ft9xx.layeredDrivers`: List of layered drivers to include in the project.
- `ft9xx.d2xxType`: Type of D2XX driver to use for FT9xx programming.
- `ft9xx.customDefinedFlags`: Custom defined flags for the compiler.
- `ft9xx.customLinkerFlags`: Custom linker flags for the linker.

## License

[MIT License](LICENSE)

[ft9xx-toolchain]: https://brtchip.com/ft9xx-toolchain/
