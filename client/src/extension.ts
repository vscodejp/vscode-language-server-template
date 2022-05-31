'use strict';

import { ExtensionContext, window as Window, Uri } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	RevealOutputChannelOn,
	ServerOptions,
	TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

// 拡張機能が有効になったときに呼ばれる
export async function activate(context: ExtensionContext) {
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
		// 対象とするファイルの種類や拡張子
		documentSelector: [
			{ scheme: 'file' },
			{ scheme: 'untitled' }
		],
		// 警告パネルでの表示名
		diagnosticCollectionName: 'sample',
		revealOutputChannelOn: RevealOutputChannelOn.Never,
		initializationOptions: {},
		progressOnInitialization: true,
	};

	try {
		// LSPを起動
		client = new LanguageClient('Sample LSP Server', serverOptions, clientOptions);
	} catch (err) {
		void Window.showErrorMessage('拡張機能の起動に失敗しました。詳細はアウトプットパネルを参照ください');
		return;
	}
	client.start().catch((error) => client.error(`Starting the server failed.`, error, 'force'));
}

export async function deactivate(): Promise<void> {
	if (client) {
		await client.stop();
	}
}