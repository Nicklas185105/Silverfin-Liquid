import * as vscode from 'vscode';
import { tagDataMap } from './tagData';

export class ProgrammaticLanguageFeatures {

	hoverProvider(): vscode.Disposable {
		let disposable = vscode.languages.registerHoverProvider('liquid', {
			provideHover(document, position, token) {
				const tag = document.getText(document.getWordRangeAtPosition(position));
				if (tagDataMap().has(tag)) {
					let markdownString = "";
					tagDataMap().get(tag)?.forEach((string) => {
						markdownString += string;
					});
					return {
						contents: [markdownString]
					};
				}
				return null;
			}
		});

		return disposable;
	}
}