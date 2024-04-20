// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * Get the nonce
 * @returns 
 */
function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

/**
 * Loading the webview content
 * @param {} root 
 * @returns 
 */
function loadWebviewFiles(root) {
	let main = fs.readFileSync(path.join(root, 'webview.html'), { encoding: 'utf8' });
	main = main.replace(/<[^\n]*"\.\/panel\/[^\n]*>/g, s => {
		let m = /"\.\/panel\/(.*?\.)(.*?)"/.exec(s)
		let content = fs.readFileSync(path.join(root, 'panel', m[1] + m[2]), { encoding: 'utf8' })
		switch (m[2]) {
			case 'css':
				return '<style>' + content + '</style>'
			case 'js':
				return '<script nonce="ToBeReplacedByRandomToken">' + content + '</script>'
			default:
				return s
		}
	})
	main = main.replace(/ToBeReplacedByRandomToken/g, getNonce())
	return main;
}

const webviewContent = loadWebviewFiles(path.join(__dirname, '..'));

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// values for webview status
	/** @type {vscode.WebviewPanel | undefined} */
	let currentPanel = undefined;

	// values for editting status
	/** @type {vscode.TextEditor | undefined} */
	let currentEditor = undefined;
	let currentLine = 0;
	let updateHandle = undefined;

	function createNewPanel() {
		// Create and show panel
		currentPanel = vscode.window.createWebviewPanel(
			'drawNote',
			'Graph Tool Demo',
			vscode.ViewColumn.Two,
			{
				// Enable scripts in the webview
				enableScripts: true
			}
		);

		currentPanel.webview.html = getWebviewContent();
		// Handle messages from the webview
		currentPanel.webview.onDidReceiveMessage(
			// Received message
			message => {
				switch (message.command) {
					case 'requestCurrentLine':
						pushCurrentLine()
						return;
					case 'editCurrentLine':
						// Set the editor text to the one sent by message received
						setEditorText(message.text, message.control);
						return;
				}
			},
			undefined,
			context.subscriptions
		);

		realTimeCurrentEditorUpdate()

		currentPanel.onDidDispose(
			() => {
				if (updateHandle != undefined) {
					clearInterval(updateHandle)
					updateHandle = undefined
				}
				currentPanel = undefined;
			},
			undefined,
			context.subscriptions
		);
	}

	function showPanel() {
		currentPanel.reveal();
	}

	function getEditorText() {
		let currentEditor_ = currentEditor
		let currentLine_ = currentLine
		
		// This line identifies the text editor, e.g. .txt file
		let activeTextEditor = vscode.window.activeTextEditor;
		if (activeTextEditor) {
			currentEditor_ = activeTextEditor;
		}
		if (!currentEditor_ || currentEditor_.document.isClosed) {
			return {};
		}
		currentLine_ = currentEditor_.selection.active.line

		let text = currentEditor_.document.getText(new vscode.Range(currentLine_, 0, currentLine_ + 1, 0))
		return { text, currentEditor_, currentLine_ }
	}

	function pushCurrentLine() {
		let { text, currentEditor_, currentLine_ } = getEditorText(true)
		if (typeof text === 'string' && currentPanel) {
			currentEditor = currentEditor_
			currentLine = currentLine_
			currentPanel.webview.postMessage({ command: 'currentLine', content: text });
		}
	}

	/**
	 * Updating the editor in real time, posting message
	 */
	function realTimeCurrentEditorUpdate() {
		let strings = ['', '']
		updateHandle = setInterval(() => {
			let { text, currentEditor_, currentLine_ } = getEditorText(false)
			if (typeof text === 'string' && currentPanel) {
				let topush = false
				if (strings[0] !== strings[1] && text === strings[0]) {
					topush = true
				}
				strings[1] = strings[0]
				strings[0] = text
				if (topush) {
					currentEditor = currentEditor_
					currentLine = currentLine_
					currentPanel.webview.postMessage({ command: 'currentLine', content: text });
				}
			}
		}, 100)
	}
	/**
	 * Set the editor side text
	 * @param {*} text 
	 * @returns 
	 */
	function setEditorText(text) {
		if (!currentEditor || currentEditor.document.isClosed) {
			vscode.window.showErrorMessage('The text editor has been closed');
			return;
		}

		const editor = currentEditor; // Save current editor
		const lastLine = editor.document.lineCount - 1;
		const fullRange = new vscode.Range(0, 0, lastLine, editor.document.lineAt(lastLine).text.length);

		vscode.window.showTextDocument(editor.document, {
			viewColumn: editor.viewColumn,
			selection: new vscode.Range(currentLine, 0, currentLine, 0)
		})
			.then(() => editor.edit(edit => {
				let lf = '';
				edit.replace(fullRange, text + lf); // Replace entire content with new text
			}))
			.then(() => vscode.window.showTextDocument(editor.document, {
				viewColumn: editor.viewColumn,
				selection: new vscode.Range(currentLine + 1, 0, currentLine + 1, 0)
			}))
			.then(() => {
				pushCurrentLine();
			});
	}

	context.subscriptions.push(
		// Trigger the panel
		vscode.commands.registerCommand('graph-tool-demo-4.start', () => {
			if (currentPanel) {
				showPanel()
			} else {
				createNewPanel()
			}
			pushCurrentLine()
		})
	);
}

exports.activate = activate;

function getWebviewContent() {
	return webviewContent
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
