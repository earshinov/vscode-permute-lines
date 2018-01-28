import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("permute-lines.reverse", function(editor, edit) {
		run(function() {
			transformLines(editor, edit, function(lines) {
				return lines.slice().reverse();
			});
		});
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("permute-lines.unique", function(editor, edit) {
		run(function() {
			transformLines(editor, edit, function(lines) {
				var unique_lines: string[] = [];
				lines.forEach(function(line) {
					if (unique_lines.indexOf(line) < 0) {
						unique_lines.push(line);
					}
				});
				return unique_lines;
			});
		});
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("permute-lines.shuffle", function(editor, edit) {
		run(function() {
			transformLines(editor, edit, shuffleArray);
		});
	}));
}


function run(callback: () => void) {
	try {
		callback();
	}
	catch (e) {
		console.error(e);
		throw e;
	}
}


function transformLines(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, callback: (lines: string[]) => string[]) {
	var document = editor.document;
	var lineCount = document.lineCount;

	var selections = editor.selections;
	if (!selections.length) return;

	// lineNumbersMap <- map of line numbers
	var lineNumbersMap: {[lineNumber: number]: true} = {};
	selections.forEach(function(selection) {

		// ignore empty lines at the beginning of selection
		for (var pos = selection.start;
			pos.line + 1 < lineCount && pos.character == document.lineAt(pos).range.end.character;
			pos = new vscode.Position(pos.line + 1, 0)) { }
		var startLine = pos.line;

		// ignore empty lines at the end of selection
		for (var pos = selection.end;
			pos.line > 0 && pos.character == 0;
			pos = document.lineAt(pos.line - 1).range.end) { }
		var endLine = pos.line;

		for (var line = startLine; line <= endLine; ++line)
			lineNumbersMap[line] = true;
	});

	// lineNumbers <- sorted array of line numbers
	var stringLineNumbers = Object.keys(lineNumbersMap);
	if (stringLineNumbers.length < 2) return;
	var lineNumbers = stringLineNumbers.map(function(stringLineNumber) { return parseInt(stringLineNumber); });
	lineNumbers.sort(function(a, b) { return a - b; });

	// lineRanges <- sorted array of vscode ranges
	var lineRanges = lineNumbers.map(function(lineNumber) {
		return document.lineAt(lineNumber).range;
	});

	var lineRangeTexts = lineRanges.map(function(lineRange) {
		return document.getText(lineRange);
	});
	lineRangeTexts = callback(lineRangeTexts);

	for (var i = 0; i < lineRanges.length && i < lineRangeTexts.length; ++i)
		edit.replace(lineRanges[i], lineRangeTexts[i]);
	for (var i = lineRangeTexts.length; i < lineRanges.length; ++i)
		edit.replace(lineRanges[i], "");
	if (lineRangeTexts.length > lineRanges.length) {
		var appendix = "\n" + lineRangeTexts.slice(lineRanges.length).join("\n");
		edit.insert(lineRanges[lineRanges.length - 1].end, appendix);
	}
}


function shuffleArray<T>(array: T[]): T[] {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}
