import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { resolve } from 'path';

export class AssignTagsProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
		if (workspaceRoot !== undefined) {
			this.workspaceRootString = workspaceRoot;
		} else {
			this.workspaceRootString = "";
		}
	}

	private workspaceRootString!: string;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Dependency): Thenable<Dependency[]> {
		if (!this.workspaceRootString) {
			vscode.window.showInformationMessage('No dependency in empty workspace');
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve(this.getDeps(this.workspaceRootString));
		} else {
			const packageJsonPath = this.workspaceRootString;
			if (this.pathExists(packageJsonPath)) {
				const test = this.getDeps(packageJsonPath);
				console.log(test);
				return Promise.resolve(test);
			} else {
				vscode.window.showInformationMessage('Workspace has no package.json');
				return Promise.resolve([]);
			}
		}
	}

	private getDeps(dirPath: string): Dependency[] {
		console.log(dirPath);
		const files = fs.readdirSync(dirPath);

		const toDep = (files: string[], dirPath: string): Dependency[] => {
			let deps = new Array();

			files.forEach(file => {
				if (file.includes('.liquid')) {
					const readInterface = readline.createInterface({
						input: fs.createReadStream(path.join(dirPath, file)),
						output: process.stdout
					});

					let lineCount = 0;

					/*readInterface.on('SIGINT', () => resolve());

					readInterface.on('line', function (line) {
						lineCount++;
						if (line.includes('{% assign ')) {
							const tagName = line.split(' ')[2];
							console.log(tagName);
							deps.push(new Dependency(tagName, file, lineCount.toString()));
						}
					});*/

					const arr = fs.readFileSync(path.join(dirPath, file)).toString().replace(/\r\n/g, '\n').split('\n');

					for (let line of arr) {
						lineCount++;
						if (line.includes('{% assign ')) {
							const tagName = line.split(' ')[2];
							console.log(tagName);
							deps.push(new Dependency(tagName, file, lineCount.toString()));
						}
					}
				}
			});

			console.log("Length: " + deps.length);

			return deps;
		};

		const depss = toDep(files, dirPath);

		return depss;
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private readonly fileName: string,
		private readonly line: string,
		public readonly command?: vscode.Command
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = `${this.label} - ${this.fileName} - ${this.line}`;
		this.description = `File: ${this.fileName} - Line: ${this.line}`;
	}

	/*iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};*/

	contextValue = 'dependency';
}