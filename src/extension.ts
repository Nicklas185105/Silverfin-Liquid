import * as vscode from 'vscode';

import { ResultTagsProvider } from './resultTags';
import { AssignTagsProvider } from './assignTags';
import { ProgrammaticLanguageFeatures } from './programmaticLanguageFeatures';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "stl-extension" is now active!');

	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	//const resultTagsProvider = new ResultTagsProvider(rootPath);
	//vscode.window.registerTreeDataProvider('result-tags', resultTagsProvider);
	//vscode.commands.registerCommand('result-tags.refreshEntry', () => resultTagsProvider.refresh());

	const assignTagsProvider = new AssignTagsProvider(rootPath);
	vscode.window.registerTreeDataProvider('assign-tags', assignTagsProvider);
	vscode.commands.registerCommand('assign-tags.refreshEntry', () => assignTagsProvider.refresh());
	let assignRefreshOnSave = vscode.workspace.onDidSaveTextDocument((e) => assignTagsProvider.refresh());

	let helloWorld = vscode.commands.registerCommand('stl-extension.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from stl-extension!');
	});

	// ----- Programmatic Language Features ----
	const programmaticLanguageFeatures = new ProgrammaticLanguageFeatures();
	let hoverProvider = programmaticLanguageFeatures.hoverProvider();

	context.subscriptions.push(helloWorld, assignRefreshOnSave, hoverProvider);
}

// this method is called when your extension is deactivated
export function deactivate() { }
