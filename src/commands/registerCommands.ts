import common = require("mocha/lib/interfaces/common");
import * as vscode from "vscode";
import { CLIHelper } from "../helpers/CLIHelper";
import { CommonHelper } from "../helpers/CommonHelper";
import { DataverseHelper } from "../helpers/DataverseHelper";
import { TemplateHelper } from "../helpers/TemplateHelper";
import { TypingsHelper } from "../helpers/TypingsHelper";
import { DataverseConnectionTreeItem } from "../trees/DataverseConnectionDataProvider";
import { EntitiesTreeItem } from "../trees/EntitiesDataProvider";
import { connectionStatusBarUniqueId, extensionPrefix, fileExtensions } from "../utils/Constants";
import { ICommand, IConnection } from "../utils/Interfaces";
import { ViewBase } from "../views/ViewBase";
import { addConnection } from "./connections";

let dvStatusBarItem: vscode.StatusBarItem;

export async function registerCommands(vscontext: vscode.ExtensionContext): Promise<void> {
    const dvHelper = new DataverseHelper(vscontext);
    const views = new ViewBase(vscontext);
    const cliHelper = new CLIHelper(vscontext);
    const templateHelper = new TemplateHelper(vscontext);
    const commonHelper = new CommonHelper(vscontext, dvHelper);
    const typingHelper = new TypingsHelper(vscontext, dvHelper);

    dvStatusBarItem = vscode.window.createStatusBarItem(connectionStatusBarUniqueId, vscode.StatusBarAlignment.Left);
    vscontext.subscriptions.push(dvStatusBarItem);

    const cmds: Array<ICommand> = new Array(
        {
            command: "dvdt.explorer.connections.addConnection",
            callback: async () => await addConnection(dvHelper),
        },
        {
            command: "dvdt.explorer.connections.deleteConnection",
            callback: async (connItem: DataverseConnectionTreeItem) => await dvHelper.deleteConnection(connItem),
        },
        {
            command: "dvdt.explorer.connections.openConnection",
            callback: (connItem: DataverseConnectionTreeItem) => dvHelper.openEnvironment(connItem),
        },
        {
            command: "dvdt.explorer.connections.connectDataverse",
            callback: async (connItem: DataverseConnectionTreeItem) => {
                const conn = await dvHelper.connectToDataverse(connItem);
                updateConnectionStatusBar(conn);
            },
        },
        {
            command: "dvdt.explorer.connections.showConnectionDetails",
            callback: async (connItem: DataverseConnectionTreeItem) => await dvHelper.showEnvironmentDetails(connItem, views),
        },
        {
            command: "dvdt.explorer.entities.showEntityDetails",
            callback: async (enItem: EntitiesTreeItem) => await dvHelper.showEntityDetails(enItem, views),
        },
        {
            command: "dvdt.commands.initPlugin",
            callback: (uri: vscode.Uri) => cliHelper.initiatePluginProject(uri.fsPath),
        },
        {
            command: "dvdt.commands.initTS",
            callback: async (uri: vscode.Uri) => await templateHelper.initiateTypeScriptProject(uri.fsPath),
        },
        {
            command: "dvdt.explorer.webresources.linkExistingWebResource",
            callback: async (uri: vscode.Uri) => await commonHelper.linkWebResource(uri.fsPath),
        },
        {
            command: "dvdt.explorer.entities.generateTyping",
            callback: async (enItem: EntitiesTreeItem) => await typingHelper.generateTyping(enItem.desc!),
        },
    );
    cmds.forEach((c) => {
        vscontext.subscriptions.push(vscode.commands.registerCommand(c.command, c.callback));
    });

    updateConnectionStatusBar(await dvHelper.reloadWorkspaceConnection());
    vscode.commands.executeCommand("setContext", `${extensionPrefix}.resourcesExtn`, fileExtensions);
    vscode.commands.executeCommand("setContext", `${extensionPrefix}.linkedResources`, await commonHelper.getLinkedResourceStrings());
}

export function updateConnectionStatusBar(conn: IConnection | undefined): void {
    if (conn) {
        dvStatusBarItem.text = `Connected to: ${conn.environmentUrl}`;
        dvStatusBarItem.show();
    } else {
        dvStatusBarItem.hide();
    }
}