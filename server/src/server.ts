'use strict';

import {
	CodeAction,
	CodeActionKind,
	createConnection,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	Range,
	TextDocuments,
	TextDocumentEdit,
	TextDocumentSyncKind,
	TextEdit,
	VersionedTextDocumentIdentifier
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

// コマンド識別子
namespace CommandIDs {
	export const fix = 'sample.fix';
}

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
			},
			codeActionProvider: {
				codeActionKinds: [CodeActionKind.QuickFix],
				resolveProvider: true
			},
			executeCommandProvider: {
				commands: [CommandIDs.fix],
			},
		},
	};
});

/**
 * テキストドキュメントを検証する
 * @param doc 検証対象ドキュメント
 */
function validate(doc: TextDocument) {
	// 警告などの状態を管理するリスト
	const diagnostics: Diagnostic[] = [];

	// ２つ以上並んでいるアルファベット大文字を検出
	const text = doc.getText();
	// 検出するための正規表現 (正規表現テスト: https://regex101.com/r/wXZbr9/1)
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	// 正規表現にマッチした文字列すべてを対象にする
	while ((m = pattern.exec(text)) !== null) {
		// 対象の位置から正規表現にマッチした文字までを対象にする
		const range: Range = {
			start: doc.positionAt(m.index),
			end: doc.positionAt(m.index + m[0].length),
		};
		// 警告を追加する;
		const diagnostic: Diagnostic = {
			// 警告範囲
			range: range,
			// 警告メッセージ
			message: `${m[0]} is all UPPERCASE.`,
			// 警告の重要度、Error, Warning, Information, Hintのいずれかを選ぶ
			severity: DiagnosticSeverity.Warning,
			// 警告コード、警告コードを識別するために使用する
			code: '',
			// 警告を発行したソース、例: eslint, typescript
			source: 'sample',
		};
		// 警告リストに警告内容を追加
		diagnostics.push(diagnostic);
	}
	//接続に警告を通知する
	connection.sendDiagnostics({ uri: doc.uri, diagnostics });
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
		connection.sendDiagnostics({ uri: uri, diagnostics: []});
	});

	// Code Actionを追加する
	connection.onCodeAction((params) => {
		// sampleから生成した警告のみを対象とする
		const diagnostics = params.context.diagnostics.filter((diag) => diag.source === 'sample');

		connection.console.info(`Code Actions is added`);
		// 対象ファイルを取得する
		const textDocument = documents.get(params.textDocument.uri);

		// 対象ファイルが存在しない場合は終了する
		if (textDocument === undefined || diagnostics.length === 0) {
			return [];
		}
		const codeActions: CodeAction[] = [];
		// 各警告に対してアクションを生成する
		diagnostics.forEach((diag) => {
			// アクションのメッセージ
			const title = 'Fix to lower case';
			// 警告範囲の文字列取得
			const originalText = textDocument.getText(diag.range);
			// 該当箇所を小文字に変更
			const edits = [TextEdit.replace(diag.range, originalText.toLowerCase())];

			const textDocumentIdentifier: VersionedTextDocumentIdentifier = {
				uri: textDocument.uri,
				version: textDocument.version};
			const editPattern = {
				documentChanges: [
					TextDocumentEdit.create(textDocumentIdentifier, edits)
				]
			};
			// コードアクションを生成
			const fixAction = CodeAction.create(
				title,
				editPattern,
				CodeActionKind.QuickFix);
			// コードアクションと警告を関連付ける
			fixAction.diagnostics = [diag];
			fixAction.isPreferred = true;
			codeActions.push(fixAction);
		});

		return codeActions;
	});
}

// Listen on the connection
connection.listen();
