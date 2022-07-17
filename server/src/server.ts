'use strict';

import {
	CodeAction,
	CodeActionKind,
	CompletionItem,
	CompletionItemKind,
	createConnection,
	Diagnostic,
	DiagnosticSeverity,
	InitializeResult,
	ProposedFeatures,
	Range,
	TextDocumentEdit,
	TextDocumentPositionParams,
	TextDocuments,
	TextDocumentSyncKind,
	TextEdit,
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
				resolveProvider: true,
				willSaveWaitUntil: false,
				save: {
					includeText: false,
				}
			},
			completionProvider: {
				codeActionKinds: [ CodeActionKind.QuickFix ],
				resolveProvider: true
			}
		},
	} as InitializeResult;
});

/**
 * テキストドキュメントを検証する
 * @param doc 検証対象ドキュメント
 */
function validate(doc: TextDocument) {
	// ２つ以上並んでいるアルファベット大文字を検出
	const text = doc.getText();
	// 検出するための正規表現 (正規表現テスト: https://regex101.com/r/wXZbr9/1)
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	// 警告などの状態を管理するリスト
	const diagnostics: Diagnostic[] = [];
	// 正規表現に引っかかった文字列すべてを対象にする
	while ((m = pattern.exec(text)) !== null) {
		// 対象の位置から正規表現に引っかかった文字列までを対象にする
		const range: Range = {start: doc.positionAt(m.index),
			end: doc.positionAt(m.index + m[0].length),
		};
		// 警告内容を作成、上から範囲、メッセージ、重要度、ID、警告原因
		const diagnostic: Diagnostic = Diagnostic.create(
			range,
			`${m[0]} is all uppercase.`,
			DiagnosticSeverity.Warning,
			'',
			'sample',
		);
		// 警告リストに警告内容を追加
		diagnostics.push(diagnostic);
	}

	// VS Codeに警告リストを送信
	void connection.sendDiagnostics({ uri: doc.uri, version: doc.version, diagnostics });
}


/**
 * ドキュメントの動作を監視する
 */
function setupDocumentsListeners() {
	// ドキュメントを作成、変更、閉じる作業を監視するマネージャー
	documents.listen(connection);

	// 補完機能の要素リスト
	connection.onCompletion(
		(textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
			// 1行目の場合はVS CodeとVisual Studio Codeを返す
			if (textDocumentPosition.position.line === 0) {
				return [
					{
					// 補完を表示する文字列
						label: 'VS Code',
						// コード補完の種類、ここではTextを選ぶがMethodなどもある
						kind: CompletionItemKind.Text,
						// 補完リスト上でのラベル
						data: 1
					}, {
					// 補完を表示する文字列
						label: 'Visual Studio Code',
						// コード補完の種類、ここではTextを選ぶがMethodなどもある
						kind: CompletionItemKind.Text,
						// 補完リスト上でのラベル
						data: 1
					}
				];
			}
			// 2行目以降はファイル名を返す
			const fileUri = textDocumentPosition.textDocument.uri;
			return [
				{
					label: fileUri.substring(fileUri.lastIndexOf('/') + 1),
					kind: CompletionItemKind.Text,
					data: 2
				}
			];
		}
	);

	// ラベル付けされた補完リストの詳細を取得する
	connection.onCompletionResolve(
		(item: CompletionItem): CompletionItem => {
			if (item.data === 1) {
				// 詳細名
				item.detail = 'VS Code 詳細';
				// 詳細ドキュメント
				item.documentation = 'Visual Studio Code 詳細ドキュメント';
			} else if (item.data === 2) {
				item.detail = '現在のファイル名';
				item.documentation = 'ファイル名 詳細ドキュメント';
			}
			return item;
		}
	);

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

	    // Code Actionを追加する
	connection.onCodeAction((params) => {
		// sampleから生成した警告のみを対象とする
		const diagnostics = params.context.diagnostics.filter((diag) => diag.source === 'sample');
		// 対象ファイルを取得する
		console.log(params.textDocument.uri);
		const textDocument = documents.get(params.textDocument.uri);
		if (textDocument === undefined || diagnostics.length === 0) {
			return [];
		}
		const codeActions: CodeAction[] = [];
		// 各警告に対してアクションを生成する
		diagnostics.forEach((diag) => {
			// アクションの目的
			const title = 'Fix to lower case';
			// 警告範囲の文字列取得
			const originalText = textDocument.getText(diag.range);
			// 該当箇所を小文字に変更
			const edits = [TextEdit.replace(diag.range, originalText.toLowerCase())];
			const editPattern = { documentChanges: [
				TextDocumentEdit.create(
					{
						uri: textDocument.uri,
						version: textDocument.version
					},
					edits)
			]};
				// コードアクションを生成
			const fixAction = CodeAction.create(
				title,
				editPattern,
				CodeActionKind.QuickFix);
				// コードアクションと警告を関連付ける
			fixAction.diagnostics = [diag];
			codeActions.push(fixAction);
		});

		return codeActions;
	});
}

// Listen on the connection
connection.listen();
