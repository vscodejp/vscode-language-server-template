'use strict';

import {
	createConnection,
	Diagnostic,
	DiagnosticSeverity,
	InitializeResult,
	ProposedFeatures,
	Range,
	TextDocuments,
	TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

// サーバー接続オブジェクトを作成する。この接続にはNodeのIPC(プロセス間通信)を利用する
// LSPの全機能を提供する
const connection = createConnection(ProposedFeatures.all);
connection.console.info(`Sample server running in node ${process.version}`);
// 初期化ハンドルでインスタンス化する
let documents!: TextDocuments<TextDocument>;

// 接続の初期化
connection.onInitialize((_params, _cancel, progress) => {
	// サーバーの起動を進捗表示する
	progress.begin('Initializing Sample Server');
	// テキストドキュメントを監視する
	documents = new TextDocuments(TextDocument);
	setupDocumentsListeners();
	// 起動進捗表示の終了
	progress.done();

	return {
		// サーバー仕様
		capabilities: {
			// ドキュメントの同期
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.Incremental,
				willSaveWaitUntil: false,
				save: {
					includeText: false,
				}
			}
		},
	} as InitializeResult;
});

/**
 * テキストドキュメントを検証する
 * @param doc 検証対象ドキュメント
 */
function validate(doc: TextDocument) {
	// 警告などの状態を管理するリスト
	const diagnostics: Diagnostic[] = [];
	// 0行目(エディタ上の行番号は1から)の端から端までに警告
	const range: Range = {start: {line: 0, character: 0},
		end: {line: 0, character: Number.MAX_VALUE}};
	// 警告を追加する
	const diagnostic: Diagnostic = {
		// 警告範囲
		range: range,
		// 警告メッセージ
		message: 'Hello World!',
		// 警告の重要度、Error, Warning, Information, Hintのいずれかを選ぶ
		severity: DiagnosticSeverity.Warning,
		// 警告コード、警告コードを識別するために使用する
		code: '',
		// 警告を発行したソース、例: eslint, typescript
		source: 'sample',
	};
	diagnostics.push(diagnostic);
	//接続に警告を通知する
	void connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}


/**
 * ドキュメントの動作を監視する
 */
function setupDocumentsListeners() {
	// ドキュメントを作成、変更、閉じる作業を監視するマネージャー
	documents.listen(connection);

	// 開いた時
	documents.onDidOpen((event) => {
		validate(event.document);
	});

	// 変更した時
	documents.onDidChangeContent((change) => {
		validate(change.document);
	});

	// 保存した時
	documents.onDidSave((change) => {
		validate(change.document);
	});

	// 閉じた時
	documents.onDidClose((close) => {
		// ドキュメントのURI(ファイルパス)を取得する
		const uri = close.document.uri;
		// 警告を削除する
		void connection.sendDiagnostics({ uri: uri, diagnostics: []});
	});
}

// Listen on the connection
connection.listen();
