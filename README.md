# vscode-language-server-template README

## このテンプレートの使い方

1. git clone機能を使って、vscode-language-server-templateをcloneします。

```sh
git clone https://github.com/vscodejp/vscode-language-server-template.git
```

2. VS Codeを起動し、vscode-language-server-templateのフォルダを開きます。

```sh
cd vscode-language-server-template
code .
```

3. リンター機能，補完機能のコードを見るにはブランチを切り替えてください．

```sh
git checkout -b linter origin/linter
git checkout linter
# または
git checkout -b completions origin/completions
git checkout completions
```

## このREADMEの使い方

"vscode-language-server-template"のREADMEテンプレートです。
実装の内容に従って以下のコンテンツを追加してください。

## 機能

拡張機能の特徴を記入してください。
可能であればスクリーンショットを記載してください。

> Tip: 多くの人気拡張機能は動画を用意しています。利用動画があると使い方を直感的に理解できるようになります。

## 必要環境

必要な依存関係や環境設定があればここに記入してください。

## 設定

拡張機能で利用する設定があればここに記入してください。

例:

本拡張機能は以下を[設定](https://code.visualstudio.com/docs/getstarted/settings)可能です:

* `sampleserver.enable`: 拡張機能を 有効/無効 にする。標準では有効になっています。

## コマンド

コマンドを作成している場合はここに記入してください。

例：

本拡張機能は以下のコマンドから呼び出すことができます:

`Fix all auto-fixable problems`: ソースコードを上の警告を修正する。
