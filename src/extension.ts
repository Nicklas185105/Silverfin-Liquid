// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ResultTagsProvider } from './resultTags';
import { AssignTagsProvider } from './assignTags';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "stl-extension" is now active!');

	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	//const resultTagsProvider = new ResultTagsProvider(rootPath);
	//vscode.window.registerTreeDataProvider('result-tags', resultTagsProvider);
	//vscode.commands.registerCommand('result-tags.refreshEntry', () => resultTagsProvider.refresh());

	const assignTagsProvider = new AssignTagsProvider(rootPath);
	vscode.window.registerTreeDataProvider('assign-tags', assignTagsProvider);
	vscode.commands.registerCommand('assign-tags.refreshEntry', () => assignTagsProvider.refresh());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('nbl-extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from nbl-extension!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
