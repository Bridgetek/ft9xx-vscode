# How to build this project

## Clone and locate the repo

First we need to clone this project to some where you want.
After that you need to run the list command below to setup the `npm` package that listed in the file `package.json`.

```shell
# clean up step if you already install it
npm cache clean --force
# if you never install VSCode package before
npm install -g @vscode/vsce
# install the listed packages
npm install
```

## Install the plugin to develop

After you clone this project VSCode will suggest to install some extention which support to develop, accept it all.

## Build and deploy the plugin or we can install locally

Run the command below to generate the `package.vsix`

```Shell
vsce package
```

Publish:

```Shell
vsce publish
```

Locally install:

```Shell
code --install-extension my-extension.vsix
```
