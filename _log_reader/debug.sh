#!/bin/sh

# EDIT .vscode/launch.json :
:<<'BLOCK_COMMENT_END'

{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Node Debug (LogReader Mac)",
            "type": "nwjs",
            "request": "launch",
            "runtimeExecutable": "/Applications/nwjs-sdk-v0.49.2-osx-x64/nwjs.app/Contents/MacOS/nwjs",
            "runtimeArgs": [
                "${workspaceRoot}/_log_reader/src",
                "--remote-debugging-port=9222"
            ],
            "webRoot": "${workspaceRoot}/_log_reader/src",
            "sourceMaps": true,
            "port": 9222
        }
    ]
}

BLOCK_COMMENT_END