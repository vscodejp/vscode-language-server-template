'use strict';

import { ExtensionContext, window as Window, Uri } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	RevealOutputChannelOn,
	ServerOptions,
	TransportKind } from 'vscode-languageclient/node';

// 拡張機能が有効になったときに呼ばれる
export function activate(context: ExtensionContext): void {
	// サーバーのパスを取得
	const serverModule =  Uri.joinPath(context.extensionUri, 'server', 'out', 'server.js').fsPath;
	// デバッグ時の設定
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6011'], cwd: process.cwd() };

	// サーバーの設定
	const serverOptions: ServerOptions = {
		run: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { cwd: process.cwd() }
		},
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions,
		},
	};
	// LSPとの通信に使うリクエストを定義
	const clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ scheme: 'file' },
			{ scheme: 'untitled' }
		],
		diagnosticCollectionName: 'sample',
		revealOutputChannelOn: RevealOutputChannelOn.Never,
		initializationOptions: {},
		progressOnInitialization: true,
	};

	let client: LanguageClient;
	try {
		// LSPを起動
		client = new LanguageClient('Sample LSP Server', serverOptions, clientOptions);
	} catch (err) {
		void Window.showErrorMessage('拡張機能の起動に失敗しました。詳細はアウトプットパネルを参照ください');
		return;
	}

	// 拡張機能のコマンドを登録
	context.subscriptions.push(
		client.start(),
	);
}
