import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class AssignTagsProvider implements vscode.TreeDataProvider<TreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
		if (workspaceRoot !== undefined) {
			this.workspaceRootString = workspaceRoot;
		} else {
			this.workspaceRootString = "";
		}
	}

	private workspaceRootString!: string;
	private re = new RegExp(/{%\sassign\s([\[\]\-$\w]+)\s=\s([\"\'\w\d\-\_]*)([\w\d\[\]\s\n\'\"\|\:\;\_\-\.\$\!\+æøåÆØÅ]*)?\s%}/gm);
	private reReplace = new RegExp(/([\[\]\-$\w]+)\s=\s([\w\d\[\]\s\'\"\|\:\;\_\-\.\!\+æøåÆØÅ]*)\s%}([\w\s]+)?/gm);
	private reMulti = new RegExp(/{%\sassign\s([\[\]\-$\w]+)\s=\s([\"\'\w\d\-\_]*)/gm);
	private reMultiEnd = new RegExp(/([\w\d\[\]\s\n\'\"\|\:\;\_\-\.\$\!\+æøåÆØÅ]*)(%})/gm);

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
		if (!this.workspaceRootString) {
			vscode.window.showInformationMessage('No files in empty workspace');
			return Promise.resolve([]);
		}

		if (element === undefined) {
			const test = this.readFiles(this.workspaceRootString);
			return Promise.resolve(test);
		} else {
			if (element.children === undefined) {
				const test = this.readAssigns(element.path);
				return Promise.resolve(test);
			}
			return element.children;
		}
	}

	private readFiles(dirPath: string): TreeItem[] {
		let files = fs.readdirSync(dirPath);
		const toDep = (files: string[], dirPath: string): TreeItem[] => {
			let deps = new Array();

			const dirPathArray = dirPath.split('\\');
			deps.push(new TreeItem(dirPathArray[dirPathArray.length - 1], path.join(dirPath, dirPathArray[dirPathArray.length - 1]) + '.liquid', false, true, 0, 0, 0, undefined)); //this.readAssigns(path.join(dirPath, dirPathArray[dirPathArray.length - 1]) + '.liquid')

			files.forEach(file => {
				const filePath = path.join(dirPath, file);
				if (fs.existsSync(filePath)) {
					// readDirectory
					if (fs.lstatSync(filePath).isDirectory()) {
						fs.readdirSync(filePath).forEach(dirFiles => {
							deps.push(new TreeItem(dirFiles, path.join(filePath, dirFiles), false, true, 0, 0, 0, undefined)); //this.readAssigns(path.join(filePath, dirFiles))
						});
					}
				}
			});

			return deps;
		};

		const deps = toDep(files, dirPath);

		return deps;
	}

	private readAssigns(filePath: string): TreeItem[] | undefined {
		let deps = new Array();

		if (filePath.includes('.liquid')) {
			let lineCount = 0;

			const arr = fs.readFileSync(filePath).toString().split(/\r\n/g);

			let multiLine = false;
			let lineMulti = "";
			let multiLineCount = 0;
			arr.forEach(line => {
				lineCount++;

				let reResult = this.re.exec(line);
				let reResultMulti = this.reMulti.exec(line);

				if (!multiLine) {
					if (reResult !== null) {
						const tagName = reResult[1];
						const colCountStart = line.replace(this.reReplace, "").length;
						const colCountEnd = colCountStart + tagName.length;
						deps.push(new TreeItem(tagName, filePath, true, false, lineCount, colCountStart, colCountEnd, undefined, 'Line: ' + lineCount, reResult[0]));
					} else if (reResultMulti !== null) {
						multiLine = true;
						lineMulti += line;
						multiLineCount = lineCount;
					}
				} else {
					if (line.includes('%}')) {
						reResult = this.reMultiEnd.exec(line);

						if (reResult !== null) {
							lineMulti += reResult[0];
							reResult = this.re.exec(lineMulti);

							if (reResult !== null) {
								const tagName = reResult[1];
								const colCountStart = lineMulti.replace(this.reReplace, "").length;
								const colCountEnd = colCountStart + tagName.length;
								deps.push(new TreeItem(tagName, filePath, true, false, multiLineCount, colCountStart, colCountEnd, undefined, 'Line: ' + multiLineCount, reResult[0]));
							}
						}
						lineMulti = "";
						multiLine = false;
					} else {
						lineMulti += line;
					}
				}
			});
		}

		return deps.length > 0 ? deps : undefined;
	}
}

export class TreeItem extends vscode.TreeItem {
	children: TreeItem[] | undefined;
	path: string;
	lineCount: number;
	colCountStart: number;
	colCountEnd: number;
	assign: boolean;

	constructor(
		label: string,
		path: string,
		assign: boolean,
		itemState: boolean,
		lineCount: number,
		colCountStart: number,
		colCountEnd: number,
		children?: TreeItem[],
		description?: string,
		tooltip?: string,
		command?: vscode.Command
	) {
		super(
			label,
			itemState ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
		);
		this.children = children;
		this.description = description;
		this.tooltip = tooltip;
		this.path = path;
		this.lineCount = lineCount;
		this.assign = assign;
		this.colCountStart = colCountStart;
		this.colCountEnd = colCountEnd;

		this.command = this.assign ? {
			title: "go To Line",
			command: "vscode.open",
			arguments: [
				vscode.Uri.file(path),
				{ selection: new vscode.Selection(new vscode.Position(lineCount - 1, colCountStart), new vscode.Position(lineCount - 1, colCountEnd)) }
			]
		} : undefined;
	}

	/*iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};*/
}