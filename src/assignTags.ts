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
	private re = new RegExp(`{%\\sassign\\s('|")?([\\[\\]\\-$\\w]+)+('|")?\\s=\\s([\\{\\]\\-\\.$\\w"']+)+\\s%}`, 'g');

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
				return Promise.resolve(test);
			} else {
				vscode.window.showInformationMessage('Workspace has no package.json');
				return Promise.resolve([]);
			}
		}
	}

	private getDeps(dirPath: string): Dependency[] {
		let files = fs.readdirSync(dirPath);
		const toDep = (files: string[], dirPath: string): Dependency[] => {
			let deps = new Array();

			files.forEach(file => {
				const filePath = path.join(dirPath, file);
				if (fs.existsSync(filePath)) {
					//readDirectory
					this.readDirectory(file, filePath, file).forEach(dep => {
						deps.push(dep);
					});
				}
			});

			return deps;
		};

		const deps = toDep(files, dirPath);

		return deps;
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}

	private readDirectory(file: string, filePath: string, rootPath: string): Dependency[] {
		let deps = new Array();

		if (fs.lstatSync(filePath).isDirectory()) {
			fs.readdirSync(filePath).forEach(dirFiles => {
				const dirFilePath = path.join(filePath, dirFiles);
				if (fs.lstatSync(dirFilePath).isDirectory()) {
					this.readDirectory(dirFiles, dirFilePath, path.join(file, dirFiles)).forEach(dep => {
						deps.push(dep);
					});
				} else if (fs.lstatSync(dirFilePath).isFile() && dirFiles.includes('.liquid')) {
					let lineCount = 0;

					const arr = fs.readFileSync(dirFilePath).toString().replace(/\r\n/g, '\n').split('\n');

					for (let line of arr) {
						lineCount++;

						let reResult;
						while ((reResult = this.re.exec(line)) !== null) {
							const tagName = reResult[2];
							deps.push(new Dependency(tagName, path.join(rootPath, dirFiles), lineCount.toString()));
						}
					}
				}
			});
		}

		if (fs.lstatSync(filePath).isFile() && filePath.includes('.liquid')) {

			let lineCount = 0;

			const arr = fs.readFileSync(filePath).toString().replace(/\r\n/g, '\n').split('\n');

			for (let line of arr) {
				lineCount++;

				let reResult;
				while ((reResult = this.re.exec(line)) !== null) {
					const tagName = reResult[2];
					deps.push(new Dependency(tagName, file, lineCount.toString()));
				}
			}
		}

		return deps;
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