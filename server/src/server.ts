'use strict';

import {
	CompletionItem,
	CompletionItemKind,
	createConnection,
	ProposedFeatures,
	TextDocumentPositionParams,
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
			},
			completionProvider: {
				resolveProvider: true
			}
		},
	};
});

/**
 * ドキュメントの動作を監視する
 */
function setupDocumentsListeners() {
	// ドキュメントを作成、変更、閉じる作業を監視するマネージャー
	documents.listen(connection);
	// 補完機能の要素リスト
	connection.onCompletion(
		(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
			return [
				{
					// 補完を表示する文字列
					label: 'VS Code',
					// コード補完の種類、ここではTextを選ぶがMethodなどもある
					kind: CompletionItemKind.Text,
					// 補完リスト上でのラベル
					data: 1
				},
				{
					label: 'Visual Studio Code',
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
				item.documentation = 'VS Code 詳細ドキュメント';
			} else if (item.data === 2) {
				item.detail = 'Visual Studio Code 詳細';
				item.documentation = 'Visual Studio Code 詳細ドキュメント';
			}
			return item;
		}
	);
}

// Listen on the connection
connection.listen();
